import { ref } from 'vue'
import html2pdf from 'html2pdf.js'
import { supabase } from '../lib/supabase'

export function useProductCsv() {
  const importing = ref(false)
  const importResult = ref('')

  function exportCsv(products) {
    const headers = ['Nama', 'SKU', 'Barcode', 'Kategori', 'Harga Modal', 'Harga Jual', 'Stok', 'Satuan']
    const rows = products.map(p => [
      p.name,
      p.sku,
      p.barcode || '',
      p.categories?.name || '',
      p.purchase_price,
      p.selling_price,
      p.stock,
      p.unit,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadBlob(csv, 'produk.csv', 'text/csv')
  }

  async function importCsv(file) {
    importing.value = true
    importResult.value = ''
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('nama')
    const skuIdx = headers.indexOf('sku')
    const priceIdx = headers.indexOf('harga jual')
    const stockIdx = headers.indexOf('stok')
    const unitIdx = headers.indexOf('satuan')

    if (nameIdx === -1 || skuIdx === -1 || priceIdx === -1) {
      importResult.value = 'Format CSV tidak valid. Minimal kolom: Nama, SKU, Harga Jual'
      importing.value = false
      return
    }

    let success = 0
    let failed = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim())
      const product = {
        name: cols[nameIdx],
        sku: cols[skuIdx],
        selling_price: parseInt(cols[priceIdx]) || 0,
        stock: stockIdx !== -1 ? parseInt(cols[stockIdx]) || 0 : 0,
        unit: unitIdx !== -1 ? cols[unitIdx] || 'pcs' : 'pcs',
        purchase_price: 0,
      }
      if (!product.name || !product.sku) { failed++; continue }
      const { error } = await supabase.from('products').upsert(product, { onConflict: 'sku' })
      if (error) failed++; else success++
    }

    importResult.value = `${success} berhasil, ${failed} gagal`
    importing.value = false
  }

  return { exportCsv, importCsv, importing, importResult }
}

export function usePdfExport() {
  const generating = ref(false)

  async function exportPdf(elementId, filename = 'document.pdf') {
    generating.value = true
    const element = document.getElementById(elementId)
    if (!element) { generating.value = false; return }
    try {
      await html2pdf()
        .set({ margin: 10, filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } })
        .from(element)
        .save()
    } catch (e) {
      console.error('PDF export failed:', e)
    } finally {
      generating.value = false
    }
  }

  async function exportReceiptPdf(elementId, filename = 'struk.pdf') {
    generating.value = true
    const element = document.getElementById(elementId)
    if (!element) { generating.value = false; return }
    try {
      await html2pdf()
        .set({
          margin: { top: 5, right: 5, bottom: 5, left: 5 },
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, width: 320 },
          jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' }
        })
        .from(element)
        .save()
    } catch (e) {
      console.error('Receipt PDF export failed:', e)
    } finally {
      generating.value = false
    }
  }

  return { exportPdf, exportReceiptPdf, generating }
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
