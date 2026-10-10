/* Space UI Sounds MIT; upstream source snapshot. License: docs/licenses/SPACE-UI-MIT.txt. */
import type { PageDirection, SpaceSoundSpec, SpatialDirection, ToggleState, VerticalDirection } from './types'

/** Apple UI Acoustic Material Ratios & Anchors */
const GLASS_MATERIAL = 2.76 // Crystalline glass / marimba resonance
const WOOD_MATERIAL = 1.82 // Muted organic wood resonance
const SILK_GLASS = 2.34 // Final Studio selections retained after A/B listening

/**
 * TAP: Neutral liquid drop click.
 * High-precision water surface contact for primary buttons and micro-interactions.
 */
export function tap(): SpaceSoundSpec {
  return {
    name: 'tap',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 2800,
        filterSweepTo: 1600,
        filterQ: 1.2,
        attack: 0.002,
        decay: 0.018,
        peak: 0.12,
      },
      { kind: 'tone', waveform: 'sine', frequency: 900, glideTo: 520, glideTime: 0.025, attack: 0.001, decay: 0.04, peak: 0.1 },
    ],
  }
}

/**
 * PRESS: Deep wet mechanical key/button press down.
 * Downward displacement feeling through gentle liquid resistance.
 */
export function press(): SpaceSoundSpec {
  return {
    name: 'press',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'lowpass',
        filterFrequency: 1200,
        filterSweepTo: 650,
        filterQ: 0.7,
        attack: 0.003,
        decay: 0.028,
        peak: 0.13,
      },
      { kind: 'tone', waveform: 'sine', frequency: 280, glideTo: 190, glideTime: 0.032, attack: 0.002, decay: 0.055, peak: 0.09 },
    ],
  }
}

/**
 * RELEASE: Key/button release upward surfacing.
 * Soft ascending liquid sweep like a bubble surfacing.
 */
export function release(): SpaceSoundSpec {
  return {
    name: 'release',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 2800,
        filterSweepTo: 4600,
        filterQ: 1.3,
        attack: 0.001,
        decay: 0.018,
        peak: 0.11,
      },
      { kind: 'tone', waveform: 'sine', frequency: 760, glideTo: 1380, glideTime: 0.03, attack: 0.001, decay: 0.05, peak: 0.08 },
    ],
  }
}

/**
 * TICK: Ultra-fine liquid micro-drop tick.
 * Delicate droplet contact for sliders, segmented controls, and hover states.
 */
export function tick(): SpaceSoundSpec {
  return {
    name: 'tick',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 3200,
        filterSweepTo: 1900,
        filterQ: 1.4,
        attack: 0.001,
        decay: 0.014,
        peak: 0.13,
      },
      { kind: 'tone', waveform: 'sine', frequency: 1200, glideTo: 700, glideTime: 0.018, attack: 0.001, decay: 0.018, peak: 0.07 },
    ],
  }
}

/**
 * PAGE: Liquid swipe flick.
 * Crisp fluid contact tap for carousels, tabs, and pagination steps.
 */
export function page(): SpaceSoundSpec {
  return {
    name: 'page',
    masterGain: 0.52,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 2600, filterSweepTo: 1500, filterQ: 1.3, attack: 0.001, decay: 0.018, peak: 0.13 },
      { kind: 'tone', waveform: 'sine', frequency: 800, glideTo: 480, glideTime: 0.022, attack: 0.001, decay: 0.025, peak: 0.09 },
    ],
  }
}

/**
 * OPEN: Focused overlay arrival (modals, dialogs, drawers).
 * Smooth upward acoustic arrival with silk-glass harmonic body.
 */
export function open(): SpaceSoundSpec {
  return {
    name: 'open',
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 2100, filterSweepTo: 3400, filterQ: 1.0, attack: 0.003, decay: 0.038, peak: 0.07 },
      { kind: 'fm', from: 440, to: 659.25, ratio: SILK_GLASS, index: 0.65, duration: 0.075, peak: 0.12 },
    ],
  }
}

/**
 * CLOSE: Focused overlay departure (modals, sheets, popovers).
 * Smooth downward acoustic return with silk-glass harmonic body.
 */
export function close(): SpaceSoundSpec {
  return {
    name: 'close',
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 2800, filterSweepTo: 1600, filterQ: 1.0, attack: 0.003, decay: 0.032, peak: 0.065 },
      { kind: 'fm', from: 659.25, to: 440, ratio: SILK_GLASS, index: 0.58, duration: 0.068, peak: 0.11 },
    ],
  }
}

/**
 * COPY: Duplicating an element into clipboard.
 * Crisp crystalline strike with glass harmonic resonance.
 */
export function copy(): SpaceSoundSpec {
  return {
    name: 'copy',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 3800,
        filterQ: 1.5,
        attack: 0.001,
        decay: 0.015,
        peak: 0.12,
      },
      { kind: 'fm', from: 659.25, to: 659.25, ratio: GLASS_MATERIAL, index: 1.1, duration: 0.04, peak: 0.14 },
    ],
  }
}

