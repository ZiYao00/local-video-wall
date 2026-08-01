# 分阶段升级计划（从 v1.8.0 起）

本文档是 Local Video Wall 的分阶段改进计划。

**核心思路：小步发布，每一步都能单独测试、单独发布、单独回退。**
不把所有改动堆成一个大版本，而是按风险和主题拆成多个补丁版本，稳一步再走下一步。

- **起始版本**：v1.8.0
- **开始前快照**：`.codex-backups/90-full-snapshots/local-video-wall-before-v2.0.0-security-refactor-20260730-175734.zip`（SHA-256 `d9a1a5db7910…`）
- **总原则**：不扩大产品范围，保持“本地 AI 图片/视频快速审查工具”定位，只补齐工程质量。

## 版本号怎么定（速查）

| 改动性质 | 版本号变化 | 例子 |
| --- | --- | --- |
| 只修 bug / 安全，不加新功能，旧用法不变 | 第三位 +1 | `1.8.0 → 1.8.1` |
| 加了新功能，旧用法仍能用 | 第二位 +1 | `1.8.x → 1.9.0` |
| 有东西被破坏/移除，或大改写 | 第一位 +1 | `1.x → 2.0.0`（留到真正的大功能再用） |

## 阶段总览

| 版本 | 主题 | 性质 | 状态 |
| --- | --- | --- | --- |
| v1.8.1 | 安全 | 补丁 | 已完成，待发布 |
| v1.8.2 | 稳定性与命名 | 补丁 | 已完成，待发布 |
| v1.8.3 | 测试与 CI | 补丁 | 未开始 |
| v1.9.0 | 内部结构重构 | 次版本 | 未开始 |
| 之后 | 打包、贡献者文档等 | 视情况 | 未开始 |

**每个阶段完成、验证、（可选）发布之后，再进入下一个。**
每个阶段开始前，若改动面大，按 `.codex-backups/README.md` 规则新建对应分类的“开始前”快照。

---

## v1.8.1 — 安全（先做这个）

> 本地服务的副作用端点没有来源校验，恶意网页理论上可通过 DNS rebinding / CSRF
> 触发本机文件打开、移动、删除。这是能被外部触发的真实问题，最该先修。

- [ ] **T1 全局来源校验**
  对所有请求校验 `Host` 头只允许 `127.0.0.1:8787` / `localhost:8787`；
  对有副作用的请求校验 `Origin` / `Referer` 属于本机，否则返回 403。
  - 影响：`app.py`
- [ ] **T2 副作用端点改为 POST**
  `/api/open`、`/api/open-file`、`/api/choose-folder` 从 GET 改 POST，同步改前端调用。
  - 影响：`app.py`、`static/app.js`
- [ ] **T3 本地一次性 token**
  启动生成随机 token 注入页面；所有写/危险操作要求携带，校验失败 403。
  - 影响：`app.py`、`static/app.js`
- [ ] **T4 回归验证**
  浏览器手工验证正常流程可用；伪造 Origin / 缺 token 的请求验证被拒。

**验收**：伪造来源或无 token 的写请求全部 403；页面所有功能正常。
**发布**：更新 CHANGELOG，打 v1.8.1。

---

## v1.8.2 — 稳定性与命名

> `service.bat` 按端口盲杀进程，会误杀碰巧占用 8787 的其它程序。

- [x] **T1 `service.bat` PID 守护**
  从监听端口取得候选 PID 后，核对进程命令行含本项目 `app.py` 的绝对路径；
  核对通过才 `taskkill`，不匹配时绝不按端口杀。
  - 影响：`service.bat`
- [x] **T2 清理旧项目名**
  `app.py` 文件头与启动打印的 "Local Civitai-style Video Wall v2" 改为 "Local Video Wall"。
  - 影响：`app.py`（约第 3、1591 行）

**验收**：占用 8787 的无关进程不会被误杀；启动输出显示正确项目名。
**发布**：更新 CHANGELOG，打 v1.8.2。

---

## v1.8.3 — 测试与 CI

> 危险文件操作和元数据解析出错会直接丢文件或崩解析，最该有回归保护。

- [ ] **T1 测试骨架**：建立 `tests/`，选定 `pytest`，准备样本数据。
- [ ] **T2 高风险单元测试**
  - 路径穿越：`safe_rel_to_path` 拒绝 `../`、绝对路径、越界路径
  - 重名恢复：`unique_destination` / restore 冲突
  - 中文路径与特殊字符
  - `_video_wall_trash` 状态迁移（move → restore → system recycle）
  - PNG 元数据样本：A1111 `parameters`、ComfyUI `prompt`/`workflow`
  - 损坏 / 空 / 超大 JSON 容错
  - Range 请求（媒体流 206）
- [ ] **T3 GitHub Actions**：Windows runner 上跑测试，PR 与 push 触发。
  - 影响：`.github/workflows/`

**验收**：`pytest` 全绿；CI 在 GitHub 跑通。
**发布**：更新 CHANGELOG，打 v1.8.3。

---

## v1.9.0 — 内部结构重构

> 不换框架，只做小步拆分，降低“改一处影响一片”的风险。
> 虽然对用户无可见新功能，但改动大、且为后续新功能铺路，作为一个次版本里程碑。
> **建议放在有测试（v1.8.3）之后再做**——重构最需要测试兜底。

- [ ] **T1 后端路由表化**：`do_GET`/`do_POST` 的 `if/elif` 链改成 `path -> handler` 字典。
- [ ] **T2 后端模块拆分**：从 `app.py` 抽出 `scanner`、`trash`/`recycle`、`system_open`、`media_stream`。
- [ ] **T3 前端 ES modules 拆分**：`static/app.js`（约 4790 行）拆为
  `api.js`、`state.js`、`i18n.js`、`media-wall.js`、`viewer.js`、`metadata-panel.js`、
  `recycle-view.js`、`settings.js`，用 `type="module"` 加载。

**验收**：功能与拆分前完全一致；测试仍全绿。
**发布**：更新 CHANGELOG，打 v1.9.0。

---

## 之后（有余力再做，不阻塞上面任何阶段）

- [ ] 发布正式命名 ZIP + SHA-256（不必等 SQLite/全文检索）
- [ ] 补 `CONTRIBUTING.md`、`SECURITY.md`、`ARCHITECTURE.md`、issue/PR 模板
- [ ] 同步 ROADMAP 状态（标注当前 stable、修正过期描述）
- [ ] GitHub 仓库删除误标的 `flask` Topic（实际用标准库 `ThreadingHTTPServer`）

---

## 每次发布前的通用检查

- [ ] 本阶段任务完成并验收
- [ ] 有测试后：`pytest` 全绿
- [ ] 手工回归：扫描 / 播放 / 元数据 / 收藏 / 回收站 / 恢复 / 设置
- [ ] CHANGELOG 写明本版本改了什么
- [ ] 代码与文档中版本号统一
