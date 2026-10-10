"""「次のバス」紹介動画の BGM と効果音を numpy だけで合成して public/audio/ に書き出す。

    python make_audio.py            # bgm.wav と sfx/*.wav
    python make_audio.py --check    # ついでに out/audio_check.png（波形とスペクトログラム）も描く

外部素材を使わないので、ライセンス表記は不要。

BGM は 120 BPM・4/4。1小節 = 2秒 = 60フレームで、小節 b の頭は 2b 秒。
動画の区切り（src/theme.js の T）も同じ格子に乗せてある。
  0–1小節   イントロ：時計の音とパッドだけ。1小節目でライザー
  2小節     ドロップ（王道進行 IV–V–iii–vi がフルで始まる）
  12小節    早送り：スネアのロールとライザーで持ち上げる
  13小節    発車2分前の一撃
  14–16小節 ブレイク（ロック画面のライブアクティビティ → Dynamic Island）：ドラムが抜ける
  17小節    戻る
  20小節    最後の一打（40秒）。あとは余韻
"""
import os
import sys
import time
import wave

import numpy as np

sys.stdout.reconfigure(encoding="utf-8")

SR = 48000
BPM = 120
BEAT = 60 / BPM          # 0.5 s
BAR = BEAT * 4           # 2.0 s
TOTAL = 44.0             # 書き出す長さ（動画は 43 秒）
N = int(SR * TOTAL)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "public", "audio")
rng = np.random.default_rng(1014)


# ── 基本 ─────────────────────────────────────────────
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def at(bar, beat=0.0):
    """小節・拍 → 秒"""
    return bar * BAR + beat * BEAT


def tt(dur):
    return np.arange(int(SR * dur)) / SR


def fft_filter(x, lo=None, hi=None, order=2):
    """位相のずれない FFT フィルタ（lo = ハイパス、hi = ローパスの遮断周波数）"""
    n = len(x)
    size = 1 << max(1, (n - 1).bit_length())
    spec = np.fft.rfft(x, size)
    f = np.fft.rfftfreq(size, 1 / SR)
    h = np.ones_like(f)
    if hi:
        h *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    if lo:
        h *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * order))
    return np.fft.irfft(spec * h, size)[:n]


