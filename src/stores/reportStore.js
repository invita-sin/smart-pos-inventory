import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useReportStore = defineStore('report', () => {
  const loading = ref(false)

  async function getSalesReport(startDate, endDate) {
    loading.value = true
    try {
      const { data } = await supabase
        .rpc('get_sales_report', { start_date: startDate, end_date: endDate })
      return data
    } finally {
      loading.value = false
    }
  }

  async function getDashboardStats() {
    loading.value = true
    try {
      const { data } = await supabase.rpc('get_dashboard_stats')
      return data
    } finally {
      loading.value = false
    }
  }

  return { loading, getSalesReport, getDashboardStats }
})
