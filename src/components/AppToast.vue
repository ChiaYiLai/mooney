<script setup lang="ts">
const { toasts, remove } = useToast();

const styles: Record<ToastType, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-orange-500",
  info: "bg-stone-500",
};
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed bottom-12 left-1/2 -translate-x-1/2 z-9999 w-72 pointer-events-none flex flex-col gap-2"
    >
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-[150px]"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-[150px]"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'relative text-white overflow-hidden flex items-center gap-3 px-6 py-3 rounded-full shadow-lg pointer-events-auto',
            styles[toast.type],
          ]"
        >
          <p class="flex-1 text-sm">{{ toast.message }}</p>
          <button class="h-6" @click="remove(toast.id)">
            <span class="material-icons">close</span>
          </button>
          <div
            class="absolute bottom-0 left-0 h-0.5 bg-black/20"
            :style="{
              width: '100%',
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style>
@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
