<script setup lang="ts">
const costsStore = useCostsStore();
const { costs } = storeToRefs(costsStore);

const totalMonth = computed(() =>
  costs.value.reduce((sum, cost) => sum + cost.price, 0),
);
</script>

<template>
  <h2 v-if="costs.length" class="text-sky-500 text-2xl text-center mb-3">
    <small>$</small>{{ totalMonth }}
  </h2>
  <div v-else class="text-center p-6">
    <p class="mb-4 text-stone-400">
      點擊右下角按鈕，<br />新增本月的第一筆花費吧！
    </p>
  </div>
</template>
