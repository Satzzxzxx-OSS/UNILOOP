/* Space UI Sounds MIT; upstream source snapshot. License: docs/licenses/SPACE-UI-MIT.txt. */
import type { FmLayer, NoiseLayer, Shimmer, ToneLayer } from '../sounds/types'

// ---------------------------------------------------------------------------
// Noise Buffer Cache
// Short pink-noise buffers are reused across calls to reduce GC pressure on
// frequent sounds (tap, tick, press, release). Buffers longer than 80 ms are
// generated fresh so they retain their natural randomness.
// ---------------------------------------------------------------------------

const NOISE_CACHE_MAX_DURATION = 0.08 // seconds
const noiseBufferCache = new Map<number, AudioBuffer>()

/** Clear the buffer cache — must be called when the AudioContext is replaced. */
export function clearNoiseBufferCache(): void {
  noiseBufferCache.clear()
}

function getOrCreateNoiseBuffer(context: AudioContext, duration: number): AudioBuffer {
  if (duration > NOISE_CACHE_MAX_DURATION) {
    return buildNoiseBuffer(context, duration)
  }
  const key = Math.ceil(duration * 1000) // 1 ms precision cache key
  const cached = noiseBufferCache.get(key)
  if (cached) return cached
  const buffer = buildNoiseBuffer(context, duration)
  noiseBufferCache.set(key, buffer)
  return buffer
}

function buildNoiseBuffer(context: AudioContext, duration: number): AudioBuffer {
  const length = Math.max(1, Math.floor(duration * context.sampleRate))
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  // Pink noise approximation (1/f power density for a softer acoustic feel)
  let b0 = 0,
    b1 = 0,
    b2 = 0
  for (let i = 0; i < length; i++) {
    const white = 2 * Math.random() - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11
  }
  return buffer
}

// ---------------------------------------------------------------------------
// Tone
// ---------------------------------------------------------------------------

/**
 * Render Tone Layer with Apple Acoustic Warmth Filter & Silky Envelope Decay.
 */
export function renderTone(context: AudioContext, destination: AudioNode, layer: ToneLayer, startTime: number): void {
  const osc = context.createOscillator()
  osc.type = layer.waveform

  // Ensure startTime is never in the past relative to the audio thread
  const effectiveStart = Math.max(context.currentTime, startTime)
  osc.frequency.setValueAtTime(layer.frequency, effectiveStart)

  if (layer.detune) osc.detune.value = layer.detune

  if (layer.glideTo !== undefined) {
    const glideDur = layer.glideTime ?? layer.attack + layer.decay
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, layer.glideTo), effectiveStart + glideDur)
  }

  // 1. Acoustic Lowpass Filter (eliminates digital harshness > 8.5 kHz)
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 8800
  filter.Q.value = 0.5

  // 2. Silky Envelope (Smooth Attack + Asymptotic Exponential Decay via setTargetAtTime)
  // CRITICAL FIX: Web Audio GainNode defaults to 1.0. Must initialize to 0.00001 immediately
  // so if scheduling evaluates late under rapid clicks, it never blasts at 100% volume.
  const gain = context.createGain()
  gain.gain.value = 0.00001

  const attackEnd = effectiveStart + Math.max(0.001, layer.attack)
  const peakVal = Math.max(0.0001, layer.peak)
  const decayTimeConst = Math.max(0.003, layer.decay / 3.2)

  gain.gain.setValueAtTime(0.00001, effectiveStart)
  gain.gain.linearRampToValueAtTime(peakVal, attackEnd)
  gain.gain.setTargetAtTime(0.00001, attackEnd, decayTimeConst)

  osc.connect(filter).connect(gain).connect(destination)

  const duration = layer.attack + layer.decay * 3 + 0.05
  osc.start(effectiveStart)
  osc.stop(effectiveStart + duration)
}

// ---------------------------------------------------------------------------
// Noise
// ---------------------------------------------------------------------------

/**
 * Render Filtered Noise Layer for soft contact ticks & air sweeps.
 */
export function renderNoise(context: AudioContext, destination: AudioNode, layer: NoiseLayer, startTime: number): void {
  const duration = layer.attack + layer.decay * 3 + 0.05
  // Reuse cached buffers for short sounds to reduce Float32 allocations
  const buffer = getOrCreateNoiseBuffer(context, duration)

  const source = context.createBufferSource()
  source.buffer = buffer

  const effectiveStart = Math.max(context.currentTime, startTime)

  const filter = context.createBiquadFilter()
  filter.type = layer.filterType
  filter.frequency.setValueAtTime(Math.max(20, layer.filterFrequency), effectiveStart)

  if (layer.filterSweepTo !== undefined) {
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, layer.filterSweepTo),
      effectiveStart + layer.attack + layer.decay,
    )
  }

  if (layer.filterQ !== undefined) filter.Q.value = layer.filterQ

  // CRITICAL FIX: initialize gain to 0.00001 immediately to prevent default 1.0 volume leak
  const gain = context.createGain()
  gain.gain.value = 0.00001

  const attackEnd = effectiveStart + Math.max(0.001, layer.attack)
  const peakVal = Math.max(0.0001, layer.peak)
  const decayTimeConst = Math.max(0.003, layer.decay / 3.0)

  gain.gain.setValueAtTime(0.00001, effectiveStart)
  gain.gain.linearRampToValueAtTime(peakVal, attackEnd)
  gain.gain.setTargetAtTime(0.00001, attackEnd, decayTimeConst)

  source.connect(filter).connect(gain).connect(destination)
  source.start(effectiveStart)
  source.stop(effectiveStart + duration)
}

