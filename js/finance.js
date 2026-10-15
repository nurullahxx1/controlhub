/**
 * ControlHub - Finance & Budget Module (Income/Expense CRUD, Accurate Floating Math, Category Filters)
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var filterType = 'all';
  var filterCategory = 'all';
  var startDateFilter = '';
  var endDateFilter = '';

  function calculateFinanceTotals(transactions) {
    var totalIncomeCents = 0;
    var totalExpenseCents = 0;

    transactions.forEach(function(tx) {
      var cents = Math.round((parseFloat(tx.amount) || 0) * 100);
      if (tx.type === 'gelir') {
        totalIncomeCents += cents;
      } else {
        totalExpenseCents += cents;
      }
    });

    var netCents = totalIncomeCents - totalExpenseCents;

    return {
      income: totalIncomeCents / 100,
      expense: totalExpenseCents / 100,
      net: netCents / 100
    };
  }

  function renderFinance() {
    var state = window.ControlHub.state.getState();
    var transactions = state.transactions || [];
    var currency = (state.settings && state.settings.currency) || '₺';

    var container = document.getElementById('finance-view-content');
    if (!container) return;

    // Filter transactions
    var filtered = transactions.filter(function(tx) {
      if (filterType !== 'all' && tx.type !== filterType) return false;
      if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
      if (startDateFilter && tx.transactionDate < startDateFilter) return false;
      if (endDateFilter && tx.transactionDate > endDateFilter) return false;
      return true;
    });

    // Sort by transactionDate descending
    filtered.sort(function(a, b) {
      return new Date(b.transactionDate || 0) - new Date(a.transactionDate || 0);
    });

    // Calculate totals for currently filtered set and overall
    var totals = calculateFinanceTotals(filtered);

    // Update KPI strip in view
    var incEl = document.getElementById('finance-total-income');
    var expEl = document.getElementById('finance-total-expense');
    var netEl = document.getElementById('finance-total-net');

    if (incEl) incEl.textContent = window.ControlHub.utils.formatCurrency(totals.income, currency);
    if (expEl) expEl.textContent = window.ControlHub.utils.formatCurrency(totals.expense, currency);
    if (netEl) {
      netEl.textContent = window.ControlHub.utils.formatCurrency(totals.net, currency);
      netEl.style.color = totals.net >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';
    }

    if (filtered.length === 0) {
      container.innerHTML = 
        '<div class="empty-state">' +
          '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>' +
          '<h3 class="empty-state-title">İşlem Kaydı Bulunamadı</h3>' +
          '<p class="empty-state-desc">Seçilen filtre kriterlerine uygun işlem kaydı bulunamadı. Gelir veya gider ekleyerek bütçenizi kontrol altına alın.</p>' +
          '<div style="display: flex; gap: 8px;">' +
            '<button class="btn btn-primary" onclick="window.ControlHub.finance.openModal(null, \'gelir\')">+ Gelir Ekle</button>' +
            '<button class="btn btn-secondary" onclick="window.ControlHub.finance.openModal(null, \'gider\')">+ Gider Ekle</button>' +
          '</div>' +
        '</div>';
      return;
    }

    var html = 
      '<div class="table-responsive">' +
        '<table class="data-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Tarih</th>' +
              '<th>Tür</th>' +
              '<th>Kategori</th>' +
              '<th>Açıklama</th>' +
              '<th style="text-align: right;">Tutar</th>' +
              '<th style="text-align: right;">İşlemler</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>';

    filtered.forEach(function(tx) {
      var isIncome = tx.type === 'gelir';
      html += 
        '<tr>' +
          '<td>' + window.ControlHub.utils.formatDate(tx.transactionDate) + '</td>' +
          '<td>' +
            '<span class="badge ' + (isIncome ? 'badge-completed' : 'badge-priority-critical') + '">' +
              (isIncome ? 'Gelir' : 'Gider') +
            '</span>' +
          '</td>' +
          '<td><span style="font-weight: 500;">' + window.ControlHub.utils.escapeHTML(tx.category) + '</span></td>' +
          '<td class="text-muted">' + window.ControlHub.utils.escapeHTML(tx.description || '-') + '</td>' +
          '<td style="text-align: right;" class="tabular-nums ' + (isIncome ? 'amount-income' : 'amount-expense') + '">' +
            (isIncome ? '+ ' : '- ') + window.ControlHub.utils.formatCurrency(tx.amount, currency) +
          '</td>' +
          '<td style="text-align: right;">' +
            '<div style="display: inline-flex; gap: 4px;">' +
              '<button class="btn-icon" onclick="window.ControlHub.finance.openModal(\'' + tx.id + '\')" title="Düzenle">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>' +
              '</button>' +
              '<button class="btn-icon" onclick="window.ControlHub.finance.deleteTransaction(\'' + tx.id + '\')" title="Sil" style="color: var(--accent-danger);">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>' +
              '</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  window.ControlHub.finance = {
    init: function() {
      var typeSel = document.getElementById('finance-filter-type');
      var catSel = document.getElementById('finance-filter-category');
      var startInp = document.getElementById('finance-filter-start');
      var endInp = document.getElementById('finance-filter-end');

      if (typeSel) typeSel.onchange = function() { filterType = this.value; renderFinance(); };
      if (catSel) catSel.onchange = function() { filterCategory = this.value; renderFinance(); };
      if (startInp) startInp.onchange = function() { startDateFilter = this.value; renderFinance(); };
      if (endInp) endInp.onchange = function() { endDateFilter = this.value; renderFinance(); };

      window.ControlHub.state.subscribe(function() {
        renderFinance();
      });

      renderFinance();
    },

    render: function() {
      renderFinance();
    },

    getTotals: calculateFinanceTotals,

    deleteTransaction: function(txId) {
      window.ControlHub.modal.confirm({
        title: 'İşlemi Sil',
        message: 'Bu finans kaydını silmek istediğinizden emin misiniz?',
        confirmText: 'Sil',
        isDestructive: true,
        onConfirm: function() {
          var state = window.ControlHub.state.getState();
          state.transactions = (state.transactions || []).filter(function(t) { return t.id !== txId; });
          window.ControlHub.state.save();
          window.ControlHub.state.notify('finance');
          window.ControlHub.notifications.success('İşlem kaydı silindi.');
        }
      });
    },

    openModal: function(txId, defaultType) {
      var state = window.ControlHub.state.getState();
      var tx = txId ? (state.transactions || []).find(function(t) { return t.id === txId; }) : null;
      var isEdit = !!tx;
      var currentType = (tx && tx.type) || defaultType || 'gider';

      var incomeCats = window.ControlHub.config.financeIncomeCategories || ['Maaş', 'Serbest Zaman / Freelance', 'Yatırım', 'Diğer Gelir'];
      var expenseCats = window.ControlHub.config.financeExpenseCategories || ['Kira & Fatura', 'Gıda & Mutfak', 'Ulaşım', 'Yazılım & Araçlar', 'Sağlık', 'Diğer Gider'];

      function buildCategoryOptions(type, selectedCat) {
        var list = type === 'gelir' ? incomeCats : expenseCats;
        var html = '';
        list.forEach(function(c) {
          var sel = c === selectedCat ? 'selected' : '';
          html += '<option value="' + c + '" ' + sel + '>' + c + '</option>';
        });
        return html;
      }

      var formHtml = 
        '<form id="finance-modal-form" onsubmit="return false;">' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="tx-f-type">İşlem Türü</label>' +
              '<select id="tx-f-type" class="form-select">' +
                '<option value="gider" ' + (currentType === 'gider' ? 'selected' : '') + '>Gider (Harcama)</option>' +
                '<option value="gelir" ' + (currentType === 'gelir' ? 'selected' : '') + '>Gelir (Kazanç)</option>' +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="tx-f-amount">Tutar <span class="required">*</span></label>' +
              '<input type="number" step="0.01" min="0.01" id="tx-f-amount" class="form-input" placeholder="0.00" value="' + (tx ? tx.amount : '') + '" required>' +
              '<div class="form-error" id="err-tx-amount" style="display: none;"></div>' +
            '</div>' +
          '</div>' +
          '<div class="form-row">' +
            '<div class="form-group">' +
              '<label class="form-label" for="tx-f-category">Kategori <span class="required">*</span></label>' +
              '<select id="tx-f-category" class="form-select">' +
                buildCategoryOptions(currentType, tx ? tx.category : '') +
              '</select>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="tx-f-date">İşlem Tarihi <span class="required">*</span></label>' +
              '<input type="date" id="tx-f-date" class="form-input" value="' + (tx && tx.transactionDate ? tx.transactionDate : window.ControlHub.utils.getLocalISODate()) + '" required>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="tx-f-desc">Açıklama</label>' +
            '<input type="text" id="tx-f-desc" class="form-input" placeholder="Örn: Market alışverişi fişi veya fatura no" value="' + window.ControlHub.utils.escapeHTML(tx ? tx.description || '' : '') + '">' +
          '</div>' +
        '</form>';

      var footerHtml = 
        '<button class="btn btn-secondary" onclick="window.ControlHub.modal.close()">Vazgeç</button>' +
        '<button class="btn btn-primary" id="save-tx-submit-btn">' + (isEdit ? 'Güncelle' : 'Kaydet') + '</button>';

      window.ControlHub.modal.open({
        title: isEdit ? 'Finans Kaydını Düzenle' : (currentType === 'gelir' ? 'Yeni Gelir Ekle' : 'Yeni Gider Ekle'),
        content: formHtml,
        footer: footerHtml,
        onOpen: function(modalEl) {
          var typeSel = modalEl.querySelector('#tx-f-type');
          var catSel = modalEl.querySelector('#tx-f-category');

          typeSel.addEventListener('change', function() {
            catSel.innerHTML = buildCategoryOptions(typeSel.value, '');
          });

          var saveBtn = modalEl.querySelector('#save-tx-submit-btn');
          if (saveBtn) {
            saveBtn.onclick = function() {
              var type = typeSel.value;
              var amount = modalEl.querySelector('#tx-f-amount').value;
              var category = catSel.value;
              var txDate = modalEl.querySelector('#tx-f-date').value;
              var desc = modalEl.querySelector('#tx-f-desc').value;

              var valResult = window.ControlHub.validation.validateTransaction({
                amount: amount,
                category: category,
                transactionDate: txDate
              });

              if (!valResult.isValid) {
                var errEl = modalEl.querySelector('#err-tx-amount');
                if (errEl) {
                  errEl.textContent = valResult.errors.amount || valResult.errors.category;
                  errEl.style.display = 'flex';
                }
                modalEl.querySelector('#tx-f-amount').classList.add('is-invalid');
                return;
              }

              var now = new Date().toISOString();
              var st = window.ControlHub.state.getState();
              var numAmount = parseFloat(parseFloat(amount).toFixed(2));

              if (isEdit) {
                tx.type = type;
                tx.amount = numAmount;
                tx.category = category;
                tx.transactionDate = txDate;
                tx.description = desc.trim();
                window.ControlHub.notifications.success('İşlem güncellendi.');
              } else {
                var newTx = {
                  id: window.ControlHub.utils.generateId('tx'),
                  type: type,
                  amount: numAmount,
                  currency: (st.settings && st.settings.currency) || '₺',
                  category: category,
                  transactionDate: txDate,
                  description: desc.trim(),
                  createdAt: now
                };
                st.transactions = st.transactions || [];
                st.transactions.push(newTx);
                window.ControlHub.notifications.success('İşlem kaydedildi.');
              }

              window.ControlHub.state.save();
              window.ControlHub.state.notify('finance');
              window.ControlHub.modal.close();
            };
          }
        }
      });
    }
  };
})();
