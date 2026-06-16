<script setup>
import { computed } from 'vue'

const props = defineProps({
  transaction: { type: Object, required: true },
  kasir: { type: String, default: '-' },
  storeName: { type: String, default: 'SmartPOS' },
  storeAddress: { type: String, default: '' },
  storePhone: { type: String, default: '' },
})

function formatCurrency(val) {
  return `Rp ${(val || 0).toLocaleString('id-ID')}`
}

const paymentLabel = computed(() => {
  const map = { tunai: 'Tunai', transfer: 'Transfer', qris: 'QRIS' }
  return map[props.transaction.payment_method] || props.transaction.payment_method
})

const changeAmount = computed(() => {
  const paid = props.transaction.amount_paid || 0
  const total = props.transaction.total || 0
  return Math.max(0, paid - total)
})

const dateFormatted = computed(() => {
  if (!props.transaction.created_at) return ''
  return new Date(props.transaction.created_at).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
})
</script>

<template>
  <div class="receipt bg-white text-black font-mono text-xs leading-relaxed mx-auto" style="max-width:320px">
    <div class="text-center mb-3">
      <div class="text-base font-bold tracking-wide">{{ storeName }}</div>
      <div v-if="storeAddress" class="text-[10px] text-gray-600">{{ storeAddress }}</div>
      <div v-if="storePhone" class="text-[10px] text-gray-600">Telp: {{ storePhone }}</div>
      <div class="border-t border-dashed border-gray-400 my-2" />
      <div class="font-bold text-sm tracking-widest">STRUK PEMBELIAN</div>
      <div class="border-t border-dashed border-gray-400 my-2" />
    </div>

    <div class="mb-2 space-y-0.5">
      <div class="flex justify-between">
        <span class="text-gray-500">Invoice</span>
        <span>{{ transaction.invoice_number }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Tanggal</span>
        <span>{{ dateFormatted }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Kasir</span>
        <span>{{ kasir }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-500">Metode</span>
        <span>{{ paymentLabel }}</span>
      </div>
    </div>

    <div class="border-t border-dashed border-gray-400 mb-2" />

    <div class="flex justify-between text-[10px] font-bold uppercase text-gray-500 mb-1">
      <span class="w-8 text-center">Qty</span>
      <span class="flex-1 ml-1">Nama</span>
      <span class="w-20 text-right">Harga</span>
    </div>

    <div v-for="item in transaction.transaction_items || []" :key="item.id" class="flex justify-between mb-0.5">
      <span class="w-8 text-center">{{ item.qty }}</span>
      <span class="flex-1 ml-1">{{ item.products?.name || 'Produk' }}</span>
      <span class="w-20 text-right">{{ formatCurrency(item.qty * item.price) }}</span>
    </div>

    <div class="border-t border-dashed border-gray-400 my-2" />

    <div class="space-y-0.5">
      <div class="flex justify-between">
        <span class="text-gray-500">Subtotal</span>
        <span>{{ formatCurrency(transaction.total) }}</span>
      </div>
      <div v-if="transaction.amount_paid" class="flex justify-between">
        <span class="text-gray-500">Bayar</span>
        <span>{{ formatCurrency(transaction.amount_paid) }}</span>
      </div>
      <div v-if="transaction.amount_paid" class="flex justify-between text-emerald-600">
        <span class="text-gray-500">Kembali</span>
        <span>{{ formatCurrency(changeAmount) }}</span>
      </div>
    </div>

    <div class="border-t border-dashed border-gray-400 my-2" />

    <div class="flex justify-between text-sm font-bold">
      <span>TOTAL</span>
      <span>{{ formatCurrency(transaction.total) }}</span>
    </div>

    <div class="border-t border-dashed border-gray-400 my-2" />

    <div class="text-center text-[10px] text-gray-500 space-y-0.5 mt-3">
      <p>Barang yang sudah dibeli tidak dapat dikembalikan</p>
      <p class="text-xs mt-1">Terima kasih telah berbelanja</p>
      <p class="text-[9px] mt-1">— SmartPOS Inventory —</p>
      <p class="text-[9px] text-gray-400 mt-1">akbar.sinyo</p>
    </div>
  </div>
</template>
