<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStockStore } from '../stores/stockStore'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const router = useRouter()
const stockStore = useStockStore()
const tab = ref('in')

onMounted(() => {
  stockStore.fetchStockIns()
  stockStore.fetchStockOuts()
})

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Stok</h1>
      <div class="flex gap-2">
        <router-link to="/stock/in" class="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
          + Barang Masuk
        </router-link>
        <router-link to="/stock/out" class="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors">
          + Barang Keluar
        </router-link>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
      <button
        @click="tab = 'in'"
        class="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'in' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        Barang Masuk
      </button>
      <button
        @click="tab = 'out'"
        class="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="tab === 'out' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        Barang Keluar
      </button>
    </div>

    <!-- Stock In Table -->
    <SkeletonLoader v-if="tab === 'in' && stockStore.loading" variant="table" :cols="6" :rows="5" />
    <div v-else-if="tab === 'in'" class="glass rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Produk</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Supplier</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
            <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Harga Modal</th>
            <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in stockStore.stockIns" :key="s.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 text-gray-500">{{ new Date(s.date).toLocaleDateString('id-ID') }}</td>
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ s.products?.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.suppliers?.name || '-' }}</td>
            <td class="px-4 py-3 text-center font-medium">{{ s.qty }}</td>
            <td class="px-4 py-3 text-right text-gray-500">{{ formatCurrency(s.purchase_price) }}</td>
            <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(s.qty * s.purchase_price) }}</td>
          </tr>
          <tr v-if="stockStore.stockIns.length === 0">
            <td colspan="6" class="text-center py-12 text-gray-400">Belum ada barang masuk</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stock Out Table -->
    <SkeletonLoader v-if="tab === 'out' && stockStore.loading" variant="table" :cols="4" :rows="5" />
    <div v-else-if="tab === 'out'" class="glass rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Produk</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in stockStore.stockOuts" :key="s.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 text-gray-500">{{ new Date(s.date).toLocaleDateString('id-ID') }}</td>
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ s.products?.name }}</td>
            <td class="px-4 py-3 text-center font-medium text-red-500">{{ s.qty }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.reason }}</td>
          </tr>
          <tr v-if="stockStore.stockOuts.length === 0">
            <td colspan="4" class="text-center py-12 text-gray-400">Belum ada barang keluar</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
