# AGENTS.md

## 项目身份
## 项目身份
AstrBot 插件 + 独立 Web 应用双版本。AstrBot 入口：`plugin/main.py`（插件路径指向 `plugin/`）。独立版入口：`www/index.html`（无需 AstrBot，浏览器打开即用）。

## 配置与数据路径（双路径回退）
- 配置：`/root/data/config/astrbot_plugin_basketball_web_config.json` → `<plugin_dir>/config.json`
- 数据：`/root/data/plugin_data/astrbot_plugin_basketball_web` → `<plugin_dir>/data/`
- 密钥持久化在 `data/.secret_key`（首次运行自动生成）

## LLM 默认值
- API 地址：`https://api.deepseek.com/v1`
- 模型：`deepseek-v4-pro`（`game.py` 代码默认；`_conf_schema.json` 写的 `v4-flash` 已过时）
- 最大 token：4096
- 非流式调用用 `_ll`（开局），流式用 `_ls`（动作），SSE 分块格式 `data: <json>\n\n`

## 架构要点
- AstrBot 版：Quart + Hypercorn 在守护线程中运行，`threading.Event` 控制启停
- 独立版：`engine.js` 移植了全部游戏引擎到 JS，`localStorage` 存档，浏览器直调 LLM API
- 游戏动作通过 SSE 流式返回（`/api/game/action`、`regenerate`、`modify`）
- 独立版引擎使用 async generator 替代 SSE 包装，直接消费 token 流
- LLM 叙事中包含状态 JSON，标记为 `##STATE##` ... `##ENDSTATE##`
- 存档：AstrBot 版 `data/{session_id}_{slot}.json`；独立版 `localStorage key: bbl_save_{slot}`，localhost 时写入 `data/save_{slot}.json`（file:// 和 http:// 共享）
- `auto` 槽位每次操作自动保存
- 支持快照回滚（`ts`/`rs`）用于重新生成和修改

## 独立版文件
- `www/index.html` — 独立版前端（含 API 配置面板）
- `www/game.js` — 独立版前端逻辑
- `www/engine.js` — 游戏引擎纯 JS 移植（对应 `web/game.py`）
- API Key 存在 `localStorage key: bbl_apikey`，首次输入后记住
- 本地运行用 `serve.bat` 启动 Python 代理服务器（8848端口），自动打开浏览器。代理转发 API 请求避开 CORS
- 模型下拉框点"获取"按钮自动从 API 抓取模型列表

## Android 版（`android/`）
原生 WebView 壳，加载本地 HTML/JS。不需要 AstrBot。

构建步骤：
1. 用 Android Studio 打开 `android/` 目录
2. Sync Gradle → Build → Build APK(s)
3. APK 在 `android/app/build/outputs/apk/debug/`
4. 传到手机安装，填入 DeepSeek API Key 即玩

关键技术点：
- `MainActivity.java` 用 `file:///android_asset/www/index.html` 加载
- `setAllowUniversalAccessFromFileURLs(true)` 禁用 WebView 的 CORS，fetch 可直连 LLM API
- Web 资源在 `android/app/src/main/assets/www/`，修改前端后需手动从 `www/` 同步到此目录

## 前端版本
`v53` 硬编码在 `plugin/templates/game.html:42`（AstrBot 版）；独立版 `game.html` 已升级到 `v54`。版本号文本和 script src `?v=N` 同文件内需同步。

## 代码风格
极度紧凑，无注释，短变量名。匹配此风格，不要展开或添加注释。

## 禁止事项
- 不要直接运行 `main.py`
- 不要添加注释或展开变量名
- 无测试/检查/构建工具链，不要凭空引入
- AstrBot 版代码在 `plugin/` 下，独立版在根目录；改动任意一版时不应破坏另一版
