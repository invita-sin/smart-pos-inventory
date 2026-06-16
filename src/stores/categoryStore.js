import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data) categories.value = data
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.from('categories').insert(payload).select().single()
    if (error) { toast.error(error.message); throw error }
    if (data) categories.value.unshift(data)
    toast.success('Kategori berhasil ditambahkan')
    return data
  }

  async function update(id, payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
    if (error) { toast.error(error.message); throw error }
    if (data) {
      const idx = categories.value.findIndex(c => c.id === id)
      if (idx > -1) categories.value[idx] = data
    }
    toast.success('Kategori berhasil diperbarui')
    return data
  }

  async function remove(id) {
    const toast = useToastStore()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error(error.message); throw error }
    categories.value = categories.value.filter(c => c.id !== id)
    toast.success('Kategori berhasil dihapus')
  }

  return { categories, loading, fetchAll, create, update, remove }
})
