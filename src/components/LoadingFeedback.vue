<script setup lang='ts'>
import { useQuasar } from 'quasar';
import { defineExpose } from 'vue';

const $q = useQuasar();

$q.loadingBar.setDefaults({ size: '7px' });

const show = $q.loadingBar.start.bind($q);

const hide = $q.loadingBar.stop.bind($q);

defineExpose({
  show,
  hide,
});
</script>
