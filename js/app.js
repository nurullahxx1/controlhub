/**
 * ControlHub - Application Bootstrap & Orchestrator
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  function updateSidebarBadges() {
    var state = window.ControlHub.state.getState();
    var activeTasksCount = (state.tasks || []).filter(function(t) { return t.status !== 'tamamlandi'; }).length;
    var activeProjectsCount = (state.projects || []).filter(function(p) { return p.status === 'aktif'; }).length;

    var tasksBadge = document.getElementById('nav-badge-tasks');
    var projectsBadge = document.getElementById('nav-badge-projects');

    if (tasksBadge) tasksBadge.textContent = activeTasksCount;
    if (projectsBadge) projectsBadge.textContent = activeProjectsCount;
  }

  function setupMobileNavigation() {
    var toggleBtn = document.getElementById('mobile-menu-toggle');
    var sidebar = document.querySelector('.app-sidebar');
    var overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn && sidebar && overlay) {
      toggleBtn.onclick = function() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      };

      overlay.onclick = function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      };
    }
  }

  function setupThemeToggle() {
    var themeBtns = document.querySelectorAll('.theme-toggle-btn');
    themeBtns.forEach(function(btn) {
      btn.onclick = function() {
        window.ControlHub.theme.toggle();
      };
    });
  }

  function setupNavigationLinks() {
    var navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(function(link) {
      link.onclick = function() {
        var route = link.getAttribute('data-route');
        if (route) {
          window.ControlHub.router.navigate(route);
        }
      };
    });
  }

  window.ControlHub.init = function() {
    try {
      // 1. Theme
      window.ControlHub.theme.init();

      // 2. State & Storage
      window.ControlHub.state.init();

      // 3. UI Modules
      window.ControlHub.dashboard.init();
      window.ControlHub.tasks.init();
      window.ControlHub.projects.init();
      window.ControlHub.notes.init();
      window.ControlHub.habits.init();
      window.ControlHub.finance.init();
      window.ControlHub.reports.init();
      window.ControlHub.search.init();
      window.ControlHub.settings.init();
      window.ControlHub.backup.init();

      // 4. Navigation & Layout
      setupMobileNavigation();
      setupThemeToggle();
      setupNavigationLinks();

      // 5. Router (loads initial hash or default)
      window.ControlHub.router.init();

      // 6. Badges & listeners
      updateSidebarBadges();
      window.ControlHub.state.subscribe(function() {
        updateSidebarBadges();
      });

      console.log('ControlHub v' + window.ControlHub.config.version + ' başarıyla başlatıldı.');
    } catch (err) {
      console.error('ControlHub initialization error', err);
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.ControlHub.init);
  } else {
    window.ControlHub.init();
  }
})();
