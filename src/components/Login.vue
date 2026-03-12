<template>
  <div class="m-8 mx-auto w-80">
    <h1 class="m-12 text-center text-sky-400 text-xl">mooney 是極簡記帳。</h1>
    <Btn @click="authStore.loginGoogle()" class="w-full">
      以 Google 帳號登入
    </Btn>
    <Or />
    <input
      v-model="email"
      type="email"
      placeholder="電子信箱"
      class="w-full mb-4"
    />
    <input
      v-model="password"
      type="password"
      placeholder="密碼"
      class="w-full mb-4"
    />
    <Btn @click="handleEmail" class="w-full mb-8">登入 / 註冊</Btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuthStore } from "../stores/auth.ts";
const toast = useToast();
const authStore = useAuthStore();
const email = ref("");
const password = ref("");

const handleEmail = async () => {
  try {
    await authStore.loginEmail(email.value, password.value);
  } catch (e: any) {
    if (e.code === "auth/user-not-found") {
      await authStore.registerEmail(email.value, password.value);
    } else {
      toast.error(e.message);
    }
  }
};
</script>
