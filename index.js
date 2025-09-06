#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Simple configuration storage using JSON file
const configDir = path.join(os.homedir(), '.claude-run');
const configFile = path.join(configDir, 'config.json');

class SimpleConfig {
  constructor() {
    this.ensureConfigDir();
    this.config = this.load();
  }

  ensureConfigDir() {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(configFile)) {
        return JSON.parse(fs.readFileSync(configFile, 'utf8'));
      }
    } catch (error) {
      // Ignore parse errors, use default
    }
    return {
      lastUsed: {},
      providers: {}
    };
  }

  save() {
    try {
      fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not save configuration'));
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return undefined;
      }
    }
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let obj = this.config;
    
    for (const k of keys) {
      if (!obj[k] || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      obj = obj[k];
    }
    
    obj[lastKey] = value;
    this.save();
  }
}

// Configuration storage
const config = new SimpleConfig();

// Provider configurations
const PROVIDERS = {
  glm: {
    name: 'GLM',
    displayName: 'GLM (智谱清言)',
    baseUrl: 'https://open.bigmodel.cn/api/anthropic'
  },
  qwen: {
    name: 'QWEN',
    displayName: 'QWEN (通义千问)',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/anthropic'
  },
  kimi: {
    name: 'Kimi',
    displayName: 'Kimi (月之暗面)',
    baseUrl: 'https://api.moonshot.cn/anthropic'
  },
  deepseek: {
    name: 'DeepSeek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/anthropic'
  },
  custom: {
    name: 'Custom',
    displayName: '自定义中转站 (Custom Relay)',
    baseUrl: null // Will be provided by user
  }
};

class ClaudeEnvSetup {
  constructor() {
    this.isWindows = os.platform() === 'win32';
  }

  async showHeader() {
    console.clear();
    console.log(chalk.cyan('================================'));
    console.log(chalk.cyan('   Claude Code 环境变量设置工具'));
    console.log(chalk.cyan('================================'));
    console.log();
  }

