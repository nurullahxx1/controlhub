/**
 * ControlHub - Dashboard Module (KPI Synchronization, Time Greeting, Interactive Widgets)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  function getGreeting() {
    var hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Günaydın';
    if (hour >= 12 && hour < 18) return 'İyi günler';
    if (hour >= 18 && hour < 23) return 'İyi akşamlar';
    return 'İyi geceler';
  }

  function getFormattedLongDate() {
    var d = new Date();
    var months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    var days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear() + ', ' + days[d.getDay()];
  }

  function renderDashboard() {
    var state = window.ControlHub.state.getState();
    var tasks = state.tasks || [];
    var projects = state.projects || [];
    var habits = state.habits || [];
    var transactions = state.transactions || [];
    var notes = state.notes || [];
    var currency = (state.settings && state.settings.currency) || '₺';

    var todayStr = window.ControlHub.utils.getLocalISODate();

    // 1. Hero greeting & summary
    var dateEl = document.getElementById('dash-current-date');
    var greetingEl = document.getElementById('dash-greeting-text');
    var summaryEl = document.getElementById('dash-summary-text');

    if (dateEl) dateEl.textContent = getFormattedLongDate();
    if (greetingEl) greetingEl.textContent = getGreeting() + '!';

    var activeTasks = tasks.filter(function(t) { return t.status !== 'tamamlandi'; });
    var completedTasks = tasks.filter(function(t) { return t.status === 'tamamlandi'; });
    var pendingTasks = tasks.filter(function(t) { return t.status === 'bekliyor'; });
    var inProgressTasks = tasks.filter(function(t) { return t.status === 'devam-ediyor'; });
    var overdueTasks = tasks.filter(function(t) {
      return t.status !== 'tamamlandi' && t.dueDate && t.dueDate < todayStr;
    });

    var activeProjects = projects.filter(function(p) { return p.status === 'aktif'; });
    var activeHabits = habits.filter(function(h) { return h.isActive !== false; });
    var completedHabitsToday = activeHabits.filter(function(h) {
      return (h.completionHistory || []).indexOf(todayStr) !== -1;
    });
    var habitRate = activeHabits.length > 0 ? Math.round((completedHabitsToday.length / activeHabits.length) * 100) : 0;

    if (summaryEl) {
      if (activeTasks.length === 0 && activeProjects.length === 0) {
        summaryEl.textContent = 'Çalışma alanınız hazır. Yeni görevler, projeler ve alışkanlıklar ekleyerek başlayabilirsiniz.';
      } else {
        var summaryMsg = 'Bugün ' + activeTasks.length + ' aktif göreviniz';
        if (overdueTasks.length > 0) {
          summaryMsg += ' (' + overdueTasks.length + ' tanesi gecikmiş)';
        }
        summaryMsg += ' ve ' + activeProjects.length + ' devam eden projeniz bulunuyor.';
        summaryEl.textContent = summaryMsg;
      }
    }

    // 2. KPI Cards
    var statActive = document.getElementById('stat-active-tasks');
    var statCompleted = document.getElementById('stat-completed-tasks');
    var statPending = document.getElementById('stat-pending-tasks');
    var statOverdue = document.getElementById('stat-overdue-tasks');
    var statProjects = document.getElementById('stat-active-projects');
    var statHabits = document.getElementById('stat-habit-rate');

    if (statActive) statActive.textContent = activeTasks.length;
    if (statCompleted) statCompleted.textContent = completedTasks.length;
    if (statPending) statPending.textContent = pendingTasks.length;
    if (statOverdue) {
      statOverdue.textContent = overdueTasks.length;
      statOverdue.style.color = overdueTasks.length > 0 ? 'var(--accent-danger)' : 'var(--text-main)';
    }
    if (statProjects) statProjects.textContent = activeProjects.length;
    if (statHabits) statHabits.textContent = '%' + habitRate;

    // 3. Upcoming Tasks widget
    var upcomingList = document.getElementById('dash-upcoming-tasks-list');
    if (upcomingList) {
      var upcoming = tasks.filter(function(t) { return t.status !== 'tamamlandi'; })
        .sort(function(a, b) {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        })
        .slice(0, 5);

      if (upcoming.length === 0) {
        upcomingList.innerHTML = 
          '<div style="padding: 16px 0; text-align: center;">' +
            '<p style="color: var(--text-dim); font-size: 0.84375rem; margin-bottom: 8px;">Bekleyen veya yaklaşan görev bulunmuyor.</p>' +
            '<button class="btn btn-secondary btn-sm" onclick="window.ControlHub.tasks.openModal()">+ İlk Görevinizi Ekleyin</button>' +
          '</div>';
      } else {
        var html = '';
        upcoming.forEach(function(t) {
          var isOverdue = t.dueDate && t.dueDate < todayStr;
          html += 
            '<div class="dash-task-item">' +
              '<div class="dash-checkbox" onclick="window.ControlHub.tasks.toggleStatus(\'' + t.id + '\')" role="button" aria-label="Görevi tamamla" tabindex="0"></div>' +
              '<div style="flex: 1; min-width: 0;">' +
                '<div class="dash-task-title">' + window.ControlHub.utils.escapeHTML(t.title) + '</div>' +
                '<div class="dash-task-meta">' +
                  '<span style="' + (isOverdue ? 'color: var(--accent-danger); font-weight: 600;' : '') + '">📅 ' + (t.dueDate ? window.ControlHub.utils.getRelativeDateLabel(t.dueDate) : 'Tarih yok') + '</span>' +
                '</div>' +
              '</div>' +
            '</div>';
        });
        upcomingList.innerHTML = html;
      }
    }

    // 4. Project Progress overview widget
    var projList = document.getElementById('dash-projects-progress-list');
    if (projList) {
      var topProjects = projects.slice(0, 4);
      if (topProjects.length === 0) {
        projList.innerHTML = 
          '<div style="padding: 16px 0; text-align: center;">' +
            '<p style="color: var(--text-dim); font-size: 0.84375rem; margin-bottom: 8px;">Henüz proje tanımlanmamış.</p>' +
            '<button class="btn btn-secondary btn-sm" onclick="window.ControlHub.projects.openModal()">+ İlk Projenizi Oluşturun</button>' +
          '</div>';
      } else {
        var pHtml = '';
        topProjects.forEach(function(p) {
          var metrics = window.ControlHub.projects.getMetrics(p.id);
          pHtml += 
            '<div class="dash-project-item">' +
              '<div class="dash-project-info">' +
                '<div class="dash-project-name">' +
                  '<span class="project-color-dot" style="background-color: ' + (p.color || '#3b82f6') + ';"></span>' +
                  '<span>' + window.ControlHub.utils.escapeHTML(p.name) + '</span>' +
                '</div>' +
                '<span class="dash-project-percent">%' + metrics.percentage + ' (' + metrics.completed + '/' + metrics.total + ')</span>' +
              '</div>' +
              '<div class="progress-container">' +
                '<div class="progress-fill ' + (metrics.percentage === 100 ? 'success' : '') + '" style="width: ' + metrics.percentage + '%;"></div>' +
              '</div>' +
            '</div>';
        });
        projList.innerHTML = pHtml;
      }
    }

    // 5. Today's Habits widget
    var habitsList = document.getElementById('dash-habits-today-list');
    if (habitsList) {
      if (activeHabits.length === 0) {
        habitsList.innerHTML = 
          '<div style="padding: 16px 0; text-align: center;">' +
            '<p style="color: var(--text-dim); font-size: 0.84375rem; margin-bottom: 8px;">Henüz aktif alışkanlık eklenmemiş.</p>' +
            '<button class="btn btn-secondary btn-sm" onclick="window.ControlHub.habits.openModal()">+ İlk Alışkanlığınızı Ekleyin</button>' +
          '</div>';
      } else {
        var hHtml = '';
        activeHabits.slice(0, 4).forEach(function(h) {
          var isDone = (h.completionHistory || []).indexOf(todayStr) !== -1;
          var streak = window.ControlHub.habits.getStreak(h.completionHistory);
          hHtml += 
            '<div class="dash-habit-row">' +
              '<div class="dash-habit-left">' +
                '<div class="dash-checkbox ' + (isDone ? 'checked' : '') + '" onclick="window.ControlHub.habits.toggleDay(\'' + h.id + '\', \'' + todayStr + '\')" role="button" aria-label="Alışkanlığı işaretle" tabindex="0">' +
                  (isDone ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '') +
                '</div>' +
                '<span class="dash-habit-name" style="' + (isDone ? 'text-decoration: line-through; color: var(--text-dim);' : '') + '">' + window.ControlHub.utils.escapeHTML(h.title) + '</span>' +
              '</div>' +
              '<span class="dash-habit-streak">🔥 ' + streak + '</span>' +
            '</div>';
        });
        habitsList.innerHTML = hHtml;
      }
    }

    // 6. Recent Transactions widget
    var txList = document.getElementById('dash-recent-transactions-list');
    if (txList) {
      var recentTxs = transactions.slice(-4).reverse();
      if (recentTxs.length === 0) {
        txList.innerHTML = 
          '<div style="padding: 16px 0; text-align: center;">' +
            '<p style="color: var(--text-dim); font-size: 0.84375rem; margin-bottom: 8px;">Henüz finans hareketi kaydedilmemiş.</p>' +
            '<button class="btn btn-secondary btn-sm" onclick="window.ControlHub.finance.openModal()">+ İlk İşlemi Ekleyin</button>' +
          '</div>';
      } else {
        var tHtml = '<div style="display: flex; flex-direction: column; gap: 8px;">';
        recentTxs.forEach(function(tx) {
          var isInc = tx.type === 'gelir';
          tHtml += 
            '<div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-subtle); font-size: 0.84375rem;">' +
              '<div>' +
                '<div style="font-weight: 500; color: var(--text-main);">' + window.ControlHub.utils.escapeHTML(tx.category) + '</div>' +
                '<div style="font-size: 0.75rem; color: var(--text-dim);">' + window.ControlHub.utils.formatDate(tx.transactionDate) + '</div>' +
              '</div>' +
              '<div class="tabular-nums ' + (isInc ? 'amount-income' : 'amount-expense') + '">' +
                (isInc ? '+' : '-') + window.ControlHub.utils.formatCurrency(tx.amount, currency) +
              '</div>' +
            '</div>';
        });
        tHtml += '</div>';
        txList.innerHTML = tHtml;
      }
    }
  }

  window.ControlHub.dashboard = {
    init: function() {
      window.ControlHub.state.subscribe(function() {
        renderDashboard();
      });
      renderDashboard();
    },

    render: function() {
      renderDashboard();
    }
  };
})();
