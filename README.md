# Theme Auto Switcher

Theme Auto Switcher 是一个 VS Code 扩展，用来定时轮换编辑器外观。

它可以自动切换：

- VS Code 颜色主题
- 编辑器字体 `editor.fontFamily`
- 终端字体 `terminal.integrated.fontFamily`

主题默认从当前 VS Code 已安装的主题中读取。字体不会自动扫描，需要你在配置里提供一个字体列表。

## 快速开始

1. 用 VS Code 打开本项目目录。
2. 按 `F5` 启动 Extension Development Host。
3. 打开命令面板，运行 `Theme Auto Switcher: Start`。

启动后，扩展会按配置的时间间隔切换外观。状态栏按钮会显示距离下一次切换的大致时间，点击状态栏按钮可以立即切换一次主题和字体。

## 配置示例

在 VS Code 的 `settings.json` 中配置：

```json
{
  "themeAutoSwitcher.enabled": true,
  "themeAutoSwitcher.intervalMinutes": 30,
  "themeAutoSwitcher.switchOnStart": false,
  "themeAutoSwitcher.useInstalledThemes": true,
  "themeAutoSwitcher.themes": [
    "Default Dark Modern",
    "Default Light Modern",
    "Abyss",
    "Solarized Dark",
    "Solarized Light"
  ],
  "themeAutoSwitcher.fontFamilies": [
    "Menlo",
    "Monaco",
    "'Fira Code'",
    "'JetBrains Mono'"
  ]
}
```

## 配置项

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `themeAutoSwitcher.enabled` | `true` | 是否启用自动切换。 |
| `themeAutoSwitcher.intervalMinutes` | `30` | 自动切换间隔，单位为分钟。 |
| `themeAutoSwitcher.switchOnStart` | `false` | 扩展启动时是否立即切换一次。 |
| `themeAutoSwitcher.useInstalledThemes` | `true` | 是否优先使用当前 VS Code 已安装的全部颜色主题。 |
| `themeAutoSwitcher.themes` | 内置示例列表 | 当未使用已安装主题，或已安装主题不足两个时使用的主题列表。 |
| `themeAutoSwitcher.fontFamilies` | `[]` | 要轮换的字体列表，同时写入编辑器和终端字体配置。 |

## 主题切换

默认情况下，扩展会读取当前 VS Code 环境里所有已安装的颜色主题，包括内置主题和主题扩展提供的主题。

如果只想使用指定主题，把 `themeAutoSwitcher.useInstalledThemes` 设为 `false`，然后在 `themeAutoSwitcher.themes` 中写入主题名称。主题名称必须和 VS Code 中显示的主题名称完全一致。

可以运行 `Theme Auto Switcher: Show Installed Themes` 查看已安装主题，也可以运行 `Theme Auto Switcher: Copy Installed Themes` 把主题名称列表复制到剪贴板。

## 字体切换

字体从 `themeAutoSwitcher.fontFamilies` 中轮换。列表至少需要两个值才会启用字体切换。

每次字体切换时，扩展会把同一个字体值同步写入：

- `editor.fontFamily`
- `terminal.integrated.fontFamily`

字体名称需要是 VS Code 设置能识别的字体值。包含空格的字体名建议带引号，例如 `"'Fira Code'"` 或 `"'JetBrains Mono'"`。

## 命令

- `Theme Auto Switcher: Start`
- `Theme Auto Switcher: Stop`
- `Theme Auto Switcher: Switch Theme and Font Now`
- `Theme Auto Switcher: Switch Font Now`
- `Theme Auto Switcher: Show Installed Themes`
- `Theme Auto Switcher: Copy Installed Themes`

## 打包

生成 `.vsix` 前先安装 VS Code 官方打包工具：

```bash
npm install -g @vscode/vsce
vsce package
```