def band_noise(n, fc_of_x, width=0.6, seed=0):
    """中心周波数が時間とともに変わる帯域ノイズ（STFT で帯域を掛ける。前作の make_film_sfx.py と同じ）"""
    r = np.random.default_rng(seed)
    noise = r.standard_normal(n + 4096)
    hop, win = 256, 2048
    window = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    out = np.zeros(len(noise))
    norm = np.zeros(len(noise))
    for i in range(1 + (len(noise) - win) // hop):
        s = i * hop
        fc = fc_of_x(min(1.0, s / n))
        band = np.exp(-0.5 * (np.log2(np.maximum(freqs, 1) / fc) / width) ** 2)
        out[s:s + win] += np.fft.irfft(np.fft.rfft(noise[s:s + win] * window) * band) * window
        norm[s:s + win] += window ** 2
    return (out / np.maximum(norm, 1e-6))[:n]


class Bus:
    """ステレオのトラック。add(秒, 信号, pan) で足していく"""

    def __init__(self, n=N):
        self.l = np.zeros(n)
        self.r = np.zeros(n)

    def add(self, sec, sig, pan=0.0, gain=1.0):
        i = int(round(sec * SR))
        l, r = sig if isinstance(sig, tuple) else (sig, sig)
        a = (pan + 1) * np.pi / 4
        gl, gr = np.cos(a) * np.sqrt(2), np.sin(a) * np.sqrt(2)
        n = min(len(l), len(self.l) - i)
        if n <= 0:
            return
        self.l[i:i + n] += l[:n] * gain * gl
        self.r[i:i + n] += r[:n] * gain * gr

    def scaled(self, g):
        b = Bus(len(self.l))
        b.l, b.r = self.l * g, self.r * g
        return b


def convolve(x, ir):
    size = 1 << (len(x) + len(ir) - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]


def make_ir(rt60=1.6, length=2.6, seed=5, damp=5200):
    """やわらかい部屋鳴り（指数減衰するノイズを暗くしたもの）。L と R で別のノイズ"""
    t = tt(length)
    tau = rt60 / 6.91
    r = np.random.default_rng(seed)
    pre = int(SR * 0.018)
    irs = []
    for _ in range(2):
        x = r.standard_normal(len(t)) * np.exp(-t / tau)
        x = fft_filter(x, lo=180, hi=damp)
        x = np.concatenate([np.zeros(pre), x])
        irs.append(x / np.sqrt(np.sum(x ** 2)))
    return irs


# ── 楽器 ─────────────────────────────────────────────
def ep(f0, dur, vel=0.7):
    """FM のエレピ（1:1 の胴鳴り＋1:14 のティン）。dur 秒で離鍵"""
    rel = 0.28
    t = tt(dur + rel + 0.05)
    k = (220 / f0) ** 0.3
    i1 = (0.9 + 1.4 * vel) * np.exp(-t / 0.4) + 0.12
    body = np.sin(2 * np.pi * f0 * t + i1 * np.sin(2 * np.pi * f0 * t))
    body2 = np.sin(2 * np.pi * f0 * 1.0035 * t + 0.6 * i1 * np.sin(2 * np.pi * f0 * 1.0035 * t))
    i2 = 1.6 * vel * np.exp(-t / 0.025)
    tine = np.sin(2 * np.pi * f0 * t + i2 * np.sin(2 * np.pi * 14 * f0 * t)) * np.exp(-t / 0.22)
    env = np.minimum(1, t / 0.002) * np.exp(-t / (1.7 * k))
    env *= np.where(t > dur, np.exp(-(t - dur) / (rel / 4)), 1.0)
    y = (0.62 * body + 0.38 * body2 + 0.32 * tine) * env * vel
    trem = 0.22 * np.sin(2 * np.pi * 4.6 * t)  # 左右にゆれる
    return y * (1 + trem), y * (1 - trem)


def bell(f0, dur, vel=0.7):
    """マレットの鉄琴（倍音の速い減衰＋ 3.5 倍の FM できらっとさせる）"""
    t = tt(max(dur, 0.2) + 1.4)
    i = 1.3 * np.exp(-t / 0.09)
    y = np.sin(2 * np.pi * f0 * t + i * np.sin(2 * np.pi * 3.5 * f0 * t))
    y += 0.22 * np.sin(2 * np.pi * 2 * f0 * t) * np.exp(-t / 0.18)
    y += 0.08 * np.sin(2 * np.pi * 4.01 * f0 * t) * np.exp(-t / 0.05)
    env = np.minimum(1, t / 0.0015) * np.exp(-t / 0.75)
    env *= np.where(t > dur + 0.25, np.exp(-(t - dur - 0.25) / 0.12), 1.0)
    return y * env * vel


def saw(f0, t, top=3200):
    """帯域制限したのこぎり波（倍音を足し合わせる）"""
    y = np.zeros_like(t)
    for h in range(1, max(2, int(top / f0)) + 1):
        y += np.sin(2 * np.pi * h * f0 * t) / h
    return y


def pad_chord(notes, dur, att=0.35, rel=0.6):
    t = tt(dur + rel)
    l = np.zeros_like(t)
    r = np.zeros_like(t)
    for m in notes:
        f0 = midi(m)
        for det, p in ((-0.0045, -0.7), (0.0, 0.0), (0.0047, 0.7)):
            ph = rng.uniform(0, 1)
            y = saw(f0 * (1 + det), t + ph / f0)
            l += y * (1 - p) / 2
            r += y * (1 + p) / 2
    env = np.minimum(1, t / att) * np.where(t > dur, np.exp(-(t - dur) / (rel / 4)), 1.0)
    return l * env, r * env


def bass(f0, dur, vel=0.8):
    t = tt(dur + 0.08)
    y = np.sin(2 * np.pi * f0 * t) + 0.35 * np.sin(2 * np.pi * 2 * f0 * t) + 0.12 * np.sin(2 * np.pi * 3 * f0 * t)
    y = np.tanh(1.6 * y) / np.tanh(1.6)
    env = np.minimum(1, t / 0.006) * (0.72 + 0.28 * np.exp(-t / 0.12))
    env *= np.where(t > dur - 0.03, np.exp(-(t - dur + 0.03) / 0.025), 1.0)
    return y * env * vel


NOISE = rng.standard_normal(SR * 4)
HAT_NOISE = fft_filter(NOISE, lo=7200, order=3)
SHAKER_NOISE = fft_filter(NOISE, lo=4200, hi=11000, order=2)
SNARE_NOISE = fft_filter(NOISE, lo=1300, hi=8500, order=2)
CLAP_NOISE = fft_filter(NOISE, lo=900, hi=3200, order=2)
CRASH_NOISE = fft_filter(NOISE, lo=3800, order=2)


def noise_slice(src, n, seed):
    s = np.random.default_rng(seed).integers(0, len(src) - n)
    return src[s:s + n]


def kick(vel=1.0):
    t = tt(0.45)
    f = 44 + 100 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26) * np.minimum(1, t / 0.001)
    click = noise_slice(SNARE_NOISE, len(t), 11) * np.exp(-t / 0.0025) * 0.35
    return np.tanh(1.4 * (body + click)) * vel


