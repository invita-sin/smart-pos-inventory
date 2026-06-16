import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useProductStore } from '../stores/productStore'
import { useStockStore } from '../stores/stockStore'
import { useTransactionStore } from '../stores/transactionStore'
import { useReportStore } from '../stores/reportStore'
import { useUIStore } from '../stores/uiStore'

export function useRealtime() {
  const connected = ref(false)
  const channels = []

  onMounted(() => {
    const productStore = useProductStore()
    const stockStore = useStockStore()
    const transactionStore = useTransactionStore()
    const reportStore = useReportStore()
    const ui = useUIStore()

    const productChannel = supabase
      .channel('public:products')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          productStore.fetchAll()
          ui.fetchLowStockCount()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') connected.value = true
      })
    channels.push(productChannel)

    const transactionChannel = supabase
      .channel('public:transactions')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        () => {
          transactionStore.fetchAll()
          reportStore.getDashboardStats()
        }
      )
      .subscribe()
    channels.push(transactionChannel)

    const stockInChannel = supabase
      .channel('public:stock_ins')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_ins' },
        () => {
          stockStore.fetchStockIns()
          productStore.fetchAll()
          ui.fetchLowStockCount()
        }
      )
      .subscribe()
    channels.push(stockInChannel)

    const stockOutChannel = supabase
      .channel('public:stock_outs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_outs' },
        () => {
          stockStore.fetchStockOuts()
          productStore.fetchAll()
          ui.fetchLowStockCount()
        }
      )
      .subscribe()
    channels.push(stockOutChannel)
  })

  onUnmounted(() => {
    channels.forEach(ch => supabase.removeChannel(ch))
    channels.length = 0
    connected.value = false
  })

  return { connected }
}
