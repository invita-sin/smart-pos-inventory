<script setup>
import { ref, onMounted } from 'vue'
import { useSupplierStore } from '../stores/supplierStore'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const supplierStore = useSupplierStore()

const showForm = ref(false)
const editingSupplier = ref(null)
const form = ref({ name: '', phone: '', address: '', email: '' })
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

onMounted(() => supplierStore.fetchAll())

function openCreate() {
  editingSupplier.value = null
  form.value = { name: '', phone: '', address: '', email: '' }
  showForm.value = true
}

function openEdit(supplier) {
  editingSupplier.value = supplier
  form.value = {
    name: supplier.name,
    phone: supplier.phone || '',
    address: supplier.address || '',
    email: supplier.email || ''
  }
  showForm.value = true
}

async function save() {
  if (editingSupplier.value) {
    await supplierStore.update(editingSupplier.value.id, form.value)
  } else {
    await supplierStore.create(form.value)
  }
  showForm.value = false
}

function confirmDelete(supplier) {
  deleteTarget.value = supplier
  showDeleteModal.value = true
}

async function deleteSupplier() {
  if (deleteTarget.value) {
    await supplierStore.remove(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Supplier</h1>
      <button @click="openCreate" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
        + Tambah Supplier
      </button>
    </div>

    <SkeletonLoader v-if="supplierStore.loading" variant="table" :cols="5" :rows="5" />
    <div v-else class="glass rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nama</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Telepon</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Alamat</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in supplierStore.suppliers" :key="s.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ s.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.phone || '-' }}</td>
            <td class="px-4 py-3 text-gray-500">{{ s.email || '-' }}</td>
            <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ s.address || '-' }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-2">
                <button @click="openEdit(s)" class="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button @click="confirmDelete(s)" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="supplierStore.suppliers.length === 0">
            <td colspan="5" class="text-center py-12 text-gray-400">Belum ada supplier</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ editingSupplier ? 'Edit Supplier' : 'Tambah Supplier' }}
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama *</label>
            <input v-model="form.name" required class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telepon</label>
            <input v-model="form.phone" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="form.email" type="email" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat</label>
            <textarea v-model="form.address" rows="2" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none"></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showForm = false" class="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">Batal</button>
          <button @click="save" class="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium">{{ editingSupplier ? 'Simpan' : 'Tambah' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Supplier</h3>
        <p class="text-sm text-gray-500 mb-4">Yakin ingin menghapus <strong>{{ deleteTarget?.name }}</strong>?</p>
        <div class="flex gap-3">
          <button @click="showDeleteModal = false" class="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">Batal</button>
          <button @click="deleteSupplier" class="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>
