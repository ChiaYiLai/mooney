<template>
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="bg-black/60 fixed inset-0 flex justify-center items-start z-50"
      @click.self="modelValue = false"
    >
      <div
        class="w-80 max-h-[80vh] px-6 py-8 mt-8 bg-white rounded-md overflow-y-auto modal-content"
      >
        <h2 v-if="modalTitle" class="text-xl mb-6">{{ modalTitle }}</h2>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>();
const props = defineProps<{
  modalTitle?: string;
}>();
</script>
