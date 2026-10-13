# 魔法主题功能图标

2026-10-13：为本站绘制统一的24单位线条SVG，圆角端点、1.5单位线宽，随页面主题继承currentColor。

源文件为`magic.svg`（11个symbol）。`preview.html`是深浅背景下48px/24px实际渲染的内联预览；`preview-live.png`是浏览器截图。占卜、每日指引、图鉴、手札、设置、家园、保存、导出及通用方向/关闭按钮均已使用本套图标。

| symbol | 用途 |
|---|---|
| sparkle | 魔法星芒、品牌与卡背 |
| sun | 今日指引，太阳星轮 |
| cards | 三牌占卜，叠牌与星芒 |
| book | 星辰图鉴，魔法书 |
| leaf | 魔法手札，羽毛与书页（保留旧代码中的leaf标识） |
| settings | 小镇设置，齿轮与星芒 |
| home | 回到小镇，小屋 |
| heart | 保存指引，心形与十字星 |
| download | 导出记录 |
| arrow | 前往 / 进入 |
| close | 关闭 |

网站统一通过`components/Icon.tsx`引用`/icons/magic.svg#名称`，不是逐页重复绘制。修改源SVG后运行`npm run icons:sync`；构建和检查会自动同步本套图标与六马标志到public。使用站内同源SVG sprite，不依赖外部图标服务，不新增依赖。

已通过独立视觉验收：24px/48px可识别、笔画统一、无裁切；桌面与手机六马按钮对应、透明比例和选中状态均已检查。
