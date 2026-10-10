/* Space UI Sounds MIT; upstream source snapshot. License: docs/licenses/SPACE-UI-MIT.txt. */
import type { OutputProfile, PlayOptions, SpaceLayer, SpaceSoundSettings, SpaceSoundSpec } from '../sounds/types'

import { getVoice, setVoice, type Voice } from '../voice/voice'
import { createMasteringChain, type MasteringChain } from './mastering'
import { attachShimmer, clearNoiseBufferCache, renderFm, renderNoise, renderTone } from './renderer'
import { createSpatialPanner } from './spatial'

const STORAGE_KEY = 'spacesound-settings'
const isBrowser = typeof window !== 'undefined'

let settings: SpaceSoundSettings = {
  enabled: true,
  volume: 0.8,
  voiceSeed: null,
  respectReducedMotion: true,
  outputProfile: 'auto',
}

let loaded = false
let snapshot: SpaceSoundSettings = settings
const listeners = new Set<() => void>()

function loadSettings() {
  if (loaded || !isBrowser) return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) settings = { ...settings, ...JSON.parse(raw) }
  } catch {
    /* private mode fallback */
  }
  setVoice(settings.voiceSeed)
  snapshot = { ...settings }
}

function saveSettings() {
  snapshot = { ...settings }
  for (const fn of listeners) fn()
  if (!isBrowser) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore storage errors */
  }
}

export function setEnabled(enabled: boolean): void {
  loadSettings()
  settings.enabled = enabled
  saveSettings()
}

export function setVolume(volume: number): void {
  loadSettings()
  settings.volume = Math.min(Math.max(volume, 0), 1)
  saveSettings()
}

export function setRespectReducedMotion(respect: boolean): void {
  loadSettings()
  settings.respectReducedMotion = respect
  saveSettings()
}

export function setOutputProfile(profile: OutputProfile): void {
  loadSettings()
  settings.outputProfile = profile
  // Gracefully fade out all active mastering chains before disposing.
  // This prevents a hard click when sounds are actively playing.
  disposeAllChains(true)
  saveSettings()
}

export function setVoiceSeed(seed: string | null): void {
  loadSettings()
  settings.voiceSeed = seed
  setVoice(seed)
  saveSettings()
}

