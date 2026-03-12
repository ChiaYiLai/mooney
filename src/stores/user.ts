import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const useUserStore = defineStore("user", () => {
  const authStore = useAuthStore();
  const tags = ref<string[]>([]);
  const names = ref<string[]>([]);
  const isModalTags = ref(false);
  const isModalNames = ref(false);
  const filterTags = ref<string[]>([]);

  const getUserData = async () => {
    const snapshot = await getDoc(doc(db, "users", authStore.user!.uid));
    const data = snapshot.data();
    tags.value = data?.tags ?? [];
    names.value = data?.names ?? [];
  };

  const save = async (field: "tags" | "names", value: string[]) => {
    await updateDoc(doc(db, "users", authStore.user!.uid), { [field]: value });
  };

  // tags
  const addTag = async (tag: string) => {
    if (!tag.trim()) return;
    tags.value.push(tag);
    await save("tags", tags.value);
  };
  const deleteTag = async (tag: string) => {
    tags.value = tags.value.filter((t) => t !== tag);
    await save("tags", tags.value);
  };
  const toggleFilterTag = (tag: string) => {
    if (filterTags.value.includes(tag)) {
      filterTags.value = filterTags.value.filter((t) => t !== tag);
    } else {
      filterTags.value.push(tag);
    }
  };

  // names
  const addName = async (name: string) => {
    if (names.value.includes(name)) return;
    names.value.push(name);
    await save("names", names.value);
  };
  const deleteName = async (name: string) => {
    names.value = names.value.filter((n) => n !== name);
    await save("names", names.value);
  };

  return {
    getUserData,

    tags,
    addTag,
    deleteTag,
    isModalTags,
    filterTags,
    toggleFilterTag,

    names,
    addName,
    deleteName,
    isModalNames,
  };
});