def snare(vel=1.0, seed=0):
    t = tt(0.35)
    tone = 0.55 * np.sin(2 * np.pi * 188 * t) * np.exp(-t / 0.05) + 0.25 * np.sin(2 * np.pi * 336 * t) * np.exp(-t / 0.035)
    nz = noise_slice(SNARE_NOISE, len(t), 100 + seed) * np.exp(-t / 0.11) * 0.8
    clap = np.zeros_like(t)
    cn = noise_slice(CLAP_NOISE, len(t), 200 + seed)
    for k, d in enumerate((0.0, 0.009, 0.018)):
        tt_ = np.clip(t - d, 0, None)
        clap += cn * np.exp(-tt_ / (0.005 if k < 2 else 0.07)) * (t >= d)
    return (tone + nz + 0.7 * clap) * vel * np.minimum(1, t / 0.0008)


def hat(vel=1.0, open_=False, seed=0):
    t = tt(0.65 if open_ else 0.12)
    y = noise_slice(HAT_NOISE, len(t), 300 + seed) * np.exp(-t / (0.22 if open_ else 0.032))
    return y * vel * np.minimum(1, t / 0.0005)


def shaker(vel=1.0, seed=0):
    t = tt(0.12)
    y = noise_slice(SHAKER_NOISE, len(t), 400 + seed)
    return y * np.minimum(1, t / 0.014) * np.exp(-t / 0.045) * vel


def crash(vel=1.0, seed=0):
    t = tt(3.2)
    y = noise_slice(CRASH_NOISE, len(t), 500 + seed) * np.exp(-t / 1.1)
    for k in range(9):
        f = 3000 + 650 * k + 137 * np.sin(k * 3.1)
        y += 0.05 * np.sin(2 * np.pi * f * t) * np.exp(-t / (0.5 + 0.1 * k))
    return y * vel * np.minimum(1, t / 0.001)


def tick(high=True, vel=1.0):
    """時計のチク・タク（ウッドブロック風）"""
    t = tt(0.09)
    f = 2350 if high else 1680
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.011) + 0.4 * np.sin(2 * np.pi * f * 2.71 * t) * np.exp(-t / 0.005)
    y += noise_slice(SNARE_NOISE, len(t), 600 + int(high)) * np.exp(-t / 0.0015) * 0.5
    return y * vel


def riser(dur, seed=11):
    n = int(SR * dur)
    x = np.arange(n) / n
    nz = band_noise(n, lambda u: 350 * (24 ** (u ** 1.5)), 0.7, seed=seed)
    f = 150 * (2 ** (2.5 * x ** 1.6))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = 0.3 * np.sin(ph) + 0.16 * np.sin(ph * 1.5) + 0.06 * np.sin(ph * 2)
    env = x ** 2.2 * np.where(x > 0.97, np.exp(-(x - 0.97) / 0.01), 1.0)
    return (nz * 1.1 + tone) * env


def impact(seed=5, size=1.0):
    t = tt(2.6)
    f = 36 + 72 * np.exp(-t / 0.09)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 * size)) * np.minimum(1, t / 0.003)
    burst = band_noise(len(t), lambda u: 2400 * (0.25 ** u), 1.1, seed=seed) * np.exp(-t / 0.16) * 0.8
    return sub * 1.3 + burst


# ── 曲の設計 ──────────────────────────────────────────
# 小節 → [(拍, コード)]
CHORDS = {
    0: [(0, "Bm7")], 1: [(0, "Asus4"), (2, "A")],
    2: [(0, "Gmaj7")], 3: [(0, "A")], 4: [(0, "F#m7")], 5: [(0, "Bm7")],
    6: [(0, "Gmaj7")], 7: [(0, "A")], 8: [(0, "F#m7")], 9: [(0, "Bm7")],
    10: [(0, "Gmaj7")], 11: [(0, "A")], 12: [(0, "F#m7")], 13: [(0, "Bm7")],
    14: [(0, "Em7")], 15: [(0, "F#m7")], 16: [(0, "Asus4"), (2, "A")],
    17: [(0, "Gmaj7")], 18: [(0, "F#m7"), (2, "Bm7")], 19: [(0, "Em7"), (2, "A7")],
    20: [(0, "D")],
}
VOICE = {
    "Gmaj7": [55, 59, 62, 66], "A": [57, 61, 64, 69], "Asus4": [57, 62, 64, 69], "F#m7": [54, 57, 61, 64],
    "Bm7": [57, 62, 66, 71], "Em7": [55, 59, 62, 64], "A7": [55, 61, 64, 69], "D": [50, 57, 62, 64, 66, 69],
}
ROOT_NOTE = {"Gmaj7": 43, "A": 45, "Asus4": 45, "F#m7": 42, "Bm7": 35, "Em7": 40, "A7": 45, "D": 38}
SECTION = {0: "intro", 1: "intro", 12: "build", 14: "break", 15: "break", 16: "break", 20: "final"}


def section(b):
    return SECTION.get(b, "groove")


def chord_at(b, beat):
    cur = CHORDS[b][0][1]
    for s, c in CHORDS[b]:
        if beat >= s:
            cur = c
    return cur


