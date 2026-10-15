/**
 * ControlHub - Global Search & Quick Actions Controller
 * Keyboard shortcuts (Ctrl+K/Cmd+K), cross-module search, and instant modal openers.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  function performSearch(query) {
    if (!query || !query.trim()) return [];
    var q = query.trim().toLowerCase();
    var state = window.ControlHub.state.getState();
    var results = [];

    // 1. Search Tasks
    (state.tasks || []).forEach(function(t) {
      if ((t.title || '').toLowerCase().indexOf(q) !== -1 ||
          (t.description || '').toLowerCase().indexOf(q) !== -1 ||
          (t.tags || []).some(function(tag) { return tag.toLowerCase().indexOf(q) !== -1; })) {
        results.push({
          type: 'Görev',
          typeClass: 'badge-in-progress',
          route: 'tasks',
          id: t.id,
          title: t.title,
          subtitle: 'Durum: ' + t.status + (t.dueDate ? ' · Bitiş: ' + t.dueDate : '')
        });
      }
    });

    // 2. Search Projects
    (state.projects || []).forEach(function(p) {
      if ((p.name || '').toLowerCase().indexOf(q) !== -1 ||
          (p.description || '').toLowerCase().indexOf(q) !== -1) {
        results.push({
          type: 'Proje',
          typeClass: 'badge-completed',
          route: 'projects',
          id: p.id,
          title: p.name,
          subtitle: p.description || 'Açıklama yok'
        });
      }
    });

    // 3. Search Notes
    (state.notes || []).forEach(function(n) {
      if ((n.title || '').toLowerCase().indexOf(q) !== -1 ||
          (n.content || '').toLowerCase().indexOf(q) !== -1) {
        results.push({
          type: 'Not',
          typeClass: 'badge-pending',
          route: 'notes',
          id: n.id,
          title: n.title,
          subtitle: (n.content || '').substring(0, 70) + '...'
        });
      }
    });

    // 4. Search Habits
    (state.habits || []).forEach(function(h) {
      if ((h.title || '').toLowerCase().indexOf(q) !== -1 ||
          (h.description || '').toLowerCase().indexOf(q) !== -1) {
        results.push({
          type: 'Alışkanlık',
          typeClass: 'badge-priority-high',
          route: 'habits',
          id: h.id,
          title: h.title,
          subtitle: h.frequency || 'Her gün'
        });
      }
    });

    // 5. Search Finance
    (state.transactions || []).forEach(function(tx) {
      if ((tx.category || '').toLowerCase().indexOf(q) !== -1 ||
          (tx.description || '').toLowerCase().indexOf(q) !== -1 ||
          String(tx.amount).indexOf(q) !== -1) {
        results.push({
          type: 'Finans',
          typeClass: tx.type === 'gelir' ? 'badge-completed' : 'badge-priority-critical',
          route: 'finance',
          id: tx.id,
          title: tx.category + ': ' + tx.amount + ' ' + (tx.currency || '₺'),
          subtitle: tx.description || tx.transactionDate
        });
      }
    });

    return results;
  }

  window.ControlHub.search = {
    init: function() {
      // Global shortcut: Ctrl+K or Cmd+K
      document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          window.ControlHub.search.openModal();
        }
      });

      // Search trigger button in topbar
      var triggerBtn = document.getElementById('global-search-trigger-btn');
      if (triggerBtn) {
        triggerBtn.onclick = function() {
          window.ControlHub.search.openModal();
        };
      }

      // Quick add button in topbar
      var quickAddBtn = document.getElementById('global-quick-add-btn');
      if (quickAddBtn) {
        quickAddBtn.onclick = function() {
          window.ControlHub.search.openQuickAddModal();
        };
      }
    },

    openModal: function() {
      var modalHtml = 
        '<div>' +
          '<div class="search-input-wrapper" style="width: 100%; margin-bottom: 16px;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' +
            '<input type="text" id="omni-search-modal-input" class="form-input" placeholder="Görev, proje, not, alışkanlık veya harcama ara..." autofocus>' +
          '</div>' +
          '<div id="omni-search-results-box" style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">' +
            '<p style="text-align: center; color: var(--text-dim); padding: 24px 0; font-size: 0.875rem;">Aramak için yazmaya başlayın (Ctrl+K)</p>' +
          '</div>' +
        '</div>';

      window.ControlHub.modal.open({
        title: 'Global Arama',
        content: modalHtml,
        footer: '<div style="font-size: 0.75rem; color: var(--text-dim); margin-right: auto;">ESC ile kapat</div><button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Kapat</button>',
        onOpen: function(modalEl) {
          var input = modalEl.querySelector('#omni-search-modal-input');
          var resultsBox = modalEl.querySelector('#omni-search-results-box');

          input.addEventListener('input', function() {
            var val = input.value;
            if (!val || !val.trim()) {
              resultsBox.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 24px 0; font-size: 0.875rem;">Aramak için yazmaya başlayın</p>';
              return;
            }

            var results = performSearch(val);
            if (results.length === 0) {
              resultsBox.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 24px 0; font-size: 0.875rem;">Sonuç bulunamadı.</p>';
              return;
            }

            var html = '';
            results.forEach(function(r) {
              html += 
                '<div class="task-row" style="cursor: pointer;" onclick="window.ControlHub.search.navigateResult(\'' + r.route + '\', \'' + r.id + '\')">' +
                  '<span class="badge ' + r.typeClass + '">' + r.type + '</span>' +
                  '<div class="task-main-info">' +
                    '<div class="task-title">' + window.ControlHub.utils.escapeHTML(r.title) + '</div>' +
                    '<div class="task-meta-bar">' + window.ControlHub.utils.escapeHTML(r.subtitle) + '</div>' +
                  '</div>' +
                  '<span style="color: var(--text-dim); font-size: 0.75rem;">Git &rarr;</span>' +
                '</div>';
            });
            resultsBox.innerHTML = html;
          });
        }
      });
    },

    navigateResult: function(route, itemId) {
      window.ControlHub.modal.close();
      window.ControlHub.router.navigate(route);

      // Open item modal depending on route
      setTimeout(function() {
        if (route === 'tasks') {
          window.ControlHub.tasks.openModal(itemId);
        } else if (route === 'projects') {
          window.ControlHub.projects.showDetail(itemId);
        } else if (route === 'notes') {
          window.ControlHub.notes.openModal(itemId);
        } else if (route === 'habits') {
          window.ControlHub.habits.openModal(itemId);
        } else if (route === 'finance') {
          window.ControlHub.finance.openModal(itemId);
        }
      }, 150);
    },

    openQuickAddModal: function() {
      var quickHtml = 
        '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">' +
          '<button class="card" style="text-align: left; padding: 16px; cursor: pointer;" onclick="window.ControlHub.modal.close(); setTimeout(function(){ window.ControlHub.tasks.openModal(); }, 100);">' +
            '<div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 4px; color: var(--accent-primary);">+ Yeni Görev</div>' +
            '<div style="font-size: 0.8125rem; color: var(--text-dim);">Yapılacak yeni bir görev tanımla</div>' +
          '</button>' +
          '<button class="card" style="text-align: left; padding: 16px; cursor: pointer;" onclick="window.ControlHub.modal.close(); setTimeout(function(){ window.ControlHub.notes.openModal(); }, 100);">' +
            '<div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 4px; color: var(--accent-warning);">+ Yeni Not</div>' +
            '<div style="font-size: 0.8125rem; color: var(--text-dim);">Fikir veya toplantı notu al</div>' +
          '</button>' +
          '<button class="card" style="text-align: left; padding: 16px; cursor: pointer;" onclick="window.ControlHub.modal.close(); setTimeout(function(){ window.ControlHub.projects.openModal(); }, 100);">' +
            '<div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 4px; color: var(--accent-success);">+ Yeni Proje</div>' +
            '<div style="font-size: 0.8125rem; color: var(--text-dim);">Hedef veya kapsam projesi kur</div>' +
          '</button>' +
          '<button class="card" style="text-align: left; padding: 16px; cursor: pointer;" onclick="window.ControlHub.modal.close(); setTimeout(function(){ window.ControlHub.finance.openModal(null, \'gider\'); }, 100);">' +
            '<div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 4px; color: var(--accent-danger);">+ Gelir / Gider</div>' +
            '<div style="font-size: 0.8125rem; color: var(--text-dim);">Bütçe işlemi kaydet</div>' +
          '</button>' +
          '<button class="card" style="text-align: left; padding: 16px; cursor: pointer; grid-column: span 2;" onclick="window.ControlHub.modal.close(); setTimeout(function(){ window.ControlHub.habits.openModal(); }, 100);">' +
            '<div style="font-weight: 600; font-size: 0.9375rem; margin-bottom: 4px; color: var(--accent-purple);">+ Yeni Alışkanlık</div>' +
            '<div style="font-size: 0.8125rem; color: var(--text-dim);">Günlük veya haftalık rutin oluştur</div>' +
          '</button>' +
        '</div>';

      window.ControlHub.modal.open({
        title: 'Hızlı İşlem Ekle',
        content: quickHtml,
        footer: '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Vazgeç</button>'
      });
    }
  };
})();
