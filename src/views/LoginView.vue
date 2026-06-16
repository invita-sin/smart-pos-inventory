<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const seeding = ref(false)
const seedResult = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  const result = await auth.login(email.value, password.value)
  loading.value = false
  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.error
  }
}

async function handleSeed() {
  seedResult.value = ''
  seeding.value = true
  const res = await auth.seedDemoData()
  seeding.value = false
  const parts = []
  if (res.users.length) parts.push(`${res.users.length} user (${res.users.filter(u => u.status === 'created').length} baru)`)
  if (res.categories) parts.push(`${res.categories} kategori`)
  if (res.suppliers) parts.push(`${res.suppliers} supplier`)
  if (res.products) parts.push(`${res.products} produk`)
  if (parts.length) seedResult.value = '✅ ' + parts.join(', ') + ' berhasil'
  if (res.errors.length) seedResult.value += ' ⚠️ ' + res.errors.join('; ')
}
</script>

<template>
  <div class="w-full max-w-md">
    <div class="glass rounded-2xl p-8 shadow-xl">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">SmartPOS</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Masuk ke akun Anda</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@smartpos.com"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500 text-center">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <div class="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
        <p class="font-medium mb-1">Akun Demo:</p>
        <p>Owner: owner@smartpos.com / owner123</p>
        <p>Kasir: kasir@smartpos.com / kasir123</p>
        <p class="mt-2">
          <button
            @click="handleSeed"
            :disabled="seeding"
            class="text-primary hover:underline font-medium disabled:opacity-50"
          >
            {{ seeding ? 'Menambahkan...' : 'Buat Akun + Data Demo' }}
          </button>
        </p>
        <p v-if="seedResult" class="mt-1" :class="seedResult.includes('⚠️') ? 'text-amber-600' : 'text-emerald-600'">
          {{ seedResult }}
        </p>
      </div>
    </div>
  </div>
</template>