# 鉄琴のメロディ（拍, MIDI, 長さ[拍]）。王道進行に合わせて、強拍はコードの音
HOOK_A = [
    [(0, 78, .5), (.5, 81, .5), (1, 83, 1), (2, 81, .5), (2.5, 78, .5), (3, 74, 1)],
    [(0, 76, .5), (.5, 73, .5), (1, 76, .5), (1.5, 81, 1.5), (3, 83, .5), (3.5, 81, .5)],
    [(0, 85, 1), (1, 81, .5), (1.5, 78, .5), (2, 76, 1), (3, 78, .5), (3.5, 81, .5)],
    [(0, 83, 1.5), (1.5, 81, .5), (2, 78, 1), (3, 74, .5), (3.5, 76, .5)],
]
HOOK_B = [
    [(0, 78, .5), (.5, 81, .5), (1, 83, 1), (2, 86, .5), (2.5, 83, .5), (3, 81, 1)],
    [(0, 85, .5), (.5, 81, .5), (1, 76, .5), (1.5, 81, 1), (2.5, 85, .5), (3, 88, 1)],
    [(0, 85, .5), (.5, 81, .5), (1, 78, 1), (2, 81, .5), (2.5, 85, .5), (3, 83, 1)],
    [(0, 86, 1), (1, 85, .5), (1.5, 83, 1.5), (3, 81, 1)],
]
MELODY = {
    2: HOOK_A[0], 3: HOOK_A[1], 4: HOOK_A[2], 5: HOOK_A[3],
    6: HOOK_B[0], 7: HOOK_B[1], 8: HOOK_B[2], 9: HOOK_B[3],
    10: HOOK_A[0], 11: HOOK_A[1],
    12: [(k * .5, m, .5) for k, m in enumerate([78, 81, 85, 88, 81, 85, 88, 90])],
    13: [(0, 83, 2), (2, 86, 1), (3, 85, 1)],
    14: [(0, 79, 1.5), (1.5, 78, .5), (2, 76, 2)],
    15: [(0, 76, 1), (1, 78, 1), (2, 81, 2)],
    16: [(0, 74, 1), (1, 76, 1), (2, 81, 1), (3, 73, 1)],
    17: HOOK_A[0],
    18: [(0, 85, 1), (1, 81, 1), (2, 83, 1), (3, 78, 1)],
    19: [(0, 83, 1), (1, 79, .5), (1.5, 76, .5), (2, 85, 1), (3, 88, .5), (3.5, 85, .5)],
    20: [(0, 86, 4), (0, 90, 3), (.25, 93, 2.5), (.5, 98, 2)],
}


