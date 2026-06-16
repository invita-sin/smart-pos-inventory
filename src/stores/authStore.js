import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useToastStore } from './toastStore'
import { demoUsers, seedCategories, seedSuppliers, seedProducts } from '../lib/seedData'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function fetchUser() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        user.value = {
          id: session.user.id,
          email: session.user.email,
          name: profile?.name || session.user.user_metadata?.name || '',
          role: profile?.role || session.user.user_metadata?.role || 'kasir'
        }
      }
    } finally {
      loading.value = false
    }
  }

  async function login(email, password) {
    const toast = useToastStore()
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      await fetchUser()
      toast.success('Login berhasil')
      return { success: true }
    } catch (e) {
      toast.error(e.message)
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, name, role = 'kasir') {
    const toast = useToastStore()
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } }
      })
      if (error) throw error

      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role
        })
      }
      toast.success('Registrasi berhasil')
      return { success: true }
    } catch (e) {
      toast.error(e.message)
      return { success: false, error: e.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await fetchUser()
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        user.value = null
      }
    })
  }

  async function seedDemoData() {
    const toast = useToastStore()
    loading.value = true
    const results = { users: [], categories: 0, suppliers: 0, products: 0, errors: [] }

    try {
      for (const u of demoUsers) {
        const { data, error } = await supabase.auth.signUp({
          email: u.email,
          password: u.password,
          options: { data: { name: u.name, role: u.role } }
        })
        if (error) {
          if (error.message.includes('already registered')) {
            results.users.push({ email: u.email, status: 'already_exists' })
            continue
          }
          if (error.message.includes('confirm') || error.message.includes('email')) {
            throw new Error('Email konfirmasi diperlukan. Nonaktifkan "Confirm email" di Supabase Dashboard > Auth > Settings, lalu coba lagi.')
          }
          results.errors.push(`${u.email}: ${error.message}`)
          continue
        }
        if (data.user) {
          await supabase.from('users').insert({
            id: data.user.id, email: u.email, name: u.name, role: u.role
          })
          results.users.push({ email: u.email, status: 'created' })
        }
      }

      const { data: cats, error: catErr } = await supabase.from('categories').insert(seedCategories).select()
      if (catErr) results.errors.push(`Kategori: ${catErr.message}`)
      if (cats) results.categories = cats.length

      const { data: sups, error: supErr } = await supabase.from('suppliers').insert(seedSuppliers).select()
      if (supErr) results.errors.push(`Supplier: ${supErr.message}`)
      if (sups) results.suppliers = sups.length

      if (cats && cats.length && sups && sups.length) {
        const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]))
        const supMap = Object.fromEntries(sups.map(s => [s.name, s.id]))
        const products = seedProducts.map(p => ({
          sku: p.sku, name: p.name, purchase_price: p.purchase_price,
          selling_price: p.selling_price, stock: p.stock, unit: p.unit,
          category_id: catMap[p.category],
          supplier_id: supMap[p.supplier],
        }))
        const { data: prods } = await supabase.from('products').insert(products).select()
        if (prods) results.products = prods.length
      }

      if (results.errors.length === 0) {
        toast.success(`Data demo berhasil di-seed: ${results.users.length} user, ${results.categories} kategori, ${results.suppliers} supplier, ${results.products} produk`)
      } else {
        toast.warning(`Seeded with ${results.errors.length} error(s)`)
      }
    } catch (e) {
      results.errors.push(e.message)
      toast.error(e.message)
    } finally {
      loading.value = false
    }
    return results
  }

  return { user, loading, isAuthenticated, login, register, logout, fetchUser, init, seedDemoData }
})
