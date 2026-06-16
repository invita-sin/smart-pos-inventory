<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import SkeletonLoader from '../components/SkeletonLoader.vue'

const userStore = useUserStore()

const showForm = ref(false)
const editingUser = ref(null)
const form = ref({ name: '', email: '', password: '', role: 'kasir' })
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const formError = ref('')

onMounted(() => userStore.fetchAll())

function openCreate() {
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: 'kasir' }
  formError.value = ''
  showForm.value = true
}

function openEdit(user) {
  editingUser.value = user
  form.value = { name: user.name, email: user.email, password: '', role: user.role }
  formError.value = ''
  showForm.value = true
}

async function save() {
  formError.value = ''
  if (!form.value.name || !form.value.email) {
    formError.value = 'Nama dan Email wajib diisi'
    return
  }
  try {
    if (editingUser.value) {
      const payload = { name: form.value.name, role: form.value.role }
      await userStore.update(editingUser.value.id, payload)
    } else {
      if (!form.value.password || form.value.password.length < 6) {
        formError.value = 'Password minimal 6 karakter'
        return
      }
      await userStore.create(form.value.email, form.value.password, form.value.name, form.value.role)
    }
    showForm.value = false
  } catch (e) {
    formError.value = e.message
  }
}

function confirmDelete(user) {
  deleteTarget.value = user
  showDeleteModal.value = true
}

async function deleteUser() {
  if (deleteTarget.value) {
    await userStore.remove(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
  }
}

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'kasir', label: 'Kasir' },
  { value: 'gudang', label: 'Gudang' }
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Pengguna</h1>
      <button @click="openCreate" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">
        + Tambah Pengguna
      </button>
    </div>

    <SkeletonLoader v-if="userStore.loading" variant="table" :cols="4" :rows="6" />
    <div v-else class="glass rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nama</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Email</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Role</th>
            <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in userStore.users" :key="u.id" class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ u.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300': u.role === 'owner',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300': u.role === 'kasir',
                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': u.role === 'gudang'
                }"
              >
                {{ u.role }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-2">
                <button @click="openEdit(u)" class="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button @click="confirmDelete(u)" class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="userStore.users.length === 0">
            <td colspan="4" class="text-center py-12 text-gray-400">Belum ada pengguna</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {{ editingUser ? 'Edit Pengguna' : 'Tambah Pengguna' }}
        </h3>
        <div v-if="formError" class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {{ formError }}
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama *</label>
            <input v-model="form.name" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input v-model="form.email" type="email" :disabled="!!editingUser" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none disabled:opacity-60" />
          </div>
          <div v-if="!editingUser">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
            <input v-model="form.password" type="password" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select v-model="form.role" class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none">
              <option v-for="r in roles" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showForm = false" class="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">Batal</button>
          <button @click="save" class="flex-1 py-2.5 rounded-lg bg-primary text-white font-medium">{{ editingUser ? 'Simpan' : 'Tambah' }}</button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Pengguna</h3>
        <p class="text-sm text-gray-500 mb-4">Yakin ingin menghapus <strong>{{ deleteTarget?.name }}</strong>?</p>
        <div class="flex gap-3">
          <button @click="showDeleteModal = false" class="flex-1 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">Batal</button>
          <button @click="deleteUser" class="flex-1 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600">Hapus</button>
        </div>
      </div>
    </div>
  </div>
</template>
