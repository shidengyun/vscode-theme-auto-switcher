const vscode = require('vscode');

let timer;
let statusBarItem;
let nextSwitchAt;

function activate(context) {
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'themeAutoSwitcher.switchNow';
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand('themeAutoSwitcher.start', async () => {
      await updateEnabledSetting(true);
      start();
      vscode.window.showInformationMessage('Theme Auto Switcher started.');
    }),
    vscode.commands.registerCommand('themeAutoSwitcher.stop', async () => {
      await updateEnabledSetting(false);
      stop();
      vscode.window.showInformationMessage('Theme Auto Switcher stopped.');
    }),
    vscode.commands.registerCommand('themeAutoSwitcher.switchNow', async () => {
      await switchAppearance();
      scheduleNextSwitch();
    }),
    vscode.commands.registerCommand('themeAutoSwitcher.switchFontNow', async () => {
      await switchFont();
      scheduleNextSwitch();
    }),
    vscode.commands.registerCommand('themeAutoSwitcher.showInstalledThemes', showInstalledThemes),
    vscode.commands.registerCommand('themeAutoSwitcher.copyInstalledThemes', copyInstalledThemes),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('themeAutoSwitcher')) {
        start();
      }
    })
  );

  start();
}

function deactivate() {
  stop();
}

function getConfig() {
  const config = vscode.workspace.getConfiguration('themeAutoSwitcher');

  return {
    enabled: config.get('enabled', true),
    intervalMinutes: Math.max(1, config.get('intervalMinutes', 30)),
    switchOnStart: config.get('switchOnStart', false),
    useInstalledThemes: config.get('useInstalledThemes', true),
    themes: normalizeStringList(config.get('themes', [])),
    fontFamilies: normalizeStringList(config.get('fontFamilies', []))
  };
}

function normalizeStringList(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
}

function updateEnabledSetting(enabled) {
  return vscode.workspace
    .getConfiguration('themeAutoSwitcher')
    .update('enabled', enabled, vscode.ConfigurationTarget.Global);
}

function start() {
  clearTimer();

  const config = getConfig();

  if (!config.enabled) {
    updateStatus('stopped');
    return;
  }

  const themes = getThemePool(config);
  const fonts = getFontPool(config);

  if (themes.length < 2 && fonts.length < 2) {
    updateStatus('needs settings');
    vscode.window.showWarningMessage('Theme Auto Switcher needs at least two themes or two fonts in settings.');
    return;
  }

  if (config.switchOnStart) {
    switchAppearance();
  }

  scheduleNextSwitch();
}

