# 六马可爱标志 · 修复版

更新：2026-10-13。按用户提供的六张参考图修复已有重绘，保留每个标记自己的朝向、非对称轮廓与排列。SVG为纯矢量路径，没有嵌入原图或背景矩形；PNG为透明背景。原参考图留在refs，旧版留在archive-v1。

## 文件

| SVG / PNG 名称 | 角色 | 本次修复 |
|---|---|---|
| twilight | 紫悦 | 中央六尖星、五颗白星的位置与比例；白星不透明纯白 |
| pinkie | 碧琪 | 三只气球各自的倾斜、结和三条卷绳，不做镜像化 |
| fluttershy | 柔柔 | 三只蝴蝶的原始姿态、圆润翅缘、身体与触角；消除翼根细缝 |
| rainbow | 云宝 | 连续云瓣、内部回旋线、三色闪电折点与尾尖 |
| rarity | 珍奇 | 三枚钻石各自轮廓、中央椭圆与分面线；线端限制在菱形内 |
| applejack | 苹果嘉儿 | 三枚苹果各自形状与六片叶子的朝向，不复用对称模板 |

- `svg/`：网页优先使用的SVG源，缩放清晰，透明背景。
- `png/`：长边2048px透明PNG，由SVG重新渲染，便于放大使用。
- `preview.html`：内联SVG深浅背景与48px网页尺寸预览。
- `preview.png`：便携总览；这张总览本身有底色，单独图标仍透明。
- `preview-live.png`：网页实际渲染截图。
- `compare/`：左参考、右修复版棋盘格对比。棋盘格只用于预览，没有写入单张PNG。
- `verification.json`：透明边缘、内容边界、纯矢量与白星检测结果。
- `archive-v1/`：修改前SVG、PNG与对比图，可恢复。

## 制作与复现

采用指定技能库的几何/颜色探测、SVG路径、网页视觉复核与独立视觉裁判流程。其余标记按参考坐标提取轮廓并保留尖角；苹果与蝴蝶按用户最新审美要求改用手写三次贝塞尔曲线，保留各自姿态，消除低分辨率描摹台阶。原参考PNG不修改。样式色板集中在`repair_marks.py`，输出SVG可独立编辑。

PNG使用项目现有sharp原生SVG渲染，避免旧Edge截图导出对viewport、默认SVG尺寸与透明度的依赖；网页仍用内联SVG实际检查。没有新增依赖。

在项目根目录运行：

```powershell
& 'C:/Asoftware/anaconda3/python.exe' -X utf8 assets/cutie-marks/repair_marks.py
& 'C:/Asoftware/anaconda3/python.exe' -X utf8 assets/cutie-marks/export_png.py
& 'C:/Asoftware/anaconda3/python.exe' -X utf8 assets/cutie-marks/build_preview.py
& 'C:/Asoftware/anaconda3/python.exe' -X utf8 assets/cutie-marks/check_marks.py
```

手改SVG后只运行后三条，避免重新描摹覆盖手改。只重导某张PNG可用`export_png.py rainbow`。

## 验收

六张对比图均通过独立视觉裁判；最终针对碧琪绳结、柔柔翼根、珍奇分面线再次复查通过。程序检查通过：六张纯SVG、PNG四边透明、无裁切、白星不透明纯白、参考页脚未混入。网页检查包含深浅背景和48px尺寸。

2026-10-13已接入每日牌和三牌的“选择小马解读”按钮。运行`npm run icons:sync`同步到`public/icons/ponies/`，构建与检查也会自动同步。采用固定宽高与`object-fit: contain`，不拉伸窄长的云宝闪电；保留姓名、语气与aria-pressed选中状态。

## 苹果与蝴蝶的平滑修订

用户指出描摹版仍有像素折点后，已进一步重绘这两套形状。曲线参数集中在`smooth_shapes.json`；果实、叶片、四翅、身体与触角使用少量手写三次贝塞尔段，不再跟随位图毛边。翅膀子路径独立绘制，避免相反绕向在相交处挖出透明洞。三枚苹果各自轮廓、三只蝴蝶各自方向保留。独立视觉复查通过，无明显毛刺、透明洞或拼接缝。

描摹版两张SVG存于`archive-v2-traced/`。查看`smooth-details.png`可比较放大后的平滑效果。网站与独立部署目录已同步新版，SVG可继续无损放大；全部PNG重新输出为长边2048px。
