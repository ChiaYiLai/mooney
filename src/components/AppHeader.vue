<template>
  <header class="bg-linear-to-r from-sky-50 to-sky-100 relative">
    <Btn v="none" size="icon" @click="isModalMenu = true">
      <i class="material-icons text-sky-300">notes</i>
    </Btn>
    <h1 class="text-lg text-sky-500 absolute left-1/2 -translate-1/2 top-1/2">
      mooney
    </h1>
  </header>
  <Modal v-model="isModalMenu" modalTitle="設定">
    <template v-if="user?.uid">
      <Btn @click="authStore.logout()">登出</Btn>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
const isModalMenu = ref(false);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>
