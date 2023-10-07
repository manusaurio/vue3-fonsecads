import './styles/quasar.sass';
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css';
import { Loading, LoadingBar } from 'quasar';

// To be used on app.use(Quasar, { ... })
export default {
  config: { loading: { spinnerColor: 'red' } },
  plugins: { Loading, LoadingBar },
  extras: [
    'material-icons-outlined',
  ],
};
