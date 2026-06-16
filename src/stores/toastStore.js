import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 0

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function add(message, type = 'success', duration = 3000) {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), duration)
  }

  function success(message) { add(message, 'success') }
  function error(message) { add(message, 'error', 5000) }
  function info(message) { add(message, 'info') }
  function warning(message) { add(message, 'warning', 4000) }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, add, success, error, info, warning, remove }
})
