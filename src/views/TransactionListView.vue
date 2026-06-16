<script setup>
import { ref, onMounted } from 'vue'
import { useTransactionStore } from '../stores/transactionStore'
import { usePdfExport } from '../composables/useExport'
import ReceiptContent from '../components/ReceiptContent.vue'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const transactionStore = useTransactionStore()
const pdf = usePdfExport()
const filter = ref('all')
const selectedTransaction = ref(null)
const showDetail = ref(false)

onMounted(async () => {
  await transactionStore.fetchAll()
  applyFilter()
})

const filteredTransactions = ref([])

function applyFilter() {
  const now = new Date()
  let startDate
  switch (filter.value) {
    case 'hari':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'minggu':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'bulan':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'tahun':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      filteredTransactions.value = transactionStore.transactions
      return
  }
  filteredTransactions.value = transactionStore.transactions.filter(
    t => new Date(t.created_at) >= startDate
  )
}

async function viewDetail(transaction) {
  selectedTransaction.value = await transactionStore.getById(transaction.id)
  showDetail.value = true
}

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Riwayat Transaksi</h1>

    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex gap-2">
        <button
          v-for="f in [{key:'all',label:'Semua'},{key:'hari',label:'Hari Ini'},{key:'minggu',label:'Minggu Ini'},{key:'bulan',label:'Bulan Ini'},{key:'tahun',label:'Tahun Ini'}]"
          :key="f.key"
          @click="filter = f.key; applyFilter()"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="filter === f.key ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <SkeletonLoader v-if="transactionStore.loading" variant="table" :cols="5" :rows="6" />
    <div v-else class="glass rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Invoice</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tanggal</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Metode</th>
            <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Total</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in filteredTransactions" :key="t.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ t.invoice_number }}</td>
            <td class="px-4 py-3 text-gray-500">{{ new Date(t.created_at).toLocaleDateString('id-ID', { day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' }) }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                :class="t.payment_method === 'tunai' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'">
                {{ t.payment_method }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(t.total) }}</td>
            <td class="px-4 py-3 text-center">
              <button @click="viewDetail(t)" class="px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors">Detail</button>
            </td>
          </tr>
          <tr v-if="filteredTransactions.length === 0">
            <td colspan="5" class="text-center py-12 text-gray-400">Belum ada transaksi</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetail && selectedTransaction" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">Detail Transaksi</h3>
          <button @click="showDetail = false" class="p-1 rounded text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div id="detail-receipt">
          <ReceiptContent
            :transaction="selectedTransaction"
            kasir="-"
            storeName="SmartPOS"
            storeAddress="Jl. Merdeka No. 123"
            storePhone="0812-3456-7890"
          />
        </div>

        <div class="mt-4 space-y-2">
          <button
            @click="pdf.exportReceiptPdf('detail-receipt', `${selectedTransaction.invoice_number}.pdf`)"
            class="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            {{ pdf.generating ? 'Menyiapkan...' : 'Download Struk (PDF)' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
