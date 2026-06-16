<script setup>
import { ref, computed } from 'vue'
import { useProductStore } from '../stores/productStore'
import { useCartStore } from '../stores/cartStore'
import { useTransactionStore } from '../stores/transactionStore'
import { useAuthStore } from '../stores/authStore'
import { usePdfExport } from '../composables/useExport'
import { useToastStore } from '../stores/toastStore'
import ReceiptContent from '../components/ReceiptContent.vue'

const productStore = useProductStore()
const cart = useCartStore()
const transactionStore = useTransactionStore()
const auth = useAuthStore()
const pdf = usePdfExport()
const toast = useToastStore()

const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
const paymentMethod = ref('tunai')
const amountPaid = ref(0)
const showReceipt = ref(false)
const receiptTransaction = ref(null)
const loading = ref(false)

const change = computed(() => Math.max(0, amountPaid.value - cart.subtotal))

async function onSearch() {
  if (searchQuery.value.length < 1) {
    searchResults.value = []
    return
  }
  searching.value = true
  searchResults.value = await productStore.search(searchQuery.value)
  searching.value = false
}

function addToCart(product) {
  if (product.stock <= 0) {
    toast.error(`Stok ${product.name} habis`)
    return
  }
  cart.addItem(product)
  searchQuery.value = ''
  searchResults.value = []
}

async function checkout() {
  if (cart.items.length === 0) return
  if (paymentMethod === 'tunai' && amountPaid.value < cart.subtotal) {
    toast.error('Jumlah dibayar kurang dari total belanja')
    return
  }
  loading.value = true
  try {
    const result = await transactionStore.create({
      items: cart.items.map(i => ({ product_id: i.id, qty: i.qty, price: i.selling_price })),
      total: cart.subtotal,
      payment_method: paymentMethod.value,
      amount_paid: amountPaid.value
    })
    const full = await transactionStore.getById(result.id)
    receiptTransaction.value = full
    showReceipt.value = true
    cart.clear()
    amountPaid.value = 0
  } catch (e) {
    toast.error('Gagal memproses transaksi: ' + e.message)
  } finally {
    loading.value = false
  }
}

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}

function printReceipt() {
  window.print()
}
</script>

<template>
  <div class="h-[calc(100vh-6rem)] lg:h-[calc(100vh-3rem)] flex flex-col lg:flex-row gap-4">
    <!-- Product Search -->
    <div class="flex-1 flex flex-col glass rounded-xl p-4 overflow-hidden">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cari Produk</h2>
      <div class="relative mb-4">
        <input
          v-model="searchQuery"
          @input="onSearch"
          placeholder="Cari nama, SKU, atau barcode..."
          class="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
        />
        <svg class="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <div v-if="searching" class="text-center text-gray-400 py-8">Mencari...</div>

      <div v-else-if="searchResults.length > 0" class="flex-1 overflow-y-auto space-y-2">
        <div
          v-for="p in searchResults"
          :key="p.id"
          @click="addToCart(p)"
          class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-primary/5 cursor-pointer transition-colors"
        >
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ p.name }}</p>
            <p class="text-xs text-gray-500">Stok: {{ p.stock }} {{ p.unit }}</p>
          </div>
          <p class="text-sm font-semibold text-primary">{{ formatCurrency(p.selling_price) }}</p>
        </div>
      </div>

      <div v-else class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <p class="text-sm">Ketik untuk mencari produk</p>
        </div>
      </div>
    </div>

    <!-- Cart & Checkout -->
    <div class="lg:w-96 flex flex-col glass rounded-xl p-4 overflow-hidden">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Keranjang</h2>

      <div v-if="cart.items.length === 0" class="flex-1 flex items-center justify-center text-gray-400">
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
          <p class="text-sm">Keranjang kosong</p>
        </div>
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-2 mb-4">
        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
        >
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            <p class="text-xs text-gray-500">{{ formatCurrency(item.selling_price) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="cart.updateQty(item.id, item.qty - 1)" class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm hover:bg-gray-300 dark:hover:bg-gray-600">-</button>
            <span class="w-8 text-center text-sm font-medium">{{ item.qty }}</span>
            <button @click="cart.updateQty(item.id, item.qty + 1)" class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Total Item</span>
          <span class="font-medium">{{ cart.totalItems }}</span>
        </div>
        <div class="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span class="text-primary">{{ formatCurrency(cart.subtotal) }}</span>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metode Pembayaran</label>
          <select v-model="paymentMethod" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </select>
        </div>

        <div v-if="paymentMethod === 'tunai'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Dibayar</label>
          <input v-model.number="amountPaid" type="number" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
          <p v-if="amountPaid >= cart.subtotal" class="text-sm text-emerald-600 mt-1">Kembali: {{ formatCurrency(change) }}</p>
        </div>

        <button
          @click="checkout"
          :disabled="cart.items.length === 0 || loading"
          class="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : `Bayar ${formatCurrency(cart.subtotal)}` }}
        </button>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div v-if="showReceipt && receiptTransaction" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm">
        <div class="text-center mb-4">
          <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 class="text-base font-bold text-gray-900 dark:text-white">Pembayaran Berhasil</h3>
        </div>

        <div id="pos-receipt">
          <ReceiptContent
            :transaction="receiptTransaction"
            :kasir="auth.user?.name || '-'"
            storeName="SmartPOS"
            storeAddress="Jl. Merdeka No. 123"
            storePhone="0812-3456-7890"
          />
        </div>

        <div class="mt-4 space-y-2">
          <button @click="printReceipt" class="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
            Cetak Struk
          </button>
          <button @click="pdf.exportReceiptPdf('pos-receipt', `${receiptTransaction.invoice_number}.pdf`)" class="w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {{ pdf.generating ? 'Menyiapkan...' : 'Download PDF' }}
          </button>
          <button @click="showReceipt = false" class="w-full py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
