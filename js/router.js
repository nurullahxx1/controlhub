/**
 * ControlHub - Client-Side Hash Router
 * Supports direct file:// execution, browser back/forward history, and active tab sync.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var routes = {
    'dashboard': { title: 'Genel Bakış', elementId: 'view-dashboard' },
    'tasks': { title: 'Görevler', elementId: 'view-tasks' },
    'projects': { title: 'Projeler', elementId: 'view-projects' },
    'notes': { title: 'Notlar', elementId: 'view-notes' },
    'habits': { title: 'Alışkanlıklar', elementId: 'view-habits' },
    'finance': { title: 'Finans & Bütçe', elementId: 'view-finance' },
    'reports': { title: 'Raporlar & Analitik', elementId: 'view-reports' },
    'settings': { title: 'Ayarlar & Yedekleme', elementId: 'view-settings' }
  };

  var currentRoute = 'dashboard';

  function updateView(routeKey) {
    if (!routes[routeKey]) {
      routeKey = 'dashboard';
    }
    currentRoute = routeKey;

    // Toggle view elements
    Object.keys(routes).forEach(function(key) {
      var viewEl = document.getElementById(routes[key].elementId);
      if (viewEl) {
        if (key === routeKey) {
          viewEl.classList.add('active');
        } else {
          viewEl.classList.remove('active');
        }
      }
    });

    // Update sidebar active link
    var navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    navLinks.forEach(function(link) {
      var target = link.getAttribute('data-route');
      if (target === routeKey) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update breadcrumb
    var breadcrumbActive = document.getElementById('breadcrumb-active-text');
    if (breadcrumbActive) {
      breadcrumbActive.textContent = routes[routeKey].title;
    }

    // Close mobile drawer if open
    var sidebar = document.querySelector('.app-sidebar');
    var overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Notify modules to render/refresh their view
    if (window.ControlHub.events) {
      window.ControlHub.events.emit('route:changed', routeKey);
    }
  }

  window.ControlHub.router = {
    init: function() {
      window.addEventListener('hashchange', function() {
        var hash = window.location.hash.replace('#', '');
        updateView(hash || 'dashboard');
      });

      var initialHash = window.location.hash.replace('#', '');
      updateView(initialHash || 'dashboard');
    },

    navigate: function(routeKey) {
      window.location.hash = '#' + routeKey;
    },

    getCurrentRoute: function() {
      return currentRoute;
    }
  };
})();
