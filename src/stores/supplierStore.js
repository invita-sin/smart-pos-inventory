import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useSupplierStore = defineStore('supplier', () => {
  const suppliers = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await supabase.from('suppliers').select('*').order('name')
      if (data) suppliers.value = data
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.from('suppliers').insert(payload).select().single()
    if (error) { toast.error(error.message); throw error }
    if (data) suppliers.value.unshift(data)
    toast.success('Supplier berhasil ditambahkan')
    return data
  }

  async function update(id, payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.from('suppliers').update(payload).eq('id', id).select().single()
    if (error) { toast.error(error.message); throw error }
    if (data) {
      const idx = suppliers.value.findIndex(s => s.id === id)
      if (idx > -1) suppliers.value[idx] = data
    }
    toast.success('Supplier berhasil diperbarui')
    return data
  }

  async function remove(id) {
    const toast = useToastStore()
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) { toast.error(error.message); throw error }
    suppliers.value = suppliers.value.filter(s => s.id !== id)
    toast.success('Supplier berhasil dihapus')
  }

  return { suppliers, loading, fetchAll, create, update, remove }
})