def build_bgm():
    drums, bassb, keys, bells, pads, fx = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()
    kicks = []  # サイドチェイン用

    for b in range(21):
        sec = section(b)
        # ── ドラム ──
        if sec == "intro":
            for k in range(4):
                drums.add(at(b, k), tick(k % 2 == 0, 0.8 if k % 2 == 0 else 0.62), pan=0.15 if k % 2 == 0 else -0.15)
            if b == 1:
                for k in range(4):  # 後半はチク・タクの間にも小さく
                    drums.add(at(b, k + .5), tick(False, 0.32), pan=-0.1)
        elif sec in ("groove", "build"):
            kb = [0, 1, 2, 3] if sec == "build" else ([0, 2, 3.5] if b % 2 == 1 else [0, 2])
            if b == 19:
                kb = [0, 2, 3.5]
            for k in kb:
                drums.add(at(b, k), kick(0.95))
                kicks.append(at(b, k))
            if sec == "build":
                for k in range(16):  # スネアのロール（だんだん強く）
                    v = 0.18 + 0.82 * (k / 15) ** 1.6
                    drums.add(at(b, k * .25), snare(v * 0.75, seed=k), pan=0.05)
            else:
                for k in (1, 3):
                    drums.add(at(b, k), snare(0.85, seed=b * 4 + k))
            for k in range(8):
                v = 0.62 if k % 2 == 1 else 0.38
                if sec == "build":
                    v *= 1.1
                drums.add(at(b, k * .5), hat(v, seed=b * 8 + k), pan=0.28)
            if b % 2 == 1 and sec != "build":
                drums.add(at(b, 3.5), hat(0.4, open_=True, seed=b), pan=0.28)
            for k in range(16):
                drums.add(at(b, k * .25), shaker(0.5 if k % 4 == 2 else 0.28, seed=b * 16 + k), pan=-0.35)
        elif sec == "break":
            for k in range(16):
                drums.add(at(b, k * .25), shaker(0.42 if k % 4 == 2 else 0.22, seed=b * 16 + k), pan=-0.35)
            if b == 16:  # 戻る直前のフィル
                for k, v in enumerate((0.35, 0.5, 0.68, 0.9)):
                    drums.add(at(b, 3 + k * .25), snare(v * 0.8, seed=90 + k))
        elif sec == "final":
            drums.add(at(b, 0), kick(1.0))
            kicks.append(at(b, 0))

        # クラッシュ（区切り）
        if b in (2, 13, 17, 20):
            drums.add(at(b, 0), crash(0.55 if b != 20 else 0.7, seed=b), pan=-0.2)

        # ── ベース ──
        if sec in ("groove", "build", "final", "break"):
            if sec == "groove":
                pat = [(0, 0, 1.5), (1.5, 0, .5), (2, 0, 1), (3, 12, .5), (3.5, 0, .5)]
            elif sec == "build":
                pat = [(k * .5, 0, .5) for k in range(8)]
            elif sec == "break":
                pat = [(0, 0, 3.9)]
            else:
                pat = [(0, 0, 3.6)]
            for s, oct_, d in pat:
                m = ROOT_NOTE[chord_at(b, s)] + oct_
                v = 0.85 if s in (0, 2) else 0.7
                if sec == "break":
                    v = 0.5
                bassb.add(at(b, s), bass(midi(m), d * BEAT, v))

        # ── エレピ ──
        if sec == "intro":
            for s, c in CHORDS[b]:
                d = (4 - s) * BEAT if len(CHORDS[b]) == 1 or s > 0 else 2 * BEAT
                for m in VOICE[c]:
                    keys.add(at(b, s), ep(midi(m), d * 0.95, 0.6))
        elif sec == "groove":
            for s, d, v in ((0, 1.25, 0.66), (1.5, .75, 0.5), (2.5, 1.25, 0.6)):
                for m in VOICE[chord_at(b, s)]:
                    keys.add(at(b, s), ep(midi(m), d * BEAT, v))
        elif sec == "build":
            for k in range(8):
                v = 0.35 + 0.4 * k / 7
                for m in VOICE[chord_at(b, k * .5)]:
                    keys.add(at(b, k * .5), ep(midi(m), .4 * BEAT, v))
        elif sec == "break":
            for s, c in CHORDS[b]:
                d = (4 - s) * BEAT if s > 0 or len(CHORDS[b]) == 1 else 2 * BEAT
                for m in VOICE[c]:
                    keys.add(at(b, s), ep(midi(m), d * 0.97, 0.5))
        elif sec == "final":
            for m in VOICE["D"]:
                keys.add(at(b, 0), ep(midi(m), 3.4, 0.72))

        # ── 鉄琴 ──
        for s, m, d in MELODY.get(b, []):
            v = 0.62
            if b == 12:
                v = 0.4 + 0.35 * s / 3.5
            if sec == "break":
                v = 0.5
            if sec == "final":
                v = 0.62 if m < 90 else 0.36  # 最後の和音の高い粒は控えめに
            bells.add(at(b, s), bell(midi(m), d * BEAT, v), pan=-0.18)

        # ── パッド ──
        for i, (s, c) in enumerate(CHORDS[b]):
            end = CHORDS[b][i + 1][0] if i + 1 < len(CHORDS[b]) else 4
            d = (end - s) * BEAT
            if sec == "final":
                d = 3.0
            pads.add(at(b, s), pad_chord([m + 12 for m in VOICE[c][:4]], d))

    # ── 効果（曲の一部として拍に合わせるもの）──
    fx.add(at(1, 0), riser(BAR, seed=11), gain=0.55)
    fx.add(at(2, 0), impact(seed=5, size=1.0), gain=0.75)
    fx.add(at(12, 0), riser(BAR, seed=13), gain=0.5)
    fx.add(at(13, 0), impact(seed=6, size=0.7), gain=0.5)
    rev = crash(0.5, seed=77)[: int(SR * 1.0)][::-1]  # 逆再生のシンバルで戻りを予告
    fx.add(at(17, 0) - len(rev) / SR, rev * np.linspace(0, 1, len(rev)) ** 2, pan=0.2, gain=0.8)
    fx.add(at(20, 0), impact(seed=8, size=1.3), gain=0.8)

    return drums, bassb, keys, bells, pads, fx, kicks


def k_weight(x):
    """聴感の重み（K 特性の近似：低域を落とし、2kHz より上を +4dB）"""
    size = 1 << max(1, (len(x) - 1).bit_length())
    f = np.fft.rfftfreq(size, 1 / SR)
    h = 1 / np.sqrt(1 + (60 / np.maximum(f, 1e-3)) ** 4)
    h *= 1 + (10 ** (4 / 20) - 1) * f ** 2 / (f ** 2 + 1500 ** 2)
    return np.fft.irfft(np.fft.rfft(x, size) * h, size)[:len(x)]


def loud_db(l, r, a=at(2), b=at(12)):
    """区間 [a, b] 秒の聴感 RMS（dBFS）。ステムの音量合わせに使う"""
    i, j = int(a * SR), int(b * SR)
    m = k_weight((l[i:j] + r[i:j]) / 2)
    return 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-12)


