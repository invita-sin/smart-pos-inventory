<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { Line, Bar } from 'vue-chartjs'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const router = useRouter()

const colorClasses = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  amber: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
}

const stats = ref([
  { label: 'Penjualan Hari Ini', value: 'Rp 0', icon: 'trending-up', color: 'emerald' },
  { label: 'Total Transaksi', value: '0', icon: 'receipt', color: 'indigo' },
  { label: 'Total Produk', value: '0', icon: 'package', color: 'cyan' },
  { label: 'Produk Hampir Habis', value: '0', icon: 'alert-triangle', color: 'amber' }
])

const recentTransactions = ref([])
const lowStockProducts = ref([])
const chartPeriod = ref(7)
const salesChartData = ref(null)
const topProductsData = ref(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  await Promise.all([
    loadStats(),
    loadLowStock(),
    loadRecentTransactions(),
    loadChartData()
  ])
  loading.value = false
})

async function loadStats() {
  const today = new Date().toISOString().split('T')[0]
  const { data: todaySales } = await supabase
    .from('transactions')
    .select('total')
    .gte('created_at', today)
  const totalSales = todaySales?.reduce((s, t) => s + (t.total || 0), 0) || 0

  const { count: txCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })

  const { count: prodCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: lowCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .lte('stock', 10)

  stats.value = [
    { label: 'Penjualan Hari Ini', value: `Rp ${totalSales.toLocaleString('id-ID')}`, icon: 'trending-up', color: 'emerald' },
    { label: 'Total Transaksi', value: txCount?.toString() || '0', icon: 'receipt', color: 'indigo' },
    { label: 'Total Produk', value: prodCount?.toString() || '0', icon: 'package', color: 'cyan' },
    { label: 'Produk Hampir Habis', value: lowCount?.toString() || '0', icon: 'alert-triangle', color: 'amber' }
  ]
}

async function loadLowStock() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .lte('stock', 10)
    .order('stock')
    .limit(5)
  lowStockProducts.value = data || []
}

async function loadRecentTransactions() {
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  recentTransactions.value = data || []
}

async function loadChartData() {
  const now = new Date()
  const startDate = new Date(now.getTime() - chartPeriod.value * 24 * 60 * 60 * 1000)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('created_at, total')
    .gte('created_at', startDate.toISOString())
    .order('created_at')

  const dailyMap = {}
  for (let i = 0; i < chartPeriod.value; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split('T')[0]
    dailyMap[key] = 0
  }

  transactions?.forEach(t => {
    const key = new Date(t.created_at).toISOString().split('T')[0]
    if (dailyMap[key] !== undefined) dailyMap[key] += t.total || 0
  })

  const labels = Object.keys(dailyMap).reverse()
  const values = Object.values(dailyMap).reverse()

  salesChartData.value = {
    labels: labels.map(d => {
      const date = new Date(d + 'T00:00:00')
      return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
    }),
    datasets: [{
      label: 'Penjualan',
      data: values,
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointBackgroundColor: '#4f46e5',
    }]
  }

  const { data: txIds } = await supabase
    .from('transactions')
    .select('id')
    .gte('created_at', startDate.toISOString())

  if (!txIds?.length) {
    topProductsData.value = { labels: [], datasets: [{ label: 'Terjual', data: [], backgroundColor: [] }] }
    return
  }

  const { data: items } = await supabase
    .from('transaction_items')
    .select('qty, products(name)')
    .in('transaction_id', txIds.map(t => t.id))

  const prodMap = {}
  items?.forEach(item => {
    const name = item.products?.name || 'Unknown'
    prodMap[name] = (prodMap[name] || 0) + item.qty
  })

  const sorted = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  topProductsData.value = {
    labels: sorted.map(s => s[0]),
    datasets: [{
      label: 'Terjual',
      data: sorted.map(s => s[1]),
      backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
      borderRadius: 6,
    }]
  }
}

async function changePeriod(days) {
  chartPeriod.value = days
  await loadChartData()
}

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 } }
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        font: { size: 10 },
        callback: (v) => 'Rp' + (v / 1000).toFixed(0) + 'k'
      }
    }
  }
}))

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { display: false } },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: { font: { size: 10 } }
    },
    y: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    }
  }
}))
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

    <!-- Stats -->
    <SkeletonLoader v-if="loading" variant="stats" :count="4" />
    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="glass rounded-xl p-5 hover:shadow-lg transition-shadow"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ stat.label }}</span>
          <span
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="colorClasses[stat.color]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="stat.icon === 'trending-up'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              <path v-if="stat.icon === 'receipt'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              <path v-if="stat.icon === 'package'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              <path v-if="stat.icon === 'alert-triangle'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </span>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid lg:grid-cols-2 gap-6 mb-6">
      <!-- Sales Trend Chart -->
      <div class="glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tren Penjualan</h2>
          <div class="flex gap-1">
            <button @click="changePeriod(7)" class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
              :class="chartPeriod === 7 ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'">7H</button>
            <button @click="changePeriod(30)" class="px-2.5 py-1 rounded text-xs font-medium transition-colors"
              :class="chartPeriod === 30 ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'">30H</button>
          </div>
        </div>
        <div class="h-64">
          <SkeletonLoader v-if="loading" variant="chart" />
          <Line v-else-if="salesChartData" :data="salesChartData" :options="chartOptions" />
          <div v-else class="flex items-center justify-center h-full text-gray-400 text-sm">Belum ada data</div>
        </div>
      </div>

      <!-- Top Products Chart -->
      <div class="glass rounded-xl p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Produk Terlaris</h2>
        <div class="h-64">
          <SkeletonLoader v-if="loading" variant="chart" />
          <div v-else-if="!topProductsData || topProductsData.labels.length === 0" class="flex items-center justify-center h-full text-gray-400 text-sm">Belum ada data</div>
          <Bar v-else :data="topProductsData" :options="barOptions" />
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Low Stock -->
      <div class="glass rounded-xl p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Produk Hampir Habis</h2>
        <SkeletonLoader v-if="loading" variant="list" :rows="4" />
        <div v-else-if="lowStockProducts.length === 0" class="text-sm text-gray-400 py-8 text-center">
          Semua stok aman
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="p in lowStockProducts"
            :key="p.id"
            class="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.name }}</p>
              <p class="text-xs text-gray-500">SKU: {{ p.sku }}</p>
            </div>
            <span class="text-sm font-semibold text-red-600 dark:text-red-400">{{ p.stock }} tersisa</span>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Transaksi Terbaru</h2>
          <button @click="router.push('/transactions')" class="text-sm text-primary hover:underline">Lihat Semua</button>
        </div>
        <SkeletonLoader v-if="loading" variant="list" :rows="5" />
        <div v-else-if="recentTransactions.length === 0" class="text-sm text-gray-400 py-8 text-center">
          Belum ada transaksi
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="t in recentTransactions"
            :key="t.id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
          >
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ t.invoice_number }}</p>
              <p class="text-xs text-gray-500">{{ new Date(t.created_at).toLocaleDateString('id-ID') }}</p>
            </div>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(t.total) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
      akbar.sinyo
    </div>
  </div>
</template>
