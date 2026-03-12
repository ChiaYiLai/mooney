<script setup lang="ts">
const userStore = useUserStore();
const { names, isModalNames } = storeToRefs(userStore);

const newName = ref("");
</script>

<template>
  <Modal v-model="isModalNames" modalTitle="常用品項">
    <div class="flex gap-2">
      <input
        v-model="newName"
        placeholder="新增品項"
        @keyup.enter="userStore.addName(newName)"
        class="min-w-0"
      />
      <Btn @click="userStore.addName(newName)">新增</Btn>
    </div>
    <Or />

    <ul class="space-y-6 mb-4">
      <li v-for="name in names" :key="name" class="flex items-center gap-3">
        <span class="flex-1">{{ name }}</span>
        <Btn @click="userStore.deleteName(name)" size="sm" v="danger">刪除</Btn>
      </li>
    </ul>
  </Modal>
</template>