export function getSettings(): SpaceSoundSettings {
  return snapshot
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function hydrate(): void {
  const before = snapshot
  loadSettings()
  if (
    snapshot.enabled !== before.enabled ||
    snapshot.volume !== before.volume ||
    snapshot.respectReducedMotion !== before.respectReducedMotion ||
    snapshot.voiceSeed !== before.voiceSeed ||
    snapshot.outputProfile !== before.outputProfile
  ) {
    for (const fn of listeners) fn()
  }
}

/* --- Web Audio Context & Mastering Chains --- */

let sharedContext: AudioContext | null = null
/** Mastering chain for the default output profile. */
let masteringChain: MasteringChain | null = null
/**
 * Per-profile mastering chain cache.
 * Fix #3: Previously every playSpec() call with options.profile created a new
 * MasteringChain (6 nodes) that was never destroyed. Now we reuse one chain
 * per profile, cleared only on setOutputProfile() or destroy().
 */
const profileChains = new Map<OutputProfile, MasteringChain>()

function getAudioContext(): AudioContext | null {
  if (sharedContext) return sharedContext
  if (!isBrowser) return null

  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null

  try {
    sharedContext = new Ctor()
  } catch {
    return null
  }
  return sharedContext
}

/** Fade out a chain's input gain over 20 ms then disconnect after 150 ms. */
function gracefulDisposeChain(chain: MasteringChain): void {
  const ctx = sharedContext
  if (ctx) {
    chain.input.gain.setTargetAtTime(0, ctx.currentTime, 0.02)
    setTimeout(() => chain.dispose(), 150)
  } else {
    chain.dispose()
  }
}

function disposeAllChains(graceful: boolean): void {
  if (masteringChain) {
    const c = masteringChain
    masteringChain = null
    if (graceful) gracefulDisposeChain(c)
    else c.dispose()
  }
  for (const chain of profileChains.values()) {
    if (graceful) gracefulDisposeChain(chain)
    else chain.dispose()
  }
  profileChains.clear()
}

function getMasterInput(context: AudioContext, profileOverride?: OutputProfile): GainNode {
  const targetProfile = profileOverride ?? settings.outputProfile

  if (profileOverride) {
    // Reuse cached per-profile chain (Fix #3: previously leaked a new chain each call)
    const cached = profileChains.get(profileOverride)
    if (cached) return cached.input
    const chain = createMasteringChain(context, profileOverride)
    profileChains.set(profileOverride, chain)
    return chain.input
  }

  if (masteringChain) return masteringChain.input
  masteringChain = createMasteringChain(context, targetProfile)
  return masteringChain.input
}

/* --- Anti-Fatigue Rapid Trigger Protection --- */
let lastPlayTime = -Infinity
let rapidTriggerCount = 0

function getFatigueDampening(): { freqScale: number; volScale: number } {
  const now = performance.now()
  const delta = now - lastPlayTime
  lastPlayTime = now

  if (delta < 65) {
    rapidTriggerCount = Math.min(6, rapidTriggerCount + 1)
  } else {
    rapidTriggerCount = Math.max(0, rapidTriggerCount - 1)
  }

  if (rapidTriggerCount > 1) {
    // Dampen high frequencies by 4% per rapid trigger & volume by 8% to prevent ear fatigue
    const freqScale = Math.max(0.75, 1 - rapidTriggerCount * 0.04)
    const volScale = Math.max(0.6, 1 - rapidTriggerCount * 0.08)
    return { freqScale, volScale }
  }

  return { freqScale: 1.0, volScale: 1.0 }
}

/* --- Cleanup Duration Calculator --- */

/**
 * Compute the minimum safe cleanup delay (ms) for a given sound spec.
 *
 * Fix #1: Previously hardcoded at 1200 ms for every sound regardless of length.
 * For sounds with shimmer (bloom, confirm, sparkle…) the feedback loop could
 * still be audible or — worse — its internal cycle left connected after the
 * subMaster was disconnected. This function derives the correct value from the
 * actual layer durations and shimmer ring-down time.
 */
function computeCleanupDelay(spec: SpaceSoundSpec): number {
  let maxEnd = 0
  for (const layer of spec.layers) {
    const offset = layer.offset ?? 0
    const layerDur =
      layer.kind === 'fm'
        ? layer.duration * 3 + 0.05
        : layer.attack + layer.decay * 3 + 0.05
    maxEnd = Math.max(maxEnd, offset + layerDur)
  }

  let shimmerTail = 0
  if (spec.shimmer) {
    // Feedback amplitude decays as feedback^N over N delay-cycles.
    // Time constant ≈ delay / (1 − feedback). Multiply by 5 for ~99 % attenuation.
    const safeRemainder = Math.max(0.001, 1 - spec.shimmer.feedback)
    shimmerTail = (spec.shimmer.delay / safeRemainder) * 5
  }

  // Add a 300 ms safety buffer for OS scheduling jitter
  return Math.ceil((maxEnd + shimmerTail) * 1000) + 300
}

/* --- Voice & Fatigue Transformation Engine --- */

function voiced(
  spec: SpaceSoundSpec,
  voice?: Voice,
  fatigueDampening: { freqScale: number; volScale: number } = { freqScale: 1, volScale: 1 },
): SpaceSoundSpec {
  const v = voice
  const fDamp = fatigueDampening.freqScale

  const layers: SpaceLayer[] = spec.layers.map((l) => {
    if (l.kind === 'tone') {
      const baseFreq = l.fixed ? l.frequency : l.frequency * (v ? v.register : 1)
      const freq = baseFreq * fDamp
      const glideTo =
        l.glideTo !== undefined ? (l.fixed ? l.glideTo : l.glideTo * (v ? v.register : 1)) * fDamp : undefined
      return {
        ...l,
        frequency: freq,
        glideTo,
        attack: l.attack * (v ? v.pace : 1),
        decay: l.decay * (v ? v.pace : 1),
        offset: (l.offset ?? 0) * (v ? v.pace : 1),
      }
    }

    if (l.kind === 'noise') {
      return {
        ...l,
        filterFrequency: l.filterFrequency * (v ? v.brightness : 1) * fDamp,
        filterSweepTo: l.filterSweepTo !== undefined ? l.filterSweepTo * (v ? v.brightness : 1) * fDamp : undefined,
        attack: l.attack * (v ? v.pace : 1),
        decay: l.decay * (v ? v.pace : 1),
        offset: (l.offset ?? 0) * (v ? v.pace : 1),
      }
    }

    // FM Layer
    const from = (l.fixed ? l.from : l.from * (v ? v.register : 1)) * fDamp
    const to = (l.fixed ? l.to : l.to * (v ? v.register : 1)) * fDamp
    const ratio = l.fixed ? l.ratio : l.ratio * (v ? v.material : 1)
    const index = l.fixed ? l.index : l.index * (v ? v.brightness : 1)

    return {
      ...l,
      from,
      to,
      ratio,
      index,
      duration: l.duration * (v ? v.pace : 1),
      offset: (l.offset ?? 0) * (v ? v.pace : 1),
    }
  })

  return {
    ...spec,
    layers,
  }
}

/* --- Main Playback Dispatcher --- */

export function playSpec(spec: SpaceSoundSpec, options?: PlayOptions): void {
  loadSettings()
  if (!settings.enabled) return

  if (settings.respectReducedMotion && isBrowser && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const fatigue = getFatigueDampening()
  const volumeScale = settings.volume * (options?.volume ?? 1) * fatigue.volScale
  if (volumeScale === 0) return

  const context = getAudioContext()
  if (!context) return

  // Resume suspended AudioContext on user interaction
  if (context.state === 'suspended') {
    context.resume().catch(() => {})
  }

  const finalSpec = voiced(spec, getVoice() ?? undefined, fatigue)
  // 5ms forward scheduling buffer prevents negative delta audio thread glitches under click load
  const now = context.currentTime + 0.005
  const masterInput = getMasterInput(context, options?.profile)

  // Sub-master node for this sound instance
  const subMaster = context.createGain()
  const baseGain = (finalSpec.masterGain ?? 0.5) * volumeScale
  subMaster.gain.value = baseGain
  subMaster.gain.setValueAtTime(baseGain, now)

  let panner: PannerNode | null = null
  if (options?.spatial) {
    panner = createSpatialPanner(context, options.spatial)
    subMaster.connect(panner).connect(masterInput)
  } else {
    subMaster.connect(masterInput)
  }

  // attachShimmer now returns a ShimmerHandle so we can cleanly tear down
  // the feedback cycle (Fix #2).
  const shimmerHandle = finalSpec.shimmer
    ? attachShimmer(context, subMaster, masterInput, finalSpec.shimmer)
    : null

  for (const layer of finalSpec.layers) {
    const startTime = now + (layer.offset ?? 0)
    if (layer.kind === 'tone') renderTone(context, subMaster, layer, startTime)
    else if (layer.kind === 'noise') renderNoise(context, subMaster, layer, startTime)
    else if (layer.kind === 'fm') renderFm(context, subMaster, layer, startTime)
  }

  // Fix #1: derive the cleanup delay from actual sound durations rather than
  // using a fixed 1200 ms that can be too short for shimmer-heavy sounds.
  const cleanupMs = computeCleanupDelay(finalSpec)

  setTimeout(() => {
    if (shimmerHandle) {
      // Fix #2: ramp the feedback gain to 0 before breaking the cycle to
      // avoid a click caused by abrupt energy termination.
      shimmerHandle.feedbackGain.gain.setTargetAtTime(0, context.currentTime, 0.02)
      setTimeout(() => {
        for (const node of shimmerHandle.nodes) node.disconnect()
      }, 150)
    }
    subMaster.disconnect()
    panner?.disconnect()
  }, cleanupMs)
}

export function playRecipe(recipe: SpaceSoundSpec, options?: PlayOptions): void {
  playSpec(recipe, options)
}

/**
 * Tear down the engine completely.
 *
 * Fix #9: Previously the AudioContext was never closed. In a SPA or during
 * HMR each hot-reload would create a new AudioContext while the old one kept
 * its audio thread alive. Call destroy() on unmount / route change to release
 * all Web Audio resources.
 */
export async function destroy(): Promise<void> {
  disposeAllChains(false)
  clearNoiseBufferCache()
  if (sharedContext) {
    await sharedContext.close()
    sharedContext = null
  }
  // Allow loadSettings() to run again if the engine is later reinitialised
  loaded = false
}
