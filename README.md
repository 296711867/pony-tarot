# 小马利亚魔法塔罗

运行地址：[在线网站](http://43.142.102.75:3100/)。当前为HTTP；域名与HTTPS待配置。

## 项目入口

| 目录 / 文件 | 用途 |
|---|---|
| `pony-tarot/` | 唯一在维护、构建和部署的应用源码 |
| `最终计划.md` | 当前方案、上线状态与下一步 |
| `服务器维护.md` | SSH连接、运行位置、更新与恢复 |
| `pony-tarot/部署说明.md` | 通用部署与SSE代理说明 |
| `pony-tarot/卡组交付模板.md` | 新卡组名称、图片与牌义填写模板 |
| `assets/cutie-marks/` | 六马标志SVG、透明PNG与重绘源 |
| `assets/ui-icons/` | 魔法功能图标SVG源与预览 |
| `assets/cursor/` | 魔法棒鼠标指针SVG/PNG与接入说明 |
| `卡牌版本1/` | 78张原始卡面，网页使用另行压缩的WebP |
| `deploy-package/pony-tarot/` | 当前构建的部署产物，可重新生成 |
| `pony-tarot-deploy-20261013.zip` | 已验证的最新部署包，重新打包会更新 |
| `tarot-main/`、`TarotWhisper-main/`、`tarot-next-app-main/` | 开源参考快照，不是运行目录 |
| `architecture/`、`docs/reference/` | 历史架构、设计与实施记录 |

## 本地操作

在`pony-tarot/`目录运行：

```powershell
npm.cmd run dev
```

检查并打包最新版本：

```powershell
npm.cmd run check
npm.cmd run build
npm.cmd run deploy:prepare
npm.cmd run deploy:package
```

部署包由bsdtar生成，使用Linux可识别的路径分隔符；不包含本机或服务器的Key、数据库。服务器密钥和数据独立保存在`/home/ubuntu/pony-tarot-data/`，更新程序时沿用。

## 版本管理

Git 仓库在本目录根，`.gitignore` 排除四类内容：密钥与运行时数据（`.env.local`、`.runtime/*.sqlite`）、依赖与构建产物（`node_modules`、`.next`、`out/`、`deploy-package/`、zip 与日志）、开源参考快照（`tarot-main/` 等三个目录）、卡面原图（`卡牌版本1/`，网页使用 `public/cards/` 下已压缩的 WebP，原图仅留在本机）。推送 GitHub 前先 `git status` 复核没有密钥类文件被跟踪。

## 接下来做什么

1. 确定域名，配置HTTPS与APP_ORIGIN。
2. 验收公网三牌/每日AI流式解读、停止、保存与回看。
3. 小范围试用，修复实际体验问题。
4. 新卡组资料到齐后独立接入；持续做好更新备份。

执行顺序与完成标准见[最终计划](最终计划.md#4-接下来按这个顺序做)。历史过程移入[实施记录](docs/reference/实施记录-20261013.md)，不作为待办。
