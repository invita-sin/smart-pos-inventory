<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { useToastStore } from '../stores/toastStore'
import { useRealtime } from '../composables/useRealtime'
import ToastContainer from '../components/ToastContainer.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const ui = useUIStore()

const sidebarOpen = ref(false)
const currentUser = computed(() => auth.user)

const { connected } = useRealtime()

onMounted(async () => {
  if (auth.isAuthenticated) {
    await ui.fetchLowStockCount()
    if (ui.lowStockCount > 0) {
      const toast = useToastStore()
      toast.warning(`${ui.lowStockCount} produk hampir habis! Cek halaman Stok.`)
    }
  }
})

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'grid', roles: ['owner', 'kasir', 'gudang'] },
  { name: 'POS Kasir', path: '/pos', icon: 'shopping-cart', roles: ['owner', 'kasir'] },
  { name: 'Produk', path: '/products', icon: 'package', roles: ['owner', 'kasir', 'gudang'] },
  { name: 'Kategori', path: '/categories', icon: 'tag', roles: ['owner'] },
  { name: 'Supplier', path: '/suppliers', icon: 'truck', roles: ['owner'] },
  { name: 'Pengguna', path: '/users', icon: 'users', roles: ['owner'] },
  { name: 'Stok', path: '/stock', icon: 'archive', roles: ['owner', 'gudang'] },
  { name: 'Transaksi', path: '/transactions', icon: 'receipt', roles: ['owner', 'kasir', 'gudang'] },
  { name: 'Laporan', path: '/reports', icon: 'bar-chart', roles: ['owner'] },
  { name: 'Pengaturan', path: '/settings', icon: 'settings', roles: ['owner'] }
]

const filteredNav = computed(() =>
  navItems.filter(item => item.roles.includes(auth.user?.role || 'kasir'))
)

const mobileNav = computed(() =>
  navItems.filter(item => ['dashboard', 'pos', 'products', 'reports'].includes(item.name.toLowerCase().replace(/\s/g, '')))
)

const isActive = (path) => {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar Desktop -->
    <aside class="fixed inset-y-0 left-0 z-30 w-64 glass hidden lg:flex flex-col">
      <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <h1 class="text-xl font-bold text-primary">SmartPOS</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">Inventory Management</p>
      </div>
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in filteredNav"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          :class="isActive(item.path)
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <span class="w-5 h-5 flex items-center justify-center">
            <svg v-if="item.icon === 'grid'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <svg v-else-if="item.icon === 'shopping-cart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <svg v-else-if="item.icon === 'package'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <svg v-else-if="item.icon === 'tag'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
            <svg v-else-if="item.icon === 'truck'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM9 17h10M3 13h17M3 9h13M3 5h17" /></svg>
            <svg v-else-if="item.icon === 'archive'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            <svg v-else-if="item.icon === 'receipt'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
            <svg v-else-if="item.icon === 'bar-chart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <svg v-else-if="item.icon === 'users'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
            <svg v-else-if="item.icon === 'settings'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </span>
          {{ item.name }}
          <span v-if="item.name === 'Stok' && ui.lowStockCount > 0"
                class="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
            {{ ui.lowStockCount > 99 ? '99+' : ui.lowStockCount }}
          </span>
        </router-link>
      </nav>
      <div class="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <div class="flex items-center gap-1.5 px-3 pb-1">
          <span class="w-2 h-2 rounded-full" :class="connected ? 'bg-green-500' : 'bg-gray-400'"></span>
          <span class="text-xs text-gray-400">{{ connected ? 'Live' : 'Offline' }}</span>
        </div>
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
            {{ currentUser?.name?.[0]?.toUpperCase() || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ currentUser?.name || 'User' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 capitalize">{{ currentUser?.role || 'kasir' }}</p>
          </div>
          <button @click="logout" class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header -->
    <header class="lg:hidden glass fixed top-0 inset-x-0 z-20 px-4 py-3 flex items-center justify-between">
      <button @click="sidebarOpen = !sidebarOpen" class="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <h1 class="text-lg font-bold text-primary">SmartPOS</h1>
      <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
        {{ currentUser?.name?.[0]?.toUpperCase() || 'U' }}
      </div>
    </header>

    <!-- Mobile Sidebar Overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" />

    <!-- Mobile Sidebar -->
    <aside :class="['lg:hidden fixed inset-y-0 left-0 z-50 w-64 glass flex flex-col transition-transform duration-300', sidebarOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
        <h1 class="text-xl font-bold text-primary">SmartPOS</h1>
        <button @click="sidebarOpen = false" class="p-1 rounded-lg text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
        <router-link
          v-for="item in filteredNav"
          :key="item.path"
          :to="item.path"
          @click="sidebarOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
          :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          {{ item.name }}
          <span v-if="item.name === 'Stok' && ui.lowStockCount > 0"
                class="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
            {{ ui.lowStockCount > 99 ? '99+' : ui.lowStockCount }}
          </span>
        </router-link>
      </nav>
      <div class="p-3 border-t border-gray-200/50 dark:border-gray-700/50">
        <button @click="logout" class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Keluar
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="lg:ml-64 pt-14 lg:pt-0 min-h-screen pb-20 lg:pb-0">
      <div class="p-4 lg:p-6">
        <RouterView />
      </div>
    </main>

    <ToastContainer />

    <!-- Mobile Bottom Nav -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 z-20 glass border-t border-gray-200/50 dark:border-gray-700/50">
      <div class="flex items-center justify-around py-1">
        <router-link
          v-for="item in mobileNav"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium transition-colors"
          :class="isActive(item.path) ? 'text-primary' : 'text-gray-400 dark:text-gray-500'"
        >
          <span class="w-5 h-5">{{ item.name.substring(0, 3) }}</span>
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
