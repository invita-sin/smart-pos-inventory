import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useUserStore = defineStore('user', () => {
  const users = ref([])
  const loading = ref(false)

  async function fetchAll() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (data) users.value = data
  }

  async function create(email, password, name, role) {
    const toast = useToastStore()
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } }
      })
      if (error) throw new Error(error.message)
      if (data.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role
        })
        if (insertError) throw new Error(insertError.message)
      }
      await fetchAll()
      toast.success('Pengguna berhasil ditambahkan')
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  async function update(id, payload) {
    const toast = useToastStore()
    try {
      const { error } = await supabase.from('users').update(payload).eq('id', id)
      if (error) throw new Error(error.message)
      await fetchAll()
      toast.success('Pengguna berhasil diperbarui')
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  async function remove(id) {
    const toast = useToastStore()
    try {
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw new Error(error.message)
      users.value = users.value.filter(u => u.id !== id)
      toast.success('Pengguna berhasil dihapus')
    } catch (e) {
      toast.error(e.message)
      throw e
    }
  }

  return { users, loading, fetchAll, create, update, remove }
})
