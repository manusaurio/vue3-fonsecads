import { reactive } from 'vue';
import { Dialog } from 'quasar';

export const state = reactive({
  geolocation: {
    working: true,
    on: false,
  },
  outOfBounds: false,
  warningDialog: {},
  showWarning() {
    Dialog.create(this.warningDialog);
  },
  reset() {
    this.geolocation.working = true;
    this.geolocation.on = false;
    this.outOfBounds = false;
  },
});
