#!/usr/bin/env python3
"""Bake the Play-mode island's synthesized weather sounds into files (so recordings and renders include them):
rain hiss = white noise through a band-pass at 1400 Hz (Q 0.4); thunder = noise through a 140 Hz low-pass with a
fast attack and a 2.8 s decay — the same recipe as drive-portfolio/js/game.js. Writes studio/assets/sfx/*.wav.
    python3 tools/make_sfx.py      (needs numpy)
"""
import numpy as np, wave, os, math
SR = 44100; out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'studio', 'assets', 'sfx')
rng = np.random.default_rng(7)
def biquad(x, kind, f0, q):
    w0 = 2 * math.pi * f0 / SR; a = math.sin(w0) / (2 * q); c = math.cos(w0)
    if kind == 'bandpass': b0, b1, b2 = a, 0, -a
    else: b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
    a0, a1, a2 = 1 + a, -2 * c, 1 - a
    b0, b1, b2, a1, a2 = b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2, x1, y2, y1 = x1, x[i], y1, v; y[i] = v
    return y
def save(name, y, peak=0.9):
    y = y / (np.abs(y).max() + 1e-9) * peak
    with wave.open(os.path.join(out, name), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
    print('wrote', name, round(len(y) / SR, 1), 's')
# rain: 12 s seamless loop (crossfade the ends), plus a few heavier drops for texture
n = SR * 12; noise = rng.uniform(-1, 1, n + SR)
r = biquad(noise, 'bandpass', 1400, 0.4)
drops = np.zeros_like(r); idx = rng.integers(0, len(r) - 400, 900)
for i in idx: drops[i:i + 400] += rng.uniform(-1, 1, 400) * np.exp(-np.arange(400) / 60) * 0.6
r = r + biquad(drops, 'bandpass', 3000, 0.7) * 0.5
fade = np.linspace(0, 1, SR); loop = r[:n].copy(); loop[:SR] = loop[:SR] * fade + r[n:n + SR] * (1 - fade)
save('rain-loop.wav', loop, 0.6)
# thunder: rumble with an exponential envelope, slight second roll
t = np.arange(int(SR * 3.6)) / SR
env = np.minimum(1, t / 0.08) * np.exp(-t / 0.9) + 0.5 * np.exp(-np.maximum(0, t - 0.7) / 1.1) * (t > 0.7)
th = biquad(rng.uniform(-1, 1, len(t)), 'lowpass', 140, 0.7) * env
save('thunder.wav', th, 0.95)
