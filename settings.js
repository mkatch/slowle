let settings = null;
let isFirstVisit = false;

loadSettings();

function loadSettings() {
  settings = localStorage.getItem('settings');
  if (settings) {
    settings = JSON.parse(settings);
  } else {
    settings = {};
    isFirstVisit = true;
  }
  if (!settings.theme) {
    settings.theme = 'dark';
  }
  // We want to do it as early as possible. Other settings can wait.
  applyThemeSetting();
}

function applyThemeSetting() {
  if (!document.body) {
    window.addEventListener('DOMContentLoaded', applyThemeSetting);
    return;
  }

  document.body.setAttribute('theme', settings.theme);
}

function saveSettings() {
  applyThemeSetting();
  themeButtonElement.textContent =
    settings.theme == 'dark' ? 'dark_mode' : 'light_mode';
  localStorage.setItem('settings', JSON.stringify(settings));
}