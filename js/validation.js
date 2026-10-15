/**
 * ControlHub - Validation Service
 * Validates entity forms and incoming JSON backups.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  window.ControlHub.validation = {
    /**
     * Validate Task input
     */
    validateTask: function(data) {
      var errors = {};
      if (!data.title || !data.title.trim()) {
        errors.title = 'Görev başlığı zorunludur.';
      } else if (data.title.trim().length > 150) {
        errors.title = 'Başlık 150 karakterden uzun olamaz.';
      }

      if (data.dueDate && isNaN(new Date(data.dueDate).getTime())) {
        errors.dueDate = 'Geçerli bir bitiş tarihi giriniz.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
      };
    },

    /**
     * Validate Project input
     */
    validateProject: function(data) {
      var errors = {};
      if (!data.name || !data.name.trim()) {
        errors.name = 'Proje adı zorunludur.';
      } else if (data.name.trim().length > 100) {
        errors.name = 'Proje adı 100 karakterden uzun olamaz.';
      }

      if (data.startDate && data.endDate) {
        var start = new Date(data.startDate).getTime();
        var end = new Date(data.endDate).getTime();
        if (start > end) {
          errors.endDate = 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
        }
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
      };
    },

    /**
     * Validate Note input
     */
    validateNote: function(data) {
      var errors = {};
      if (!data.title || !data.title.trim()) {
        errors.title = 'Not başlığı zorunludur.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
      };
    },

    /**
     * Validate Habit input
     */
    validateHabit: function(data) {
      var errors = {};
      if (!data.title || !data.title.trim()) {
        errors.title = 'Alışkanlık adı zorunludur.';
      } else if (data.title.trim().length > 80) {
        errors.title = 'Alışkanlık adı 80 karakterden uzun olamaz.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
      };
    },

    /**
     * Validate Finance Transaction input
     */
    validateTransaction: function(data) {
      var errors = {};
      var amount = parseFloat(data.amount);

      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Tutar sıfırdan büyük geçerli bir sayı olmalıdır.';
      }

      if (!data.category || !data.category.trim()) {
        errors.category = 'Kategori seçimi zorunludur.';
      }

      if (!data.transactionDate || isNaN(new Date(data.transactionDate).getTime())) {
        errors.transactionDate = 'Geçerli bir işlem tarihi giriniz.';
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
      };
    },

    /**
     * Validate full Backup JSON payload
     */
    validateBackup: function(jsonObj) {
      if (!jsonObj || typeof jsonObj !== 'object') {
        return { isValid: false, message: 'Yedek dosyası geçerli bir JSON nesnesi değil.' };
      }

      if (!jsonObj.app || jsonObj.app !== 'ControlHub') {
        return { isValid: false, message: 'Bu dosya ControlHub yedeği değil veya geçersiz.' };
      }

      if (!jsonObj.schemaVersion || typeof jsonObj.schemaVersion !== 'number') {
        return { isValid: false, message: 'Yedek şema sürüm bilgisi eksik veya geçersiz.' };
      }

      if (!jsonObj.data || typeof jsonObj.data !== 'object') {
        return { isValid: false, message: 'Yedek veri gövdesi (data) bulunamadı.' };
      }

      var requiredArrays = ['tasks', 'projects', 'notes', 'habits', 'transactions'];
      for (var i = 0; i < requiredArrays.length; i++) {
        var key = requiredArrays[i];
        if (!Array.isArray(jsonObj.data[key])) {
          return { isValid: false, message: 'Yedek verisinde eksik veya bozuk alan: ' + key };
        }
      }

      // Check ID uniqueness
      var idMap = {};
      for (var j = 0; j < requiredArrays.length; j++) {
        var arr = jsonObj.data[requiredArrays[j]];
        for (var k = 0; k < arr.length; k++) {
          var item = arr[k];
          if (!item.id) {
            return { isValid: false, message: requiredArrays[j] + ' listesinde ID değeri eksik olan bir kayıt bulundu.' };
          }
          if (idMap[item.id]) {
            return { isValid: false, message: 'Yedek dosyasında mükerrer ID bulundu: ' + item.id };
          }
          idMap[item.id] = true;
        }
      }

      return { isValid: true, message: 'Yedek şeması başarıyla doğrulandı.' };
    }
  };
})();
