import OpenLayersMap from 'vue3-openlayers';

import { createApp } from 'vue';
import { Quasar } from 'quasar';
import router from './router';
import App from './App.vue';
import quasarUserOptions from './quasar-user-options';

createApp(App).use(Quasar, quasarUserOptions)
  .use(router)
  .use(OpenLayersMap)
  .mount('#app');