/**
 * PASTE: Placing an element from clipboard into canvas.
 * Grounded placement strike with tactile resonance.
 */
export function paste(): SpaceSoundSpec {
  return {
    name: 'paste',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 3400,
        filterQ: 1.4,
        attack: 0.001,
        decay: 0.018,
        peak: 0.12,
      },
      { kind: 'fm', from: 523.25, to: 523.25, ratio: GLASS_MATERIAL, index: 1.0, duration: 0.042, peak: 0.13 },
    ],
  }
}

/**
 * REMOVE: Item destroyed or deleted.
 * Muted organic dead strike signaling intentional removal.
 */
export function remove(): SpaceSoundSpec {
  return {
    name: 'remove',
    masterGain: 0.55,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 1500,
        filterQ: 1.2,
        attack: 0.001,
        decay: 0.024,
        peak: 0.15,
      },
      { kind: 'fm', from: 220, to: 180, ratio: WOOD_MATERIAL, index: 1.2, duration: 0.038, peak: 0.13 },
    ],
  }
}

/**
 * CONFIRM: Positive outcome worth marking.
 * Uplifting liquid drop with rising major third (C5 -> E5) pitch inflection.
 */
export function confirm(): SpaceSoundSpec {
  return {
    name: 'confirm',
    masterGain: 0.52,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 3200, filterSweepTo: 2200, filterQ: 1.2, attack: 0.002, decay: 0.02, peak: 0.1 },
      { kind: 'tone', waveform: 'sine', frequency: 523.25, glideTo: 659.25, glideTime: 0.04, attack: 0.002, decay: 0.07, peak: 0.12 },
    ],
  }
}

/**
 * DENY: Refusal or warning tone.
 * Low, soft dual wooden tone informing rather than punishing.
 */
export function deny(): SpaceSoundSpec {
  return {
    name: 'deny',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 1300,
        filterQ: 1.2,
        attack: 0.001,
        decay: 0.022,
        peak: 0.11,
      },
      { kind: 'fm', from: 220, to: 196, ratio: WOOD_MATERIAL, index: 0.95, duration: 0.045, peak: 0.12 },
      { kind: 'fm', from: 196, to: 174.61, ratio: WOOD_MATERIAL, offset: 0.038, index: 0.85, duration: 0.05, peak: 0.1 },
    ],
  }
}

/**
 * LOADING: Task starting lift.
 * Gentle rising air sweep signaling ongoing asynchronous work.
 */
export function loading(): SpaceSoundSpec {
  return {
    name: 'loading',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: 1800,
        filterSweepTo: 3800,
        filterQ: 1.2,
        attack: 0.01,
        decay: 0.065,
        peak: 0.11,
      },
      {
        kind: 'tone',
        waveform: 'sine',
        frequency: 440,
        glideTo: 587.33,
        glideTime: 0.07,
        attack: 0.005,
        decay: 0.07,
        peak: 0.1,
      },
    ],
  }
}

/**
 * READY: Calm task completion.
 * Clean, resolved liquid drop with resonant harmonic body.
 */
export function ready(): SpaceSoundSpec {
  return {
    name: 'ready',
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 2400, filterSweepTo: 1400, filterQ: 1.1, attack: 0.002, decay: 0.024, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 659.25, glideTo: 440, glideTime: 0.05, attack: 0.002, decay: 0.065, peak: 0.11 },
    ],
  }
}

/**
 * CHIME: Elegant notification chime.
 * Harmonious dual-frequency liquid bell (A5 and E6) chiming in unison.
 */
export function chime(): SpaceSoundSpec {
  return {
    name: 'chime',
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 3800, filterSweepTo: 2400, filterQ: 1.3, attack: 0.002, decay: 0.018, peak: 0.08 },
      { kind: 'tone', waveform: 'sine', frequency: 880, glideTo: 660, glideTime: 0.06, attack: 0.002, decay: 0.07, peak: 0.1 },
      { kind: 'tone', waveform: 'sine', frequency: 1318.51, glideTo: 990, glideTime: 0.06, attack: 0.002, decay: 0.065, peak: 0.08 },
    ],
  }
}

/**
 * SPARKLE: Crystalline magical sparkle.
 * Ultra-fast ascending liquid micro-chirp cascade that feels like a single unified shimmer.
 */
export function sparkle(): SpaceSoundSpec {
  return {
    name: 'sparkle',
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 4200, filterSweepTo: 2800, filterQ: 1.4, attack: 0.001, decay: 0.018, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 783.99, glideTo: 1046.5, glideTime: 0.025, attack: 0.001, decay: 0.035, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 1046.5, glideTo: 1318.51, glideTime: 0.025, offset: 0.012, attack: 0.001, decay: 0.04, peak: 0.1 },
      { kind: 'tone', waveform: 'sine', frequency: 1318.51, glideTo: 1567.98, glideTime: 0.03, offset: 0.024, attack: 0.001, decay: 0.045, peak: 0.11 },
    ],
  }
}