# ステムの目標の大きさ（ドロップ後の 2〜12 小節で測った聴感 RMS、dBFS）
STEM_DB = {"drums": -20.0, "bass": -23.5, "keys": -25.0, "bells": -24.0, "pad": -33.0, "wet": -29.0}


def mix_bgm():
    drums, bassb, keys, bells, pads, fx, kicks = build_bgm()
    t = np.arange(N) / SR

    # サイドチェイン（キックでパッドとベースを少し沈める）
    duck = np.ones(N)
    for k in kicks:
        i = int(k * SR)
        n = min(int(SR * 0.4), N - i)
        duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.55 * np.exp(-np.arange(n) / SR / 0.11))

    # パッドは暗め。12小節（早送り）で開いていき、一打のあと閉じる
    pl = fft_filter(pads.l, hi=1300)
    pr = fft_filter(pads.r, hi=1300)
    pl_b = fft_filter(pads.l, hi=4200)
    pr_b = fft_filter(pads.r, hi=4200)
    open_ = np.clip((t - at(12)) / BAR, 0, 1) ** 2 * np.clip(1 - (t - at(13) - 0.3) / 0.8, 0, 1)
    pad_l = (pl * (1 - open_) + pl_b * open_) * duck
    pad_r = (pr * (1 - open_) + pr_b * open_) * duck
    # イントロはふわっと入る。ブレイクで少し前に出る
    pad_gain = np.clip(t / 2.2, 0, 1) ** 1.5 * (1 + 0.5 * ((t >= at(14)) & (t < at(17))))
    pad_l *= pad_gain
    pad_r *= pad_gain

    bass_l = fft_filter(bassb.l, lo=32, hi=900) * (0.55 + 0.45 * duck)
    bass_r = fft_filter(bassb.r, lo=32, hi=900) * (0.55 + 0.45 * duck)

    # 鉄琴の付点8分ディレイ（左右に跳ねる）
    d = int(SR * BEAT * 0.75)
    bl, br = bells.l.copy(), bells.r.copy()
    el = np.zeros(N)
    er = np.zeros(N)
    src = bells.l + bells.r
    for k, g in enumerate((0.32, 0.2, 0.12, 0.07)):
        off = d * (k + 1)
        tgt = el if k % 2 == 0 else er
        tgt[off:] += src[:-off] * g * 0.5
    bl = fft_filter(bl + fft_filter(el, lo=300, hi=5000), hi=9000)
    br = fft_filter(br + fft_filter(er, lo=300, hi=5000), hi=9000)

    keys_l = fft_filter(keys.l, lo=90, hi=7000)
    keys_r = fft_filter(keys.r, lo=90, hi=7000)

    # ステムごとに聴感の大きさを揃える（耳で聞けないので数字で合わせる）
    stems = {
        "drums": (drums.l, drums.r), "bass": (bass_l, bass_r), "keys": (keys_l, keys_r),
        "bells": (bl, br), "pad": (pad_l, pad_r),
    }
    gains = {}
    for name, (l, r) in stems.items():
        gains[name] = 10 ** ((STEM_DB[name] - loud_db(l, r)) / 20)
        stems[name] = (l * gains[name], r * gains[name])

    # リバーブ（エレピ・鉄琴・スネア・パッドから送る）
    irl, irr = make_ir()
    send = (stems["keys"][0] + stems["keys"][1]) * 0.3 + (stems["bells"][0] + stems["bells"][1]) * 0.4 \
        + (stems["drums"][0] + stems["drums"][1]) * 0.06 + (stems["pad"][0] + stems["pad"][1]) * 0.2
    send = fft_filter(send, lo=220)
    wet_l = convolve(send, irl)
    wet_r = convolve(send, irr)
    gw = 10 ** ((STEM_DB["wet"] - loud_db(wet_l, wet_r)) / 20)
    stems["wet"] = (wet_l * gw, wet_r * gw)
    # 効果（ライザー・一打）はドラムと同じ倍率で
    stems["fx"] = (fx.l * gains["drums"] * 0.8, fx.r * gains["drums"] * 0.8)

    L = sum(s[0] for s in stems.values())
    R = sum(s[1] for s in stems.values())

    # 最後の一打のあとは 2.6 秒で消える
    fade = np.clip(1 - (t - at(20) - 0.5) / 2.6, 0, 1) ** 1.3
    L = fft_filter(L * fade, lo=28)
    R = fft_filter(R * fade, lo=28)

    # 全体：聴感 RMS を揃えてから、やわらかく頭を抑える
    # （効果音を上に重ねるので、曲だけで -14.5 LUFS 前後・ピーク -1.5dB に収める）
    g = 10 ** ((-16.5 - loud_db(L, R, at(2), at(20))) / 20)
    L, R = L * g, R * g
    L = np.tanh(L / 0.9) * 0.9
    R = np.tanh(R / 0.9) * 0.9
    peak = max(np.abs(L).max(), np.abs(R).max())
    if peak > 10 ** (-1.5 / 20):
        k = 10 ** (-1.5 / 20) / peak
        L, R, g = L * k, R * k, g * k

    for name, (l, r) in stems.items():
        print(f"  {name:6s} {loud_db(l * g, r * g):6.1f} dB（聴感、2〜12小節）")
    for a, b, label in ((0, 2, "イントロ"), (2, 12, "ドロップ後"), (12, 14, "早送り〜一打"), (14, 17, "ブレイク"), (17, 20, "戻り"), (20, 21.5, "余韻")):
        print(f"  {label:8s} {loud_db(L, R, at(a), at(b)):6.1f} dB")
    return L, R


