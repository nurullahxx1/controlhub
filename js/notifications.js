/**
 * ControlHub - Notifications & Toast Manager
 * Accessible aria-live status announcer with visual toasts.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var container = null;

  function ensureContainer() {
    if (!container) {
      container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
      }
    }
    return container;
  }

  var icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  window.ControlHub.notifications = {
    show: function(message, type, duration) {
      type = type || 'info';
      duration = duration || 3500;
      var c = ensureContainer();

      var toast = document.createElement('div');
      toast.className = 'toast toast-' + type;
      toast.setAttribute('role', 'alert');

      var iconSvg = icons[type] || icons.info;
      var textSpan = document.createElement('span');
      textSpan.textContent = message;

      toast.innerHTML = iconSvg;
      toast.appendChild(textSpan);

      c.appendChild(toast);

      // Trigger animation
      setTimeout(function() {
        toast.classList.add('show');
      }, 10);

      // Auto dismiss
      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, duration);
    },

    success: function(message, duration) {
      this.show(message, 'success', duration);
    },

    error: function(message, duration) {
      this.show(message, 'error', duration || 4500);
    },

    warning: function(message, duration) {
      this.show(message, 'warning', duration);
    },

    info: function(message, duration) {
      this.show(message, 'info', duration);
    }
  };
})();
