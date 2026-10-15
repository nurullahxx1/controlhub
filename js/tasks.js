/**
 * ControlHub - Tasks Module (Full CRUD, List & Kanban Views, Filters, Overdue Detection)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var viewMode = 'list'; // 'list' or 'kanban'
  var filterStatus = 'all';
  var filterPriority = 'all';
  var filterProject = 'all';
  var searchQuery = '';
  var sortBy = 'dueDate';

  function getProjectName(projectId) {
    if (!projectId) return null;
    var state = window.ControlHub.state.getState();
    var project = (state.projects || []).find(function(p) { return p.id === projectId; });
    return project ? project.name : null;
  }

  function renderTasks() {
    var state = window.ControlHub.state.getState();
    var tasks = state.tasks || [];
    var container = document.getElementById('tasks-view-content');
    if (!container) return;

    var todayStr = window.ControlHub.utils.getLocalISODate();

    // Filter tasks
    var filtered = tasks.filter(function(task) {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterProject !== 'all' && task.projectId !== filterProject) return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var titleMatch = (task.title || '').toLowerCase().indexOf(q) !== -1;
        var descMatch = (task.description || '').toLowerCase().indexOf(q) !== -1;
        var tagMatch = (task.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) !== -1; });
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }
      return true;
    });

    // Sort tasks
    filtered.sort(function(a, b) {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'priority') {
        var priorityWeight = { kritik: 4, yuksek: 3, normal: 2, dusuk: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    // Populate project filter dropdown
    var projSelect = document.getElementById('task-filter-project');
    if (projSelect) {
      var currentVal = projSelect.value;
      var optionsHtml = '<option value="all">Tüm Projeler</option>';
      (state.projects || []).forEach(function(p) {
        optionsHtml += '<option value="' + p.id + '">' + window.ControlHub.utils.escapeHTML(p.name) + '</option>';
      });
      projSelect.innerHTML = optionsHtml;
      projSelect.value = currentVal || 'all';
    }

    if (viewMode === 'list') {
      renderListView(container, filtered, todayStr);
    } else {
      renderKanbanView(container, filtered, todayStr);
    }
  }

  function renderListView(container, tasks, todayStr) {
    if (tasks.length === 0) {
      container.innerHTML = 
        '<div class="empty-state">' +
          '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>' +
          '<h3 class="empty-state-title">Görev Bulunamadı</h3>' +
          '<p class="empty-state-desc">Arama veya filtre kriterlerinize uygun görev bulunmuyor. Yeni bir görev oluşturabilirsiniz.</p>' +
          '<button class="btn btn-primary" onclick="window.ControlHub.tasks.openModal()">+ Yeni Görev Ekle</button>' +
        '</div>';
      return;
    }

    var html = '<div class="tasks-list-container">';
    tasks.forEach(function(task) {
      var isCompleted = task.status === 'tamamlandi';
      var isOverdue = !isCompleted && task.dueDate && task.dueDate < todayStr;
      var projName = getProjectName(task.projectId);
      var priorityObj = window.ControlHub.config.taskPriorities.find(function(p) { return p.id === task.priority; }) || { label: task.priority, badgeClass: 'badge-priority-normal' };
      var statusObj = window.ControlHub.config.taskStatuses.find(function(s) { return s.id === task.status; }) || { label: task.status, badgeClass: 'badge-pending' };

      html += 
        '<div class="task-row ' + (isCompleted ? 'is-completed' : '') + ' ' + (isOverdue ? 'is-overdue' : '') + '">' +
          '<div class="dash-checkbox ' + (isCompleted ? 'checked' : '') + '" onclick="window.ControlHub.tasks.toggleStatus(\'' + task.id + '\')" role="button" aria-label="Görevi tamamla" tabindex="0">' +
            (isCompleted ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '') +
          '</div>' +
          '<div class="task-main-info">' +
            '<div class="task-title">' + window.ControlHub.utils.escapeHTML(task.title) + '</div>' +
            '<div class="task-meta-bar">' +
              (projName ? '<span style="color: var(--accent-primary); font-weight: 500;">📁 ' + window.ControlHub.utils.escapeHTML(projName) + '</span>' : '') +
              '<span>📅 ' + (task.dueDate ? window.ControlHub.utils.formatDate(task.dueDate) + ' (' + window.ControlHub.utils.getRelativeDateLabel(task.dueDate) + ')' : 'Tarih yok') + '</span>' +
              '<span class="badge ' + priorityObj.badgeClass + '">' + priorityObj.label + '</span>' +
              '<span class="badge ' + statusObj.badgeClass + '">' + statusObj.label + '</span>' +
              (task.tags && task.tags.length ? task.tags.map(function(t) { return '<span class="task-tag">#' + window.ControlHub.utils.escapeHTML(t) + '</span>'; }).join('') : '') +
            '</div>' +
          '</div>' +
          '<div class="task-actions">' +
            '<button class="btn-icon" onclick="window.ControlHub.tasks.openModal(\'' + task.id + '\')" title="Düzenle" aria-label="Düzenle">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
            '</button>' +
            '<button class="btn-icon" onclick="window.ControlHub.tasks.deleteTask(\'' + task.id + '\')" title="Sil" aria-label="Sil" style="color: var(--accent-danger);">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
            '</button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function renderKanbanView(container, tasks, todayStr) {
    var columns = [
      { id: 'bekliyor', title: 'Bekliyor', badge: 'badge-pending' },
      { id: 'devam-ediyor', title: 'Devam Ediyor', badge: 'badge-in-progress' },
      { id: 'tamamlandi', title: 'Tamamlandı', badge: 'badge-completed' }
    ];

    var html = '<div class="kanban-board">';
    columns.forEach(function(col) {
      var colTasks = tasks.filter(function(t) { return t.status === col.id; });
      html += 
        '<div class="kanban-column">' +
          '<div class="kanban-column-header">' +
            '<div class="kanban-column-title">' +
              '<span>' + col.title + '</span>' +
              '<span class="badge ' + col.badge + '">' + colTasks.length + '</span>' +
            '</div>' +
            '<button class="btn btn-ghost btn-sm" onclick="window.ControlHub.tasks.openModal(null, \'' + col.id + '\')">+ Ekle</button>' +
          '</div>' +
          '<div class="kanban-column-body">';

      if (colTasks.length === 0) {
        html += '<p style="text-align: center; color: var(--text-dim); padding: 24px 0; font-size: 0.8125rem;">Bu sütunda görev yok</p>';
      } else {
        colTasks.forEach(function(task) {
          var isOverdue = task.status !== 'tamamlandi' && task.dueDate && task.dueDate < todayStr;
          var projName = getProjectName(task.projectId);
          var priorityObj = window.ControlHub.config.taskPriorities.find(function(p) { return p.id === task.priority; }) || { label: task.priority, badgeClass: 'badge-priority-normal' };

          html += 
            '<div class="kanban-card" onclick="window.ControlHub.tasks.openModal(\'' + task.id + '\')">' +
              '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">' +
                '<span class="badge ' + priorityObj.badgeClass + '">' + priorityObj.label + '</span>' +
                (task.dueDate ? '<span style="font-size: 0.75rem; color: ' + (isOverdue ? 'var(--accent-danger)' : 'var(--text-dim)') + ';">📅 ' + window.ControlHub.utils.formatDate(task.dueDate) + '</span>' : '') +
              '</div>' +
              '<div style="font-weight: 500; font-size: 0.875rem; color: var(--text-main);">' + window.ControlHub.utils.escapeHTML(task.title) + '</div>' +
              (task.description ? '<div style="font-size: 0.75rem; color: var(--text-dim); line-height: 1.4; max-height: 2.8em; overflow: hidden;">' + window.ControlHub.utils.escapeHTML(task.description) + '</div>' : '') +
              '<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.75rem;">' +
                (projName ? '<span style="color: var(--accent-primary);">📁 ' + window.ControlHub.utils.escapeHTML(projName) + '</span>' : '<span></span>') +
                '<div onclick="event.stopPropagation()">' +
                  '<select class="form-select" style="padding: 2px 6px; font-size: 0.75rem; width: auto;" onchange="window.ControlHub.tasks.changeStatus(\'' + task.id + '\', this.value)">' +
                    '<option value="bekliyor" ' + (task.status === 'bekliyor' ? 'selected' : '') + '>Bekliyor</option>' +
                    '<option value="devam-ediyor" ' + (task.status === 'devam-ediyor' ? 'selected' : '') + '>Devam Ediyor</option>' +
                    '<option value="tamamlandi" ' + (task.status === 'tamamlandi' ? 'selected' : '') + '>Tamamlandı</option>' +
                  '</select>' +
                '</div>' +
              '</div>' +
            '</div>';
        });
      }

      html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.ControlHub.tasks = {
    init: function() {
      // Event listeners for filters
      var statusSel = document.getElementById('task-filter-status');
      var prioritySel = document.getElementById('task-filter-priority');
      var projectSel = document.getElementById('task-filter-project');
      var sortSel = document.getElementById('task-sort-by');
      var searchInp = document.getElementById('task-search-input');
      var viewListBtn = document.getElementById('tasks-view-list-btn');
      var viewKanbanBtn = document.getElementById('tasks-view-kanban-btn');

      if (statusSel) statusSel.onchange = function() { filterStatus = this.value; renderTasks(); };
      if (prioritySel) prioritySel.onchange = function() { filterPriority = this.value; renderTasks(); };
      if (projectSel) projectSel.onchange = function() { filterProject = this.value; renderTasks(); };
      if (sortSel) sortSel.onchange = function() { sortBy = this.value; renderTasks(); };

      if (searchInp) {
        searchInp.oninput = window.ControlHub.utils.debounce(function() {
          searchQuery = searchInp.value;
          renderTasks();
        }, 200);
      }

      if (viewListBtn) {
        viewListBtn.onclick = function() {
          viewMode = 'list';
          viewListBtn.classList.add('active');
          if (viewKanbanBtn) viewKanbanBtn.classList.remove('active');
          renderTasks();
        };
      }

      if (viewKanbanBtn) {
        viewKanbanBtn.onclick = function() {
          viewMode = 'kanban';
          viewKanbanBtn.classList.add('active');
          if (viewListBtn) viewListBtn.classList.remove('active');
          renderTasks();
        };
      }

      window.ControlHub.state.subscribe(function() {
        renderTasks();
      });

      renderTasks();
    },

    render: function() {
      renderTasks();
    },

    toggleStatus: function(taskId) {
      var state = window.ControlHub.state.getState();
      var task = (state.tasks || []).find(function(t) { return t.id === taskId; });
      if (!task) return;

      var newStatus = task.status === 'tamamlandi' ? 'bekliyor' : 'tamamlandi';
      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      if (newStatus === 'tamamlandi') {
        task.completedDate = window.ControlHub.utils.getLocalISODate();
        window.ControlHub.notifications.success('Görev tamamlandı!');
      } else {
        delete task.completedDate;
      }
      window.ControlHub.state.save();
      window.ControlHub.state.notify('tasks');
    },

    changeStatus: function(taskId, newStatus) {
      var state = window.ControlHub.state.getState();
      var task = (state.tasks || []).find(function(t) { return t.id === taskId; });
      if (!task) return;

      task.status = newStatus;
      task.updatedAt = new Date().toISOString();
      if (newStatus === 'tamamlandi') {
        task.completedDate = window.ControlHub.utils.getLocalISODate();
      } else {
        delete task.completedDate;
      }
      window.ControlHub.state.save();
      window.ControlHub.state.notify('tasks');
    },

    deleteTask: function(taskId) {
      window.ControlHub.modal.confirm({
        title: 'Görevi Sil',
        message: 'Bu görevi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        confirmText: 'Sil',
        isDestructive: true,
        onConfirm: function() {
          var state = window.ControlHub.state.getState();
          state.tasks = (state.tasks || []).filter(function(t) { return t.id !== taskId; });
          window.ControlHub.state.save();
          window.ControlHub.state.notify('tasks');
          window.ControlHub.notifications.success('Görev başarıyla silindi.');
        }
      });
    },

    openModal: function(taskId, defaultStatus) {
      var state = window.ControlHub.state.getState();
      var task = taskId ? (state.tasks || []).find(function(t) { return t.id === taskId; }) : null;
      var isEdit = !!task;

      var projects = state.projects || [];
      var projectOptionsHtml = '<option value="">(Proje Yok)</option>';
      projects.forEach(function(p) {
        var selected = task && task.projectId === p.id ? 'selected' : '';
        projectOptionsHtml += '<option value="' + p.id + '" ' + selected + '>' + window.ControlHub.utils.escapeHTML(p.name) + '</option>';
      });

      var formHtml = 
        '<form id="task-modal-form" onsubmit="return false;">' +
          '<div class="form-group">' +
            '<label class="form-label" for="task-f-title">Görev Başlığı <span class="required">*</span></label>' +
            '<input type="text" id="task-f-title" class="form-input" placeholder="Örn: Rapor dokümantasyonunu hazırla" value="' + window.ControlHub.utils.escapeHTML(task ? task.title : '') + '" required>' +
            '<div class="form-error" id="err-task-title" style="display: none;"></div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="task-f-desc">Açıklama</label>' +
            '<textarea id="task-f-desc" class="form-textarea" rows="3" placeholder="Görevle ilgili ayrıntılar...">' + window.ControlHub.utils.escapeHTML(task ? task.description || '' : '') + '</textarea>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="task-f-status">Durum</label>' +
              '<select id="task-f-status" class="form-select">' +
                '<option value="bekliyor" ' + (task && task.status === 'bekliyor' || defaultStatus === 'bekliyor' ? 'selected' : '') + '>Bekliyor</option>' +
                '<option value="devam-ediyor" ' + (task && task.status === 'devam-ediyor' || defaultStatus === 'devam-ediyor' ? 'selected' : '') + '>Devam Ediyor</option>' +
                '<option value="tamamlandi" ' + (task && task.status === 'tamamlandi' || defaultStatus === 'tamamlandi' ? 'selected' : '') + '>Tamamlandı</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="task-f-priority">Öncelik</label>' +
              '<select id="task-f-priority" class="form-select">' +
                '<option value="dusuk" ' + (task && task.priority === 'dusuk' ? 'selected' : '') + '>Düşük</option>' +
                '<option value="normal" ' + (!task || task.priority === 'normal' ? 'selected' : '') + '>Normal</option>' +
                '<option value="yuksek" ' + (task && task.priority === 'yuksek' ? 'selected' : '') + '>Yüksek</option>' +
                '<option value="kritik" ' + (task && task.priority === 'kritik' ? 'selected' : '') + '>Kritik</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="task-f-project">İlişkili Proje</label>' +
              '<select id="task-f-project" class="form-select">' + projectOptionsHtml + '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="task-f-due">Bitiş Tarihi</label>' +
              '<input type="date" id="task-f-due" class="form-input" value="' + (task && task.dueDate ? task.dueDate : '') + '">' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="task-f-tags">Etiketler (Virgülle ayırın)</label>' +
            '<input type="text" id="task-f-tags" class="form-input" placeholder="Frontend, UI/UX, Bütçe" value="' + (task && task.tags ? task.tags.join(', ') : '') + '">' +
          '</div>' +
        '</form>';

      var footerHtml = 
        '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Vazgeç</button>' +
        '<button class="btn btn-primary" id="save-task-submit-btn">' + (isEdit ? 'Güncelle' : 'Oluştur') + '</button>';

      window.ControlHub.modal.open({
        title: isEdit ? 'Görevi Düzenle' : 'Yeni Görev Ekle',
        content: formHtml,
        footer: footerHtml,
        onOpen: function(modalEl) {
          var saveBtn = modalEl.querySelector('#save-task-submit-btn');
          if (saveBtn) {
            saveBtn.onclick = function() {
              var title = modalEl.querySelector('#task-f-title').value;
              var desc = modalEl.querySelector('#task-f-desc').value;
              var status = modalEl.querySelector('#task-f-status').value;
              var priority = modalEl.querySelector('#task-f-priority').value;
              var projectId = modalEl.querySelector('#task-f-project').value || null;
              var dueDate = modalEl.querySelector('#task-f-due').value || null;
              var tagsRaw = modalEl.querySelector('#task-f-tags').value || '';
              var tags = tagsRaw.split(',').map(function(t) { return t.trim(); }).filter(function(t) { return t.length > 0; });

              var validationResult = window.ControlHub.validation.validateTask({
                title: title,
                dueDate: dueDate
              });

              if (!validationResult.isValid) {
                var errEl = modalEl.querySelector('#err-task-title');
                if (errEl) {
                  errEl.textContent = validationResult.errors.title || validationResult.errors.dueDate;
                  errEl.style.display = 'flex';
                }
                modalEl.querySelector('#task-f-title').classList.add('is-invalid');
                return;
              }

              var now = new Date().toISOString();
              var st = window.ControlHub.state.getState();

              if (isEdit) {
                task.title = title.trim();
                task.description = desc.trim();
                task.status = status;
                task.priority = priority;
                task.projectId = projectId;
                task.dueDate = dueDate;
                task.tags = tags;
                task.updatedAt = now;
                if (status === 'tamamlandi' && !task.completedDate) {
                  task.completedDate = window.ControlHub.utils.getLocalISODate();
                } else if (status !== 'tamamlandi') {
                  delete task.completedDate;
                }
                window.ControlHub.notifications.success('Görev güncellendi.');
              } else {
                var newTask = {
                  id: window.ControlHub.utils.generateId('task'),
                  title: title.trim(),
                  description: desc.trim(),
                  status: status,
                  priority: priority,
                  projectId: projectId,
                  dueDate: dueDate,
                  tags: tags,
                  createdAt: now,
                  updatedAt: now
                };
                if (status === 'tamamlandi') {
                  newTask.completedDate = window.ControlHub.utils.getLocalISODate();
                }
                st.tasks = st.tasks || [];
                st.tasks.push(newTask);
                window.ControlHub.notifications.success('Yeni görev eklendi.');
              }

              window.ControlHub.state.save();
              window.ControlHub.state.notify('tasks');
              window.ControlHub.modal.close();
            };
          }
        }
      });
    }
  };
})();
