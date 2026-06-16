<script setup>
import { ref } from 'vue'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { useHealthCheck } from '../composables/useHealthCheck'

const ui = useUIStore()
const auth = useAuthStore()

const { status: dbStatus, message: dbMessage, check: checkConnection } = useHealthCheck()
checkConnection()

const themeOptions = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'auto', label: 'Otomatis' }
]
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Pengaturan</h1>

    <div class="space-y-6 max-w-2xl">
      <!-- Theme -->
      <div class="glass rounded-xl p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tampilan</h2>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode Tema</label>
          <div class="flex gap-2">
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              @click="ui.setTheme(opt.value)"
              class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              :class="ui.theme === opt.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Profile -->
      <div class="glass rounded-xl p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profil</h2>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Nama</span>
            <span class="font-medium">{{ auth.user?.name || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Email</span>
            <span class="font-medium">{{ auth.user?.email || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Role</span>
            <span class="font-medium capitalize">{{ auth.user?.role || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Koneksi Database -->
      <div class="glass rounded-xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Koneksi Database</h2>
          <button @click="checkConnection" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-dark transition-colors">
            Test Ulang
          </button>
        </div>
        <div
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="dbStatus === 'connected'
            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/20'
            : dbStatus === 'error'
              ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20'
              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'"
        >
          <span
            class="w-3 h-3 rounded-full flex-shrink-0"
            :class="dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-gray-400 animate-pulse'"
          />
          <div>
            <p
              class="text-sm font-medium"
              :class="dbStatus === 'connected' ? 'text-emerald-700 dark:text-emerald-400' : dbStatus === 'error' ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'"
            >
              {{ dbStatus === 'connected' ? 'Terhubung' : dbStatus === 'error' ? 'Gagal' : 'Mengetes...' }}
            </p>
            <p class="text-xs text-gray-500">{{ dbMessage }}</p>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="glass rounded-xl p-5">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tentang</h2>
        <div class="space-y-2 text-sm text-gray-500">
          <p>SmartPOS Inventory v1.0.0</p>
          <p>Aplikasi Kasir dan Manajemen Stok untuk UMKM</p>
          <p>Dibangun dengan Vue 3 + Supabase</p>
        </div>
      </div>
    </div>
  </div>
</template>
