<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStockStore } from '../stores/stockStore'
import { useProductStore } from '../stores/productStore'
import { useSupplierStore } from '../stores/supplierStore'
import { useToastStore } from '../stores/toastStore'

const router = useRouter()
const stockStore = useStockStore()
const productStore = useProductStore()
const supplierStore = useSupplierStore()
const toast = useToastStore()

const saving = ref(false)
const form = ref({
  product_id: '',
  qty: 1,
  purchase_price: 0,
  supplier_id: ''
})

onMounted(async () => {
  await Promise.all([
    productStore.fetchAll(),
    supplierStore.fetchAll()
  ])
})

async function submit() {
  saving.value = true
  try {
    await stockStore.stockIn(form.value)
    // Refresh products to get updated stock
    await productStore.fetchAll()
    router.push('/stock')
  } catch (e) {
    // error toast handled by store
  } finally {
    saving.value = false
  }
}

function onProductChange() {
  const product = productStore.products.find(p => p.id === form.value.product_id)
  if (product) {
    form.value.purchase_price = product.purchase_price || 0
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Barang Masuk</h1>

    <form @submit.prevent="submit" class="glass rounded-xl p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produk *</label>
        <select v-model="form.product_id" @change="onProductChange" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Pilih Produk</option>
          <option v-for="p in productStore.products" :key="p.id" :value="p.id">{{ p.name }} (Stok: {{ p.stock }})</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
        <select v-model="form.supplier_id" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <option value="">Pilih Supplier</option>
          <option v-for="s in supplierStore.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah *</label>
          <input v-model.number="form.qty" type="number" min="1" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Modal</label>
          <input v-model.number="form.purchase_price" type="number" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="button" @click="router.back()" class="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Batal</button>
        <button type="submit" :disabled="saving" class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-50">
          {{ saving ? 'Menyimpan...' : 'Simpan Barang Masuk' }}
        </button>
      </div>
    </form>
  </div>
</template>
