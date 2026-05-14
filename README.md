# Theme Auto Switcher

一个简单的 VS Code 扩展：自动读取当前电脑安装的所有 VS Code 颜色主题，并每隔 30 分钟切换一次。

## 使用

1. 用 VS Code 打开这个目录：`~/Desktop/vscode-theme-auto-switcher`
2. 按 `F5` 启动 Extension Development Host。
3. 打开命令面板，运行 `Theme Auto Switcher: Start`。

默认会从当前 VS Code 环境里读取所有已安装主题，包括内置主题和主题扩展提供的主题。

如果你不想使用全部已安装主题，可以把 `themeAutoSwitcher.useInstalledThemes` 设成 `false`，然后手动配置轮换列表，例如：

- `Default Dark Modern`
- `Default Light Modern`
- `Abyss`
- `Solarized Dark`
- `Solarized Light`

主题名称必须和 VS Code 里安装的主题名称完全一致。

## 配置

在 VS Code `settings.json` 里可以改：

```json
{
  "themeAutoSwitcher.enabled": true,
  "themeAutoSwitcher.intervalMinutes": 30,
  "themeAutoSwitcher.switchOnStart": false,
  "themeAutoSwitcher.useInstalledThemes": true,
  "themeAutoSwitcher.themes": [
    "Default Dark Modern",
    "Default Light Modern"
  ]
}
```

## 命令

- `Theme Auto Switcher: Start`
- `Theme Auto Switcher: Stop`
- `Theme Auto Switcher: Switch Now`
- `Theme Auto Switcher: Show Installed Themes`
- `Theme Auto Switcher: Copy Installed Themes`

## 打包

如果要生成 `.vsix`，先安装 VS Code 官方打包工具：

```bash
npm install -g @vscode/vsce
cd ~/Desktop/vscode-theme-auto-switcher
vsce package
```