function stop() {
  clearTimer();
  updateStatus('stopped');
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function scheduleNextSwitch() {
  clearTimer();

  const config = getConfig();

  const themes = getThemePool(config);
  const fonts = getFontPool(config);

  if (!config.enabled || (themes.length < 2 && fonts.length < 2)) {
    updateStatus(config.enabled ? 'needs settings' : 'stopped');
    return;
  }

  const delay = config.intervalMinutes * 60 * 1000;
  nextSwitchAt = Date.now() + delay;
  updateStatus();

  timer = setTimeout(async () => {
    await switchAppearance();
    scheduleNextSwitch();
  }, delay);
}

async function switchAppearance() {
  await switchTheme();
  await switchFont();
  updateStatus();
}

async function switchTheme() {
  const config = getConfig();
  const themes = getThemePool(config);

  if (themes.length < 2) {
    return;
  }

  const workbenchConfig = vscode.workspace.getConfiguration('workbench');
  const currentTheme = workbenchConfig.get('colorTheme');
  const currentIndex = themes.indexOf(currentTheme);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % themes.length;
  const nextTheme = themes[nextIndex];

  await workbenchConfig.update('colorTheme', nextTheme, vscode.ConfigurationTarget.Global);
  updateStatus();
}

async function switchFont() {
  const fonts = getFontPool();

  if (fonts.length < 2) {
    return;
  }

  const editorConfig = vscode.workspace.getConfiguration('editor');
  const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
  const currentEditorFont = editorConfig.get('fontFamily');
  const currentTerminalFont = terminalConfig.get('fontFamily');
  const editorIndex = fonts.indexOf(currentEditorFont);
  const terminalIndex = fonts.indexOf(currentTerminalFont);
  const currentIndex = editorIndex !== -1 ? editorIndex : terminalIndex;
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % fonts.length;
  const nextFont = fonts[nextIndex];

  await editorConfig.update('fontFamily', nextFont, vscode.ConfigurationTarget.Global);
  await terminalConfig.update('fontFamily', nextFont, vscode.ConfigurationTarget.Global);
  updateStatus();
}

function getThemePool(config = getConfig()) {
  const installedThemes = config.useInstalledThemes ? getInstalledThemes().map((theme) => theme.label) : [];
  const configuredThemes = config.themes;
  const themes = installedThemes.length >= 2 ? installedThemes : configuredThemes;

  return Array.from(new Set(themes));
}

function getFontPool(config = getConfig()) {
  return Array.from(new Set(config.fontFamilies));
}

function getInstalledThemes() {
  const themes = [];
  const seen = new Set();

  for (const extension of vscode.extensions.all) {
    const contributedThemes =
      extension.packageJSON &&
      extension.packageJSON.contributes &&
      extension.packageJSON.contributes.themes;

    if (!Array.isArray(contributedThemes)) {
      continue;
    }

    for (const theme of contributedThemes) {
      const label = theme && theme.label;

      if (!label || seen.has(label)) {
        continue;
      }

      seen.add(label);
      themes.push({
        label,
        extensionId: extension.id,
        extensionName: extension.packageJSON.displayName || extension.packageJSON.name || extension.id,
        uiTheme: theme.uiTheme || ''
      });
    }
  }

  return themes.sort((a, b) => a.label.localeCompare(b.label));
}

async function showInstalledThemes() {
  const themes = getInstalledThemes();

  if (!themes.length) {
    vscode.window.showWarningMessage('No installed color themes were found.');
    return;
  }

  const selected = await vscode.window.showQuickPick(
    themes.map((theme) => ({
      label: theme.label,
      description: theme.extensionName,
      detail: theme.extensionId,
      theme
    })),
    {
      title: `Installed Color Themes (${themes.length})`,
      placeHolder: 'Pick a theme to switch now'
    }
  );

  if (selected) {
    await vscode.workspace
      .getConfiguration('workbench')
      .update('colorTheme', selected.theme.label, vscode.ConfigurationTarget.Global);
    scheduleNextSwitch();
  }
}

async function copyInstalledThemes() {
  const themeLabels = getInstalledThemes().map((theme) => theme.label);

  await vscode.env.clipboard.writeText(JSON.stringify(themeLabels, null, 2));
  vscode.window.showInformationMessage(`Copied ${themeLabels.length} installed themes to clipboard.`);
}

function updateStatus(state) {
  if (!statusBarItem) {
    return;
  }

  if (state === 'stopped') {
    statusBarItem.text = '$(color-mode) Theme switcher stopped';
    statusBarItem.tooltip = 'Click to switch theme now';
    statusBarItem.show();
    return;
  }

  if (state === 'needs settings') {
    statusBarItem.text = '$(warning) Theme switcher';
    statusBarItem.tooltip = 'Add at least two themes or fonts to Theme Auto Switcher settings';
    statusBarItem.show();
    return;
  }

  const minutes = nextSwitchAt
    ? Math.max(1, Math.ceil((nextSwitchAt - Date.now()) / 60000))
    : getConfig().intervalMinutes;

  statusBarItem.text = `$(color-mode) Appearance in ${minutes}m`;
  statusBarItem.tooltip = 'Click to switch theme and font now';
  statusBarItem.show();
}

module.exports = {
  activate,
  deactivate
};
