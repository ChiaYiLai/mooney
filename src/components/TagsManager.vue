<script setup lang="ts">
const userStore = useUserStore();
const { tags, isModalTags } = storeToRefs(userStore);

const newTag = ref("");
</script>

<template>
  <Modal v-model="isModalTags" modalTitle="標籤">
    <div class="flex gap-2">
      <input
        v-model="newTag"
        placeholder="新增標籤"
        @keyup.enter="userStore.addTag(newTag)"
        class="min-w-0"
      />
      <Btn @click="userStore.addTag(newTag)">新增</Btn>
    </div>
    <Or />

    <ul class="space-y-6 mb-4">
      <li v-for="tag in tags" :key="tag" class="flex items-center gap-3">
        <span class="flex-1">{{ tag }}</span>
        <Btn @click="userStore.deleteTag(tag)" size="sm" v="danger"> 刪除 </Btn>
      </li>
    </ul></Modal
  >
</template>
