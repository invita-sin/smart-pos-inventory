import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useHealthCheck() {
  const status = ref('checking')
  const message = ref('')
  const lastChecked = ref(null)
  const loading = ref(false)

  async function check() {
    loading.value = true
    status.value = 'checking'
    message.value = 'Mengetes koneksi...'

    try {
      const urlCheck = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }
      })
      if (!urlCheck.ok && urlCheck.status !== 401 && urlCheck.status !== 406) {
        throw new Error(`URL tidak reachable (${urlCheck.status})`)
      }

      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (error) throw error

      status.value = 'connected'
      message.value = `Terhubung — ${count} user terdaftar`
    } catch (e) {
      status.value = 'error'
      message.value = e.message
    } finally {
      lastChecked.value = new Date()
      loading.value = false
    }
  }

  return { status, message, lastChecked, loading, check }
}
