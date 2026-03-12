import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { Cost, CostItem } from "../types/index";
import dayjs from "dayjs";
const toast = useToast();

const current = ref(dayjs());
const year = computed(() => current.value.format("YYYY"));
const month = computed(() => current.value.format("MM"));
const isModalCost = ref(false);

export const useCostsStore = defineStore("costs", () => {
  const costs = ref<Cost[]>([]);
  const activeCost = ref<CostItem | null>(null);
  let changeMonthTimer: ReturnType<typeof setTimeout>;
  const authStore = useAuthStore();

  const getCosts = async () => {
    const q = query(
      collection(db, "costs"),
      where("userID", "==", authStore.user?.uid),
      where("y", "==", year.value),
      where("m", "==", month.value),
    );
    const snapshot = await getDocs(q);
    costs.value = snapshot.docs.map((doc) => ({
      ...(doc.data() as Cost),
      id: doc.id,
    }));
  };

  const changeMonth = (num: number) => {
    current.value = current.value.add(num, "month");
    clearTimeout(changeMonthTimer);
    changeMonthTimer = setTimeout(() => {
      getCosts();
      const userStore = useUserStore();
      userStore.filterTags = [];
    }, 300);
  };

  const setActiveCost = (cost: CostItem | null) => {
    activeCost.value = cost ? { ...cost } : null;
    isModalCost.value = true;
  };

  const addCost = async (cost: Omit<Cost, "id">) => {
    const docRef = await addDoc(collection(db, "costs"), cost);
    costs.value.push({ id: docRef.id, ...cost });
    toast.success(`${cost.name}新增成功！`);
  };

  const updateCost = async (cost: Cost) => {
    const { id, ...data } = cost;
    await updateDoc(doc(db, "costs", id!), data);
    const idx = costs.value.findIndex((c) => c.id === id);
    if (idx !== -1) costs.value[idx] = cost;
    toast.success(`${cost.name}更新成功！`);
  };

  const deleteCost = async (id: string) => {
    await deleteDoc(doc(db, "costs", id));
    costs.value = costs.value.filter((c) => c.id !== id);
    isModalCost.value = false;
    activeCost.value = null;
    toast.success("刪除成功！");
  };

  const closeModalCost = () => {
    isModalCost.value = false;
    activeCost.value = null;
  };

  return {
    costs,
    activeCost,
    getCosts,
    changeMonth,
    year,
    month,
    setActiveCost,
    addCost,
    updateCost,
    deleteCost,
    isModalCost,
    closeModalCost,
  };
});
