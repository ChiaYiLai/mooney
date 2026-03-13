<script setup lang="ts">
import AppFooter from "./components/AppFooter.vue";

const costsStore = useCostsStore();
const authStore = useAuthStore();
onMounted(() => {
  authStore.init();
});
</script>

<template>
  <AppHeader />
  <main class="p-4 flex-1">
    <template v-if="authStore.user">
      <DateCurrent />
      <MonthTotal />
      <TagsCost />
      <Costs />
      <CostForm />
      <NamesManager />
      <TagsManager />
      <Btn
        size="icon"
        v="addCost"
        class="fixed left-1/2 -translate-x-1/2 bottom-12 z-1 shadow-lg border-2 border-white"
        @click="costsStore.isModalCost = true"
        v-if="!costsStore.isModalCost"
      >
        <span class="material-icons text-3xl!">add</span>
      </Btn></template
    >
    <Login v-else />
  </main>
  <AppFooter />
  <AppToast />
</template>
