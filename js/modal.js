/**
 * ControlHub - Accessible Modal Controller
 * Focus trapping, escape handling, backdrop management.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var activeModal = null;
  var previousActiveElement = null;

  function getFocusableElements(element) {
    return element.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
  }

  function handleKeyDown(e) {
    if (!activeModal) return;

    if (e.key === 'Escape') {
      window.ControlHub.modal.close();
      return;
    }

    if (e.key === 'Tab') {
      var focusables = getFocusableElements(activeModal);
      if (focusables.length === 0) return;

      var firstElement = focusables[0];
      var lastElement = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  }

  window.ControlHub.modal = {
    open: function(options) {
      this.close(); // Close any currently open modal first

      previousActiveElement = document.activeElement;

      var backdrop = document.getElementById('global-modal-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'global-modal-backdrop';
        backdrop.className = 'modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.innerHTML = '<div class="modal-window" id="global-modal-window"></div>';
        document.body.appendChild(backdrop);
      }

      var modalWindow = document.getElementById('global-modal-window');
      activeModal = modalWindow;

      modalWindow.innerHTML = 
        '<div class="modal-header">' +
          '<h3 class="modal-title" id="modal-title">' + (options.title || '') + '</h3>' +
          '<button class="btn-icon" id="modal-close-x" aria-label="Kapat">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
          '</button>' +
        '</div>' +
        '<div class="modal-body" id="modal-body-content"></div>' +
        (options.footer !== false ? '<div class="modal-footer" id="modal-footer-content"></div>' : '');

      var bodyContainer = document.getElementById('modal-body-content');
      if (typeof options.content === 'string') {
        bodyContainer.innerHTML = options.content;
      } else if (options.content instanceof HTMLElement) {
        bodyContainer.appendChild(options.content);
      }

      var footerContainer = document.getElementById('modal-footer-content');
      if (footerContainer) {
        if (typeof options.footer === 'string') {
          footerContainer.innerHTML = options.footer;
        } else if (options.footer instanceof HTMLElement) {
          footerContainer.appendChild(options.footer);
        } else if (!options.footer) {
          footerContainer.innerHTML = '<button class="btn btn-secondary" id="modal-default-close-btn">Kapat</button>';
        }
      }

      // Backdrop click handler
      backdrop.onclick = function(e) {
        if (e.target === backdrop && options.preventBackdropClose !== true) {
          window.ControlHub.modal.close();
        }
      };

      // Close button handlers
      var closeX = document.getElementById('modal-close-x');
      if (closeX) {
        closeX.onclick = function() { window.ControlHub.modal.close(); };
      }
      var defaultClose = document.getElementById('modal-default-close-btn');
      if (defaultClose) {
        defaultClose.onclick = function() { window.ControlHub.modal.close(); };
      }

      backdrop.classList.add('active');
      document.addEventListener('keydown', handleKeyDown);

      // Focus first input or button
      setTimeout(function() {
        var focusables = getFocusableElements(modalWindow);
        if (focusables.length > 0) {
          focusables[0].focus();
        }
        if (typeof options.onOpen === 'function') {
          options.onOpen(modalWindow);
        }
      }, 50);
    },

    close: function() {
      var backdrop = document.getElementById('global-modal-backdrop');
      if (backdrop) {
        backdrop.classList.remove('active');
      }
      document.removeEventListener('keydown', handleKeyDown);
      activeModal = null;

      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    },

    confirm: function(options) {
      var contentHtml = '<p style="font-size: 0.9375rem; color: var(--text-main);">' + 
        window.ControlHub.utils.escapeHTML(options.message || 'Bu işlemi onaylıyor musunuz?') + 
        '</p>';
      
      var footerHtml = 
        '<button class="btn btn-secondary" id="confirm-cancel-btn">' + (options.cancelText || 'Vazgeç') + '</button>' +
        '<button class="btn ' + (options.isDestructive ? 'btn-danger' : 'btn-primary') + '" id="confirm-ok-btn">' + 
          (options.confirmText || 'Onayla') + 
        '</button>';

      this.open({
        title: options.title || 'Onay Gerekiyor',
        content: contentHtml,
        footer: footerHtml,
        onOpen: function(modalEl) {
          var okBtn = modalEl.querySelector('#confirm-ok-btn');
          var cancelBtn = modalEl.querySelector('#confirm-cancel-btn');
          if (okBtn) {
            okBtn.onclick = function() {
              window.ControlHub.modal.close();
              if (typeof options.onConfirm === 'function') {
                options.onConfirm();
              }
            };
          }
          if (cancelBtn) {
            cancelBtn.onclick = function() {
              window.ControlHub.modal.close();
              if (typeof options.onCancel === 'function') {
                options.onCancel();
              }
            };
          }
        }
      });
    }
  };
})();
