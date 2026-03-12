<script setup lang="ts">
const costsStore = useCostsStore();
const userStore = useUserStore();

const { activeCost } = storeToRefs(costsStore);

interface CostEntry {
  id: string;
  name: string;
  price: number;
  tags: string[];
  y: string;
  m: string;
  d: string;
}

interface DayGroup {
  d: string;
  day: string;
  list: CostEntry[];
  total: number;
}

const costsList = computed(() => {
  const filteredCosts = userStore.filterTags.length
    ? costsStore.costs.filter((cost) =>
        cost.tags.some((tag) => userStore.filterTags.includes(tag)),
      )
    : costsStore.costs;
  const result = filteredCosts.reduce<DayGroup[]>((acc, cost) => {
    const { id, y, m, d, name, price, tags } = cost;
    const daysOfWeek = ["日", "一", "二", "三", "四", "五", "六"];
    const date = new Date(`${y}-${m}-${d}`);
    const day = daysOfWeek[date.getDay()];
    const index = acc.findIndex((item) => item.d === d);
    const costEntry = { id, name, price, tags, y, m, d };
    if (index === -1) {
      acc.push({
        d,
        day,
        list: [costEntry],
        total: costEntry.price,
      });
    } else {
      acc[index].list.push(costEntry);
      acc[index].total += costEntry.price;
    }
    return acc;
  }, []);
  result.sort((a, b) => a.d.localeCompare(b.d));
  return result;
});
</script>

<template>
  <ul class="list-dates">
    <li v-for="cost in costsList" :key="cost.date">
      <label>
        <b>{{ cost.d }}</b>
        <span>({{ cost.day }})</span>
        <strong><small>$</small>{{ cost.total }}</strong>
      </label>
      <ul class="list-costs">
        <li
          v-for="item in cost.list"
          :key="item.id"
          @click="costsStore.setActiveCost(item)"
          :class="{
            lg: item.price >= 5000,
            md: item.price >= 1000 && item.price < 4999,
            sm: item.price >= 500 && item.price < 999,
          }"
        >
          <h4>{{ item.name }}</h4>
          <h5><small>$</small>{{ item.price }}</h5>
        </li>
      </ul>
    </li>
  </ul>
</template>
