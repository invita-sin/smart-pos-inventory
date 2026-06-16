import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) transactions.value = data
    } finally {
      loading.value = false
    }
  }

  async function getById(id) {
    const { data } = await supabase
      .from('transactions')
      .select('*, transaction_items(*, products(name))')
      .eq('id', id)
      .single()
    return data
  }

  async function create(payload) {
    const toast = useToastStore()
    const { data, error } = await supabase.rpc('create_transaction', {
      p_items: payload.items,
      p_total: payload.total,
      p_payment_method: payload.payment_method,
      p_amount_paid: payload.amount_paid
    })
    if (error) { toast.error(error.message); throw error }
    toast.success('Transaksi berhasil!')
    return data
  }

  return { transactions, loading, fetchAll, getById, create }
})