# ── 効果音 ────────────────────────────────────────────
def room(x, taps=((0.023, 0.22), (0.041, 0.15), (0.067, 0.1), (0.097, 0.07))):
    wet = np.zeros_like(x)
    for dly, g in taps:
        k = int(SR * dly)
        wet[k:] += g * x[:-k]
    return wet


def sfx_tap():
    """画面をタップしたときの小さな「ポッ」"""
    t = tt(0.09)
    f = 600 + 900 * np.exp(-t / 0.012)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.0015)) * np.exp(-t / 0.018)
    y += np.random.default_rng(7).standard_normal(len(t)) * np.exp(-t / 0.0012) * 0.2
    return y


def sfx_pop():
    """吹き出し・カードが出るときの「ポン」（少し低くて丸い）"""
    t = tt(0.22)
    f = 330 + 520 * np.exp(-t / 0.02)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.05)
    y += 0.25 * np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * np.exp(-t / 0.02)
    return y + room(y) * 0.6


def sfx_swish():
    n = int(SR * 0.42)
    x = np.arange(n) / n
    y = band_noise(n, lambda u: 700 * (5 ** np.sin(np.pi * u)), 0.5, seed=9)
    env = np.sin(np.pi * x) ** 1.6
    pan = 0.5 + 0.45 * np.tanh((x - 0.5) * 6)
    return y * env * (1 - pan) * 1.3, y * env * pan * 1.3


def sfx_whoosh():
    n = int(SR * 0.7)
    x = np.arange(n) / n
    y = band_noise(n, lambda u: 380 * (6.5 ** np.sin(np.pi * min(u, 1) * 0.92)), 0.55, seed=3)
    env = (x / 0.6) ** 2.2 * (x < 0.6) + np.exp(-(x - 0.6) / 0.07) * (x >= 0.6)
    pan = 0.5 + 0.45 * np.tanh((x - 0.5) * 5)
    return y * env * (1 - pan) * 1.4, y * env * pan * 1.4


def chime_tone(t, start, f0, decay, amp):
    u = np.clip(t - start, 0, None)
    on = (t >= start).astype(float)
    env = (1 - np.exp(-u / 0.004)) * np.exp(-u / decay) * on
    tone = np.sin(2 * np.pi * f0 * u) + 0.18 * np.sin(2 * np.pi * 2 * f0 * u) * np.exp(-u / 0.15) \
        + 0.06 * np.sin(2 * np.pi * 3.01 * f0 * u) * np.exp(-u / 0.06)
    return amp * env * tone


def sfx_pinpon():
    """降車ボタン風の「ピンポーン」（高い音 → 長3度下）。曲の調に合わせて F#6 → D6（Gmaj7 でも D でも和音の音）"""
    t = tt(2.2)
    y = chime_tone(t, 0.0, midi(90), 0.28, 0.9) + chime_tone(t, 0.21, midi(86), 0.85, 1.0)
    w = room(y, ((0.023, 0.25), (0.041, 0.18), (0.067, 0.12), (0.097, 0.08), (0.131, 0.05)))
    return y + w, y + np.roll(w, int(SR * 0.005))


def sfx_ff():
    """早送り（T.ff〜T.red の 60 フレーム）：数字が変わるコマごとにカチッ、速さに合わせて強く"""
    frames = 60
    n = int(SR * frames / 30) + int(SR * 0.1)
    y = np.zeros(n)
    ease = lambda x: 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2
    total = 436  # 12:35:44 → 12:43:00（src/theme.js の appNow と同じ）
    prev = 0
    clk = tt(0.03)
    click = np.sin(2 * np.pi * 2900 * clk) * np.exp(-clk / 0.004) + np.random.default_rng(3).standard_normal(len(clk)) * np.exp(-clk / 0.001) * 0.4
    for fr in range(1, frames):
        cur = int(total * ease(fr / frames))
        if cur != prev:
            v = min(1.0, 0.25 + (cur - prev) / 8)
            i = int(SR * fr / 30)
            y[i:i + len(clk)] += click * v
        prev = cur
    # 回転の「ヒュイーン」（速さの山に合わせて音程が上がって下がる）
    x = np.arange(n) / n
    sp = np.sin(np.pi * np.clip(x * 1.03, 0, 1)) ** 2
    f = 260 + 700 * sp
    whirr = np.sin(2 * np.pi * np.cumsum(f) / SR) * sp * 0.18
    return y * 0.8 + whirr


