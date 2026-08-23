#!/usr/bin/env python3
"""Build the V32 restrained, mono, 48 kHz airframe cue set."""

from __future__ import annotations

import argparse
import math
import random
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 48_000


def fade(samples: list[float], fade_in: float, fade_out: float) -> list[float]:
    total = len(samples)
    in_frames = max(1, int(SAMPLE_RATE * fade_in))
    out_frames = max(1, int(SAMPLE_RATE * fade_out))
    for i in range(min(in_frames, total)):
        samples[i] *= 0.5 - 0.5 * math.cos(math.pi * i / in_frames)
    for i in range(min(out_frames, total)):
        samples[total - 1 - i] *= 0.5 - 0.5 * math.cos(math.pi * i / out_frames)
    return samples


def normalize(samples: list[float], rms_db: float = -18.0, peak_db: float = -4.5) -> list[float]:
    peak = max((abs(value) for value in samples), default=0.0)
    rms = math.sqrt(sum(value * value for value in samples) / max(1, len(samples)))
    if peak == 0 or rms == 0:
        return samples
    peak_target = 10 ** (peak_db / 20)
    rms_target = 10 ** (rms_db / 20)
    scale = min(peak_target / peak, rms_target / rms)
    return [max(-1.0, min(1.0, value * scale)) for value in samples]


def original_epstein() -> list[float]:
    duration = 0.96
    count = round(duration * SAMPLE_RATE)
    rng = random.Random(4701)
    noise_state = 0.0
    phase = 0.0
    samples: list[float] = []
    for i in range(count):
        t = i / SAMPLE_RATE
        u = t / duration
        frequency = 62 * (245 / 62) ** (u ** 1.35)
        phase += 2 * math.pi * frequency / SAMPLE_RATE
        body_env = math.sin(math.pi * min(1.0, u)) ** 0.72
        noise_state += 0.032 * ((rng.random() * 2 - 1) - noise_state)
        harmonic = math.sin(phase) + 0.22 * math.sin(phase * 2.03) + 0.08 * math.sin(phase * 4.11)
        catch = math.exp(-((t - 0.73) / 0.032) ** 2) * math.sin(2 * math.pi * 920 * t)
        samples.append(body_env * (0.5 * harmonic + 0.24 * noise_state) + 0.17 * catch)
    return normalize(fade(samples, 0.035, 0.13), rms_db=-18.0, peak_db=-4.5)


def original_warp() -> list[float]:
    duration = 0.82
    count = round(duration * SAMPLE_RATE)
    rng = random.Random(4702)
    phase_up = 0.0
    phase_down = 0.0
    noise_state = 0.0
    samples: list[float] = []
    for i in range(count):
        t = i / SAMPLE_RATE
        u = t / duration
        up = 150 * (2_800 / 150) ** (u ** 1.15)
        down = 3_200 * (115 / 3_200) ** (u ** 0.74)
        phase_up += 2 * math.pi * up / SAMPLE_RATE
        phase_down += 2 * math.pi * down / SAMPLE_RATE
        noise_state += 0.11 * ((rng.random() * 2 - 1) - noise_state)
        arc = math.sin(math.pi * u) ** 1.25
        crossing = math.exp(-((u - 0.57) / 0.075) ** 2)
        value = arc * (0.34 * math.sin(phase_up) + 0.27 * math.sin(phase_down))
        value += crossing * (0.22 * noise_state + 0.12 * math.sin(2 * math.pi * 74 * t))
        samples.append(value)
    return normalize(fade(samples, 0.025, 0.1), rms_db=-18.5, peak_db=-4.5)


def original_fold() -> list[float]:
    duration = 1.08
    count = round(duration * SAMPLE_RATE)
    rng = random.Random(4703)
    phase_low = 0.0
    phase_mid = 0.0
    noise_state = 0.0
    samples: list[float] = []
    for i in range(count):
        t = i / SAMPLE_RATE
        u = t / duration
        phase_low += 2 * math.pi * (44 - 15 * u) / SAMPLE_RATE
        phase_mid += 2 * math.pi * (310 * (82 / 310) ** u) / SAMPLE_RATE
        noise_state += 0.018 * ((rng.random() * 2 - 1) - noise_state)
        pressure = math.sin(math.pi * min(1.0, u / 0.83)) ** 0.82 if u < 0.83 else (1 - u) / 0.17
        seam = math.exp(-((t - 0.78) / 0.018) ** 2)
        arrival = math.exp(-max(0.0, t - 0.78) * 13) if t >= 0.78 else 0.0
        value = pressure * (0.52 * math.sin(phase_low) + 0.17 * math.sin(phase_mid) + 0.18 * noise_state)
        value += seam * 0.24 * (rng.random() * 2 - 1)
        value += arrival * 0.11 * math.sin(2 * math.pi * 640 * (t - 0.78))
        samples.append(math.tanh(value * 1.08))
    return normalize(fade(samples, 0.045, 0.16), rms_db=-19.0, peak_db=-4.5)


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    pcm = b"".join(struct.pack("<h", round(max(-1.0, min(1.0, value)) * 32767)) for value in samples)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", type=Path, default=Path(__file__).resolve().parents[1] / "public" / "sfx")
    args = parser.parse_args()

    silence = [0.0] * round(0.35 * SAMPLE_RATE)
    cues = {
        "x1": silence,
        "sr71": silence,
        "proteus": silence,
        "starship": silence,
        "epstein": original_epstein(),
        "warp": original_warp(),
        "fold": original_fold(),
    }
    for name, samples in cues.items():
        write_wav(args.out_dir / f"{name}.wav", samples)


if __name__ == "__main__":
    main()
