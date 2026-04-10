# 培养计划管理系统

一个基于 Tauri + React + Rust 的桌面应用，用于管理人员培养计划和进度跟踪。

## 功能特性

- **人员管理**：添加、编辑、删除培养人员，支持头像上传
- **培养计划**：创建培养计划，定义任务和参与人员
- **进度管理**：跟踪每个成员的任务完成进度，支持状态流转

## 技术栈

| 类型     | 技术                  |
| -------- | --------------------- |
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8                |
| 桌面框架 | Tauri 2               |
| 后端语言 | Rust                  |
| 数据存储 | 本地 JSON 文件        |

## 环境要求

运行本项目前，需要先安装以下软件：

| 软件          | 必需 | 说明                        |
| ------------- | ---- | --------------------------- |
| Node.js >= 18 | ✅   | JavaScript 运行时，包含 npm |
| Rust >= 1.77  | ✅   | 编译 Tauri 后端             |
| React         | ❌   | `npm install` 自动安装    |
| Tauri CLI     | ❌   | `npm install` 自动安装    |

### 安装 Node.js

下载地址：https://nodejs.org/

选择 LTS 版本下载安装即可。

验证安装：

```bash
node --version
npm --version
```

### 安装 Rust

如果未安装 Rust，请运行：

**Windows (PowerShell) - 推荐先配置环境变量到数据盘：**

```powershell
# 1. 先设置环境变量（避免占用 C 盘空间）
# 将 D:\Rust 替换为你想要的数据盘路径
$env:RUSTUP_HOME = "D:\Rust\rustup"
$env:CARGO_HOME = "D:\Rust\cargo"

# 2. 永久设置用户环境变量
[Environment]::SetEnvironmentVariable("RUSTUP_HOME", $env:RUSTUP_HOME, "User")
[Environment]::SetEnvironmentVariable("CARGO_HOME", $env:CARGO_HOME, "User")

# 3. 将 cargo 添加到 PATH
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";" + $env:CARGO_HOME + "\bin", "User")

# 4. 安装 Rust
winget install Rustlang.Rustup
```

**macOS / Linux：**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

安装后重启终端，验证安装：

```bash
rustc --version
cargo --version
```

## 项目初始化

### 1. 克隆项目

```bash
git clone <repository-url>
cd development_plan
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发模式

```bash
npm run tauri:dev
```

首次启动会编译 Rust 代码，可能需要几分钟。

## 常用命令

| 命令                    | 说明                   |
| ----------------------- | ---------------------- |
| `npm run tauri:dev`   | 启动开发模式（热重载） |
| `npm run tauri:build` | 构建生产版本           |
| `npm run dev`         | 仅启动前端开发服务器   |
| `npm run build`       | 仅构建前端             |
| `npm run lint`        | 代码检查               |

## 项目结构

```
development_plan/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── PersonManager/  # 人员管理
│   │   ├── PlanManager/    # 培养计划
│   │   └── ProgressViewer/ # 进度管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   │   ├── fileStorage.ts  # 文件存储抽象层
│   │   ├── personStorage.ts
│   │   ├── planStorage.ts
│   │   └── progressStorage.ts
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   └── lib.rs          # Tauri 命令定义
│   ├── Cargo.toml          # Rust 依赖配置
│   └── tauri.conf.json     # Tauri 配置
├── filestore/              # 数据存储目录
│   ├── persons.json
│   ├── training_plans.json
│   └── plan_progress.json
├── package.json
└── vite.config.ts
```

## 数据存储

数据保存在项目目录下的 `filestore/` 文件夹中：

- `persons.json` - 人员数据
- `training_plans.json` - 培养计划
- `plan_progress.json` - 进度数据

## 状态流转

### 培养计划状态

```
未启动 → 进行中 → 已完成
```

### 任务进度状态

```
待完成 → 进行中 → 已完成 → 待完成（循环）
```

当计划中所有任务都完成时，计划状态自动更新为「已完成」。

## 打包发布

```bash
npm run tauri:build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录：

- Windows: `.exe` / `.msi`
- macOS: `.dmg` / `.app`
- Linux: `.deb` / `.AppImage`

## 许可证

MIT
