/**
 * ControlHub - Notes Module (CRUD, Pinning, Category Filter, Search, Safe Rendering, Auto-Save)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var filterCategory = 'all';
  var searchQuery = '';

  function renderNotes() {
    var state = window.ControlHub.state.getState();
    var notes = state.notes || [];
    var container = document.getElementById('notes-view-content');
    if (!container) return;

    var filtered = notes.filter(function(note) {
      if (filterCategory !== 'all' && note.category !== filterCategory) return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var titleMatch = (note.title || '').toLowerCase().indexOf(q) !== -1;
        var contentMatch = (note.content || '').toLowerCase().indexOf(q) !== -1;
        var tagMatch = (note.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1; });
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }
      return true;
    });

    // Sort: Pinned first, then by updatedAt descending
    filtered.sort(function(a, b) {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    if (filtered.length === 0) {
      container.innerHTML = 
        '<div class="empty-state">' +
          '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' +
          '<h3 class="empty-state-title">Not Bulunamadı</h3>' +
          '<p class="empty-state-desc">Aramanıza uygun not bulunamadı. Fikirlerinizi, toplantı notlarınızı veya yapılacakları not defterine kaydedin.</p>' +
          '<button class="btn btn-primary" onclick="window.ControlHub.notes.openModal()">+ Yeni Not Ekle</button>' +
        '</div>';
      return;
    }

    var html = '<div class="notes-grid">';
    filtered.forEach(function(note) {
      html += 
        '<div class="note-card ' + (note.isPinned ? 'pinned' : '') + '" onclick="window.ControlHub.notes.openModal(\'' + note.id + '\')">' +
          '<button class="btn-icon note-pin-btn ' + (note.isPinned ? 'active' : '') + '" onclick="event.stopPropagation(); window.ControlHub.notes.togglePin(\'' + note.id + '\')" title="' + (note.isPinned ? 'Sabitlemeyi Kaldır' : 'Başa Sabitle') + '">' +
            '<svg viewBox="0 0 24 24" fill="' + (note.isPinned ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>' +
          '</button>' +
          '<div class="note-card-title">' + window.ControlHub.utils.escapeHTML(note.title) + '</div>' +
          '<div class="note-card-snippet">' + window.ControlHub.utils.escapeHTML(note.content || 'Boş not') + '</div>' +
          '<div class="note-card-footer">' +
            '<span class="badge" style="background: var(--bg-card-subtle); color: var(--text-muted);">' + window.ControlHub.utils.escapeHTML(note.category || 'Genel') + '</span>' +
            '<span>' + window.ControlHub.utils.formatDate(note.updatedAt) + '</span>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.ControlHub.notes = {
    init: function() {
      var catSelect = document.getElementById('note-filter-category');
      var searchInp = document.getElementById('note-search-input');

      if (catSelect) {
        catSelect.onchange = function() {
          filterCategory = this.value;
          renderNotes();
        };
      }

      if (searchInp) {
        searchInp.oninput = window.ControlHub.utils.debounce(function() {
          searchQuery = searchInp.value;
          renderNotes();
        }, 200);
      }

      window.ControlHub.state.subscribe(function() {
        renderNotes();
      });

      renderNotes();
    },

    render: function() {
      renderNotes();
    },

    togglePin: function(noteId) {
      var state = window.ControlHub.state.getState();
      var note = (state.notes || []).find(function(n) { return n.id === noteId; });
      if (!note) return;

      note.isPinned = !note.isPinned;
      window.ControlHub.state.save();
      window.ControlHub.state.notify('notes');
      window.ControlHub.notifications.info(note.isPinned ? 'Not başa sabitlendi.' : 'Not sabitlemesi kaldırıldı.', 1500);
    },

    deleteNote: function(noteId) {
      window.ControlHub.modal.confirm({
        title: 'Notu Sil',
        message: 'Bu notu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        confirmText: 'Sil',
        isDestructive: true,
        onConfirm: function() {
          var state = window.ControlHub.state.getState();
          state.notes = (state.notes || []).filter(function(n) { return n.id !== noteId; });
          window.ControlHub.state.save();
          window.ControlHub.state.notify('notes');
          window.ControlHub.notifications.success('Not silindi.');
        }
      });
    },

    openModal: function(noteId) {
      var state = window.ControlHub.state.getState();
      var note = noteId ? (state.notes || []).find(function(n) { return n.id === noteId; }) : null;
      var isEdit = !!note;

      var categories = window.ControlHub.config.noteCategories || ['Genel', 'İş & Proje', 'Fikirler', 'Toplantı', 'Kişisel'];
      var catOptionsHtml = '';
      categories.forEach(function(c) {
        var selected = note && note.category === c ? 'selected' : '';
        catOptionsHtml += '<option value="' + c + '" ' + selected + '>' + c + '</option>';
      });

      var formHtml = 
        '<form id="note-modal-form" onsubmit="return false;">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
            '<div class="save-status-pill" id="note-save-status">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
              '<span>Hazır</span>' +
            '</div>' +
            '<div id="note-counters" style="font-size: 0.75rem; color: var(--text-dim);">' +
              '0 kelime, 0 karakter' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="note-f-title">Not Başlığı <span class="required">*</span></label>' +
            '<input type="text" id="note-f-title" class="form-input" placeholder="Not başlığı..." value="' + window.ControlHub.utils.escapeHTML(note ? note.title : '') + '" required>' +
            '<div class="form-error" id="err-note-title" style="display: none;"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="note-f-cat">Kategori</label>' +
              '<select id="note-f-cat" class="form-select">' + catOptionsHtml + '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="note-f-tags">Etiketler</label>' +
              '<input type="text" id="note-f-tags" class="form-input" placeholder="Fikir, Önemli" value="' + (note && note.tags ? note.tags.join(', ') : '') + '">' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="note-f-content">İçerik</label>' +
            '<textarea id="note-f-content" class="form-textarea" rows="8" placeholder="Notlarınızı buraya yazın...">' + window.ControlHub.utils.escapeHTML(note ? note.content || '' : '') + '</textarea>' +
          '</div>' +
        '</form>';

      var footerHtml = 
        (isEdit ? '<button class="btn btn-ghost" id="note-modal-del-btn" style="color: var(--accent-danger); margin-right: auto;">Sil</button>' : '') +
        '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Vazgeç</button>' +
        '<button class="btn btn-primary" id="save-note-submit-btn">' + (isEdit ? 'Kaydet' : 'Oluştur') + '</button>';

      window.ControlHub.modal.open({
        title: isEdit ? 'Notu Düzenle' : 'Yeni Not Ekle',
        content: formHtml,
        footer: footerHtml,
        onOpen: function(modalEl) {
          var titleInp = modalEl.querySelector('#note-f-title');
          var contentInp = modalEl.querySelector('#note-f-content');
          var catSelect = modalEl.querySelector('#note-f-cat');
          var tagsInp = modalEl.querySelector('#note-f-tags');
          var countersEl = modalEl.querySelector('#note-counters');
          var saveStatusEl = modalEl.querySelector('#note-save-status');

          function updateCounters() {
            var text = contentInp.value || '';
            var charCount = text.length;
            var wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
            if (countersEl) {
              countersEl.textContent = wordCount + ' kelime, ' + charCount + ' karakter';
            }
          }

          updateCounters();
          contentInp.addEventListener('input', function() {
            updateCounters();
            if (saveStatusEl) {
              saveStatusEl.className = 'save-status-pill saving';
              saveStatusEl.innerHTML = '<span>Değişiklik var...</span>';
            }
          });

          var delBtn = modalEl.querySelector('#note-modal-del-btn');
          if (delBtn && noteId) {
            delBtn.onclick = function() {
              window.ControlHub.modal.close();
              window.ControlHub.notes.deleteNote(noteId);
            };
          }

          var saveBtn = modalEl.querySelector('#save-note-submit-btn');
          if (saveBtn) {
            saveBtn.onclick = function() {
              var title = titleInp.value;
              var content = contentInp.value;
              var category = catSelect.value;
              var tagsRaw = tagsInp.value || '';
              var tags = tagsRaw.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; });

              var valResult = window.ControlHub.validation.validateNote({ title: title });
              if (!valResult.isValid) {
                var errEl = modalEl.querySelector('#err-note-title');
                if (errEl) {
                  errEl.textContent = valResult.errors.title;
                  errEl.style.display = 'flex';
                }
                titleInp.classList.add('is-invalid');
                return;
              }

              var now = new Date().toISOString();
              var st = window.ControlHub.state.getState();

              if (isEdit) {
                note.title = title.trim();
                note.content = content;
                note.category = category;
                note.tags = tags;
                note.updatedAt = now;
                window.ControlHub.notifications.success('Not güncellendi.');
              } else {
                var newNote = {
                  id: window.ControlHub.utils.generateId('note'),
                  title: title.trim(),
                  content: content,
                  category: category,
                  tags: tags,
                  isPinned: false,
                  createdAt: now,
                  updatedAt: now
                };
                st.notes = st.notes || [];
                st.notes.push(newNote);
                window.ControlHub.notifications.success('Yeni not eklendi.');
              }

              window.ControlHub.state.save();
              window.ControlHub.state.notify('notes');
              window.ControlHub.modal.close();
            };
          }
        }
      });
    }
  };
})();
