import wave
import struct
import math
import random
import os

SR = 44100

NOTE_FREQS = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
    'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
    'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
    'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
    'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.35, 'E5': 659.25,
    'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
}

def sine(freq, duration, sr=SR):
    n = int(sr * duration)
    return [math.sin(2.0 * math.pi * freq * i / sr) for i in range(n)]

def square(freq, duration, sr=SR):
    n = int(sr * duration)
    return [1.0 if math.sin(2.0 * math.pi * freq * i / sr) >= 0 else -1.0 for i in range(n)]

def triangle(freq, duration, sr=SR):
    n = int(sr * duration)
    result = []
    for i in range(n):
        phase = (freq * i / sr) % 1.0
        val = 4.0 * abs(phase - 0.5) - 1.0
        result.append(val)
    return result

def sawtooth(freq, duration, sr=SR):
    n = int(sr * duration)
    return [2.0 * ((freq * i / sr) % 1.0) - 1.0 for i in range(n)]

def envelope(samples, attack=0.02, decay=0.05, sr=SR):
    n = len(samples)
    attack_n = int(attack * sr)
    decay_n = int(decay * sr)
    result = list(samples)
    for i in range(min(attack_n, n)):
        result[i] *= i / attack_n
    for i in range(min(decay_n, n)):
        result[n - 1 - i] *= i / decay_n
    return result

def adsr(samples, attack=0.01, decay=0.03, sustain_level=0.7, release=0.05, sr=SR):
    n = len(samples)
    attack_n = int(attack * sr)
    decay_n = int(decay * sr)
    release_n = int(release * sr)
    sustain_n = max(0, n - attack_n - decay_n - release_n)
    result = list(samples)
    for i in range(min(attack_n, n)):
        result[i] *= i / max(attack_n, 1)
    for i in range(min(decay_n, n)):
        t = i / max(decay_n, 1)
        result[attack_n + i] *= 1.0 - t * (1.0 - sustain_level)
    for i in range(min(sustain_n, n)):
        result[attack_n + decay_n + i] *= sustain_level
    for i in range(min(release_n, n)):
        t = i / max(release_n, 1)
        idx = n - release_n + i
        if 0 <= idx < n:
            result[idx] *= sustain_level * (1.0 - t)
    return result

def lowpass(samples, cutoff=4000, sr=SR):
    rc = 1.0 / (2.0 * math.pi * cutoff)
    dt = 1.0 / sr
    alpha = dt / (rc + dt)
    result = [0.0] * len(samples)
    result[0] = samples[0]
    for i in range(1, len(samples)):
        result[i] = result[i - 1] + alpha * (samples[i] - result[i - 1])
    return result

def mix_tracks(tracks, total_samples):
    result = [0.0] * total_samples
    for samples, offset, volume in tracks:
        start = offset
        for i, s in enumerate(samples):
            idx = start + i
            if 0 <= idx < total_samples:
                result[idx] += s * volume
    return result

def normalize(samples, peak=0.85):
    max_val = max(abs(s) for s in samples) if samples else 1.0
    if max_val == 0:
        return samples
    factor = peak / max_val
    return [s * factor for s in samples]

