const fs = require('node:fs');
const path = require('node:path');

const SAMPLE_RATE = 48000;
const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/audio/sfx');
const TAU = Math.PI * 2;

function clamp(value, min = -1, max = 1)
{
    return Math.max(min, Math.min(max, value));
}

function envelope(t, duration, attack = 0.01, release = 0.12)
{
    const fadeIn = Math.min(1, t / Math.max(attack, 0.0001));
    const fadeOut = Math.min(1, (duration - t) / Math.max(release, 0.0001));
    return clamp(Math.min(fadeIn, fadeOut), 0, 1);
}

function seededNoise(seed = 1)
{
    let state = seed >>> 0;

    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return (state / 0xffffffff) * 2 - 1;
    };
}

function oscillator(type, phase)
{
    const cycle = ((phase / TAU) % 1 + 1) % 1;

    if (type === 'square') return cycle < 0.5 ? 1 : -1;
    if (type === 'triangle') return 1 - 4 * Math.abs(cycle - 0.5);
    if (type === 'saw') return cycle * 2 - 1;
    return Math.sin(phase);
}

function render(duration, sample, options = {})
{
    const length = Math.ceil(duration * SAMPLE_RATE);
    const data = new Float32Array(length);
    const noise = seededNoise(options.seed ?? 1);
    let peak = 0;

    for (let i = 0; i < length; i += 1)
    {
        data[i] = clamp(sample(i / SAMPLE_RATE, duration, noise));
        peak = Math.max(peak, Math.abs(data[i]));
    }

    const targetPeak = 0.89;
    const gain = peak > 0 ? targetPeak / peak : 1;

    for (let i = 0; i < length; i += 1)
    {
        data[i] = clamp(data[i] * gain);
    }

    return data;
}

function writeWav(filename, samples)
{
    const dataLength = samples.length * 2;
    const buffer = Buffer.alloc(44 + dataLength);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);

    for (let i = 0; i < samples.length; i += 1)
    {
        buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
    }

    fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
}

function tone(t, frequency, type = 'sine', phaseOffset = 0)
{
    return oscillator(type, TAU * frequency * t + phaseOffset);
}

const effects = {
    'engine-loop.wav': render(3, (t) => {
        const phase = TAU * 73 * t + (3 / 8) * (1 - Math.cos(TAU * 8 * t));
        const body = oscillator('saw', phase) * 0.46 + oscillator('square', phase * 2) * 0.14;
        return body;
    }),

    'acceleration.wav': render(1.1, (t, duration, noise) => {
        const progress = t / duration;
        const frequency = 90 + 330 * progress * progress;
        const phase = TAU * (90 * t + (330 / (3 * duration * duration)) * t ** 3);
        return (oscillator('saw', phase) * 0.46 + oscillator('square', phase * 0.5) * 0.17 + noise() * 0.04)
            * envelope(t, duration, 0.025, 0.16);
    }, { seed: 1002 }),

    'braking.wav': render(0.68, (t, duration, noise) => {
        const progress = t / duration;
        const squeal = tone(t, 920 - 360 * progress, 'triangle') * 0.23;
        const scrape = noise() * (0.6 - 0.3 * progress);
        return (squeal + scrape) * envelope(t, duration, 0.008, 0.22);
    }, { seed: 1003 }),

    'collision.wav': render(0.52, (t, duration, noise) => {
        const hit = Math.exp(-t * 18) * (tone(t, 74, 'sine') * 0.75 + noise() * 0.65);
        const debris = t > 0.06 ? noise() * 0.25 * Math.exp(-(t - 0.06) * 10) : 0;
        return (hit + debris) * envelope(t, duration, 0.002, 0.08);
    }, { seed: 1004 }),

    'pickup.wav': render(0.58, (t, duration) => {
        const notes = [523.25, 659.25, 783.99];
        const index = Math.min(notes.length - 1, Math.floor(t / 0.14));
        const local = t - index * 0.14;
        const ping = tone(local, notes[index], 'square') * 0.32 + tone(local, notes[index] * 2, 'sine') * 0.18;
        return ping * Math.exp(-local * 7) * envelope(t, duration, 0.004, 0.09);
    }),

    'delivery-complete.wav': render(1.18, (t, duration) => {
        const notes = [392, 523.25, 659.25, 783.99];
        const step = 0.22;
        const index = Math.min(notes.length - 1, Math.floor(t / step));
        const local = t - index * step;
        const chord = tone(local, notes[index], 'triangle') * 0.42
            + tone(local, notes[index] * 1.5, 'sine') * 0.18;
        return chord * Math.exp(-local * 3.3) * envelope(t, duration, 0.008, 0.2);
    }),

    'money.wav': render(0.55, (t, duration) => {
        const strike = tone(t, 1320, 'sine') * 0.42 + tone(t, 1980, 'sine') * 0.25;
        const sparkle = tone(t, 2640 + Math.sin(TAU * 12 * t) * 80, 'triangle') * 0.12;
        return (strike + sparkle) * Math.exp(-t * 6) * envelope(t, duration, 0.003, 0.12);
    }),

    'pursuit-start.wav': render(1.25, (t, duration) => {
        const sirenPhase = TAU * 630 * t + (190 / 2.7) * (1 - Math.cos(TAU * 2.7 * t));
        const siren = oscillator('square', sirenPhase) * 0.34;
        const alarm = tone(t, 95, 'saw') * 0.14;
        return (siren + alarm) * envelope(t, duration, 0.025, 0.16);
    }),

    'pursuit-end.wav': render(1.05, (t, duration) => {
        const phase = TAU * (720 * t - (390 / (2 * duration)) * t * t);
        const calm = oscillator('triangle', phase) * 0.38 + oscillator('sine', phase * 0.5) * 0.21;
        return calm * envelope(t, duration, 0.012, 0.28);
    }),

    'game-over.wav': render(2.35, (t, duration) => {
        const notes = [329.63, 293.66, 246.94, 164.81];
        const step = 0.48;
        const index = Math.min(notes.length - 1, Math.floor(t / step));
        const local = t - index * step;
        const note = tone(local, notes[index], 'square') * 0.3
            + tone(local, notes[index] * 0.5, 'triangle') * 0.28;
        return note * Math.exp(-local * 2.4) * envelope(t, duration, 0.01, 0.36);
    }),

    'ui-click.wav': render(0.12, (t, duration, noise) => {
        const click = tone(t, 1180, 'square') * 0.38 + noise() * 0.12;
        return click * Math.exp(-t * 34) * envelope(t, duration, 0.001, 0.025);
    }, { seed: 1011 })
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const [filename, samples] of Object.entries(effects))
{
    writeWav(filename, samples);
    console.log(`Generated ${filename} (${(samples.length / SAMPLE_RATE).toFixed(2)} s)`);
}
