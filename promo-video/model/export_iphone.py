"""iPhone の3Dモデル（.blend）を、動画で使う glb に書き出す（Blender の中で実行する）。

    "C:/Program Files/Blender Foundation/Blender 4.5/blender.exe" --background --disable-autoexec \
        <ダウンロードした Iphone_18_.blend> --python model/export_iphone.py -- public/model/iphone.glb src/model.json

  （npm run model -- "<.blend のパス>" でも同じ。--disable-autoexec で .blend に埋め込まれたスクリプトは動かさない）

やること：
  - 本体（Object_7）だけを書き出す（床の板 Plane は入れない）
  - 表示部分（マテリアル Material.001）の中心を原点に、正面を +Z、上を +Y にそろえる（元のデータは少し後ろに傾いている）
  - 1単位 = 画面の 1px。表示部分の高さを SCREEN_H（852）にする（幅は約 394。DOM の画面 393x852 をそこに貼る）
  - 表示部分の角の丸み・ダイナミックアイランドの位置と大きさ・本体の大きさを測って JSON に書く（ModelPhone.jsx が使う）
"""
import json
import sys

import bpy
from mathutils import Matrix, Vector

sys.stdout.reconfigure(encoding="utf-8")
args = sys.argv[sys.argv.index("--") + 1:]
OUT_GLB = args[0]
OUT_JSON = args[1]
SCREEN_H = 852.0

o = bpy.data.objects["Object_7"]
me = o.data
names = [s.material.name if s.material else "" for s in o.material_slots]


def faces_of(pattern):
    idx = {i for i, n in enumerate(names) if n == pattern or (pattern.endswith("*") and n.startswith(pattern[:-1]))}
    return [p for p in me.polygons if p.material_index in idx]


# ── 表示部分の向きと中心（ワールド座標）──
mw = o.matrix_world
disp = faces_of("Material.001")
nsum = Vector((0, 0, 0))
pts = []
for p in disp:
    nsum += (mw.to_3x3() @ p.normal) * p.area
    pts += [mw @ me.vertices[v].co for v in p.vertices]
n = nsum.normalized()
up = (Vector((0, 0, 1)) - n * n.dot(Vector((0, 0, 1)))).normalized()
right = up.cross(n)
c0 = pts[0]
rs = [(q - c0).dot(right) for q in pts]
us = [(q - c0).dot(up) for q in pts]
ns = [(q - c0).dot(n) for q in pts]
center = c0 + right * (min(rs) + max(rs)) / 2 + up * (min(us) + max(us)) / 2 + n * (sum(ns) / len(ns))
height = max(us) - min(us)
scale = SCREEN_H / height

# right → +X、up → +Z、n → -Y（glTF に +Y up で書き出すと right → +X、up → +Y、n → +Z になる）
target = Matrix(((1, 0, 0), (0, 0, 1), (0, -1, 0))).transposed()
rot = target @ Matrix((right, up, n))
M = Matrix.Scale(scale, 4) @ rot.to_4x4() @ Matrix.Translation(-center)
o.matrix_world = M @ mw
bpy.ops.object.select_all(action="DESELECT")
o.select_set(True)
bpy.context.view_layer.objects.active = o
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
me = o.data


# ── 測る（画面の座標：x 右、y 上、z 手前。px）──
def bbox(pattern):
    ps = [me.vertices[v].co for p in faces_of(pattern) for v in p.vertices]
    xs, ys, zs = [q.x for q in ps], [q.z for q in ps], [-q.y for q in ps]
    return {"x": [min(xs), max(xs)], "y": [min(ys), max(ys)], "z": [min(zs), max(zs)]}


d = bbox("Material.001")
W, H = d["x"][1] - d["x"][0], d["y"][1] - d["y"][0]
# 角の丸み：上の辺がまっすぐ続く端と、横の辺がまっすぐ続く端から測る
dv = [me.vertices[v].co for p in faces_of("Material.001") for v in p.vertices]
top, rgt = d["y"][1], d["x"][1]
x_end = max(q.x for q in dv if q.z > top - 0.05)
y_end = max(q.z for q in dv if q.x > rgt - 0.05)
radius = ((rgt - x_end) + (top - y_end)) / 2

isl = [bbox(p) for p in ("17ProMax_Black2.001", "17ProMax_2112.001", "17ProMax_Lens2.001")]
ix = [min(b["x"][0] for b in isl), max(b["x"][1] for b in isl)]
iy = [min(b["y"][0] for b in isl), max(b["y"][1] for b in isl)]
allv = [q for q in me.vertices]
body = {"x": [min(q.co.x for q in allv), max(q.co.x for q in allv)],
        "y": [min(q.co.z for q in allv), max(q.co.z for q in allv)],
        "z": [min(-q.co.y for q in allv), max(-q.co.y for q in allv)]}
info = {
    "screen": {"w": round(W, 2), "h": round(H, 2), "radius": round(radius, 1), "z": round(sum(d["z"]) / 2, 2)},
    # ダイナミックアイランド：DOM の画面（左上が原点、y は下向き）での位置
    "island": {"left": round(ix[0] + W / 2, 1), "top": round(top - iy[1], 1), "w": round(ix[1] - ix[0], 1), "h": round(iy[1] - iy[0], 1)},
    "body": {k: [round(v, 1) for v in body[k]] for k in body},
    "glass_z": [round(v, 2) for v in bbox("17ProMax_glass")["z"]],
}
print("model:", json.dumps(info, ensure_ascii=False))
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(info, f, ensure_ascii=False, indent=1)
    f.write("\n")

bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", use_selection=True, export_yup=True, export_apply=True)
print("wrote", OUT_GLB)
