/**
 * ControlHub - Utilities & Helper Functions
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  window.ControlHub.utils = {
    /**
     * Generate unique identifier
     */
    generateId: function(prefix) {
      prefix = prefix || 'id';
      var timestamp = Date.now().toString(36);
      var randomStr = Math.random().toString(36).substring(2, 8);
      return prefix + '_' + timestamp + randomStr;
    },

    /**
     * Strictly escape HTML for safe rendering and DOM-based XSS defense
     */
    escapeHTML: function(str) {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Get YYYY-MM-DD string in local timezone (prevents UTC date boundary bugs)
     */
    getLocalISODate: function(d) {
      var date = d ? new Date(d) : new Date();
      if (isNaN(date.getTime())) return '';
      var year = date.getFullYear();
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var day = String(date.getDate()).padStart(2, '0');
      return year + '-' + month + '-' + day;
    },

    /**
     * Format ISO date to localized readable string (e.g. 15 Eki 2026 or 15.10.2026)
     */
    formatDate: function(dateStr) {
      if (!dateStr) return 'Tarih yok';
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      var day = String(d.getDate()).padStart(2, '0');
      var month = String(d.getMonth() + 1).padStart(2, '0');
      var year = d.getFullYear();
      return day + '.' + month + '.' + year;
    },

    /**
     * Format currency with 2 decimal places and tabular thousands separation
     */
    formatCurrency: function(amount, symbol) {
      var num = parseFloat(amount);
      if (isNaN(num)) num = 0;
      symbol = symbol || '₺';
      
      var parts = num.toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return parts.join(',') + ' ' + symbol;
    },

    /**
     * Debounce function execution
     */
    debounce: function(func, wait) {
      var timeout;
      return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
          func.apply(context, args);
        }, wait);
      };
    },

    /**
     * Sanitize values for CSV to prevent Spreadsheet Formula Injection (=, +, -, @, \t, \r)
     */
    sanitizeCSV: function(value) {
      if (value === null || value === undefined) return '""';
      var str = String(value);
      // If starts with formula triggers, prepend a single quote
      if (/^[=\+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      // Escape double quotes by doubling them
      str = str.replace(/"/g, '""');
      return '"' + str + '"';
    },

    /**
     * Deep clone JSON-serializable object
     */
    deepClone: function(obj) {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        return obj;
      }
    },

    /**
     * Calculate difference in days between two YYYY-MM-DD dates
     */
    daysDiff: function(dateStr1, dateStr2) {
      var d1 = new Date(dateStr1);
      var d2 = new Date(dateStr2);
      var diffTime = d2.getTime() - d1.getTime();
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Get relative date description (Bugün, Dün, Yarın or date)
     */
    getRelativeDateLabel: function(dateStr) {
      if (!dateStr) return '';
      var today = this.getLocalISODate();
      var target = dateStr.substring(0, 10);
      var diff = this.daysDiff(today, target);
      if (diff === 0) return 'Bugün';
      if (diff === 1) return 'Yarın';
      if (diff === -1) return 'Dün';
      if (diff < -1) return Math.abs(diff) + ' gün gecikti';
      return diff + ' gün sonra';
    }
  };
})();
