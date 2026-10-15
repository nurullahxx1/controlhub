/**
 * ControlHub - Settings Module
 * Preferences, storage inspection, data reset & danger zone.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  function renderSettings() {
    var state = window.ControlHub.state.getState();
    var settings = state.settings || window.ControlHub.config.defaultSettings;

    var currSelect = document.getElementById('settings-currency-select');
    var viewSelect = document.getElementById('settings-default-view-select');
    var storageModeEl = document.getElementById('settings-storage-mode-badge');
    var storageSummaryEl = document.getElementById('settings-storage-summary');

    if (currSelect) currSelect.value = settings.currency || '₺';
    if (viewSelect) viewSelect.value = settings.defaultView || 'dashboard';

    if (storageModeEl) {
      var isAvailable = window.ControlHub.storage.isAvailable();
      storageModeEl.textContent = isAvailable ? 'Tarayıcı LocalStorage (Aktif & Güvenli)' : 'Geçici Bellek Modu (Kalıcılık Devre Dışı)';
      storageModeEl.className = 'badge ' + (isAvailable ? 'badge-completed' : 'badge-priority-critical');
    }

    if (storageSummaryEl) {
      var tCount = (state.tasks || []).length;
      var pCount = (state.projects || []).length;
      var nCount = (state.notes || []).length;
      var hCount = (state.habits || []).length;
      var txCount = (state.transactions || []).length;

      storageSummaryEl.textContent = 
        tCount + ' Görev · ' + pCount + ' Proje · ' + nCount + ' Not · ' + hCount + ' Alışkanlık · ' + txCount + ' Finans Kaydı';
    }
  }

  window.ControlHub.settings = {
    init: function() {
      var currSelect = document.getElementById('settings-currency-select');
      var viewSelect = document.getElementById('settings-default-view-select');
      var resetDemoBtn = document.getElementById('settings-reset-demo-btn');
      var clearAllBtn = document.getElementById('settings-clear-all-btn');

      if (currSelect) {
        currSelect.onchange = function() {
          var state = window.ControlHub.state.getState();
          state.settings = state.settings || {};
          state.settings.currency = currSelect.value;
          window.ControlHub.state.save();
          window.ControlHub.state.notify();
          window.ControlHub.notifications.success('Para birimi güncellendi: ' + currSelect.value);
        };
      }

      if (viewSelect) {
        viewSelect.onchange = function() {
          var state = window.ControlHub.state.getState();
          state.settings = state.settings || {};
          state.settings.defaultView = viewSelect.value;
          window.ControlHub.state.save();
          window.ControlHub.notifications.success('Varsayılan açılış sayfası kaydedildi.');
        };
      }

      if (resetDemoBtn) {
        resetDemoBtn.onclick = function() {
          window.ControlHub.modal.confirm({
            title: 'Örnek Verileri Yükle',
            message: 'Mevcut verilerinizin yerine başlangıç örnek verileri yüklenecektir. Devam etmek istiyor musunuz?',
            confirmText: 'Örnek Veriyi Yükle',
            onConfirm: function() {
              window.ControlHub.state.resetToDemoData();
              window.ControlHub.notifications.success('Örnek veriler başarıyla geri yüklendi.');
            }
          });
        };
      }

      if (clearAllBtn) {
        clearAllBtn.onclick = function() {
          window.ControlHub.modal.confirm({
            title: 'Tüm Verileri Sıfırla',
            message: 'DİKKAT: Görevler, projeler, notlar, alışkanlıklar ve tüm finans geçmişiniz kalıcı olarak silinecektir. Bu işlem geri alınamaz!',
            confirmText: 'Tümünü Kalıcı Olarak Sil',
            isDestructive: true,
            onConfirm: function() {
              window.ControlHub.state.clearAllData();
              window.ControlHub.notifications.warning('Tüm veriler temizlendi.');
            }
          });
        };
      }

      window.ControlHub.state.subscribe(function() {
        renderSettings();
      });

      renderSettings();
    },

    render: function() {
      renderSettings();
    }
  };
})();
