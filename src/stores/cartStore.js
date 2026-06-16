import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))
  const subtotal = computed(() => items.value.reduce((sum, i) => sum + i.qty * i.selling_price, 0))

  function addItem(product) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        selling_price: product.selling_price,
        qty: 1
      })
    }
  }

  function updateQty(productId, qty) {
    const item = items.value.find(i => i.id === productId)
    if (item) {
      if (qty <= 0) {
        removeItem(productId)
      } else {
        item.qty = qty
      }
    }
  }

  function removeItem(productId) {
    items.value = items.value.filter(i => i.id !== productId)
  }

  function clear() {
    items.value = []
  }

  return { items, totalItems, subtotal, addItem, updateQty, removeItem, clear }
})
