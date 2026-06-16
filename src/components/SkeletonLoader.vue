<script setup>
defineProps({
  variant: { type: String, default: 'table' },
  rows: { type: Number, default: 5 },
  cols: { type: Number, default: 4 },
  count: { type: Number, default: 4 }
})
</script>

<template>
  <!-- Stats Cards Skeleton -->
  <div v-if="variant === 'stats'" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div v-for="i in count" :key="i" class="glass rounded-xl p-5 animate-pulse">
      <div class="flex items-center justify-between mb-3">
        <div class="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
      <div class="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
    </div>
  </div>

  <!-- Table Skeleton -->
  <div v-else-if="variant === 'table'" class="glass rounded-xl overflow-hidden animate-pulse">
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-8">
        <div v-for="j in cols" :key="j" class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
    <div v-for="i in rows" :key="i" class="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
      <div class="flex gap-8 items-center">
        <div v-for="j in cols" :key="j" class="h-3 bg-gray-200 dark:bg-gray-700 rounded" :class="j === cols ? 'w-16' : 'w-24'" />
      </div>
    </div>
  </div>

  <!-- Chart Skeleton -->
  <div v-else-if="variant === 'chart'" class="glass rounded-xl p-5 animate-pulse">
    <div class="flex items-center justify-between mb-4">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
      <div class="flex gap-1">
        <div class="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
        <div class="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
    <div class="h-64 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg" />
  </div>

  <!-- List Skeleton -->
  <div v-else-if="variant === 'list'" class="glass rounded-xl p-5 animate-pulse">
    <div v-for="i in rows" :key="i" class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div>
        <div class="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
        <div class="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  </div>

  <!-- Form Skeleton -->
  <div v-else-if="variant === 'form'" class="glass rounded-xl p-6 animate-pulse">
    <div class="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
    <div class="space-y-4">
      <div v-for="i in 4" :key="i">
        <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
        <div class="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  </div>
</template>