/**
 * DROPLET: Pure acoustic water droplet.
 * Natural fluid drop with gentle body resonance.
 */
export function droplet(): SpaceSoundSpec {
  return {
    name: 'droplet',
    masterGain: 0.48,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 1174.66, glideTo: 698.46, glideTime: 0.06, attack: 0.002, decay: 0.06, peak: 0.1 },
      { kind: 'tone', waveform: 'sine', frequency: 220, attack: 0.002, decay: 0.04, peak: 0.03 },
    ],
  }
}

/**
 * BLOOM: Warm harmonic pad swell.
 * Consonant detuned chord that blooms softly and decays naturally.
 */
export function bloom(): SpaceSoundSpec {
  return {
    name: 'bloom',
    masterGain: 0.54,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 261.63, detune: -6, attack: 0.02, decay: 0.18, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 329.63, detune: 6, attack: 0.02, decay: 0.18, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 392.0, attack: 0.025, decay: 0.2, peak: 0.1 },
      { kind: 'tone', waveform: 'sine', frequency: 493.88, attack: 0.028, decay: 0.22, peak: 0.11 },
    ],
  }
}

/**
 * WHISPER: Breathy quiet noise bed.
 * Soft filtered air cushion for gentle ambiance or quiet notifications.
 */
export function whisper(): SpaceSoundSpec {
  return {
    name: 'whisper',
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'lowpass',
        filterFrequency: 1600,
        filterQ: 0.5,
        attack: 0.01,
        decay: 0.085,
        peak: 0.18,
      },
    ],
  }
}

/**
 * NUDGE: Directional pitch adjustment step.
 * Pitch step indicating directional stepper movement (up or down).
 */
export function nudge(direction: VerticalDirection): SpaceSoundSpec {
  const up = direction === 'up'
  return {
    name: `nudge-${direction}`,
    masterGain: 0.54,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: up ? 4000 : 2400,
        filterQ: 1.4,
        attack: 0.001,
        decay: 0.014,
        peak: 0.11,
      },
      {
        kind: 'tone',
        waveform: 'sine',
        frequency: up ? 440 : 587.33,
        glideTo: up ? 587.33 : 440,
        glideTime: 0.03,
        attack: 0.001,
        decay: 0.038,
        peak: 0.11,
      },
    ],
  }
}

/**
 * TOGGLE: Binary state switch (on / off).
 * Liquid valve acoustic inflection — upward sweep on enable, downward on disable.
 */
export function toggle(state: ToggleState): SpaceSoundSpec {
  const on = state === 'on'
  return {
    name: `toggle-${state}`,
    masterGain: 0.52,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: on ? 1800 : 3400,
        filterSweepTo: on ? 3400 : 1600,
        filterQ: 1.0,
        attack: 0.002,
        decay: 0.022,
        peak: 0.1,
      },
      {
        kind: 'tone',
        waveform: 'sine',
        frequency: on ? 440 : 700,
        glideTo: on ? 700 : 340,
        glideTime: 0.04,
        attack: 0.002,
        decay: 0.06,
        peak: 0.09,
      },
    ],
  }
}

/**
 * SLIDE: Directional spatial noise sweep (in / out).
 * Filter sweep conveying physical movement into or out of view.
 */
export function slide(direction: SpatialDirection): SpaceSoundSpec {
  const isIn = direction === 'in'
  return {
    name: `slide-${direction}`,
    masterGain: 0.54,
    layers: [
      {
        kind: 'noise',
        filterType: 'bandpass',
        filterFrequency: isIn ? 1600 : 3800,
        filterSweepTo: isIn ? 3800 : 1600,
        filterQ: 1.2,
        attack: 0.004,
        decay: 0.048,
        peak: 0.13,
      },
    ],
  }
}

/**
 * TURN: Page travel (forward / back).
 * Organic turn flick with tactile acoustic resonance.
 */
export function turn(direction: PageDirection): SpaceSoundSpec {
  const forward = direction === 'forward'
  return {
    name: `turn-${direction}`,
    masterGain: 0.54,
    layers: [
      {
        kind: 'noise',
        filterType: 'lowpass',
        filterFrequency: forward ? 1800 : 1400,
        filterQ: 0.7,
        attack: 0.004,
        decay: 0.065,
        peak: 0.12,
      },
      {
        kind: 'fm',
        from: forward ? 523.25 : 659.25,
        to: forward ? 659.25 : 523.25,
        ratio: GLASS_MATERIAL,
        offset: 0.02,
        index: 0.9,
        duration: 0.042,
        peak: 0.1,
      },
    ],
  }
}