def generate_loop(note_sequence, bpm, bars, waveform='sine', bass=True, pad=True, cutoff=8000):
    beat_dur = 60.0 / bpm
    bar_dur = beat_dur * 4
    total_dur = bar_dur * bars
    total_samples = int(SR * total_dur)

    tracks = []

    beat_idx = 0
    for note, beats in note_sequence:
        offset = int(beat_idx * beat_dur * SR)
        note_dur = beats * beat_dur * 0.9
        if waveform == 'sine':
            raw = sine(NOTE_FREQS[note], note_dur)
        elif waveform == 'triangle':
            raw = triangle(NOTE_FREQS[note], note_dur)
        elif waveform == 'square':
            raw = square(NOTE_FREQS[note], note_dur)
        elif waveform == 'saw':
            raw = sawtooth(NOTE_FREQS[note], note_dur)
        else:
            raw = sine(NOTE_FREQS[note], note_dur)
        shaped = adsr(raw, attack=0.008, decay=0.02, sustain_level=0.75, release=min(0.08, note_dur * 0.3))
        tracks.append((shaped, offset, 0.35))
        beat_idx += beats

    if bass:
        bass_notes = [n for n, b in note_sequence if n in NOTE_FREQS]
        for bar in range(bars):
            for beat in range(0, 4, 2):
                if bass_notes:
                    note = bass_notes[(bar * 2 + beat // 2) % len(bass_notes)]
                    bass_octave = note[:-1] + str(int(note[-1]) - 1) if note[-1].isdigit() else note
                    freq = NOTE_FREQS.get(bass_octave, NOTE_FREQS[note] / 2)
                    offset = int((bar * bar_dur + beat * beat_dur) * SR)
                    raw = sine(freq, beat_dur * 1.8)
                    shaped = adsr(raw, attack=0.01, decay=0.04, sustain_level=0.6, release=0.1)
                    tracks.append((shaped, offset, 0.25))

    if pad:
        pad_notes = [n for n, b in note_sequence[:4] if n in NOTE_FREQS]
        for bar in range(bars):
            offset = int(bar * bar_dur * SR)
            chord_freqs = [NOTE_FREQS[n] for n in pad_notes[:3] if n in NOTE_FREQS]
            if chord_freqs:
                pad_dur = bar_dur * 0.95
                pad_len = int(pad_dur * SR)
                pad_samples = [0.0] * pad_len
                for freq in chord_freqs:
                    wave_samples = triangle(freq, pad_dur)
                    for i in range(pad_len):
                        pad_samples[i] += wave_samples[i] / len(chord_freqs)
                shaped = adsr(pad_samples, attack=0.15, decay=0.1, sustain_level=0.5, release=0.2)
                tracks.append((shaped, offset, 0.12))

    mixed = mix_tracks(tracks, total_samples)
    mixed = lowpass(mixed, cutoff=cutoff)

    fade_samples = int(0.05 * SR)
    for i in range(min(fade_samples, total_samples)):
        mixed[i] *= i / fade_samples
        mixed[total_samples - 1 - i] *= i / fade_samples

    return normalize(mixed)

def write_wav(samples, path, sr=SR):
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        for s in samples:
            val = max(-1.0, min(1.0, s))
            w.writeframes(struct.pack('<h', int(val * 32767)))

# --- Robot music definitions ---

# Mabel (Grandma, housecleaning) - Gentle waltz, warm, cozy
# Key: C major, 3/4 feel at moderate tempo
mabel_melody = [
    ('E4', 1.5), ('G4', 0.5), ('A4', 1), ('G4', 1),
    ('E4', 1), ('D4', 1), ('C4', 2),
    ('D4', 1.5), ('E4', 0.5), ('G4', 1), ('E4', 1),
    ('D4', 1.5), ('C4', 0.5), ('D4', 1), ('C4', 1),
    ('E4', 1), ('G4', 1), ('A4', 1), ('G4', 1),
    ('C5', 1), ('A4', 1), ('G4', 2),
    ('E4', 1), ('D4', 1), ('C4', 1), ('D4', 1),
    ('E4', 2), ('G4', 1), ('E4', 1),
]

# Orbit (Grandpa, vehicle-repair) - Steady blues, mechanical groove
# Key: A minor, steady 4/4
orbit_melody = [
    ('A3', 1), ('C4', 0.5), ('D4', 0.5), ('E4', 1), ('D4', 1),
    ('C4', 1), ('A3', 1), ('E3', 2),
    ('A3', 1), ('E4', 0.5), ('D4', 0.5), ('C4', 1), ('A3', 1),
    ('E3', 1), ('A3', 1), ('C4', 2),
    ('D4', 1), ('E4', 0.5), ('D4', 0.5), ('C4', 1), ('A3', 1),
    ('E4', 1), ('D4', 1), ('C4', 2),
    ('A3', 1), ('C4', 1), ('E4', 1), ('A3', 1),
    ('E3', 2), ('A3', 2),
]

# Luma (Mama, knowledge-teacher) - Thoughtful, gentle, curious
# Key: G major, flowing melody
luma_melody = [
    ('G4', 1), ('A4', 0.5), ('B4', 0.5), ('D5', 1.5), ('B4', 0.5),
    ('A4', 1), ('G4', 1), ('D4', 2),
    ('G4', 1), ('B4', 0.5), ('A4', 0.5), ('G4', 1), ('E4', 1),
    ('D4', 1), ('E4', 1), ('G4', 2),
    ('B4', 1), ('A4', 0.5), ('G4', 0.5), ('A4', 1), ('B4', 1),
    ('D5', 1.5), ('B4', 0.5), ('A4', 1), ('G4', 1),
    ('E4', 1), ('G4', 1), ('A4', 1), ('G4', 1),
    ('D4', 2), ('G4', 2),
]

# Helios (Papa, constructor) - Strong, march-like, inventive
# Key: D major, confident rhythm
helios_melody = [
    ('D4', 0.5), ('D4', 0.5), ('A4', 1), ('A4', 1), ('B4', 1),
    ('A4', 0.5), ('G4', 0.5), ('F#4', 1), ('D4', 2),
    ('D4', 0.5), ('E4', 0.5), ('F#4', 1), ('G4', 1), ('A4', 1),
    ('B4', 1), ('A4', 1), ('G4', 2),
    ('A4', 0.5), ('B4', 0.5), ('D5', 1), ('B4', 1), ('A4', 1),
    ('G4', 0.5), ('F#4', 0.5), ('E4', 1), ('D4', 2),
    ('E4', 1), ('F#4', 1), ('G4', 1), ('A4', 1),
    ('D4', 2), ('A4', 2),
]

# Nova (Oldest kid, soccer-coach) - Upbeat, energetic pop
# Key: E major, fast and driving
nova_melody = [
    ('E4', 0.5), ('E4', 0.5), ('G#4', 1), ('B4', 0.5), ('B4', 0.5), ('E5', 1),
    ('D5', 0.5), ('B4', 0.5), ('G#4', 1), ('E4', 2),
    ('E4', 0.5), ('G#4', 0.5), ('A4', 1), ('B4', 0.5), ('B4', 0.5), ('D5', 1),
    ('E5', 1), ('D5', 0.5), ('B4', 0.5), ('G#4', 2),
    ('B4', 0.5), ('D5', 0.5), ('E5', 1), ('D5', 1), ('B4', 1),
    ('G#4', 0.5), ('E4', 0.5), ('G#4', 1), ('A4', 2),
    ('E4', 0.5), ('G#4', 0.5), ('B4', 1), ('E5', 1), ('D5', 1),
    ('B4', 1), ('G#4', 1), ('E4', 2),
]

# Pip (Middle kid, art-assistant) - Quirky, whimsical, playful
# Key: F major with chromatic touches
pip_melody = [
    ('F4', 0.5), ('A4', 0.5), ('C5', 0.5), ('F4', 0.5), ('A4', 1), ('G4', 1),
    ('F4', 0.5), ('E4', 0.5), ('D4', 0.5), ('F4', 0.5), ('A4', 1), ('G4', 1),
    ('C5', 0.5), ('A4', 0.5), ('G4', 0.5), ('F4', 0.5), ('E4', 1), ('D4', 1),
    ('F4', 0.5), ('A4', 0.5), ('C5', 0.5), ('A4', 0.5), ('F4', 2),
    ('G4', 0.5), ('A4', 0.5), ('C5', 0.5), ('D5', 0.5), ('C5', 1), ('A4', 1),
    ('F4', 0.5), ('G4', 0.5), ('A4', 0.5), ('C5', 0.5), ('A4', 1), ('G4', 1),
    ('F4', 1), ('A4', 1), ('C5', 1), ('F4', 1),
]

# Dot (Youngest kid, delivery) - Bouncy, fast, cheerful
# Key: C major, quick and light
dot_melody = [
    ('C4', 0.5), ('E4', 0.5), ('G4', 0.5), ('C5', 0.5), ('G4', 0.5), ('E4', 0.5), ('C4', 1),
    ('D4', 0.5), ('F4', 0.5), ('A4', 0.5), ('D5', 0.5), ('A4', 0.5), ('F4', 0.5), ('D4', 1),
    ('E4', 0.5), ('G4', 0.5), ('C5', 0.5), ('E5', 0.5), ('C5', 0.5), ('G4', 0.5), ('E4', 1),
    ('G4', 0.5), ('E4', 0.5), ('C4', 0.5), ('E4', 0.5), ('G4', 0.5), ('C5', 0.5), ('C4', 1),
    ('C5', 0.5), ('A4', 0.5), ('G4', 0.5), ('E4', 0.5), ('D4', 0.5), ('E4', 0.5), ('G4', 1),
    ('F4', 0.5), ('A4', 0.5), ('G4', 0.5), ('E4', 0.5), ('D4', 0.5), ('C4', 0.5), ('E4', 1),
    ('C4', 1), ('E4', 1), ('G4', 1), ('C5', 1),
]

robots = [
    {
        'name': 'housecleaning',
        'melody': mabel_melody,
        'bpm': 88,
        'bars': 2,
        'waveform': 'sine',
        'cutoff': 5000,
        'desc': 'Gentle waltz for Grandma Mabel',
    },
    {
        'name': 'vehicle-repair',
        'melody': orbit_melody,
        'bpm': 80,
        'bars': 2,
        'waveform': 'saw',
        'cutoff': 3500,
        'desc': 'Steady blues for Grandpa Orbit',
    },
    {
        'name': 'knowledge-teacher',
        'melody': luma_melody,
        'bpm': 92,
        'bars': 2,
        'waveform': 'triangle',
        'cutoff': 6000,
        'desc': 'Thoughtful melody for Mama Luma',
    },
    {
        'name': 'constructor',
        'melody': helios_melody,
        'bpm': 100,
        'bars': 2,
        'waveform': 'square',
        'cutoff': 4500,
        'desc': 'Strong march for Papa Helios',
    },
    {
        'name': 'soccer-coach',
        'melody': nova_melody,
        'bpm': 128,
        'bars': 2,
        'waveform': 'square',
        'cutoff': 7000,
        'desc': 'Energetic pop for Nova',
    },
    {
        'name': 'art-assistant',
        'melody': pip_melody,
        'bpm': 108,
        'bars': 2,
        'waveform': 'triangle',
        'cutoff': 6000,
        'desc': 'Whimsical tune for Pip',
    },
    {
        'name': 'delivery',
        'melody': dot_melody,
        'bpm': 138,
        'bars': 2,
        'waveform': 'sine',
        'cutoff': 7500,
        'desc': 'Bouncy cheerful tune for Dot',
    },
]

output_dir = '/Users/cw/work/projects/robot-family/public/audio/music'

for robot in robots:
    print(f"Generating {robot['desc']} ({robot['name']}.mp3)...")
    samples = generate_loop(
        robot['melody'],
        robot['bpm'],
        robot['bars'],
        waveform=robot['waveform'],
        bass=True,
        pad=True,
        cutoff=robot['cutoff'],
    )
    wav_path = os.path.join(output_dir, f"tmp_{robot['name']}.wav")
    mp3_path = os.path.join(output_dir, f"{robot['name']}.mp3")
    write_wav(samples, wav_path)
    os.system(f'ffmpeg -y -i "{wav_path}" -ac 1 -ar 44100 -b:a 96k "{mp3_path}" 2>/dev/null')
    os.remove(wav_path)
    print(f"  -> {mp3_path}")

print("\nDone! All 7 personality-matched tracks generated.")
