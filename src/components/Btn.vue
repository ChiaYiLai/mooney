<script setup lang="ts">
const props = defineProps<{
  v?: "primary" | "warning" | "danger" | "light" | "none" | "addCost";
  size?: "md" | "sm" | "icon";
  disabled?: boolean;
}>();

const baseClass =
  "cursor-pointer transition rounded-full whitespace-nowrap leading-none text-sm";

const variantClass = computed(
  () =>
    ({
      primary: "bg-sky-400 hover:bg-sky-600 text-white",
      warning: "bg-teal-400 hover:bg-teal-600 text-white",
      danger: "bg-red-400 hover:bg-red-600 text-white",
      light: "bg-stone-400 hover:bg-stone-600 text-white",
      none: "bg-transparent border-0",
      addCost: "bg-teal-400 text-white w-14 h-14",
    })[props.v ?? "primary"],
);

const sizeClass = computed(
  () =>
    ({
      md: "px-6 py-3",
      sm: "px-6 py-3 text-xs",
      icon: "p-0 flex items-center justify-center w-12 h-12",
    })[props.size ?? "md"],
);
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :class="[baseClass, variantClass, sizeClass]"
  >
    <slot />
  </button>
</template>
