/**
 * ControlHub - Application Configuration
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  window.ControlHub.config = {
    appName: 'ControlHub',
    version: '1.0.1',
    schemaVersion: 1,
    storageKey: 'controlhub_state_clean_v1',
    themeStorageKey: 'controlhub_theme',
    
    // Status definitions
    taskStatuses: [
      { id: 'bekliyor', label: 'Bekliyor', badgeClass: 'badge-pending' },
      { id: 'devam-ediyor', label: 'Devam Ediyor', badgeClass: 'badge-in-progress' },
      { id: 'tamamlandi', label: 'Tamamlandı', badgeClass: 'badge-completed' }
    ],

    // Priority definitions
    taskPriorities: [
      { id: 'dusuk', label: 'Düşük', badgeClass: 'badge-priority-low' },
      { id: 'normal', label: 'Normal', badgeClass: 'badge-priority-normal' },
      { id: 'yuksek', label: 'Yüksek', badgeClass: 'badge-priority-high' },
      { id: 'kritik', label: 'Kritik', badgeClass: 'badge-priority-critical' }
    ],

    // Project status definitions
    projectStatuses: [
      { id: 'aktif', label: 'Aktif', badgeClass: 'badge-in-progress' },
      { id: 'tamamlandi', label: 'Tamamlandı', badgeClass: 'badge-completed' },
      { id: 'beklemede', label: 'Beklemede', badgeClass: 'badge-pending' }
    ],

    // Finance categories
    financeIncomeCategories: [
      'Maaş', 'Serbest Zaman / Freelance', 'Yatırım', 'Satış', 'Diğer Gelir'
    ],
    financeExpenseCategories: [
      'Kira & Fatura', 'Gıda & Mutfak', 'Ulaşım', 'Yazılım & Araçlar', 'Eğitim', 'Sağlık', 'Eğlence', 'Diğer Gider'
    ],

    // Note categories
    noteCategories: [
      'Genel', 'İş & Proje', 'Fikirler', 'Toplantı', 'Kişisel'
    ],

    defaultSettings: {
      currency: '₺',
      defaultView: 'dashboard',
      dateFormat: 'DD.MM.YYYY',
      autoSaveDelay: 1000
    }
  };
})();