  async checkSavedConfig() {
    const lastUsed = config.get('lastUsed');
    const providers = config.get('providers');
    
    if (lastUsed.provider && providers[lastUsed.provider]?.apiKey) {
      console.log(chalk.green('📁 发现已保存的配置:'));
      console.log(`   上次使用: ${chalk.yellow(lastUsed.modelName)} (${lastUsed.mode})`);
      console.log(`   时间: ${lastUsed.timestamp}`);
      console.log();

      const { useSaved } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useSaved',
        message: '是否使用已保存的配置？',
        default: true
      }]);

      if (useSaved) {
        const provider = PROVIDERS[lastUsed.provider];
        const savedApiKey = providers[lastUsed.provider].apiKey;
        
        // For custom provider, get saved baseUrl
        let baseUrl = lastUsed.baseUrl;
        if (!baseUrl) {
          if (lastUsed.provider === 'custom') {
            baseUrl = providers[lastUsed.provider]?.baseUrl;
          } else if (provider) {
            baseUrl = provider.baseUrl;
          }
        }
        
        return {
          provider: lastUsed.provider,
          providerName: lastUsed.modelName,
          baseUrl: baseUrl,
          mode: lastUsed.mode,
          apiKey: savedApiKey
        };
      }
    }
    return null;
  }

  async getNewConfig() {
    const providerChoices = Object.entries(PROVIDERS).map(([key, value]) => ({
      name: value.displayName,
      value: key
    }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: '请选择模型供应商:',
        choices: providerChoices
      },
      {
        type: 'input',
        name: 'customBaseUrl',
        message: '请输入自定义 Base URL:',
        when: (answers) => answers.provider === 'custom',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Base URL 不能为空';
          }
          try {
            new URL(input);
            return true;
          } catch {
            return '请输入有效的 URL (例如: https://api.example.com/v1)';
          }
        }
      },
      {
        type: 'list',
        name: 'mode',
        message: '请选择设置类型:',
        choices: [
          { name: '临时设置 (仅当前会话)', value: 'temp' },
          { name: '永久设置 (系统环境变量)', value: 'perm' }
        ]
      },
      {
        type: 'password',
        name: 'apiKey',
        message: '请输入您的API密钥:',
        mask: '*',
        validate: (input) => input.length > 0 || 'API密钥不能为空'
      }
    ]);

    const provider = PROVIDERS[answers.provider];
    const baseUrl = answers.provider === 'custom' ? answers.customBaseUrl : provider.baseUrl;
    const providerName = answers.provider === 'custom' ? `Custom (${baseUrl})` : provider.name;
    
    return {
      provider: answers.provider,
      providerName: providerName,
      baseUrl: baseUrl,
      mode: answers.mode,
      apiKey: answers.apiKey
    };
  }

  async confirmSettings(settings) {
    console.log();
    console.log(chalk.cyan('================================'));
    console.log(chalk.cyan('设置摘要:'));
    console.log(`  供应商: ${chalk.yellow(settings.providerName)}`);
    console.log(`  Base URL: ${chalk.blue(settings.baseUrl)}`);
    console.log(`  设置类型: ${settings.mode === 'temp' ? '临时设置' : '永久设置'}`);
    console.log(`  API Key: ${chalk.gray('***[已隐藏]***')}`);
    console.log(chalk.cyan('================================'));
    console.log();

    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: '确认设置？',
      default: true
    }]);

    return confirmed;
  }

  async setEnvironmentVariables(settings) {
    console.log();
    console.log(chalk.blue('正在设置环境变量...'));
    console.log();

    if (settings.mode === 'perm') {
      await this.setPermanentEnvVars(settings);
    }

    // Always set current process environment for immediate effect
    process.env.ANTHROPIC_BASE_URL = settings.baseUrl;
    process.env.ANTHROPIC_API_KEY = settings.apiKey;

    console.log(chalk.green('✅ 环境变量设置完成'));
    console.log(`   ANTHROPIC_BASE_URL=${settings.baseUrl}`);
    console.log(`   ANTHROPIC_API_KEY=${chalk.gray('***[已隐藏]***')}`);
    
    if (settings.mode === 'perm') {
      console.log();
      console.log(chalk.yellow('💡 永久设置提醒:'));
      if (this.isWindows) {
        console.log('   - 系统环境变量已设置，新开的终端将自动生效');
        console.log('   - 当前CMD窗口：需要重新打开CMD才能看到永久变量');
        console.log('   - 立即测试：在当前窗口中已可直接使用Claude Code');
      } else {
        console.log('   - 已添加到shell配置文件');
        console.log('   - 新终端将自动生效');
        console.log('   - 当前终端：请运行 source ~/.bashrc (或相应配置文件)');
      }
    } else {
      console.log();
      console.log(chalk.yellow('💡 提示: 仅在当前会话中生效'));
      console.log('   关闭终端后设置将失效');
    }

    // Show current session verification
    console.log();
    console.log(chalk.cyan('🔍 当前会话验证:'));
    console.log(`   ANTHROPIC_BASE_URL: ${chalk.green(process.env.ANTHROPIC_BASE_URL)}`);
    console.log(`   ANTHROPIC_API_KEY: ${chalk.green('***[已设置]***')}`);
  }

  async setPermanentEnvVars(settings) {
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      if (this.isWindows) {
        // Windows: use setx command
        const setx1 = spawn('setx', ['ANTHROPIC_BASE_URL', settings.baseUrl], {
          stdio: 'pipe'
        });
        
        setx1.on('close', (code1) => {
          if (code1 === 0) {
            const setx2 = spawn('setx', ['ANTHROPIC_API_KEY', settings.apiKey], {
              stdio: 'pipe'
            });
            
            setx2.on('close', (code2) => {
              if (code2 === 0) {
                resolve();
              } else {
                console.log(chalk.red('❌ 永久设置失败，可能需要管理员权限'));
                resolve(); // Continue anyway
              }
            });
          } else {
            console.log(chalk.red('❌ 永久设置失败，可能需要管理员权限'));
            resolve(); // Continue anyway
          }
        });
      } else {
        // Unix: add to shell profile
        this.addToShellProfile(settings);
        resolve();
      }
    });
  }

  addToShellProfile(settings) {
    const homeDir = os.homedir();
    const shellProfiles = ['.bashrc', '.zshrc', '.bash_profile', '.profile'];
    
    // Find existing profile or use .bashrc as default
    let profilePath = path.join(homeDir, '.bashrc');
    for (const profile of shellProfiles) {
      const fullPath = path.join(homeDir, profile);
      if (fs.existsSync(fullPath)) {
        profilePath = fullPath;
        break;
      }
    }

    const envLines = [
      '',
      `# Claude Code environment variables - ${new Date().toISOString()}`,
      `export ANTHROPIC_BASE_URL="${settings.baseUrl}"`,
      `export ANTHROPIC_API_KEY="${settings.apiKey}"`,
      ''
    ];

    try {
      fs.appendFileSync(profilePath, envLines.join('\n'));
      console.log(chalk.green(`✅ 已添加到 ${profilePath}`));
    } catch (error) {
      console.log(chalk.red(`❌ 无法写入 ${profilePath}: ${error.message}`));
    }
  }

  saveConfig(settings) {
    // Save last used configuration
    config.set('lastUsed', {
      provider: settings.provider,
      modelName: settings.providerName,
      baseUrl: settings.baseUrl, // Save baseUrl for custom providers
      mode: settings.mode,
      timestamp: new Date().toLocaleString('zh-CN')
    });

    // Save API key for this provider
    config.set(`providers.${settings.provider}.apiKey`, settings.apiKey);
    
    // For custom provider, also save the baseUrl
    if (settings.provider === 'custom') {
      config.set(`providers.${settings.provider}.baseUrl`, settings.baseUrl);
    }
    
    console.log();
    console.log(chalk.green('💾 配置已保存，下次运行时可直接使用'));
  }

  async showSuccess(settings) {
    console.log();
    console.log(chalk.green('🎉 完成！现在您可以使用'), chalk.yellow(settings.providerName), chalk.green('运行 Claude Code'));
    console.log();

    // Ask if user wants to launch Claude Code directly
    const { launchClaude } = await inquirer.prompt([{
      type: 'confirm',
      name: 'launchClaude',
      message: '是否直接启动 Claude Code？',
      default: true
    }]);

    if (launchClaude) {
      await this.launchClaudeCode();
      return;
    }
    
    if (settings.mode === 'perm') {
      console.log(chalk.cyan('📋 验证环境变量设置:'));
      console.log();
      
      if (this.isWindows) {
        console.log(chalk.yellow('在当前CMD窗口中验证 (立即生效):'));
        console.log(chalk.gray('  node -e "console.log(process.env.ANTHROPIC_BASE_URL)"'));
        console.log(chalk.gray('  node -e "console.log(process.env.ANTHROPIC_API_KEY)"'));
        console.log();
        console.log(chalk.yellow('在新CMD窗口中验证 (永久设置):'));
        console.log(chalk.gray('  echo %ANTHROPIC_BASE_URL%'));
        console.log(chalk.gray('  echo %ANTHROPIC_API_KEY%'));
      } else {
        console.log(chalk.yellow('在当前终端中验证 (立即生效):'));
        console.log(chalk.gray('  echo $ANTHROPIC_BASE_URL'));
        console.log(chalk.gray('  echo $ANTHROPIC_API_KEY'));
        console.log();
        console.log(chalk.yellow('在新终端中验证 (永久设置):'));
        console.log(chalk.gray('  echo $ANTHROPIC_BASE_URL'));
        console.log(chalk.gray('  echo $ANTHROPIC_API_KEY'));
      }
    } else {
      console.log(chalk.cyan('验证环境变量 (当前会话):'));
      if (this.isWindows) {
        console.log(chalk.gray('  node -e "console.log(process.env.ANTHROPIC_BASE_URL)"'));
        console.log(chalk.gray('  node -e "console.log(process.env.ANTHROPIC_API_KEY)"'));
      } else {
        console.log(chalk.gray('  echo $ANTHROPIC_BASE_URL'));
        console.log(chalk.gray('  echo $ANTHROPIC_API_KEY'));
      }
    }
    
    console.log();
    console.log(chalk.green('✨ Claude Code 现在可以正常使用了！'));
  }

  async launchClaudeCode() {
    const { spawn } = require('child_process');
    
    console.log();
    console.log(chalk.cyan('🚀 正在启动 Claude Code...'));
    console.log(chalk.gray('环境变量已自动配置，Claude Code 将使用当前设置'));
    console.log();
    
    try {
      // Launch claude command with current environment variables
      const claude = spawn('claude', [], {
        stdio: 'inherit',
        env: process.env,
        shell: true
      });

      claude.on('error', (error) => {
        console.log();
        console.log(chalk.red('❌ 无法启动 Claude Code:'), error.message);
        console.log(chalk.yellow('💡 请确保 Claude Code 已正确安装'));
        console.log(chalk.gray('   可尝试运行: npm install -g @anthropic-ai/claude-desktop'));
        console.log();
        this.showManualInstructions();
      });

      claude.on('close', (code) => {
        console.log();
        console.log(chalk.cyan('Claude Code 已退出'));
      });

    } catch (error) {
      console.log();
      console.log(chalk.red('❌ 启动失败:'), error.message);
      this.showManualInstructions();
    }
  }

  showManualInstructions() {
    console.log();
    console.log(chalk.cyan('📋 手动启动 Claude Code:'));
    console.log();
    console.log(chalk.yellow('在当前终端中运行:'));
    console.log(chalk.white('  claude'));
    console.log();
    console.log(chalk.gray('环境变量验证:'));
    console.log(chalk.gray('  node -e "console.log(process.env.ANTHROPIC_BASE_URL)"'));
    console.log(chalk.gray('  node -e "console.log(process.env.ANTHROPIC_API_KEY ? \'已设置\' : \'未设置\')"'));
  }

  async run() {
    try {
      await this.showHeader();

      // Check for saved configuration
      let settings = await this.checkSavedConfig();

      // If no saved config or user chose new config
      if (!settings) {
        settings = await this.getNewConfig();
      }

      // Confirm settings
      const confirmed = await this.confirmSettings(settings);
      if (!confirmed) {
        console.log(chalk.yellow('操作已取消'));
        return;
      }

      // Set environment variables
      await this.setEnvironmentVariables(settings);

      // Save configuration
      this.saveConfig(settings);

      // Show success message
      await this.showSuccess(settings);

    } catch (error) {
      console.error(chalk.red('❌ 发生错误:'), error.message);
      process.exit(1);
    }
  }
}

// Run the application
if (require.main === module) {
  const app = new ClaudeEnvSetup();
  app.run().catch(console.error);
}

module.exports = ClaudeEnvSetup;