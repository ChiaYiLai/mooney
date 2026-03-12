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
  <main v-if="authStore.user" class="p-4 flex-1">
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
      class="fixed right-6 bottom-6 z-1 shadow-lg border-2 border-white"
      @click="costsStore.isModalCost = true"
      v-if="!costsStore.isModalCost"
    >
      <span class="material-icons">add</span>
    </Btn>
  </main>
  <Login v-else />
  <AppFooter />
  <AppToast />
</template>
