<script setup lang="ts">
import dayjs from "dayjs";

const costsStore = useCostsStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const toast = useToast();

const { tags, names } = storeToRefs(userStore);
const { isModalCost, activeCost } = storeToRefs(costsStore);
const nameInput = ref<HTMLInputElement | null>(null);
const priceInput = ref<HTMLInputElement | null>(null);

const defaultForm = () => ({
  date: dayjs().format("YYYY-MM-DD"),
  name: "",
  price: null as number | null,
  tags: [] as string[],
});

const form = ref(defaultForm());

const toggleTag = (tag: string) => {
  const i = form.value.tags.indexOf(tag);
  i === -1 ? form.value.tags.push(tag) : form.value.tags.splice(i, 1);
};

const submit = async () => {
  const { date, name, price, tags } = form.value;
  if (!name || !price) return toast.error("請填寫品項及價格");
  const d = dayjs(date);
  const data = {
    name,
    price,
    tags,
    y: d.format("YYYY"),
    m: d.format("MM"),
    d: d.format("DD"),
    userID: authStore.user!.uid,
  };

  if (activeCost.value?.id) {
    await costsStore.updateCost({ ...data, id: activeCost.value.id });
  } else {
    await costsStore.addCost(data);
  }

  form.value = defaultForm();
  costsStore.isModalCost = false;
};

watch(isModalCost, (val) => {
  if (val) {
    if (activeCost.value) {
      form.value = {
        date: `${activeCost.value.y}-${activeCost.value.m}-${activeCost.value.d}`,
        name: activeCost.value.name,
        price: activeCost.value.price,
        tags: [...activeCost.value.tags],
      };
    } else {
      form.value = defaultForm();
    }
    nextTick(() => nameInput.value?.focus());
  }
});
</script>

<template>
  <Modal
    :modelValue="isModalCost"
    @update:modelValue="costsStore.closeModalCost()"
  >
    <input v-model="form.date" type="date" class="w-full mb-4" />
    <input
      v-model="form.name"
      placeholder="品項"
      class="w-full mb-4"
      ref="nameInput"
      list="names-list"
      @change="priceInput?.focus()"
    />
    <datalist id="names-list">
      <option v-for="name in names" :key="name" :value="name" />
    </datalist>
    <input
      v-model.number="form.price"
      type="number"
      placeholder="價格"
      class="w-full mb-4"
      ref="priceInput"
    />

    <ul class="list-tags mb-4">
      <li
        v-for="tag in tags"
        :key="tag"
        :class="{ active: form.tags.includes(tag) }"
        @click="toggleTag(tag)"
      >
        {{ tag }}
      </li>
    </ul>

    <Btn @click="submit" class="w-full">
      {{ activeCost ? "更新" : "新增" }}
    </Btn>
    <Or />
    <div class="flex flex-wrap gap-3">
      <Btn size="sm" @click="userStore.isModalNames = true" v="light">
        編輯常用品項
      </Btn>
      <Btn size="sm" @click="userStore.isModalTags = true" v="light"
        >編輯標籤</Btn
      >
      <Btn
        v-if="activeCost"
        size="sm"
        v="danger"
        @click="costsStore.deleteCost(activeCost!.id)"
        >刪除此品項</Btn
      >
    </div>
  </Modal>
</template>
