<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '../stores/productStore'
import { useCategoryStore } from '../stores/categoryStore'
import { useSupplierStore } from '../stores/supplierStore'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const categoryStore = useCategoryStore()
const supplierStore = useSupplierStore()

const isEdit = !!route.params.id
const loading = ref(false)
const saving = ref(false)

const form = ref({
  name: '',
  sku: '',
  barcode: '',
  category_id: '',
  supplier_id: '',
  purchase_price: 0,
  selling_price: 0,
  stock: 0,
  unit: 'pcs',
  image: ''
})

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchAll(),
    supplierStore.fetchAll()
  ])
  if (isEdit) {
    loading.value = true
    const product = await productStore.getById(route.params.id)
    if (product) {
      form.value = {
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        purchase_price: product.purchase_price || 0,
        selling_price: product.selling_price || 0,
        stock: product.stock || 0,
        unit: product.unit || 'pcs',
        image: product.image || ''
      }
    }
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    if (isEdit) {
      await productStore.update(route.params.id, form.value)
    } else {
      await productStore.create(form.value)
    }
    router.push('/products')
  } catch {
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      {{ isEdit ? 'Edit Produk' : 'Tambah Produk' }}
    </h1>

    <SkeletonLoader v-if="loading" variant="form" />

    <form v-else @submit.prevent="save" class="glass rounded-xl p-6 space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Produk *</label>
          <input v-model="form.name" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU *</label>
          <input v-model="form.sku" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
          <input v-model="form.barcode" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
          <select v-model="form.category_id" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Pilih Kategori</option>
            <option v-for="c in categoryStore.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
          <select v-model="form.supplier_id" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Pilih Supplier</option>
            <option v-for="s in supplierStore.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Modal *</label>
          <input v-model.number="form.purchase_price" type="number" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga Jual *</label>
          <input v-model.number="form.selling_price" type="number" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok Awal</label>
          <input v-model.number="form.stock" type="number" :disabled="isEdit" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-50" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Satuan</label>
          <select v-model="form.unit" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="pcs">Pcs</option>
            <option value="kg">Kg</option>
            <option value="liter">Liter</option>
            <option value="box">Box</option>
            <option value="pack">Pack</option>
            <option value="sak">Sak</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button type="button" @click="router.back()" class="px-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
        <button type="submit" :disabled="saving" class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50">
          {{ saving ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Simpan') }}
        </button>
      </div>
    </form>
  </div>
</template>
