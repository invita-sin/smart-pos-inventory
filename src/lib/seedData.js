export const demoUsers = [
  { email: 'owner@smartpos.com', password: 'owner123', name: 'Andi Owner', role: 'owner' },
  { email: 'kasir@smartpos.com', password: 'kasir123', name: 'Budi Kasir', role: 'kasir' },
  { email: 'gudang@smartpos.com', password: 'gudang123', name: 'Citra Gudang', role: 'gudang' },
]

export const seedCategories = [
  { name: 'Makanan', description: 'Makanan ringan dan berat' },
  { name: 'Minuman', description: 'Minuman dalam kemasan' },
  { name: 'Elektronik', description: 'Peralatan elektronik' },
  { name: 'Pakan Ternak', description: 'Pakan untuk hewan ternak' },
  { name: 'Alat Tulis', description: 'Peralatan kantor dan sekolah' },
  { name: 'Rumah Tangga', description: 'Kebutuhan rumah tangga' },
]

export const seedSuppliers = [
  { name: 'PT Indofood Sukses Makmur', phone: '021-12345678', address: 'Jakarta Pusat', email: 'indofood@email.com' },
  { name: 'PT Wings Group', phone: '021-87654321', address: 'Surabaya', email: 'wings@email.com' },
  { name: 'PT Charoen Pokphand', phone: '024-7654321', address: 'Semarang', email: 'cp@email.com' },
  { name: 'CV Maju Jaya', phone: '0274-123456', address: 'Yogyakarta', email: 'majujaya@email.com' },
]

export const seedProducts = [
  { sku: 'MKN-001', name: 'Indomie Goreng', category: 'Makanan', supplier: 'PT Indofood Sukses Makmur', purchase_price: 2500, selling_price: 3500, stock: 200, unit: 'pcs' },
  { sku: 'MKN-002', name: 'Roti Tawar', category: 'Makanan', supplier: 'CV Maju Jaya', purchase_price: 10000, selling_price: 15000, stock: 50, unit: 'pcs' },
  { sku: 'MKN-003', name: 'Biskuit Roma Kelapa', category: 'Makanan', supplier: 'PT Wings Group', purchase_price: 5000, selling_price: 7500, stock: 80, unit: 'pcs' },
  { sku: 'MKN-004', name: 'Keripik Singkong Balado', category: 'Makanan', supplier: 'CV Maju Jaya', purchase_price: 8000, selling_price: 12000, stock: 5, unit: 'pcs' },
  { sku: 'MNM-001', name: 'Air Mineral 600ml', category: 'Minuman', supplier: 'PT Wings Group', purchase_price: 2000, selling_price: 3500, stock: 300, unit: 'pcs' },
  { sku: 'MNM-002', name: 'Teh Botol Sosro', category: 'Minuman', supplier: 'PT Indofood Sukses Makmur', purchase_price: 3000, selling_price: 5000, stock: 150, unit: 'pcs' },
  { sku: 'MNM-003', name: 'Kopi Kapal Api Sachet', category: 'Minuman', supplier: 'CV Maju Jaya', purchase_price: 1500, selling_price: 2500, stock: 7, unit: 'pcs' },
  { sku: 'ELK-001', name: 'Baterai AA', category: 'Elektronik', supplier: 'CV Maju Jaya', purchase_price: 5000, selling_price: 10000, stock: 100, unit: 'pcs' },
  { sku: 'ELK-002', name: 'Lampu LED 10W', category: 'Elektronik', supplier: 'CV Maju Jaya', purchase_price: 12000, selling_price: 20000, stock: 40, unit: 'pcs' },
  { sku: 'PKN-001', name: 'Pelet Ikan 781', category: 'Pakan Ternak', supplier: 'PT Charoen Pokphand', purchase_price: 10000, selling_price: 15000, stock: 3, unit: 'kg' },
  { sku: 'PKN-002', name: 'Konsentrat Sapi', category: 'Pakan Ternak', supplier: 'PT Charoen Pokphand', purchase_price: 8000, selling_price: 12000, stock: 25, unit: 'kg' },
  { sku: 'PKN-003', name: 'Pakan Ayam BR1', category: 'Pakan Ternak', supplier: 'PT Charoen Pokphand', purchase_price: 9000, selling_price: 13500, stock: 0, unit: 'kg' },
  { sku: 'PKN-004', name: 'Vitamin Ternak', category: 'Pakan Ternak', supplier: 'PT Charoen Pokphand', purchase_price: 25000, selling_price: 40000, stock: 15, unit: 'pcs' },
  { sku: 'ATK-001', name: 'Pulpen Standard AE7', category: 'Alat Tulis', supplier: 'CV Maju Jaya', purchase_price: 2000, selling_price: 3500, stock: 200, unit: 'pcs' },
  { sku: 'ATK-002', name: 'Buku Tulis 40 Lembar', category: 'Alat Tulis', supplier: 'CV Maju Jaya', purchase_price: 3000, selling_price: 5000, stock: 120, unit: 'pcs' },
  { sku: 'RMT-001', name: 'Sapu Lidi', category: 'Rumah Tangga', supplier: 'CV Maju Jaya', purchase_price: 7000, selling_price: 12000, stock: 30, unit: 'pcs' },
  { sku: 'RMT-002', name: 'Sabun Cuci Piring 500ml', category: 'Rumah Tangga', supplier: 'PT Wings Group', purchase_price: 8000, selling_price: 13000, stock: 60, unit: 'pcs' },
]
