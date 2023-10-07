<script setup lang='ts'>
import { useQuasar } from 'quasar';
import { ref, defineExpose } from 'vue';

const $q = useQuasar();

$q.loadingBar.setDefaults({ size: '7px' });

const requests = new Set<string>();

const show = $q.loadingBar.start.bind($q);

const hide = () => {
  $q.loadingBar.stop();
  requests.clear();
};

const requestShow = (id: string) => {
  requests.add(id);
  $q.loadingBar.start();
};

const requestHide = (id: string) => {
  requests.delete(id);
  if (requests.size === 0) $q.loadingBar.stop();
};

defineExpose({
  show,
  hide,
  requestShow,
  requestHide,
});
</script>
