/**
 * ControlHub - Event Bus
 * Decoupled publish/subscribe event manager.
 */
(function() {
  'use strict';

  window.ControlHub = window.ControlHub || {};

  var eventListeners = {};

  window.ControlHub.events = {
    on: function(event, callback) {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(callback);
      return function off() {
        if (!eventListeners[event]) return;
        eventListeners[event] = eventListeners[event].filter(function(cb) {
          return cb !== callback;
        });
      };
    },

    emit: function(event, payload) {
      if (!eventListeners[event]) return;
      var listeners = eventListeners[event].slice();
      for (var i = 0; i < listeners.length; i++) {
        try {
          listeners[i](payload);
        } catch (e) {
          console.error('Event listener error for ' + event, e);
        }
      }
    }
  };
})();
