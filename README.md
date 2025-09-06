# Claude Code 智能切换工具

一个现代化的跨平台工具，用于配置 Claude Code 的环境变量。支持多个模型供应商，具有智能配置记忆功能。

## 🚀 特性

✅ **跨平台**: Windows、macOS、Linux 完美支持  
✅ **现代交互界面**: 基于 inquirer 的友好命令行界面  
✅ **智能配置记忆**: 自动保存和复用配置  
✅ **多供应商支持**: GLM、QWEN、Kimi、DeepSeek 、中转站
✅ **Claude Code 专用**: 使用 Anthropic 兼容端点  
✅ **安全存储**: 本地加密存储 API 密钥  

## 📦 安装

### 方式一：全局安装 (推荐)
```bash
git clone https://github.com/rcnn/claude-run.git
npm install -g .
```

安装后可在任意位置使用：
```bash
claude-run
```

### 方式二：本地运行
```bash
# 安装依赖
npm install

# 运行工具
node index.js
# 或
npm test
```

## 🎯 使用方法

只需运行一个命令：
```bash
claude-run
```

然后跟随交互界面：

1. **选择模型供应商**
   - GLM (智谱清言)
   - QWEN (通义千问)  
   - Kimi (月之暗面)
   - DeepSeek
   - **自定义中转站** (用户自定义 URL)

2. **配置自定义中转站**（可选）
   - 输入自定义 Base URL
   - 支持任何兼容 Anthropic API 的端点

3. **选择设置类型**
   - 临时设置 (仅当前会话)
   - 永久设置 (系统环境变量)

4. **输入 API 密钥**
   - 安全的密码输入模式
   - 自动验证非空

5. **确认并应用**
   - 显示设置摘要
   - 一键确认应用

## 📊 支持的供应商

| 供应商 | Claude Code 专用端点 | API Key 环境变量 |
|--------|-------------------|------------------|
| GLM | `https://open.bigmodel.cn/api/anthropic` | `ANTHROPIC_API_KEY` |
| QWEN | `https://dashscope.aliyuncs.com/api/v1/anthropic` | `ANTHROPIC_AUTH_TOKEN` |
| Kimi | `https://api.moonshot.cn/anthropic` | `ANTHROPIC_API_KEY` |
| DeepSeek | `https://api.deepseek.com/anthropic` | `ANTHROPIC_API_KEY` |
| **自定义中转站** | **用户自定义 URL** | `ANTHROPIC_API_KEY` |

## 🔧 技术特性

### 智能配置管理
- 使用 `conf` 包进行配置存储
- 自动检测已保存配置
- 支持快速复用上次设置

### 跨平台环境变量设置
- **Windows**: 自动使用 `setx` 命令设置系统环境变量
- **Unix 系统**: 智能检测并写入 shell 配置文件 (`.bashrc`, `.zshrc`, `.bash_profile`, `.profile`)
- **即时生效**: 当前会话立即设置，无需重启

### 现代化用户体验
- **彩色输出**: 使用 `chalk` 提供友好的彩色界面
- **交互式菜单**: 基于 `inquirer` 的现代命令行界面
- **密码保护**: API 密钥输入时自动隐藏
- **智能提示**: 详细的操作指导和状态反馈

## 🎨 界面预览

```
================================
   Claude Code 环境变量设置工具
================================

📁 发现已保存的配置:
   上次使用: GLM (perm)
   时间: 2025-09-06 16:30:25

? 是否使用已保存的配置？ Yes
================================
设置摘要:
  供应商: GLM
  Base URL: https://open.bigmodel.cn/api/anthropic
  设置类型: 永久设置
  API Key: ***[已隐藏]***
================================

? 确认设置？ Yes

正在设置环境变量...

✅ 环境变量设置完成
   ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
   ANTHROPIC_API_KEY=***[已隐藏]***

💡 提示: 永久环境变量已设置
   重启终端后将在所有新会话中生效
   当前会话已立即生效

💾 配置已保存，下次运行时可直接使用

🎉 完成！现在您可以使用 GLM 运行 Claude Code

验证设置:
  echo %ANTHROPIC_BASE_URL%
  echo %ANTHROPIC_API_KEY%
```

## 🔒 安全性

- **本地存储**: 所有配置存储在本地，不会上传到任何服务器
- **加密存储**: 使用 `conf` 包的安全存储机制
- **密钥保护**: 界面中自动隐藏 API 密钥显示
- **权限检查**: 自动检测写入权限并提供友好提示

## 🚨 故障排除

### Windows 权限问题
如果永久设置失败，请以管理员身份运行命令提示符：
```cmd
# 以管理员身份打开 cmd 或 PowerShell
claude-run
```

### Unix 系统配置文件问题
工具会自动检测并选择合适的 shell 配置文件。如果遇到问题，可以手动检查：
```bash
# 检查配置文件权限
ls -la ~/.bashrc ~/.zshrc ~/.bash_profile ~/.profile

# 手动重新加载配置
source ~/.bashrc
```

### Node.js 版本要求
要求 Node.js >= 16.0.0
```bash
# 检查 Node.js 版本
node --version

# 如果版本过低，请升级 Node.js
```

## 📝 开发信息

- **运行环境**: Node.js >= 16.0.0
- **核心依赖**: inquirer, chalk, conf
- **许可证**: MIT
- **支持平台**: Windows, macOS, Linux

## 🎯 使用场景

### 首次使用
```bash
claude-run
# 选择供应商 → 选择模式 → 输入密钥 → 确认设置
```

### 快速切换
```bash
claude-run
# 检测到保存配置 → 选择 "否" 重新配置 → 选择新供应商
```

### 团队协作
```bash
# 在不同机器上使用相同配置
claude-run
# 输入团队提供的 API 密钥即可
```