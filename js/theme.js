/**
 * ControlHub - Theme Manager
 * Dark (default) and Light theme switching with persistence.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var currentTheme = 'dark';

  window.ControlHub.theme = {
    init: function() {
      var saved = window.ControlHub.storage.get(window.ControlHub.config.themeStorageKey);
      if (saved === 'light' || saved === 'dark') {
        currentTheme = saved;
      } else {
        currentTheme = 'dark'; // Dark theme is default as specified
      }
      this.apply(currentTheme);
    },

    getTheme: function() {
      return currentTheme;
    },

    toggle: function() {
      var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.apply(newTheme);
      window.ControlHub.storage.set(window.ControlHub.config.themeStorageKey, newTheme);
      window.ControlHub.notifications.info(newTheme === 'dark' ? 'Koyu tema aktif' : 'Açık tema aktif', 1500);
      return newTheme;
    },

    apply: function(theme) {
      currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      
      // Update theme toggle icons across the interface
      var themeBtns = document.querySelectorAll('.theme-toggle-btn');
      themeBtns.forEach(function(btn) {
        if (theme === 'light') {
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
          btn.setAttribute('title', 'Koyu Temaya Geç');
          btn.setAttribute('aria-label', 'Koyu Temaya Geç');
        } else {
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
          btn.setAttribute('title', 'Açık Temaya Geç');
          btn.setAttribute('aria-label', 'Açık Temaya Geç');
        }
      });

      if (window.ControlHub.events) {
        window.ControlHub.events.emit('theme:changed', theme);
      }
    }
  };
})();
