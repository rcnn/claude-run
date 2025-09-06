# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cross-platform Node.js CLI tool for configuring Claude Code environment variables. It supports multiple model providers (GLM, QWEN, Kimi, DeepSeek, and custom relay stations) with intelligent configuration memory functionality.

## Key Architecture

### Core Components

- **SimpleConfig Class** (`lines 13-75`): Custom JSON-based configuration storage system
  - Stores config in `~/.claude-run/config.json` 
  - Provides `get()`, `set()`, and `save()` methods for configuration management
  - Handles both `lastUsed` settings and per-provider API keys

- **ClaudeEnvSetup Class** (`lines 114-558`): Main application logic
  - Cross-platform environment variable management
  - Interactive CLI using inquirer.js
  - Configuration persistence and reuse logic

### Configuration Flow

1. **Check Saved Config** (`checkSavedConfig()`): Looks for previously saved configuration
2. **Get New Config** (`getNewConfig()`): Interactive provider selection with smart key reuse
3. **Environment Setup** (`setEnvironmentVariables()`): Cross-platform env var setting
4. **Config Persistence** (`saveConfig()`): Save settings for future use

### Provider System

The `PROVIDERS` object (`lines 81-112`) defines supported model providers:
- Each provider has: `name`, `displayName`, `baseUrl`, `apiKeyEnvName`
- Custom providers support user-defined base URLs
- Different providers use different API key environment variables

## Development Commands

### Running the Tool
```bash
# Development mode
node index.js
npm test

# Global installation
npm install -g .
claude-run
```

### Testing Environment Variables
```bash
# Check current settings
node -e "console.log(process.env.ANTHROPIC_BASE_URL)"
node -e "console.log(process.env.ANTHROPIC_API_KEY)"
```

## Key Implementation Details

### Smart Configuration Reuse
The tool implements intelligent configuration reuse in `getNewConfig()`:
- When user selects "No" to saved config, it still checks for per-provider saved API keys
- Automatically uses saved keys for the selected provider (user can opt to change)
- Reduces repetitive API key entry while maintaining flexibility

### Cross-Platform Environment Variables
- **Windows**: Uses `setx` command for permanent system variables
- **Unix**: Writes to shell profile files (`.bashrc`, `.zshrc`, etc.)
- **Current Session**: Always sets `process.env` for immediate effect

### Error Handling
- Graceful fallback when permanent setting fails (continues with temporary)
- Configuration file corruption handling with default fallback
- URL validation for custom providers

## Configuration Storage Schema

```json
{
  "lastUsed": {
    "provider": "glm",
    "modelName": "GLM (智谱清言)", 
    "baseUrl": "https://...",
    "mode": "perm",
    "timestamp": "2025-09-06 16:30:25"
  },
  "providers": {
    "glm": { "apiKey": "..." },
    "custom": { "apiKey": "...", "baseUrl": "..." }
  }
}
```

## Dependencies

- **inquirer**: Interactive CLI prompts
- **chalk**: Colored console output  
- **fs/os/path**: Core Node.js modules for file system and OS operations