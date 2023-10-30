import OpenLayersMap from 'vue3-openlayers';

import { createApp } from 'vue';
import { Quasar } from 'quasar';
import VueCookies from 'vue-cookies';
import router from './router';
import App from './App.vue';
import quasarUserOptions from './quasar-user-options';

createApp(App).use(Quasar, quasarUserOptions)
  .use(router)
  .use(OpenLayersMap)
  .use(VueCookies, { expires: '2d', sameSite: 'Strict' })
  .mount('#app');
