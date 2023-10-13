import './styles/quasar.sass';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css';

import {
  Loading, LoadingBar,
  Notify, Dialog,
} from 'quasar';

// To be used on app.use(Quasar, { ... })
export default {
  config: {
    loadingBar: { size: '7px' },
    notify: {
      position: 'top',
      color: 'primary',
      timeout: 700,
      group: false,
    },
  },
  plugins: {
    Loading,
    LoadingBar,
    Notify,
    Dialog,
  },
  extras: [
    'material-icons-outlined',
  ],
};
