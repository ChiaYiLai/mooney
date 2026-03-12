<script setup lang="ts">
const costsStore = useCostsStore();
const userStore = useUserStore();
const tagsCost = computed(() => {
  if (!costsStore.costs) return [];
  const tagTotals = costsStore.costs.reduce((acc, cost) => {
    cost.tags.forEach(
      (tag) => (acc[tag] = (acc[tag] || 0) + parseInt(cost.price, 10)),
    );
    return acc;
  }, {});
  return Object.entries(tagTotals).map(([name, total]) => ({ name, total }));
});
</script>

<template>
  <ul class="list-tags-cost">
    <li
      v-for="tag in tagsCost"
      :key="tag.name"
      @click="userStore.toggleFilterTag(tag.name)"
      :class="{ active: userStore.filterTags.includes(tag.name) }"
    >
      <b>{{ tag.name }}</b>
      <span><small>$</small>{{ tag.total }}</span>
    </li>
  </ul>
</template>
