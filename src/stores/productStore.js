import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await supabase
        .from('products')
        .select('*, categories(name), suppliers(name)')
        .order('name')
      if (data) products.value = data
    } finally {
      loading.value = false
    }
  }

  async function getById(id) {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name), suppliers(name)')
      .eq('id', id)
      .single()
    return data
  }

  async function create(payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.from('products').insert(payload).select().single()
    if (error) { toast.error(error.message); throw error }
    if (data) products.value.unshift(data)
    toast.success('Produk berhasil ditambahkan')
    return data
  }

  async function update(id, payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single()
    if (error) { toast.error(error.message); throw error }
    if (data) {
      const idx = products.value.findIndex(p => p.id === id)
      if (idx > -1) products.value[idx] = data
    }
    toast.success('Produk berhasil diperbarui')
    return data
  }

  async function remove(id) {
    const toast = useToastStore()
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { toast.error(error.message); throw error }
    products.value = products.value.filter(p => p.id !== id)
    toast.success('Produk berhasil dihapus')
  }

  async function search(query) {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name), suppliers(name)')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(20)
    return data || []
  }

  return { products, loading, fetchAll, getById, create, update, remove, search }
})
