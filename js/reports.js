/**
 * ControlHub - Reports & Analytics Module (Pure SVG Visualizations, CSV Export with Formula Defense)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  function renderDonutChart(svgEl, segments) {
    var total = segments.reduce(function(acc, s) { return acc + s.value; }, 0);
    if (total === 0) {
      svgEl.innerHTML = '<text x="100" y="105" text-anchor="middle" fill="var(--text-dim)" font-size="12">Veri Yok</text>';
      return;
    }

    var radius = 70;
    var cx = 100;
    var cy = 100;
    var circumference = 2 * Math.PI * radius;
    var accumulatedOffset = 0;

    var pathsHtml = '';
    segments.forEach(function(seg) {
      if (seg.value <= 0) return;
      var strokeDash = (seg.value / total) * circumference;
      pathsHtml += 
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" ' +
        'fill="transparent" stroke="' + seg.color + '" stroke-width="24" ' +
        'stroke-dasharray="' + strokeDash + ' ' + (circumference - strokeDash) + '" ' +
        'stroke-dashoffset="' + (-accumulatedOffset) + '" ' +
        'transform="rotate(-90 ' + cx + ' ' + cy + ')">' +
        '<title>' + seg.label + ': ' + seg.value + ' (%' + Math.round((seg.value / total) * 100) + ')</title>' +
        '</circle>';
      accumulatedOffset += strokeDash;
    });

    pathsHtml += '<text x="100" y="96" text-anchor="middle" fill="var(--text-main)" font-size="20" font-weight="700">' + total + '</text>';
    pathsHtml += '<text x="100" y="114" text-anchor="middle" fill="var(--text-dim)" font-size="11">Toplam</text>';

    svgEl.innerHTML = pathsHtml;
  }

  function renderBarChart(svgEl, bars) {
    var maxVal = Math.max.apply(null, bars.map(function(b) { return b.value; }).concat([1]));
    var width = 360;
    var height = 160;
    var paddingBottom = 26;
    var chartHeight = height - paddingBottom;
    var barWidth = 28;
    var spacing = (width - (bars.length * barWidth)) / (bars.length + 1);

    var html = '';
    bars.forEach(function(b, idx) {
      var x = spacing + idx * (barWidth + spacing);
      var barH = maxVal > 0 ? (b.value / maxVal) * (chartHeight - 20) : 0;
      var y = chartHeight - barH;

      html += 
        '<rect x="' + x + '" y="' + y + '" width="' + barWidth + '" height="' + barH + '" rx="4" fill="' + (b.color || 'var(--accent-primary)') + '">' +
          '<title>' + b.label + ': ' + b.value + '</title>' +
        '</rect>' +
        '<text x="' + (x + barWidth / 2) + '" y="' + (y - 5) + '" text-anchor="middle" fill="var(--text-muted)" font-size="10" font-weight="600">' + (b.value > 0 ? b.value : '') + '</text>' +
        '<text x="' + (x + barWidth / 2) + '" y="' + (height - 6) + '" text-anchor="middle" fill="var(--text-dim)" font-size="10">' + b.label + '</text>';
    });

    svgEl.innerHTML = html;
  }

  function renderReports() {
    var state = window.ControlHub.state.getState();
    var tasks = state.tasks || [];
    var transactions = state.transactions || [];
    var habits = state.habits || [];
    var projects = state.projects || [];
    var currency = (state.settings && state.settings.currency) || '₺';

    // 1. Task Status Donut
    var completedTasks = tasks.filter(function(t) { return t.status === 'tamamlandi'; }).length;
    var inProgressTasks = tasks.filter(function(t) { return t.status === 'devam-ediyor'; }).length;
    var pendingTasks = tasks.filter(function(t) { return t.status === 'bekliyor'; }).length;

    var donutSvg = document.getElementById('report-tasks-donut-svg');
    if (donutSvg) {
      renderDonutChart(donutSvg, [
        { label: 'Tamamlandı', value: completedTasks, color: '#10b981' },
        { label: 'Devam Ediyor', value: inProgressTasks, color: '#3b82f6' },
        { label: 'Bekliyor', value: pendingTasks, color: '#f59e0b' }
      ]);
    }

    // Accessible text summary for screen readers
    var tasksSummaryEl = document.getElementById('report-tasks-summary-text');
    if (tasksSummaryEl) {
      tasksSummaryEl.textContent = 'Toplam ' + tasks.length + ' görevden ' + completedTasks + ' tanesi tamamlandı, ' + inProgressTasks + ' tanesi devam ediyor, ' + pendingTasks + ' tanesi beklemede.';
    }

    // 2. Weekly Activity Bar Chart (tasks completed in last 7 days)
    var barSvg = document.getElementById('report-weekly-bars-svg');
    if (barSvg) {
      var days = [];
      var dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      var today = new Date();

      for (var i = 6; i >= 0; i--) {
        var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
        var iso = window.ControlHub.utils.getLocalISODate(d);
        var count = tasks.filter(function(t) { return t.completedDate === iso; }).length;
        days.push({
          label: dayNames[d.getDay()],
          value: count,
          color: i === 0 ? 'var(--accent-primary)' : 'var(--border-focus)'
        });
      }
      renderBarChart(barSvg, days);
    }

    // 3. Expense Categories Breakdown
    var expContainer = document.getElementById('report-expense-categories-list');
    if (expContainer) {
      var expenseTxs = transactions.filter(function(t) { return t.type === 'gider'; });
      var catTotals = {};
      var totalExpense = 0;

      expenseTxs.forEach(function(tx) {
        var amt = parseFloat(tx.amount) || 0;
        catTotals[tx.category] = (catTotals[tx.category] || 0) + amt;
        totalExpense += amt;
      });

      var catEntries = Object.keys(catTotals).map(function(k) {
        return { category: k, amount: catTotals[k] };
      }).sort(function(a, b) { return b.amount - a.amount; });

      if (catEntries.length === 0) {
        expContainer.innerHTML = '<p style="color: var(--text-dim); font-size: 0.875rem;">Henüz gider kaydı bulunmuyor.</p>';
      } else {
        var html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
        catEntries.forEach(function(item) {
          var pct = totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0;
          html += 
            '<div>' +
              '<div style="display: flex; justify-content: space-between; font-size: 0.84375rem; margin-bottom: 4px;">' +
                '<span style="font-weight: 500;">' + window.ControlHub.utils.escapeHTML(item.category) + '</span>' +
                '<span class="tabular-nums" style="color: var(--text-muted);">' + window.ControlHub.utils.formatCurrency(item.amount, currency) + ' (%' + pct + ')</span>' +
              '</div>' +
              '<div class="progress-container">' +
                '<div class="progress-fill" style="width: ' + pct + '%; background-color: var(--accent-danger);"></div>' +
              '</div>' +
            '</div>';
        });
        html += '</div>';
        expContainer.innerHTML = html;
      }
    }
  }

  window.ControlHub.reports = {
    init: function() {
      var exportBtn = document.getElementById('export-tasks-csv-btn');
      if (exportBtn) {
        exportBtn.onclick = function() {
          window.ControlHub.reports.exportTasksCSV();
        };
      }

      window.ControlHub.state.subscribe(function() {
        renderReports();
      });

      renderReports();
    },

    render: function() {
      renderReports();
    },

    exportTasksCSV: function() {
      var state = window.ControlHub.state.getState();
      var tasks = state.tasks || [];
      var utils = window.ControlHub.utils;

      if (tasks.length === 0) {
        window.ControlHub.notifications.warning('Dışa aktarılacak görev bulunmuyor.');
        return;
      }

      var headers = ['ID', 'Baslik', 'Aciklama', 'Durum', 'Oncelik', 'ProjeID', 'BitisTarihi', 'OlusturulmaTarihi'];
      var csvRows = [headers.join(',')];

      tasks.forEach(function(t) {
        var row = [
          utils.sanitizeCSV(t.id),
          utils.sanitizeCSV(t.title),
          utils.sanitizeCSV(t.description || ''),
          utils.sanitizeCSV(t.status),
          utils.sanitizeCSV(t.priority),
          utils.sanitizeCSV(t.projectId || ''),
          utils.sanitizeCSV(t.dueDate || ''),
          utils.sanitizeCSV(t.createdAt || '')
        ];
        csvRows.push(row.join(','));
      });

      var csvContent = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel Turkish character support
      var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'controlhub-gorevler-' + utils.getLocalISODate() + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      window.ControlHub.notifications.success('Görevler CSV olarak indirildi.');
    }
  };
})();
