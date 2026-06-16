import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useStockStore = defineStore('stock', () => {
  const stockIns = ref([])
  const stockOuts = ref([])
  const loadingIns = ref(false)
  const loadingOuts = ref(false)

  const loading = ref(false)

  async function fetchStockIns() {
    loadingIns.value = true
    loading.value = true
    try {
      const { data } = await supabase
        .from('stock_ins')
        .select('*, products(name), suppliers(name)')
        .order('date', { ascending: false })
      if (data) stockIns.value = data
    } finally {
      loadingIns.value = false
      loading.value = loadingOuts.value
    }
  }

  async function fetchStockOuts() {
    loadingOuts.value = true
    loading.value = true
    try {
      const { data } = await supabase
        .from('stock_outs')
        .select('*, products(name)')
        .order('date', { ascending: false })
      if (data) stockOuts.value = data
    } finally {
      loadingOuts.value = false
      loading.value = loadingIns.value
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

  return { stockIns, stockOuts, loading, loadingIns, loadingOuts, fetchStockIns, fetchStockOuts, stockIn, stockOut }
})
