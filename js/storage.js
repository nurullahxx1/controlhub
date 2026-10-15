/**
 * ControlHub - Storage Layer
 * LocalStorage wrapper with memory fallback, quota safety, and error handling.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var memoryStorage = {};
  var isLocalStorageAvailable = false;

  try {
    var testKey = '__ch_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
  } catch (e) {
    isLocalStorageAvailable = false;
    console.warn('ControlHub: LocalStorage is not accessible. Running in memory fallback mode.');
  }

  window.ControlHub.storage = {
    isAvailable: function() {
      return isLocalStorageAvailable;
    },

    get: function(key) {
      try {
        if (isLocalStorageAvailable) {
          var item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        }
        return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : null;
      } catch (e) {
        console.error('Storage get error for key ' + key, e);
        return null;
      }
    },

    set: function(key, value) {
      try {
        var serialized = JSON.stringify(value);
        if (isLocalStorageAvailable) {
          window.localStorage.setItem(key, serialized);
        }
        memoryStorage[key] = serialized;
        return true;
      } catch (e) {
        console.error('Storage set error for key ' + key, e);
        // Fallback to memory
        memoryStorage[key] = JSON.stringify(value);
        return false;
      }
    },

    remove: function(key) {
      try {
        if (isLocalStorageAvailable) {
          window.localStorage.removeItem(key);
        }
        delete memoryStorage[key];
        return true;
      } catch (e) {
        delete memoryStorage[key];
        return false;
      }
    },

    clear: function() {
      try {
        if (isLocalStorageAvailable) {
          window.localStorage.clear();
        }
        memoryStorage = {};
        return true;
      } catch (e) {
        memoryStorage = {};
        return false;
      }
    }
  };
})();
