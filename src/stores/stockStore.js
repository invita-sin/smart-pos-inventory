import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useStockStore = defineStore('stock', () => {
  const stockIns = ref([])
  const stockOuts = ref([])
  const loading = ref(false)

  async function fetchStockIns() {
    loading.value = true
    try {
      const { data } = await supabase
        .from('stock_ins')
        .select('*, products(name), suppliers(name)')
        .order('date', { ascending: false })
      if (data) stockIns.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchStockOuts() {
    loading.value = true
    try {
      const { data } = await supabase
        .from('stock_outs')
        .select('*, products(name)')
        .order('date', { ascending: false })
      if (data) stockOuts.value = data
    } finally {
      loading.value = false
    }
  }

  async function stockIn(payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.rpc('stock_in', {
      p_product_id: payload.product_id,
      p_qty: payload.qty,
      p_purchase_price: payload.purchase_price,
      p_supplier_id: payload.supplier_id || null
    })
    if (error) { toast.error(error.message); throw error }
    toast.success('Barang masuk berhasil dicatat')
    return data
  }

  async function stockOut(payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.rpc('stock_out', {
      p_product_id: payload.product_id,
      p_qty: payload.qty,
      p_reason: payload.reason
    })
    if (error) { toast.error(error.message); throw error }
    toast.success('Barang keluar berhasil dicatat')
    return data
  }

  return { stockIns, stockOuts, loading, fetchStockIns, fetchStockOuts, stockIn, stockOut }
})
