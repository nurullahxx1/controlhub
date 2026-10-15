/**
 * ControlHub - Backup & Restore System
 * JSON schema validation, atomic imports, merge/overwrite modes, export downloads.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  window.ControlHub.backup = {
    init: function() {
      var exportBtn = document.getElementById('backup-export-json-btn');
      var importInput = document.getElementById('backup-import-file-input');

      if (exportBtn) {
        exportBtn.onclick = function() {
          window.ControlHub.backup.exportJSON();
        };
      }

      if (importInput) {
        importInput.onchange = function(e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          window.ControlHub.backup.importJSON(file);
          importInput.value = ''; // Reset input
        };
      }
    },

    exportJSON: function() {
      var state = window.ControlHub.state.getState();
      var backupPayload = {
        app: 'ControlHub',
        version: window.ControlHub.config.version,
        schemaVersion: window.ControlHub.config.schemaVersion,
        exportedAt: new Date().toISOString(),
        data: window.ControlHub.utils.deepClone(state)
      };

      var jsonStr = JSON.stringify(backupPayload, null, 2);
      var blob = new Blob([jsonStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'controlhub-backup-' + window.ControlHub.utils.getLocalISODate() + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      window.ControlHub.notifications.success('Yedek dosyası başarıyla dışa aktarıldı.');
    },

    importJSON: function(file) {
      if (!file.name.endsWith('.json')) {
        window.ControlHub.notifications.error('Yalnızca .json formatındaki yedek dosyaları desteklenir.');
        return;
      }

      var reader = new FileReader();
      reader.onload = function(event) {
        try {
          var parsed = JSON.parse(event.target.result);
          var validation = window.ControlHub.validation.validateBackup(parsed);

          if (!validation.isValid) {
            window.ControlHub.notifications.error('Geçersiz yedek: ' + validation.message);
            return;
          }

          // Ask user whether to Overwrite or Merge
          var summary = 
            'Yedek Özeti:<br>' +
            '· ' + parsed.data.tasks.length + ' Görev<br>' +
            '· ' + parsed.data.projects.length + ' Proje<br>' +
            '· ' + parsed.data.notes.length + ' Not<br>' +
            '· ' + parsed.data.habits.length + ' Alışkanlık<br>' +
            '· ' + parsed.data.transactions.length + ' Finans Kaydı<br><br>' +
            'Bu yedeği mevcut verilerinizin üzerine yazmak mı (Tam Değiştirme), yoksa mevcut verilerle birleştirmek mi istersiniz?';

          var modalHtml = 
            '<p style="font-size: 0.9375rem; color: var(--text-main); line-height: 1.6;">' + summary + '</p>' +
            '<div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">' +
              '<button class="btn btn-primary" id="import-overwrite-btn">Tam Üzerine Yaz (Tavsiye Edilen)</button>' +
              '<button class="btn btn-secondary" id="import-merge-btn">Mevcut Verilerle Birleştir</button>' +
            '</div>';

          window.ControlHub.modal.open({
            title: 'Yedek Geri Yükleme Onayı',
            content: modalHtml,
            footer: '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">İptal</button>',
            onOpen: function(modalEl) {
              var overwriteBtn = modalEl.querySelector('#import-overwrite-btn');
              var mergeBtn = modalEl.querySelector('#import-merge-btn');

              if (overwriteBtn) {
                overwriteBtn.onclick = function() {
                  window.ControlHub.modal.close();
                  window.ControlHub.state.setState(parsed.data);
                  window.ControlHub.notifications.success('Yedek başarıyla geri yüklendi (üzerine yazıldı).');
                };
              }

              if (mergeBtn) {
                mergeBtn.onclick = function() {
                  window.ControlHub.modal.close();
                  var current = window.ControlHub.state.getState();
                  
                  // Helper to merge arrays avoiding duplicate IDs
                  function mergeArrays(arr1, arr2) {
                    var map = {};
                    var result = [];
                    (arr1 || []).forEach(function(item) {
                      map[item.id] = true;
                      result.push(item);
                    });
                    (arr2 || []).forEach(function(item) {
                      if (!map[item.id]) {
                        map[item.id] = true;
                        result.push(item);
                      }
                    });
                    return result;
                  }

                  current.tasks = mergeArrays(current.tasks, parsed.data.tasks);
                  current.projects = mergeArrays(current.projects, parsed.data.projects);
                  current.notes = mergeArrays(current.notes, parsed.data.notes);
                  current.habits = mergeArrays(current.habits, parsed.data.habits);
                  current.transactions = mergeArrays(current.transactions, parsed.data.transactions);

                  window.ControlHub.state.setState(current);
                  window.ControlHub.notifications.success('Yedek mevcut verilerle başarıyla birleştirildi.');
                };
              }
            }
          });

        } catch (e) {
          console.error('JSON parse error during import', e);
          window.ControlHub.notifications.error('Yedek dosyası bozuk veya okunamıyor: ' + e.message);
        }
      };

      reader.onerror = function() {
        window.ControlHub.notifications.error('Dosya okuma sırasında hata oluştu.');
      };

      reader.readAsText(file);
    }
  };
})();
