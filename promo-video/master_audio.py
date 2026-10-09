"""書き出した音（曲＋効果音）を整える。render.mjs から呼ばれる。

    python master_audio.py in.wav out.wav

聴感の大きさを TARGET_LUFS 前後にそろえ、ピークを CEILING_DB に抑える（先読みつきのリミッター。AAC にしたあと -1 dBTP 前後）。
Remotion の音の書き出しは 16bit なので、BusPromo.jsx 側では曲を 0.8 倍にして重なりでも割れないようにしてあり、
ここで持ち上げる。LUFS は BS.1770 の近似（K 特性は FFT で近似、400ms ブロック・ゲートあり）。
"""
import sys
import wave

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
TARGET_LUFS = -14.5
CEILING_DB = -2.0  # AAC にすると少し上に出るので余裕を見る


def read(path):
    with wave.open(path, "rb") as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype="<i2").astype(np.float64) / 32768
    return sr, x.reshape(-1, ch)


def write(path, sr, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(x.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 32767 / 32768) * 32768).astype("<i2").tobytes())


def k_weight(x, sr):
    size = 1 << max(1, (len(x) - 1).bit_length())
    f = np.fft.rfftfreq(size, 1 / sr)
    h = 1 / np.sqrt(1 + (60 / np.maximum(f, 1e-3)) ** 4)
    h *= 1 + (10 ** (4 / 20) - 1) * f ** 2 / (f ** 2 + 1500 ** 2)
    return np.fft.irfft(np.fft.rfft(x, size, axis=0) * h[:, None], size, axis=0)[:len(x)]


def lufs(x, sr):
    y = k_weight(x, sr)
    blk, hop = int(0.4 * sr), int(0.1 * sr)
    ms = np.array([np.mean(np.sum(y[i:i + blk] ** 2, axis=1)) for i in range(0, len(y) - blk, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[lk > -70]
    rel = -0.691 + 10 * np.log10(np.mean(g)) - 10
    g = ms[(lk > -70) & (lk > rel)]
    return -0.691 + 10 * np.log10(np.mean(g))


def limit(x, sr, ceiling):
    """1ms ごとの必要な減衰を 3ms 先読みで求め、戻りは 80ms でなめらかに"""
    b = sr // 1000
    n = len(x) // b * b
    env = np.abs(x[:n]).max(axis=1).reshape(-1, b).max(axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    look = np.copy(need)
    for k in range(1, 4):
        look[:-k] = np.minimum(look[:-k], need[k:])
    rel = 1 - np.exp(-1 / 80)
    g = np.empty_like(look)
    cur = 1.0
    for i, v in enumerate(look):
        cur = v if v < cur else cur + (min(1.0, v) - cur) * rel
        g[i] = cur
    g = np.convolve(np.pad(g, 1, mode="edge"), np.ones(3) / 3, mode="valid")
    g = np.minimum(g, look)
    gs = np.interp(np.arange(len(x)), np.arange(len(g)) * b + b / 2, g)
    y = x * gs[:, None]
    return np.clip(y, -ceiling, ceiling), 20 * np.log10(g.min())


if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    sr, x = read(src)
    clipped = int(np.sum(np.abs(x) >= 32767 / 32768))
    before = lufs(x, sr)
    x = x * 10 ** ((TARGET_LUFS - before) / 20)
    ceiling = 10 ** (CEILING_DB / 20)
    x, gr = limit(x, sr, ceiling)
    after = lufs(x, sr)
    write(dst, sr, x)
    print(f"  音：{before:.1f} → {after:.1f} LUFS（近似）・ピーク {CEILING_DB:.1f} dBFS・最大の抑え {gr:.1f} dB"
          + (f"・書き出しの時点で割れていたサンプル {clipped}" if clipped else ""))
