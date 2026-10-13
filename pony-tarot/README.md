# pony-tarot · 小马利亚魔法塔罗

小马宝莉主题的塔罗牌网站：家园场景、三牌占卜、今日一牌、星辰图鉴、魔法手札、六马视角 AI 解读。Next.js 16（Node 服务）+ React 19 + TypeScript + 原生 CSS，模型不参与抽牌与牌义，只做解读润色。

在线地址与当前进度见根目录[最终计划](../最终计划.md)。

## 快速开始

```powershell
npm install
npm run ai:setup      # 生成本地 MODEL_ENCRYPTION_KEY（写入 .env.local，不入库）
npm run dev           # http://127.0.0.1:3000
```

模型 API Key 在站点「设置」里填写，加密后存入 `.runtime/pony-tarot.sqlite`（程序与数据分离，Key 与数据库都不进 Git）。

## 常用脚本

| 命令 | 用途 |
|---|---|
| `npm run dev` | 本地开发（127.0.0.1:3000） |
| `npm run check` | 数据同步 + TypeScript 检查 + 自定义检查 |
| `npm run build` | 同步数据并构建（生产） |
| `npm start` | 以生产模式启动 |
| `npm run check:ai` | AI 流式链路测试（隔离数据库 + 模拟模型，不耗真实额度） |
| `npm run ai:setup` | 生成本地密钥加密 Key |
| `npm run cards:prepare` | 卡面原图压缩并同步到 `public/cards/` |
| `npm run icons:sync` | 同步六马/功能图标到 `public/icons/` |
| `npm run deploy:prepare` / `deploy:package` | 生成部署包（不含 Key 与数据库） |

## 目录要点

- `data/deck-definitions/*.json` — 卡组源（名称、牌义、逆位规则），构建时校验并生成注册表
- `public/cards/` — 网页卡面（WebP，由原图压缩）
- `asset-sources/` — 家园场景源图；网页素材在 `public/art/`
- `app/globals.css` — 全站样式（含魔法棒鼠标指针，见 `public/cursor/`）
- `THIRD_PARTY_LICENSES.txt` — 参考的开源项目与其许可声明

## 文档

- [最终计划](../最终计划.md) — 当前方案、上线状态、下一步（权威）
- [服务器维护](../服务器维护.md) — SSH、运行位置、更新与恢复
- [部署说明](部署说明.md) — 通用部署与 SSE 代理
- [卡组交付模板](卡组交付模板.md) — 新卡组接入要填的内容
