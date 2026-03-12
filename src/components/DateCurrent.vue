<script setup lang="ts">
const costsStore = useCostsStore();
const { year, month } = storeToRefs(costsStore);
</script>

<template>
  <div class="flex gap-2 items-center justify-center">
    <Btn v="none" size="icon"
      ><i
        class="material-icons text-stone-300"
        @click="costsStore.changeMonth(-1)"
        >chevron_left</i
      ></Btn
    >
    <h3>{{ year }} / {{ month }}</h3>
    <Btn v="none" size="icon"
      ><i
        class="material-icons text-stone-300"
        @click="costsStore.changeMonth(1)"
        >chevron_right</i
      ></Btn
    >
  </div>
</template>
