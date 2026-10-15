/**
 * ControlHub - Projects Module (CRUD, Real Progress Calculation, Linked Tasks, Safe Delete)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var filterStatus = 'all';

  function calculateProjectMetrics(projectId) {
    var state = window.ControlHub.state.getState();
    var tasks = (state.tasks || []).filter(function(t) { return t.projectId === projectId; });
    var total = tasks.length;
    var completed = tasks.filter(function(t) { return t.status === 'tamamlandi'; }).length;
    var percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total: total,
      completed: completed,
      pending: total - completed,
      percentage: percentage,
      tasks: tasks
    };
  }

  function renderProjects() {
    var state = window.ControlHub.state.getState();
    var projects = state.projects || [];
    var container = document.getElementById('projects-view-content');
    if (!container) return;

    var filtered = projects.filter(function(p) {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = 
        '<div class="empty-state">' +
          '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' +
          '<h3 class="empty-state-title">Proje Bulunamadı</h3>' +
          '<p class="empty-state-desc">Henüz eklenmiş bir proje bulunmuyor. Görevlerinizi gruplamak ve ilerlemenizi ölçmek için proje oluşturun.</p>' +
          '<button class="btn btn-primary" onclick="window.ControlHub.projects.openModal()">+ Yeni Proje Oluştur</button>' +
        '</div>';
      return;
    }

    var html = '<div class="projects-grid">';
    filtered.forEach(function(proj) {
      var metrics = calculateProjectMetrics(proj.id);
      var statusObj = window.ControlHub.config.projectStatuses.find(function(s) { return s.id === proj.status; }) || { label: proj.status, badgeClass: 'badge-in-progress' };

      html += 
        '<div class="project-card">' +
          '<div class="project-card-header">' +
            '<div class="project-title-group">' +
              '<span class="project-color-dot" style="background-color: ' + (proj.color || '#3b82f6') + ';"></span>' +
              '<h3 style="font-size: 1.125rem;">' + window.ControlHub.utils.escapeHTML(proj.name) + '</h3>' +
            '</div>' +
            '<span class="badge ' + statusObj.badgeClass + '">' + statusObj.label + '</span>' +
          '</div>' +
          '<div class="project-desc">' + window.ControlHub.utils.escapeHTML(proj.description || 'Açıklama belirtilmemiş.') + '</div>' +
          '<div class="project-progress-block">' +
            '<div class="project-progress-labels">' +
              '<span>İlerleme: %' + metrics.percentage + '</span>' +
              '<span>' + metrics.completed + ' / ' + metrics.total + ' Görev</span>' +
            '</div>' +
            '<div class="progress-container">' +
              '<div class="progress-fill ' + (metrics.percentage === 100 ? 'success' : '') + '" style="width: ' + metrics.percentage + '%;"></div>' +
            '</div>' +
          '</div>' +
          '<div class="project-card-footer">' +
            '<span>📅 ' + (proj.startDate ? window.ControlHub.utils.formatDate(proj.startDate) : '') + (proj.endDate ? ' - ' + window.ControlHub.utils.formatDate(proj.endDate) : '') + '</span>' +
            '<div style="display: flex; gap: 4px;">' +
              '<button class="btn-icon" onclick="window.ControlHub.projects.showDetail(\'' + proj.id + '\')" title="Detaylar & Bağlı Görevler" aria-label="Detaylar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>' +
              '</button>' +
              '<button class="btn-icon" onclick="window.ControlHub.projects.openModal(\'' + proj.id + '\')" title="Düzenle" aria-label="Düzenle">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '</button>' +
              '<button class="btn-icon" onclick="window.ControlHub.projects.deleteProject(\'' + proj.id + '\')" title="Sil" aria-label="Sil" style="color: var(--accent-danger);">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.ControlHub.projects = {
    init: function() {
      var filterSel = document.getElementById('project-filter-status');
      if (filterSel) {
        filterSel.onchange = function() {
          filterStatus = this.value;
          renderProjects();
        };
      }

      window.ControlHub.state.subscribe(function() {
        renderProjects();
      });

      renderProjects();
    },

    render: function() {
      renderProjects();
    },

    getMetrics: calculateProjectMetrics,

    showDetail: function(projectId) {
      var state = window.ControlHub.state.getState();
      var project = (state.projects || []).find(function(p) { return p.id === projectId; });
      if (!project) return;

      var metrics = calculateProjectMetrics(projectId);

      var tasksListHtml = '';
      if (metrics.tasks.length === 0) {
        tasksListHtml = '<p style="color: var(--text-dim); font-size: 0.875rem;">Bu projeye henüz bağlı görev bulunmuyor.</p>';
      } else {
        tasksListHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        metrics.tasks.forEach(function(t) {
          var isDone = t.status === 'tamamlandi';
          tasksListHtml += 
            '<div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-card-subtle); border-radius: var(--radius-md); font-size: 0.875rem;">' +
              '<span style="' + (isDone ? 'text-decoration: line-through; color: var(--text-dim);' : 'color: var(--text-main); font-weight: 500;') + '">' + window.ControlHub.utils.escapeHTML(t.title) + '</span>' +
              '<span class="badge ' + (isDone ? 'badge-completed' : 'badge-pending') + '">' + (isDone ? 'Tamamlandı' : 'Bekliyor') + '</span>' +
            '</div>';
        });
        tasksListHtml += '</div>';
      }

      var contentHtml = 
        '<div style="display: flex; flex-direction: column; gap: 16px;">' +
          '<div>' +
            '<p style="color: var(--text-muted); font-size: 0.9375rem; margin-bottom: 8px;">' + window.ControlHub.utils.escapeHTML(project.description || '') + '</p>' +
            '<div style="display: flex; gap: 16px; font-size: 0.8125rem; color: var(--text-dim);">' +
              '<span>Başlangıç: ' + (project.startDate ? window.ControlHub.utils.formatDate(project.startDate) : '-') + '</span>' +
              '<span>Bitiş: ' + (project.endDate ? window.ControlHub.utils.formatDate(project.endDate) : '-') + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="project-progress-block">' +
            '<div class="project-progress-labels">' +
              '<span>Genel İlerleme (%' + metrics.percentage + ')</span>' +
              '<span>' + metrics.completed + ' / ' + metrics.total + ' Görev</span>' +
            '</div>' +
            '<div class="progress-container">' +
              '<div class="progress-fill ' + (metrics.percentage === 100 ? 'success' : '') + '" style="width: ' + metrics.percentage + '%;"></div>' +
            '</div>' +
          '</div>' +
          '<div>' +
            '<h4 style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 8px;">Bağlı Görevler</h4>' +
            tasksListHtml +
          '</div>' +
        '</div>';

      window.ControlHub.modal.open({
        title: project.name,
        content: contentHtml,
        footer: '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Kapat</button>'
      });
    },

    deleteProject: function(projectId) {
      var state = window.ControlHub.state.getState();
      var project = (state.projects || []).find(function(p) { return p.id === projectId; });
      if (!project) return;

      var linkedTasks = (state.tasks || []).filter(function(t) { return t.projectId === projectId; });

      var msg = 'Bu projeyi silmek istediğinizden emin misiniz?';
      if (linkedTasks.length > 0) {
        msg += ' Bu projeye bağlı ' + linkedTasks.length + ' adet görev bulunmaktadır. Görevler silinmeyecek, ilişkisiz (bağımsız) görev olarak korunacaktır.';
      }

      window.ControlHub.modal.confirm({
        title: 'Projeyi Sil',
        message: msg,
        confirmText: 'Projeyi Sil',
        isDestructive: true,
        onConfirm: function() {
          var st = window.ControlHub.state.getState();
          st.projects = (st.projects || []).filter(function(p) { return p.id !== projectId; });
          
          // Unlink linked tasks safely without silent data loss
          (st.tasks || []).forEach(function(t) {
            if (t.projectId === projectId) {
              t.projectId = null;
            }
          });

          window.ControlHub.state.save();
          window.ControlHub.state.notify('projects');
          window.ControlHub.notifications.success('Proje silindi (bağlı görevler korundu).');
        }
      });
    },

    openModal: function(projectId) {
      var state = window.ControlHub.state.getState();
      var project = projectId ? (state.projects || []).find(function(p) { return p.id === projectId; }) : null;
      var isEdit = !!project;

      var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      var colorRadiosHtml = '<div style="display: flex; gap: 8px; margin-top: 4px;">';
      colors.forEach(function(c) {
        var checked = (project && project.color === c) || (!project && c === '#3b82f6') ? 'checked' : '';
        colorRadiosHtml += 
          '<label style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: ' + c + ';">' +
            '<input type="radio" name="project-f-color" value="' + c + '" ' + checked + ' style="opacity: 0; width: 0; height: 0;">' +
          '</label>';
      });
      colorRadiosHtml += '</div>';

      var formHtml = 
        '<form id="project-modal-form" onsubmit="return false;">' +
          '<div class="form-group">' +
            '<label class="form-label" for="proj-f-name">Proje Adı <span class="required">*</span></label>' +
            '<input type="text" id="proj-f-name" class="form-input" placeholder="Örn: Yeni Web Sitesi Tasarımı" value="' + window.ControlHub.utils.escapeHTML(project ? project.name : '') + '" required>' +
            '<div class="form-error" id="err-proj-name" style="display: none;"></div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="proj-f-desc">Açıklama</label>' +
            '<textarea id="proj-f-desc" class="form-textarea" rows="3" placeholder="Projenin amacı, kapsamı ve hedefleri...">' + window.ControlHub.utils.escapeHTML(project ? project.description || '' : '') + '</textarea>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="proj-f-status">Durum</label>' +
              '<select id="proj-f-status" class="form-select">' +
                '<option value="aktif" ' + (!project || project.status === 'aktif' ? 'selected' : '') + '>Aktif</option>' +
                '<option value="beklemede" ' + (project && project.status === 'beklemede' ? 'selected' : '') + '>Beklemede</option>' +
                '<option value="tamamlandi" ' + (project && project.status === 'tamamlandi' ? 'selected' : '') + '>Tamamlandı</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Renk Vurgusu</label>' +
              colorRadiosHtml +
            '</div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="proj-f-start">Başlangıç Tarihi</label>' +
              '<input type="date" id="proj-f-start" class="form-input" value="' + (project && project.startDate ? project.startDate : '') + '">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="proj-f-end">Bitiş Tarihi</label>' +
              '<input type="date" id="proj-f-end" class="form-input" value="' + (project && project.endDate ? project.endDate : '') + '">' +
            '</div>' +
          '</div>' +
        '</form>';

      var footerHtml = 
        '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Vazgeç</button>' +
        '<button class="btn btn-primary" id="save-proj-submit-btn">' + (isEdit ? 'Güncelle' : 'Oluştur') + '</button>';

      window.ControlHub.modal.open({
        title: isEdit ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur',
        content: formHtml,
        footer: footerHtml,
        onOpen: function(modalEl) {
          var saveBtn = modalEl.querySelector('#save-proj-submit-btn');
          if (saveBtn) {
            saveBtn.onclick = function() {
              var name = modalEl.querySelector('#proj-f-name').value;
              var desc = modalEl.querySelector('#proj-f-desc').value;
              var status = modalEl.querySelector('#proj-f-status').value;
              var startDate = modalEl.querySelector('#proj-f-start').value || null;
              var endDate = modalEl.querySelector('#proj-f-end').value || null;
              var selectedColorEl = modalEl.querySelector('input[name="project-f-color"]:checked');
              var color = selectedColorEl ? selectedColorEl.value : '#3b82f6';

              var validationResult = window.ControlHub.validation.validateProject({
                name: name,
                startDate: startDate,
                endDate: endDate
              });

              if (!validationResult.isValid) {
                var errEl = modalEl.querySelector('#err-proj-name');
                if (errEl) {
                  errEl.textContent = validationResult.errors.name || validationResult.errors.endDate;
                  errEl.style.display = 'flex';
                }
                modalEl.querySelector('#proj-f-name').classList.add('is-invalid');
                return;
              }

              var now = new Date().toISOString();
              var st = window.ControlHub.state.getState();

              if (isEdit) {
                project.name = name.trim();
                project.description = desc.trim();
                project.status = status;
                project.color = color;
                project.startDate = startDate;
                project.endDate = endDate;
                window.ControlHub.notifications.success('Proje güncellendi.');
              } else {
                var newProj = {
                  id: window.ControlHub.utils.generateId('proj'),
                  name: name.trim(),
                  description: desc.trim(),
                  status: status,
                  color: color,
                  startDate: startDate,
                  endDate: endDate,
                  createdAt: now
                };
                st.projects = st.projects || [];
                st.projects.push(newProj);
                window.ControlHub.notifications.success('Yeni proje oluşturuldu.');
              }

              window.ControlHub.state.save();
              window.ControlHub.state.notify('projects');
              window.ControlHub.modal.close();
            };
          }
        }
      });
    }
  };
})();
