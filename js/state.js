/**
 * ControlHub - Central State Management
 * Starts completely clean and empty so the user creates and configures everything.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var listeners = [];
  var state = null;

  var cleanInitialData = {
    schemaVersion: 1,
    tasks: [],
    projects: [],
    notes: [],
    habits: [],
    transactions: [],
    settings: {
      currency: '₺',
      defaultView: 'dashboard',
      dateFormat: 'DD.MM.YYYY',
      autoSaveDelay: 1000
    }
  };

  // Kept solely as an optional manual action in Settings -> Tehlikeli Bölge -> "Örnek Veriyi Yükle"
  var sampleDemoData = {
    schemaVersion: 1,
    tasks: [
      {
        id: 'task_demo_1',
        title: 'Örnek: Ürün lansmanı ve bileşen kontrolleri',
        description: 'Görev panosu, kanban ve filtreleme özelliklerini test et.',
        status: 'devam-ediyor',
        priority: 'kritik',
        projectId: 'proj_demo_1',
        dueDate: window.ControlHub.utils ? window.ControlHub.utils.getLocalISODate(new Date(Date.now() + 86400000)) : '2026-10-16',
        createdAt: '2026-10-14T09:00:00.000Z',
        updatedAt: '2026-10-15T08:00:00.000Z',
        tags: ['Frontend', 'UI/UX']
      },
      {
        id: 'task_demo_2',
        title: 'Örnek: Sistem mimari dokümantasyonu',
        description: 'Tüm modül ve sorumluluk haritasını hazırla.',
        status: 'tamamlandi',
        priority: 'yuksek',
        projectId: 'proj_demo_1',
        dueDate: '2026-10-14',
        createdAt: '2026-10-13T10:00:00.000Z',
        updatedAt: '2026-10-14T15:30:00.000Z',
        tags: ['Dokümantasyon']
      }
    ],
    projects: [
      {
        id: 'proj_demo_1',
        name: 'Örnek Proje: ControlHub Geliştirme',
        description: 'Kişisel yönetim paneli modüllerinin yapılandırılması.',
        color: '#3b82f6',
        status: 'aktif',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        createdAt: '2026-10-01T08:00:00.000Z'
      }
    ],
    notes: [
      {
        id: 'note_demo_1',
        title: 'Örnek Not: Hoş Geldiniz',
        content: 'Bu not bir örnektir. İstediğiniz zaman silebilir veya yeni notlar oluşturabilirsiniz.',
        category: 'Genel',
        tags: ['Başlangıç'],
        isPinned: true,
        createdAt: '2026-10-14T10:00:00.000Z',
        updatedAt: '2026-10-15T07:30:00.000Z'
      }
    ],
    habits: [
      {
        id: 'habit_demo_1',
        title: 'Örnek: 2 Litre Su Tüketimi',
        description: 'Vücut sağlığı ve odaklanma için düzenli su içme.',
        color: '#10b981',
        frequency: 'Her gün',
        isActive: true,
        completionHistory: [
          window.ControlHub.utils ? window.ControlHub.utils.getLocalISODate() : '2026-10-15'
        ],
        createdAt: '2026-10-01T00:00:00.000Z'
      }
    ],
    transactions: [
      {
        id: 'tx_demo_1',
        type: 'gelir',
        amount: 25000,
        currency: '₺',
        category: 'Maaş',
        description: 'Aylık hakediş',
        transactionDate: '2026-10-05',
        createdAt: '2026-10-05T09:00:00.000Z'
      }
    ],
    settings: {
      currency: '₺',
      defaultView: 'dashboard',
      dateFormat: 'DD.MM.YYYY',
      autoSaveDelay: 1000
    }
  };

  window.ControlHub.state = {
    init: function() {
      // Clear legacy sample keys if any exist
      try {
        if (window.localStorage) {
          window.localStorage.removeItem('controlhub_state_v1');
        }
      } catch (e) {}

      var saved = window.ControlHub.storage.get(window.ControlHub.config.storageKey);
      if (saved && saved.schemaVersion) {
        state = saved;
      } else {
        // Start completely clean and empty
        state = window.ControlHub.utils.deepClone(cleanInitialData);
        this.save();
      }
    },

    getState: function() {
      if (!state) this.init();
      return state;
    },

    setState: function(newState, skipNotify) {
      state = newState;
      this.save();
      if (!skipNotify) {
        this.notify();
      }
    },

    resetToDemoData: function() {
      state = window.ControlHub.utils.deepClone(sampleDemoData);
      this.save();
      this.notify();
    },

    clearAllData: function() {
      state = window.ControlHub.utils.deepClone(cleanInitialData);
      this.save();
      this.notify();
    },

    save: function() {
      if (!state) return;
      window.ControlHub.storage.set(window.ControlHub.config.storageKey, state);
    },

    subscribe: function(callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
      return function unsubscribe() {
        listeners = listeners.filter(function(l) { return l !== callback; });
      };
    },

    notify: function(moduleHint) {
      for (var i = 0; i < listeners.length; i++) {
        try {
          listeners[i](state, moduleHint);
        } catch (e) {
          console.error('State listener error', e);
        }
      }
    }
  };
})();
