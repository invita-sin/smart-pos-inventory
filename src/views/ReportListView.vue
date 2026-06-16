<script setup>
import { ref, computed } from 'vue'
import { useReportStore } from '../stores/reportStore'
import { usePdfExport } from '../composables/useExport'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import { supabase } from '../lib/supabase'

const reportStore = useReportStore()
const pdf = usePdfExport()
const activeTab = ref('penjualan')
const stockTab = ref('current')

// Sales Report
const salesData = ref(null)
const dateRange = ref('bulan')

// Stock Current
const stockData = ref([])

// Stock In Report
const stockInData = ref([])
const stockInRange = ref('bulan')

// Stock Out Report
const stockOutData = ref([])
const stockOutRange = ref('bulan')

function getDateRange(range) {
  const now = new Date()
  let start
  switch (range) {
    case 'hari':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'minggu':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'bulan':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'tahun':
      start = new Date(now.getFullYear(), 0, 1)
      break
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { start, end: now }
}

async function loadSalesReport() {
  const { start, end } = getDateRange(dateRange.value)
  salesData.value = await reportStore.getSalesReport(
    start.toISOString(),
    end.toISOString()
  )
}

async function loadStockReport() {
  reportStore.loading = true
  try {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('stock', { ascending: true })
    stockData.value = data || []
  } finally {
    reportStore.loading = false
  }
}

async function loadStockInReport() {
  reportStore.loading = true
  try {
    const { start, end } = getDateRange(stockInRange.value)
    const { data } = await supabase
      .from('stock_ins')
      .select('*, products(name), suppliers(name)')
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())
      .order('date', { ascending: false })
    stockInData.value = data || []
  } finally {
    reportStore.loading = false
  }
}

async function loadStockOutReport() {
  reportStore.loading = true
  try {
    const { start, end } = getDateRange(stockOutRange.value)
    const { data } = await supabase
      .from('stock_outs')
      .select('*, products(name)')
      .gte('date', start.toISOString())
      .lte('date', end.toISOString())
      .order('date', { ascending: false })
    stockOutData.value = data || []
  } finally {
    reportStore.loading = false
  }
}

const totalOmzet = computed(() => {
  if (!salesData) return 0
  return salesData.value?.reduce((s, r) => s + (r.total || 0), 0) || 0
})

const totalProfit = computed(() => {
  if (!salesData) return 0
  return salesData.value?.reduce((s, r) => s + (r.profit || 0), 0) || 0
})

const lowStockCount = computed(() => stockData.value.filter(p => p.stock <= 10).length)
const outOfStockCount = computed(() => stockData.value.filter(p => p.stock <= 0).length)

const stockInTotalQty = computed(() => stockInData.value.reduce((s, r) => s + (r.qty || 0), 0))
const stockInTotalValue = computed(() => stockInData.value.reduce((s, r) => s + (r.qty || 0) * (r.purchase_price || 0), 0))