// ---------------------------------------------------------------------------
// FM
// ---------------------------------------------------------------------------

/**
 * Render 2-Operator FM Layer with Apple Glass/Wood acoustic resonance & smooth index decay.
 */
export function renderFm(context: AudioContext, destination: AudioNode, layer: FmLayer, startTime: number): void {
  const effectiveStart = Math.max(context.currentTime, startTime)

  const carrier = context.createOscillator()
  carrier.type = 'sine'
  carrier.frequency.setValueAtTime(Math.max(20, layer.from), effectiveStart)
  if (layer.from !== layer.to) {
    carrier.frequency.exponentialRampToValueAtTime(Math.max(20, layer.to), effectiveStart + layer.duration)
  }

  const modulator = context.createOscillator()
  modulator.type = 'sine'
  const modFreq = Math.max(10, layer.from * layer.ratio)
  modulator.frequency.setValueAtTime(modFreq, effectiveStart)

  const modGain = context.createGain()
  modGain.gain.value = 0
  const initialDepth = modFreq * layer.index
  modGain.gain.setValueAtTime(initialDepth, effectiveStart)
  modGain.gain.setTargetAtTime(0.01, effectiveStart, Math.max(0.004, layer.duration / 3.5))

  modulator.connect(modGain).connect(carrier.frequency)

  // Acoustic Warmth Lowpass Filter for FM body
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 9200
  filter.Q.value = 0.5

  // CRITICAL FIX: initialize gain to 0.00001 immediately to prevent default 1.0 volume leak
  const masterGain = context.createGain()
  masterGain.gain.value = 0.00001

  const attackEnd = effectiveStart + 0.002
  const peakVal = Math.max(0.0001, layer.peak)
  const decayTimeConst = Math.max(0.004, layer.duration / 3.2)

  masterGain.gain.setValueAtTime(0.00001, effectiveStart)
  masterGain.gain.linearRampToValueAtTime(peakVal, attackEnd)
  masterGain.gain.setTargetAtTime(0.00001, attackEnd, decayTimeConst)

  carrier.connect(filter).connect(masterGain).connect(destination)

  const totalDur = layer.duration * 3 + 0.05
  carrier.start(effectiveStart)
  modulator.start(effectiveStart)
  carrier.stop(effectiveStart + totalDur)
  modulator.stop(effectiveStart + totalDur)
}

// ---------------------------------------------------------------------------
// Shimmer
// ---------------------------------------------------------------------------

/**
 * Handle for the shimmer reverb-tail graph.
 * Callers use this to perform a clean, click-free teardown:
 *   1. Ramp `feedbackGain` to 0 (kills the feedback loop gradually).
 *   2. After a short fade, disconnect all `nodes`.
 */
export interface ShimmerHandle {
  /** All audio nodes in the shimmer sub-graph. */
  nodes: AudioNode[]
  /**
   * The feedback gain node.
   * Ramp its `.gain` to 0 with `setTargetAtTime` before disconnecting
   * to prevent audible clicks caused by abrupt cycle termination.
   */
  feedbackGain: GainNode
}

/**
 * Attach Shimmer Reverb Tail node chain.
 * Returns a ShimmerHandle for controlled teardown.
 */
export function attachShimmer(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  shimmer: Shimmer,
): ShimmerHandle {
  const delay = context.createDelay(1)
  delay.delayTime.value = shimmer.delay

  const feedbackFilter = context.createBiquadFilter()
  feedbackFilter.type = 'lowpass'
  feedbackFilter.frequency.value = shimmer.lowpass

  const feedbackGain = context.createGain()
  feedbackGain.gain.value = shimmer.feedback

  const wetGain = context.createGain()
  wetGain.gain.value = shimmer.wet

  source.connect(delay)
  delay.connect(feedbackFilter)
  feedbackFilter.connect(feedbackGain)
  feedbackGain.connect(delay) // ← feedback cycle
  feedbackFilter.connect(wetGain)
  wetGain.connect(destination)

  return {
    nodes: [delay, feedbackFilter, feedbackGain, wetGain],
    feedbackGain,
  }
}
