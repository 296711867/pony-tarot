# 魔法棒鼠标指针

为网站做的卡通魔法棒光标：金色五角星（双色调分面）+ 紫色锥形柄 + 金环接口 + 柄尾球 + 闪火星尘，透明背景。星尖指向左上，即点击热区位置。

## 文件

- [wand.svg](wand.svg) — 矢量源 / SVG 光标（根节点自带 `width="32" height="32"`，浏览器光标必须有内在尺寸）
- `wand-32.png` / `wand-48.png` — PNG 光标位图（Safari 不支持 SVG 光标，用它兜底）
- `wand-128.png` / `wand-24.png` — 大图 / 迷你尺寸
- [preview.png](preview.png) — 128/48/32/24px × 深浅底验收图
- [export_cursor.py](export_cursor.py) — 重渲染：`python export_cursor.py`
- [check_cursor.py](check_cursor.py) — 程序化验收：`python check_cursor.py`

## 用法（复制即用）

热区：星尖在 32px 图中位于 (4.7, 3.7)，取 `5 4`；48px 图取 `7 6`。

```css
/* 全站默认箭头替换（缩放比 0.5：viewBox 64 → 32px） */
body {
  cursor: url("/cursor/wand.svg") 5 4,
          url("/cursor/wand-32.png") 5 4,
          auto;
}
/* 可点元素保留手型语义，但换成魔法棒（可自行决定是否统一） */
a, button, [role="button"] {
  cursor: url("/cursor/wand.svg") 5 4,
          url("/cursor/wand-32.png") 5 4,
          pointer;
}
```

把 `assets/cursor/` 拷入站点（Next.js 放 `public/cursor/`，路径按 `/cursor/...` 引用）。

## 兼容性

- Chrome / Edge / Firefox：直接用 SVG 光标（需根节点 width/height，已内置）
- Safari：忽略 SVG 光标，自动落到 PNG 兜底
- 分辨率：位图链可再加 `url("/cursor/wand-48.png") 7 6` 供高分屏挑选

## 设计备注

- 纯填充剪影、无描边，曲线均为切线平滑的贝塞尔（图标重绘教训的落实版）
- 色板：金 `#FFD666/#F2A93B`、紫 `#7C52B4/#6E4699/#A87FD6`、闪火 `#FFF3C4/#FFE58A`，与站点紫色主题呼应
- 星尖角保持尖锐（光标指向感），星星用左右两片明暗分面模拟参考图的折面效果
