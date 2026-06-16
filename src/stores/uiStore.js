import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

export const useUIStore = defineStore('ui', () => {
  const theme = ref(localStorage.getItem('theme') || 'light')
  const sidebarOpen = ref(false)
  const lowStockCount = ref(0)

  async function fetchLowStockCount() {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lte('stock', 10)
    lowStockCount.value = count || 0
  }

  function setTheme(t) {
    theme.value = t
    localStorage.setItem('theme', t)
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement
    if (theme.value === 'dark') {
      root.classList.add('dark')
    } else if (theme.value === 'light') {
      root.classList.remove('dark')
    } else {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }

  watch(theme, applyTheme, { immediate: true })

  return { theme, sidebarOpen, lowStockCount, fetchLowStockCount, setTheme, applyTheme }
})
