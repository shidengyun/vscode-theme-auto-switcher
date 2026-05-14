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
      await switchTheme();
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
    themes: config.get('themes', []).filter(Boolean)
  };
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

  if (themes.length < 2) {
    updateStatus('needs themes');
    vscode.window.showWarningMessage('Theme Auto Switcher needs at least two themes in settings.');
    return;
  }

  if (config.switchOnStart) {
    switchTheme();
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

  if (!config.enabled || themes.length < 2) {
    updateStatus(config.enabled ? 'needs themes' : 'stopped');
    return;
  }

  const delay = config.intervalMinutes * 60 * 1000;
  nextSwitchAt = Date.now() + delay;
  updateStatus();

  timer = setTimeout(async () => {
    await switchTheme();
    scheduleNextSwitch();
  }, delay);
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

function getThemePool(config = getConfig()) {
  const installedThemes = config.useInstalledThemes ? getInstalledThemes().map((theme) => theme.label) : [];
  const configuredThemes = config.themes;
  const themes = installedThemes.length >= 2 ? installedThemes : configuredThemes;

  return Array.from(new Set(themes));
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

  if (state === 'needs themes') {
    statusBarItem.text = '$(warning) Theme switcher';
    statusBarItem.tooltip = 'Add at least two themes to themeAutoSwitcher.themes';
    statusBarItem.show();
    return;
  }

  const minutes = nextSwitchAt
    ? Math.max(1, Math.ceil((nextSwitchAt - Date.now()) / 60000))
    : getConfig().intervalMinutes;

  statusBarItem.text = `$(color-mode) Theme in ${minutes}m`;
  statusBarItem.tooltip = 'Click to switch theme now';
  statusBarItem.show();
}

module.exports = {
  activate,
  deactivate
};
