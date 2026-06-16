<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductStore } from '../stores/productStore'
import { useAuthStore } from '../stores/authStore'
import { useProductCsv } from '../composables/useExport'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const router = useRouter()
const productStore = useProductStore()
const auth = useAuthStore()
const csv = useProductCsv()

const search = ref('')
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const fileInput = ref(null)

const filteredProducts = ref([])

onMounted(async () => {
  await productStore.fetchAll()
  filteredProducts.value = productStore.products
})

function handleFileUpload(e) {
  const file = e.target.files[0]
  if (file) csv.importCsv(file).then(() => productStore.fetchAll())
  e.target.value = ''
}

function filterProducts() {
  const q = search.value.toLowerCase()
  filteredProducts.value = productStore.products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku?.toLowerCase().includes(q) ||
    p.barcode?.toLowerCase().includes(q)
  )
}

function confirmDelete(product) {
  deleteTarget.value = product
  showDeleteModal.value = true
}

async function deleteProduct() {
  if (deleteTarget.value) {
    await productStore.remove(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
  }
}

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Produk</h1>
      <div class="flex items-center gap-2 flex-wrap">
        <button
          @click="csv.exportCsv(productStore.products)"
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Export CSV
        </button>
        <input ref="fileInput" type="file" accept=".csv" @change="handleFileUpload" class="hidden" />
        <button
          v-if="auth.user?.role === 'owner'"
          @click="fileInput?.click()"
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Import CSV
        </button>
        <router-link
          v-if="auth.user?.role === 'owner'"
          to="/products/new"
          class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          + Tambah Produk
        </router-link>
      </div>
    </div>

    <div class="glass rounded-xl p-4 mb-6">
      <input
        v-model="search"
        @input="filterProducts"
        placeholder="Cari produk..."
        class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
      />
      <p v-if="csv.importResult" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {{ csv.importResult }}
      </p>
    </div>

    <SkeletonLoader v-if="productStore.loading" variant="table" :cols="auth.user?.role === 'owner' ? 7 : 6" :rows="6" />
    <div v-else class="glass rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nama</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">SKU</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Kategori</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Harga Modal</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Harga Jual</th>
              <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Stok</th>
              <th v-if="auth.user?.role === 'owner'" class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ p.name }}</td>
              <td class="px-4 py-3 text-gray-500">{{ p.sku }}</td>
              <td class="px-4 py-3 text-gray-500">{{ p.categories?.name || '-' }}</td>
              <td class="px-4 py-3 text-right text-gray-500">{{ formatCurrency(p.purchase_price) }}</td>
              <td class="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">{{ formatCurrency(p.selling_price) }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="p.stock <= 10 ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'">
                  {{ p.stock }} {{ p.unit }}
                </span>
              </td>
              <td v-if="auth.user?.role === 'owner'" class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button @click="router.push(`/products/${p.id}/edit`)" class="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button @click="confirmDelete(p)" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td :colspan="auth.user?.role === 'owner' ? 7 : 6" class="text-center py-12 text-gray-400">
                Tidak ada produk
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Produk</h3>
        <p class="text-sm text-gray-500 mb-4">Yakin ingin menghapus <strong>{{ deleteTarget?.name }}</strong>?</p>
        <div class="flex gap-3">
          <button @click="showDeleteModal = false" class="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">Batal</button>
          <button @click="deleteProduct" class="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>