def sfx_lock():
    """画面が消えるときのカチッ"""
    t = tt(0.08)
    y = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.012) * 0.8
    y += fft_filter(np.random.default_rng(4).standard_normal(len(t)), hi=2500) * np.exp(-t / 0.004) * 0.9
    return y


def sfx_sparkle():
    """ウィジェットが出るときのきらめき（ペンタトニックの粒）"""
    t = tt(1.4)
    l = np.zeros(len(t))
    r = np.zeros(len(t))
    notes = [midi(m) for m in (86, 88, 90, 93, 95, 98)]
    g = np.random.default_rng(21)
    for k in range(12):
        st = 0.035 * k + g.uniform(0, 0.02)
        f0 = notes[k % len(notes)]
        u = np.clip(t - st, 0, None)
        on = (t >= st).astype(float)
        e = np.exp(-u / g.uniform(0.15, 0.4)) * (1 - np.exp(-u / 0.002)) * on * (1 - k / 14)
        s = np.sin(2 * np.pi * f0 * u) * e
        p = g.uniform(0.2, 0.8)
        l += s * (1 - p)
        r += s * p
    return l + room(l), r + room(r)


def write_wav(path, left, right=None, peak_db=-3.0, normalize=True):
    right = left if right is None else right
    st = np.stack([left, right], axis=1)
    if normalize:
        st = st / np.abs(st).max() * 10 ** (peak_db / 20)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"wrote {os.path.relpath(path, HERE)}: {len(left) / SR:.2f}s")


def draw_check(L, R, path):
    """波形とスペクトログラム（耳の前に目で確かめる用）"""
    from PIL import Image, ImageDraw

    mono = (L + R) / 2
    W, H = 1640, 520
    img = Image.new("RGB", (W, H), (16, 16, 24))
    dr = ImageDraw.Draw(img)
    # 波形（上 140px）
    spp = len(mono) // W
    for x in range(W):
        seg = mono[x * spp:(x + 1) * spp]
        if len(seg):
            dr.line([(x, 70 - seg.max() * 66), (x, 70 - seg.min() * 66)], fill=(150, 160, 255))
    # スペクトログラム（下 360px、対数周波数 40Hz–16kHz）
    hop, win = spp, 4096
    window = np.hanning(win)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    rows = 360
    edges = np.geomspace(40, 16000, rows + 1)
    for x in range(W):
        s = x * hop
        seg = mono[s:s + win]
        if len(seg) < win:
            break
        mag = np.abs(np.fft.rfft(seg * window))
        db = 20 * np.log10(mag + 1e-9)
        for yy in range(rows):
            lo, hi = np.searchsorted(freqs, [edges[yy], edges[yy + 1]])
            v = db[lo:max(hi, lo + 1)].max()
            c = int(np.clip((v + 10) / 70, 0, 1) * 255)
            img.putpixel((x, H - 1 - yy), (c, int(c * 0.75), 255 - c // 2 if c else 30))
    # 小節線
    for b in range(22):
        x = int(at(b) / TOTAL * W)
        dr.line([(x, 0), (x, H)], fill=(255, 80, 80) if b in (2, 12, 13, 14, 17, 20) else (70, 70, 90))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print(f"wrote {os.path.relpath(path, HERE)}")


if __name__ == "__main__":
    t0 = time.time()
    L, R = mix_bgm()
    print(f"  （BGM の合成 {time.time() - t0:.1f} 秒）")
    write_wav(os.path.join(ROOT, "bgm.wav"), L, R, normalize=False)
    sfx = os.path.join(ROOT, "sfx")
    write_wav(os.path.join(sfx, "tap.wav"), sfx_tap(), peak_db=-6)
    write_wav(os.path.join(sfx, "pop.wav"), sfx_pop(), peak_db=-5)
    write_wav(os.path.join(sfx, "swish.wav"), *sfx_swish(), peak_db=-6)
    write_wav(os.path.join(sfx, "whoosh.wav"), *sfx_whoosh(), peak_db=-5)
    write_wav(os.path.join(sfx, "pinpon.wav"), *sfx_pinpon(), peak_db=-4)
    write_wav(os.path.join(sfx, "ff.wav"), sfx_ff(), peak_db=-8)
    write_wav(os.path.join(sfx, "lock.wav"), sfx_lock(), peak_db=-7)
    write_wav(os.path.join(sfx, "sparkle.wav"), *sfx_sparkle(), peak_db=-8)
    if "--check" in sys.argv:
        draw_check(L, R, os.path.join(HERE, "out", "audio_check.png"))
