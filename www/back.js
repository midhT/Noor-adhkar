/* Naseem Android back button.
   The native layer (native.js) calls NaseemBack.press() when the system back button / gesture fires.
   Handlers listen for "naseem:back" on document and call preventDefault() when they used the press
   (close a sheet, close the full player, leave the Quran reader, go to the previous screen).
   If nothing handled it, we are on Home with nothing open and the app may close. */
(function () {
  'use strict';
  window.NaseemBack = {
    press() {
      const evt = new CustomEvent('naseem:back', { cancelable: true, bubbles: true });
      document.dispatchEvent(evt);
      return evt.defaultPrevented;
    }
  };
})();
