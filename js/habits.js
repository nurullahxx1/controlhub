/**
 * ControlHub - Habits Module (CRUD, 7-Day Matrix, Robust Local Date Streak Calculation)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  /**
   * Get array of the last 7 days starting from 6 days ago up to today
   */
  function getLast7Days() {
    var days = [];
    var today = new Date();
    var dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

    for (var i = 6; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      var iso = window.ControlHub.utils.getLocalISODate(d);
      days.push({
        iso: iso,
        label: dayLabels[d.getDay()],
        dayNum: d.getDate(),
        isToday: i === 0
      });
    }
    return days;
  }

  /**
   * Calculate consecutive day streak for a habit
   * Looks at today or yesterday to see if current streak is intact
   */
  function calculateStreak(completionHistory) {
    if (!completionHistory || !completionHistory.length) return 0;

    var set = {};
    completionHistory.forEach(function(d) { set[d] = true; });

    var todayStr = window.ControlHub.utils.getLocalISODate();
    var checkDate = new Date();
    var streak = 0;

    // Check if done today; if not, check if done yesterday
    var isDoneToday = !!set[todayStr];
    if (!isDoneToday) {
      checkDate.setDate(checkDate.getDate() - 1);
      var yesterdayStr = window.ControlHub.utils.getLocalISODate(checkDate);
      if (!set[yesterdayStr]) {
        return 0; // Streak broken
      }
    }

    // Count backwards day by day
    while (true) {
      var dateKey = window.ControlHub.utils.getLocalISODate(checkDate);
      if (set[dateKey]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  function renderHabits() {
    var state = window.ControlHub.state.getState();
    var habits = state.habits || [];
    var container = document.getElementById('habits-view-content');
    if (!container) return;

    var last7Days = getLast7Days();
    var todayStr = window.ControlHub.utils.getLocalISODate();

    // Calculate today's completion rate
    var activeHabits = habits.filter(function(h) { return h.isActive !== false; });
    var completedTodayCount = activeHabits.filter(function(h) {
      return (h.completionHistory || []).indexOf(todayStr) !== -1;
    }).length;
    var ratePercent = activeHabits.length > 0 ? Math.round((completedTodayCount / activeHabits.length) * 100) : 0;

    var rateHeader = document.getElementById('habits-rate-badge');
    if (rateHeader) {
      rateHeader.textContent = 'Bugün: ' + completedTodayCount + ' / ' + activeHabits.length + ' (%' + ratePercent + ')';
    }

    if (habits.length === 0) {
      container.innerHTML = 
        '<div class="empty-state">' +
          '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
          '<h3 class="empty-state-title">Alışkanlık Bulunamadı</h3>' +
          '<p class="empty-state-desc">Günlük rutinlerinizi ve hedeflerinizi takip etmek için bir alışkanlık oluşturun.</p>' +
          '<button class="btn btn-primary" onclick="window.ControlHub.habits.openModal()">+ Yeni Alışkanlık Ekle</button>' +
        '</div>';
      return;
    }

    var html = '<div class="habits-container">';
    habits.forEach(function(habit) {
      var streak = calculateStreak(habit.completionHistory);
      var historySet = {};
      (habit.completionHistory || []).forEach(function(d) { historySet[d] = true; });

      var daysHtml = '<div class="habit-days-grid">';
      last7Days.forEach(function(day) {
        var isDone = !!historySet[day.iso];
        daysHtml += 
          '<div class="habit-day-col">' +
            '<span class="habit-day-label" style="' + (day.isToday ? 'color: var(--accent-primary); font-weight: 700;' : '') + '">' + day.label + '</span>' +
            '<div class="habit-day-circle ' + (isDone ? 'done' : '') + '" onclick="window.ControlHub.habits.toggleDay(\'' + habit.id + '\', \'' + day.iso + '\')" title="' + day.iso + (isDone ? ' (Tamamlandı)' : ' (İşaretle)') + '" role="button" tabindex="0">' +
              (isDone ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '') +
            '</div>' +
          '</div>';
      });
      daysHtml += '</div>';

      html += 
        '<div class="habit-card ' + (habit.isActive === false ? 'style="opacity: 0.6;"' : '') + '">' +
          '<div class="habit-left">' +
            '<span style="width: 12px; height: 12px; border-radius: 50%; background: ' + (habit.color || '#3b82f6') + '; flex-shrink: 0;"></span>' +
            '<div class="habit-title-box">' +
              '<div class="habit-name">' + window.ControlHub.utils.escapeHTML(habit.title) + '</div>' +
              '<div class="habit-desc">' + window.ControlHub.utils.escapeHTML(habit.description || habit.frequency || 'Her gün') + '</div>' +
            '</div>' +
          '</div>' +
          daysHtml +
          '<div class="habit-streak-display">' +
            '<span title="Ardışık gün serisi">🔥</span>' +
            '<span class="streak-count">' + streak + '</span>' +
            '<span style="font-size: 0.75rem; color: var(--text-dim);">gün</span>' +
          '</div>' +
          '<div style="display: flex; gap: 4px;">' +
            '<button class="btn-icon" onclick="window.ControlHub.habits.openModal(\'' + habit.id + '\')" title="Düzenle">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
            '</button>' +
            '<button class="btn-icon" onclick="window.ControlHub.habits.deleteHabit(\'' + habit.id + '\')" title="Sil" style="color: var(--accent-danger);">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
            '</button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.ControlHub.habits = {
    init: function() {
      window.ControlHub.state.subscribe(function() {
        renderHabits();
      });
      renderHabits();
    },

    render: function() {
      renderHabits();
    },

    getStreak: calculateStreak,

    toggleDay: function(habitId, dateStr) {
      var state = window.ControlHub.state.getState();
      var habit = (state.habits || []).find(function(h) { return h.id === habitId; });
      if (!habit) return;

      habit.completionHistory = habit.completionHistory || [];
      var index = habit.completionHistory.indexOf(dateStr);

      if (index !== -1) {
        habit.completionHistory.splice(index, 1);
      } else {
        habit.completionHistory.push(dateStr);
        window.ControlHub.notifications.success('Alışkanlık tamamlandı! Seriye devam.', 2000);
      }

      window.ControlHub.state.save();
      window.ControlHub.state.notify('habits');
    },

    deleteHabit: function(habitId) {
      window.ControlHub.modal.confirm({
        title: 'Alışkanlığı Sil',
        message: 'Bu alışkanlığı ve tüm geçmiş kayıtlarını silmek istediğinizden emin misiniz?',
        confirmText: 'Sil',
        isDestructive: true,
        onConfirm: function() {
          var state = window.ControlHub.state.getState();
          state.habits = (state.habits || []).filter(function(h) { return h.id !== habitId; });
          window.ControlHub.state.save();
          window.ControlHub.state.notify('habits');
          window.ControlHub.notifications.success('Alışkanlık silindi.');
        }
      });
    },

    openModal: function(habitId) {
      var state = window.ControlHub.state.getState();
      var habit = habitId ? (state.habits || []).find(function(h) { return h.id === habitId; }) : null;
      var isEdit = !!habit;

      var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      var colorRadiosHtml = '<div style="display: flex; gap: 8px; margin-top: 4px;">';
      colors.forEach(function(c) {
        var checked = (habit && habit.color === c) || (!habit && c === '#3b82f6') ? 'checked' : '';
        colorRadiosHtml += 
          '<label style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: ' + c + ';">' +
            '<input type="radio" name="habit-f-color" value="' + c + '" ' + checked + ' style="opacity: 0; width: 0; height: 0;">' +
          '</label>';
      });
      colorRadiosHtml += '</div>';

      var formHtml = 
        '<form id="habit-modal-form" onsubmit="return false;">' +
          '<div class="form-group">' +
            '<label class="form-label" for="habit-f-title">Alışkanlık Adı <span class="required">*</span></label>' +
            '<input type="text" id="habit-f-title" class="form-input" placeholder="Örn: Günde 20 sayfa kitap oku" value="' + window.ControlHub.utils.escapeHTML(habit ? habit.title : '') + '" required>' +
            '<div class="form-error" id="err-habit-title" style="display: none;"></div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="habit-f-desc">Açıklama / Hedef</label>' +
            '<input type="text" id="habit-f-desc" class="form-input" placeholder="Zihinsel gelişim ve odaklanma için..." value="' + window.ControlHub.utils.escapeHTML(habit ? habit.description || '' : '') + '">' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="habit-f-freq">Hedef Sıklığı</label>' +
              '<select id="habit-f-freq" class="form-select">' +
                '<option value="Her gün" ' + (!habit || habit.frequency === 'Her gün' ? 'selected' : '') + '>Her gün</option>' +
                '<option value="Hafta içi" ' + (habit && habit.frequency === 'Hafta içi' ? 'selected' : '') + '>Hafta içi</option>' +
                '<option value="Haftada 3 gün" ' + (habit && habit.frequency === 'Haftada 3 gün' ? 'selected' : '') + '>Haftada 3 gün</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label">Renk</label>' +
              colorRadiosHtml +
            '</div>' +
          '</div>' +
        '</form>';

      var footerHtml = 
        '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Vazgeç</button>' +
        '<button class="btn btn-primary" id="save-habit-submit-btn">' + (isEdit ? 'Güncelle' : 'Oluştur') + '</button>';

      window.ControlHub.modal.open({
        title: isEdit ? 'Alışkanlığı Düzenle' : 'Yeni Alışkanlık Ekle',
        content: formHtml,
        footer: footerHtml,
        onOpen: function(modalEl) {
          var saveBtn = modalEl.querySelector('#save-habit-submit-btn');
          if (saveBtn) {
            saveBtn.onclick = function() {
              var title = modalEl.querySelector('#habit-f-title').value;
              var desc = modalEl.querySelector('#habit-f-desc').value;
              var freq = modalEl.querySelector('#habit-f-freq').value;
              var selectedColorEl = modalEl.querySelector('input[name="habit-f-color"]:checked');
              var color = selectedColorEl ? selectedColorEl.value : '#3b82f6';

              var valResult = window.ControlHub.validation.validateHabit({ title: title });
              if (!valResult.isValid) {
                var errEl = modalEl.querySelector('#err-habit-title');
                if (errEl) {
                  errEl.textContent = valResult.errors.title;
                  errEl.style.display = 'flex';
                }
                modalEl.querySelector('#habit-f-title').classList.add('is-invalid');
                return;
              }

              var now = new Date().toISOString();
              var st = window.ControlHub.state.getState();

              if (isEdit) {
                habit.title = title.trim();
                habit.description = desc.trim();
                habit.frequency = freq;
                habit.color = color;
                window.ControlHub.notifications.success('Alışkanlık güncellendi.');
              } else {
                var newHabit = {
                  id: window.ControlHub.utils.generateId('habit'),
                  title: title.trim(),
                  description: desc.trim(),
                  frequency: freq,
                  color: color,
                  isActive: true,
                  completionHistory: [],
                  createdAt: now
                };
                st.habits = st.habits || [];
                st.habits.push(newHabit);
                window.ControlHub.notifications.success('Yeni alışkanlık eklendi.');
              }

              window.ControlHub.state.save();
              window.ControlHub.state.notify('habits');
              window.ControlHub.modal.close();
            };
          }
        }
      });
    }
  };
})();
