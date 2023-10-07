import OpenLayersMap from 'vue3-openlayers';
import 'vue3-openlayers/dist/vue3-openlayers.css';

import { createApp } from 'vue';
import { Quasar } from 'quasar';
import router from './router';
import App from './App.vue';
import quasarUserOptions from './quasar-user-options';
import LoadingFeedback from './components/LoadingFeedback.vue';

createApp(App).use(Quasar, quasarUserOptions)
  .component('LoadingFeedback', LoadingFeedback)
  .use(router)
  .use(OpenLayersMap)
  .mount('#app');