const stockOutTotalQty = computed(() => stockOutData.value.reduce((s, r) => s + (r.qty || 0), 0))

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function exportSalesCsv() {
  if (!salesData.value?.length) return
  const headers = ['Invoice', 'Tanggal', 'Total', 'Profit']
  const rows = salesData.value.map(r => [
    r.invoice_number,
    formatDate(r.created_at),
    r.total,
    r.profit
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCsv(csv, `laporan-penjualan-${dateRange.value}.csv`)
}

function exportStockCsv() {
  if (!stockData.value.length) return
  const headers = ['Produk', 'SKU', 'Stok', 'Satuan', 'Status']
  const rows = stockData.value.map(p => [
    p.name, p.sku, p.stock, p.unit,
    p.stock <= 0 ? 'Habis' : p.stock <= 10 ? 'Hampir Habis' : 'Tersedia'
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCsv(csv, 'laporan-stok.csv')
}

function exportStockInCsv() {
  if (!stockInData.value.length) return
  const headers = ['Tanggal', 'Produk', 'Supplier', 'Jumlah', 'Harga Modal', 'Total']
  const rows = stockInData.value.map(r => [
    formatDate(r.date),
    r.products?.name || '-',
    r.suppliers?.name || '-',
    r.qty,
    r.purchase_price || 0,
    (r.qty || 0) * (r.purchase_price || 0)
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCsv(csv, `laporan-barang-masuk-${stockInRange.value}.csv`)
}

function exportStockOutCsv() {
  if (!stockOutData.value.length) return
  const headers = ['Tanggal', 'Produk', 'Jumlah', 'Keterangan']
  const rows = stockOutData.value.map(r => [
    formatDate(r.date),
    r.products?.name || '-',
    r.qty,
    r.reason
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  downloadCsv(csv, `laporan-barang-keluar-${stockOutRange.value}.csv`)
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click(); URL.revokeObjectURL(url)
}

function handleTabChange(tab) {
  activeTab.value = tab
  if (tab === 'penjualan') loadSalesReport()
  if (tab === 'stok' && stockTab.value === 'current') loadStockReport()
  if (tab === 'stok' && stockTab.value === 'in') loadStockInReport()
  if (tab === 'stok' && stockTab.value === 'out') loadStockOutReport()
}

function handleStockTabChange(sub) {
  stockTab.value = sub
  if (sub === 'current') loadStockReport()
  if (sub === 'in') loadStockInReport()
  if (sub === 'out') loadStockOutReport()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Laporan</h1>

    <!-- Main Tabs -->
    <div class="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
      <button
        @click="handleTabChange('penjualan')"
        class="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === 'penjualan' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >Penjualan</button>
      <button
        @click="handleTabChange('stok')"
        class="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === 'stok' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >Stok</button>
    </div>

    <!-- ==================== SALES REPORT ==================== -->
    <div v-if="activeTab === 'penjualan'">
      <div class="glass rounded-xl p-4 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex gap-2">
            <button
              v-for="d in [{key:'hari',label:'Hari Ini'},{key:'minggu',label:'7 Hari'},{key:'bulan',label:'Bulan Ini'},{key:'tahun',label:'Tahun Ini'}]"
              :key="d.key"
              @click="dateRange = d.key; loadSalesReport()"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="dateRange === d.key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              {{ d.label }}
            </button>
          </div>
          <div v-if="salesData?.length" class="flex gap-2">
            <button @click="exportSalesCsv" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">CSV</button>
            <button @click="pdf.exportPdf('report-content', `laporan-penjualan-${dateRange.value}.pdf`)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-dark">
              {{ pdf.generating ? '...' : 'PDF' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="reportStore.loading">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div v-for="i in 3" :key="i" class="glass rounded-xl p-5 animate-pulse">
            <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div class="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <SkeletonLoader variant="table" :cols="4" :rows="5" />
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div class="glass rounded-xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Omzet</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalOmzet) }}</p>
        </div>
        <div class="glass rounded-xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Profit</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalProfit) }}</p>
        </div>
        <div class="glass rounded-xl p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Transaksi</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ salesData?.length || 0 }}</p>
        </div>
      </div>

      <div class="glass rounded-xl overflow-hidden">
        <table class="w-full text-sm" v-if="salesData?.length">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Invoice</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Profit</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in salesData" :key="r.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ r.invoice_number }}</td>
              <td class="px-4 py-3 text-gray-500">{{ formatDate(r.created_at) }}</td>
              <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(r.total) }}</td>
              <td class="px-4 py-3 text-right font-medium text-emerald-600">{{ formatCurrency(r.profit) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="text-center py-12 text-gray-400">Tidak ada data penjualan</div>
      </div>
    </div>

    <!-- ==================== STOCK REPORT ==================== -->
    <div v-if="activeTab === 'stok'">
      <!-- Sub-tabs -->
      <div class="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
        <button
          @click="handleStockTabChange('current')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="stockTab === 'current' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        >Stok Saat Ini</button>
        <button
          @click="handleStockTabChange('in')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="stockTab === 'in' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        >Barang Masuk</button>
        <button
          @click="handleStockTabChange('out')"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="stockTab === 'out' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        >Barang Keluar</button>
      </div>

      <!-- STOK SAAT INI -->
      <div v-if="stockTab === 'current'">
        <div v-if="reportStore.loading">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div v-for="i in 3" :key="i" class="glass rounded-xl p-5 animate-pulse">
              <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div class="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <SkeletonLoader variant="table" :cols="4" :rows="8" />
        </div>

        <div v-else>
          <div class="flex justify-end mb-4">
            <button @click="exportStockCsv" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">CSV</button>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Produk</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stockData.length }}</p>
            </div>
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Hampir Habis</p>
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ lowStockCount }}</p>
            </div>
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Habis</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ outOfStockCount }}</p>
            </div>
          </div>

          <div class="glass rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Produk</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">SKU</th>
                  <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Stok</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in stockData" :key="p.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ p.name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ p.sku }}</td>
                  <td class="px-4 py-3 text-right font-medium">{{ p.stock }} {{ p.unit }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="p.stock <= 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : p.stock <= 10 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'">
                      {{ p.stock <= 0 ? 'Habis' : p.stock <= 10 ? 'Hampir Habis' : 'Tersedia' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- BARANG MASUK -->
      <div v-if="stockTab === 'in'">
        <div class="glass rounded-xl p-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <button
                v-for="d in [{key:'hari',label:'Hari Ini'},{key:'minggu',label:'7 Hari'},{key:'bulan',label:'Bulan Ini'},{key:'tahun',label:'Tahun Ini'}]"
                :key="d.key"
                @click="stockInRange = d.key; loadStockInReport()"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="stockInRange === d.key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
              >
                {{ d.label }}
              </button>
            </div>
            <div v-if="stockInData.length" class="flex gap-2">
              <button @click="exportStockInCsv" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">CSV</button>
              <button @click="pdf.exportPdf('stock-in-content', `laporan-barang-masuk-${stockInRange.value}.pdf`)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-dark">
                {{ pdf.generating ? '...' : 'PDF' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="reportStore.loading">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div v-for="i in 3" :key="i" class="glass rounded-xl p-5 animate-pulse">
              <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div class="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <SkeletonLoader variant="table" :cols="5" :rows="8" />
        </div>

        <div v-else>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Barang Masuk</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stockInData.length }} transaksi</p>
            </div>
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jumlah Item</p>
              <p class="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{{ stockInTotalQty }} item</p>
            </div>
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Nilai</p>
              <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(stockInTotalValue) }}</p>
            </div>
          </div>

          <div class="glass rounded-xl overflow-hidden">
            <table class="w-full text-sm" v-if="stockInData.length">
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
                <tr v-for="r in stockInData" :key="r.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 text-gray-500">{{ formatDate(r.date) }}</td>
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ r.products?.name }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ r.suppliers?.name || '-' }}</td>
                  <td class="px-4 py-3 text-center font-medium">{{ r.qty }}</td>
                  <td class="px-4 py-3 text-right text-gray-500">{{ formatCurrency(r.purchase_price) }}</td>
                  <td class="px-4 py-3 text-right font-medium">{{ formatCurrency((r.qty || 0) * (r.purchase_price || 0)) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="text-center py-12 text-gray-400">Tidak ada barang masuk</div>
          </div>
        </div>
      </div>

      <!-- BARANG KELUAR -->
      <div v-if="stockTab === 'out'">
        <div class="glass rounded-xl p-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <button
                v-for="d in [{key:'hari',label:'Hari Ini'},{key:'minggu',label:'7 Hari'},{key:'bulan',label:'Bulan Ini'},{key:'tahun',label:'Tahun Ini'}]"
                :key="d.key"
                @click="stockOutRange = d.key; loadStockOutReport()"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="stockOutRange === d.key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
              >
                {{ d.label }}
              </button>
            </div>
            <div v-if="stockOutData.length" class="flex gap-2">
              <button @click="exportStockOutCsv" class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">CSV</button>
              <button @click="pdf.exportPdf('stock-out-content', `laporan-barang-keluar-${stockOutRange.value}.pdf`)" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-dark">
                {{ pdf.generating ? '...' : 'PDF' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="reportStore.loading">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div v-for="i in 3" :key="i" class="glass rounded-xl p-5 animate-pulse">
              <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div class="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <SkeletonLoader variant="table" :cols="4" :rows="8" />
        </div>

        <div v-else>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Barang Keluar</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stockOutData.length }} transaksi</p>
            </div>
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Jumlah Item</p>
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stockOutTotalQty }} item</p>
            </div>
            <div class="glass rounded-xl p-5">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Rata-rata per Transaksi</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stockOutData.length ? Math.round(stockOutTotalQty / stockOutData.length) : 0 }} item</p>
            </div>
          </div>

          <div class="glass rounded-xl overflow-hidden">
            <table class="w-full text-sm" v-if="stockOutData.length">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Produk</th>
                  <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Jumlah</th>
                  <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in stockOutData" :key="r.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 text-gray-500">{{ formatDate(r.date) }}</td>
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ r.products?.name }}</td>
                  <td class="px-4 py-3 text-center font-medium text-red-500">{{ r.qty }}</td>
                  <td class="px-4 py-3 text-gray-500">{{ r.reason }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="text-center py-12 text-gray-400">Tidak ada barang keluar</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden sections for PDF export -->
    <div id="report-content" class="fixed -top-full left-0 bg-white text-black p-8 w-[680px]">
      <div class="text-center mb-6">
        <div class="text-xl font-bold">SmartPOS Inventory</div>
        <div class="text-sm text-gray-500">Laporan Penjualan</div>
        <div class="text-xs text-gray-400" v-if="salesData?.length">
          {{ formatDate(salesData[0].created_at) }}
        </div>
      </div>
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b-2 border-gray-300">
            <th class="text-left py-2 text-xs uppercase text-gray-500">Invoice</th>
            <th class="text-left py-2 text-xs uppercase text-gray-500">Tanggal</th>
            <th class="text-right py-2 text-xs uppercase text-gray-500">Total</th>
            <th class="text-right py-2 text-xs uppercase text-gray-500">Profit</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in salesData || []" :key="r.id" class="border-b border-gray-200">
            <td class="py-1.5">{{ r.invoice_number }}</td>
            <td class="py-1.5">{{ formatDate(r.created_at) }}</td>
            <td class="py-1.5 text-right">{{ formatCurrency(r.total) }}</td>
            <td class="py-1.5 text-right">{{ formatCurrency(r.profit) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-300 font-bold">
            <td colspan="3" class="py-2 text-right">Total Omzet:</td>
            <td class="py-2 text-right">{{ formatCurrency(totalOmzet) }}</td>
          </tr>
          <tr class="font-bold text-emerald-600">
            <td colspan="3" class="py-1 text-right">Total Profit:</td>
            <td class="py-1 text-right">{{ formatCurrency(totalProfit) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div id="stock-in-content" class="fixed -top-full left-0 bg-white text-black p-8 w-[680px]">
      <div class="text-center mb-6">
        <div class="text-xl font-bold">SmartPOS Inventory</div>
        <div class="text-sm text-gray-500">Laporan Barang Masuk</div>
      </div>
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b-2 border-gray-300">
            <th class="text-left py-2 text-xs uppercase text-gray-500">Tanggal</th>
            <th class="text-left py-2 text-xs uppercase text-gray-500">Produk</th>
            <th class="text-left py-2 text-xs uppercase text-gray-500">Supplier</th>
            <th class="text-right py-2 text-xs uppercase text-gray-500">Jumlah</th>
            <th class="text-right py-2 text-xs uppercase text-gray-500">Harga Modal</th>
            <th class="text-right py-2 text-xs uppercase text-gray-500">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in stockInData || []" :key="r.id" class="border-b border-gray-200">
            <td class="py-1.5">{{ formatDate(r.date) }}</td>
            <td class="py-1.5">{{ r.products?.name }}</td>
            <td class="py-1.5">{{ r.suppliers?.name || '-' }}</td>
            <td class="py-1.5 text-right">{{ r.qty }}</td>
            <td class="py-1.5 text-right">{{ formatCurrency(r.purchase_price) }}</td>
            <td class="py-1.5 text-right">{{ formatCurrency((r.qty || 0) * (r.purchase_price || 0)) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-gray-300 font-bold">
            <td colspan="5" class="py-2 text-right">Total Nilai:</td>
            <td class="py-2 text-right">{{ formatCurrency(stockInTotalValue) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div id="stock-out-content" class="fixed -top-full left-0 bg-white text-black p-8 w-[680px]">
      <div class="text-center mb-6">
        <div class="text-xl font-bold">SmartPOS Inventory</div>
        <div class="text-sm text-gray-500">Laporan Barang Keluar</div>
      </div>
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b-2 border-gray-300">
            <th class="text-left py-2 text-xs uppercase text-gray-500">Tanggal</th>
            <th class="text-left py-2 text-xs uppercase text-gray-500">Produk</th>
            <th class="text-right py-2 text-xs uppercase text-gray-500">Jumlah</th>
            <th class="text-left py-2 text-xs uppercase text-gray-500">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in stockOutData || []" :key="r.id" class="border-b border-gray-200">
            <td class="py-1.5">{{ formatDate(r.date) }}</td>
            <td class="py-1.5">{{ r.products?.name }}</td>
            <td class="py-1.5 text-right">{{ r.qty }}</td>
            <td class="py-1.5">{{ r.reason }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
