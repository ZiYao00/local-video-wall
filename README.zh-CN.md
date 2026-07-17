# Local Video Wall

[English](README.md)

[![最新版本](https://img.shields.io/github/v/release/ZiYao00/local-video-wall?display_name=tag&sort=semver)](https://github.com/ZiYao00/local-video-wall/releases/latest)
[![许可证](https://img.shields.io/github/license/ZiYao00/local-video-wall)](LICENSE)
[![平台](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D4)](#运行要求)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB)](#运行要求)

**一个面向 Windows、完全本地运行的 AI 图片与视频媒体墙，用于快速浏览、筛选、元数据查看和安全清理。**

![Local Video Wall 预览](assets/preview01.gif)

Local Video Wall 可以把一个本地文件夹转换成浏览器中的图片/视频媒体墙，适合需要生成、下载、对比和整理大量本地 AI 图片与视频的用户。

它**不是**云相册、专业视频编辑器、通用文件管理器，也不是 ComfyUI 插件。它专注解决一个更具体的问题：不上传素材，在本地快速完成 AI 媒体的浏览、筛选、标记、信息查看和整理。

## 为什么需要它？

当一个文件夹里积累了数百甚至数千张生成图片和短视频时，普通文件管理器会逐渐变得低效：

- 视频通常需要逐个打开，才能判断内容是否有用。
- 成品、废片、参考素材和未完成实验容易混在一起。
- Prompt、模型、LoRA 和工作流信息之后很难找回。
- 大批量筛选时直接删除文件，误删风险较高。

Local Video Wall 将浏览、对比、元数据查看、收藏、批量处理和安全清理集中到一个界面中。

## 核心功能

### 多视频媒体墙

- 在响应式媒体网格中混合浏览本地图片与视频。
- 多个当前可见的视频可以同时静音播放。
- 离开可视区域的媒体会暂停或释放资源，减少浏览器和磁盘压力。
- 支持 2-20 列，可在细节查看与快速扫图之间切换。
- 从 10 列开始自动使用静态预览，避免同时加载过多视频。

<!-- 后续可在此添加：assets/demo-overview.gif -->

### 快速筛选流程

- 按**全部、视频、图片、收藏**筛选。
- 支持搜索、排序、收藏和批量选择。
- 可将选中素材的 review 数据导出为 CSV。
- 可通过文件名排除规则隐藏不需要参与扫描的内容。
- 保存最近使用路径和收藏文件夹，方便重复进入常用目录。

### 图片与视频预览

- 图片支持大图查看和全屏幻灯片。
- 视频支持大播放器、上一项/下一项、全屏、播放模式和鼠标滚轮调节音量。
- 可设置适应方式、幻灯片间隔、循环方式等查看选项。

### AI 生成元数据

当素材中存在相应信息时，可以查看：

- Prompt 与 Negative Prompt
- 模型、UNET 或 diffusion model loader 名称
- LoRA 名称与强度
- ComfyUI workflow 工作流数据
- 文件基础信息和来源路径
- 同名 JSON 边车文件中的元数据
- 通过 `ffprobe` 读取的可选视频容器信息

常见支持来源：

| 来源 | 可读取的信息 |
| --- | --- |
| Stable Diffusion WebUI / A1111 PNG | `parameters` |
| ComfyUI PNG | `prompt` 与 `workflow` |
| 边车文件 | 与素材同名的 JSON 文件 |
| MP4 / WebM / MOV | 通过 `ffprobe` 读取可用的容器标签 |

对于 ComfyUI 图片，工具会尽量优先提取 KSampler 的 conditioning 链，减少断开的文本节点、未使用节点或 FaceDetailer 相关节点带来的干扰。

<!-- 后续可在此添加：assets/demo-metadata.gif -->

### 可恢复的安全清理

首次清理时，文件不会直接进入不可逆的永久删除流程。

1. 选中的文件先移动到当前扫描目录中的 `_video_wall_trash`。
2. 在项目回收站中可以筛选、批量选择、恢复或继续处理这些文件。
3. 确认不再需要后，再将文件移入 Windows 回收站。

项目回收站中的视频保持静态画面，不会持续播放；默认也不会生成持久化预览缓存。

<!-- 后续可在此添加：assets/demo-review.gif -->

## 快速开始

### 运行要求

- Windows 10 或 Windows 11
- Python 3.10 或更高版本，推荐 Python 3.12
- 推荐 Chrome 或 Edge
- 可选：将 `ffprobe` 加入 `PATH`，用于读取更多视频元数据

先确认 Python 可以使用：

```powershell
python --version
```

或者：

```powershell
py --version
```

### 下载并运行

1. 打开[最新版本发布页](https://github.com/ZiYao00/local-video-wall/releases/latest)。
2. 在发布页的 Assets 中下载 **Source code (zip)**。正式的 `local-video-wall-*.zip` 安装包发布后，也会列在这里。
3. 解压到普通本地目录，例如：

   ```text
   C:\Tools\local-video-wall
   ```

4. 双击 `start.bat`。
5. 选择本地图片/视频文件夹并开始扫描。

`start.bat` 会保留一个可见的命令行窗口，关闭该窗口后应用也会停止。

需要后台服务控制时，运行：

```text
service.bat
```

开发者也可以直接运行：

```powershell
python app.py
```

然后打开：

```text
http://127.0.0.1:8787
```

## 推荐使用流程

1. 选择 ComfyUI 输出目录、下载目录或其他本地素材目录。
2. 需要时开启子文件夹扫描。
3. 根据任务选择媒体墙密度：
   - 4-5 列：查看细节
   - 6 列：日常浏览
   - 8-9 列：多视频自动播放和快速筛选
   - 10-20 列：静态总览
4. 在同一个媒体墙中混合浏览图片和视频。
5. 打开感兴趣的素材，查看生成元数据。
6. 收藏有用素材，或批量选中不需要的文件。
7. 导出 CSV、移动到项目回收站，或稍后恢复文件。

## 支持格式

**视频**

```text
.mp4  .webm  .mov  .m4v
```

**图片**

```text
.jpg  .jpeg  .png  .gif  .webp  .bmp
```

## 本地运行与安全说明

- 应用只在本机的 `http://127.0.0.1:8787` 运行。
- 不会将媒体文件上传到云端服务。
- 设置保存在本地 `config.json` 中。
- 收藏和多选标记保存在本地 `review_data.json` 中。
- `config.json` 可能包含本地文件夹路径，不应提交到 GitHub。
- 文件会先进入 `_video_wall_trash`，在移入 Windows 回收站之前仍可恢复。
- 默认不会生成持久化图片缩略图和视频封面缓存。
- 默认情况下，超过 500 MB 的视频在媒体墙中使用占位图，避免意外加载大型电影或演出文件；可在设置中修改。
- 浏览器通常要求视频静音后才能自动播放，因此媒体墙中的视频默认静音。

## 重要限制

- 当前主要面向 Windows 本地使用，不以云部署或多人数字资产管理为目标。
- 它是浏览和筛选工具，不是专业剪辑软件。
- 视频是否包含生成元数据，取决于原始生成工具和保存方式。
- 未安装 `ffprobe` 时，视频元数据会安全回退到同名 JSON 和基础文件信息。
- `main` 分支可能包含尚未进入正式发布的新改动；普通用户建议优先下载 [Releases](https://github.com/ZiYao00/local-video-wall/releases) 中的版本。

## 适合与不适合

| 适合 | 不适合 |
| --- | --- |
| 同时浏览大量本地短视频 | 在线视频流媒体播放 |
| 查看 AI 批量生成的图片和视频 | 专业视频剪辑 |
| 筛选 ComfyUI、A1111、Wan、Kling、Runway 等输出 | 云相册或远程同步 |
| 查看 Prompt、模型、LoRA 与工作流元数据 | 多人数字资产管理系统 |
| 本地收藏、批量筛选、CSV 导出与可恢复清理 | 没有本地素材目录的用户 |

## 常见问题

- **提示找不到 `python`：**安装 Python，并在安装时勾选 **Add Python to PATH**。
- **浏览器没有自动打开：**手动访问 `http://127.0.0.1:8787`。
- **页面无法访问：**运行 `service.bat`，检查后台服务状态。
- **8787 端口被占用：**关闭冲突程序，或修改 `app.py` 中的 `PORT`。
- **视频无法带声音自动播放：**这是浏览器限制；媒体墙视频为了自动播放而默认静音。
- **部分视频元数据缺失：**安装 `ffprobe`，并确保它已经加入 `PATH`。

## 项目文档

- [更新记录](CHANGELOG.md)
- [开发路线](ROADMAP.md)
- [English README](README.md)

## 许可证

[MIT License](LICENSE)
