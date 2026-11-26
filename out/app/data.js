// RumahBudget seed data — the Santoso household, November 2026.
// All figures are realistic sample data for one Indonesian family of four.
// Amounts are in Indonesian rupiah (IDR).
export const HOUSEHOLD = {
  name: 'Keluarga Santoso',
  members: ['Budi Santoso (Ayah)', 'Sari Santoso (Ibu)', 'Dimas (13)', 'Nadia (9)'],
  month: 'November 2026',
  monthKey: '2026-11',
  currency: 'Rp',
};

export const INCOME_SOURCES = [
  { id: 'inc-1', source: 'Gaji Budi — PT Nusantara Logistik', amount: 12000000, day: 25, kind: 'Tetap' },
  { id: 'inc-2', source: 'Freelance desain Sari', amount: 4500000, day: 15, kind: 'Variabel' },
  { id: 'inc-3', source: 'Jualan online — toko Sari', amount: 2000000, day: 20, kind: 'Variabel' },
];

export const CATEGORIES = [
  { id: 'belanja', name: 'Belanja Harian', icon: '🛒', color: '#2e9e6b', budget: 3500000 },
  { id: 'makan', name: 'Makan di Luar', icon: '🍜', color: '#e07b39', budget: 1200000 },
  { id: 'transport', name: 'Transport', icon: '🛵', color: '#3a7bd5', budget: 1800000 },
  { id: 'rumah', name: 'Listrik & Air', icon: '💡', color: '#e0a800', budget: 950000 },
  { id: 'internet', name: 'Internet & HP', icon: '📶', color: '#7c5cbf', budget: 650000 },
  { id: 'pendidikan', name: 'Pendidikan Anak', icon: '📚', color: '#0e7490', budget: 2200000 },
  { id: 'kesehatan', name: 'Kesehatan', icon: '🩺', color: '#d6456b', budget: 800000 },
  { id: 'hiburan', name: 'Hiburan', icon: '🎬', color: '#8a6d3b', budget: 700000 },
  { id: 'tabungan', name: 'Tabungan', icon: '🐷', color: '#15803d', budget: 3000000 },
  { id: 'lain', name: 'Lain-lain', icon: '📦', color: '#64748b', budget: 500000 },
];

// November 2026 transactions (26 Nov is "today" in the sample month).
export const TRANSACTIONS = [
  { id: 't01', date: '2026-11-01', desc: 'Belanja mingguan — Super Indo', cat: 'belanja', type: 'out', amount: 486500 },
  { id: 't02', date: '2026-11-02', desc: 'Bensin motor — Pertamina', cat: 'transport', type: 'out', amount: 50000 },
  { id: 't03', date: '2026-11-03', desc: 'Makan siang keluarga — Warteg Bahari', cat: 'makan', type: 'out', amount: 87500 },
  { id: 't04', date: '2026-11-04', desc: 'Token listrik 200k', cat: 'rumah', type: 'out', amount: 200000 },
  { id: 't05', date: '2026-11-05', desc: 'Buku & alat tulis Dimas', cat: 'pendidikan', type: 'out', amount: 215000 },
  { id: 't06', date: '2026-11-06', desc: 'Paket data Telkomsel — Sari', cat: 'internet', type: 'out', amount: 75000 },
  { id: 't07', date: '2026-11-07', desc: 'Pasar tradisional — sayur & buah', cat: 'belanja', type: 'out', amount: 178000 },
  { id: 't08', date: '2026-11-08', desc: 'Nonton bioskop — Dimas & Nadia', cat: 'hiburan', type: 'out', amount: 150000 },
  { id: 't09', date: '2026-11-09', desc: 'Ojek online — antar Nadia les', cat: 'transport', type: 'out', amount: 32000 },
  { id: 't10', date: '2026-11-10', desc: 'Belanja mingguan — Super Indo', cat: 'belanja', type: 'out', amount: 512000 },
  { id: 't11', date: '2026-11-11', desc: 'Obat flu & vitamin — Apotek K24', cat: 'kesehatan', type: 'out', amount: 96000 },
  { id: 't12', date: '2026-11-12', desc: 'Makan malam — Ayam Geprek Juara', cat: 'makan', type: 'out', amount: 124000 },
  { id: 't13', date: '2026-11-13', desc: 'Les piano Nadia (bulanan)', cat: 'pendidikan', type: 'out', amount: 350000 },
  { id: 't14', date: '2026-11-14', desc: 'Air galon 2x + gas LPG', cat: 'rumah', type: 'out', amount: 68000 },
  { id: 't15', date: '2026-11-15', desc: 'Freelance desain — DP klien logo', cat: 'income', type: 'in', amount: 4500000 },
  { id: 't16', date: '2026-11-15', desc: 'Belanja mingguan — Super Indo', cat: 'belanja', type: 'out', amount: 498000 },
  { id: 't17', date: '2026-11-16', desc: 'Servis motor — ganti oli', cat: 'transport', type: 'out', amount: 185000 },
  { id: 't18', date: '2026-11-17', desc: 'Langganan streaming — Vidio Premier', cat: 'hiburan', type: 'out', amount: 49000 },
  { id: 't19', date: '2026-11-18', desc: 'SPP sekolah Dimas', cat: 'pendidikan', type: 'out', amount: 750000 },
  { id: 't20', date: '2026-11-19', desc: 'Pasar tradisional — sayur & buah', cat: 'belanja', type: 'out', amount: 164500 },
  { id: 't21', date: '2026-11-20', desc: 'Jualan online — 4 paket terkirim', cat: 'income', type: 'in', amount: 2000000 },
  { id: 't22', date: '2026-11-20', desc: 'Makan siang — Soto Betawi H. Ma\'ruf', cat: 'makan', type: 'out', amount: 96000 },
  { id: 't23', date: '2026-11-21', desc: 'Top up e-money tol & parkir', cat: 'transport', type: 'out', amount: 150000 },
  { id: 't24', date: '2026-11-22', desc: 'Belanja mingguan — Super Indo', cat: 'belanja', type: 'out', amount: 467000 },
  { id: 't25', date: '2026-11-23', desc: 'Periksa gigi Nadia — Klinik Gigi Sehat', cat: 'kesehatan', type: 'out', amount: 225000 },
  { id: 't26', date: '2026-11-24', desc: 'WiFi IndiHome (bulanan)', cat: 'internet', type: 'out', amount: 315000 },
  { id: 't27', date: '2026-11-25', desc: 'Gaji Budi — PT Nusantara Logistik', cat: 'income', type: 'in', amount: 12000000 },
  { id: 't28', date: '2026-11-25', desc: 'Pindah ke tabungan — Dana Darurat', cat: 'tabungan', type: 'out', amount: 1500000 },
  { id: 't29', date: '2026-11-26', desc: 'Laundry kiloan — 6 kg', cat: 'lain', type: 'out', amount: 42000 },
  { id: 't30', date: '2026-11-26', desc: 'Bensin motor — Pertamina', cat: 'transport', type: 'out', amount: 50000 },
];

export const BILLS = [
  { id: 'b1', name: 'Token Listrik PLN', amount: 200000, due: '2026-11-04', paid: true, recurring: 'Bulanan' },
  { id: 'b2', name: 'PDAM — Air Bersih', amount: 145000, due: '2026-11-10', paid: true, recurring: 'Bulanan' },
  { id: 'b3', name: 'WiFi IndiHome 50 Mbps', amount: 315000, due: '2026-11-24', paid: true, recurring: 'Bulanan' },
  { id: 'b4', name: 'BPJS Kesehatan (4 orang)', amount: 140000, due: '2026-11-10', paid: true, recurring: 'Bulanan' },
  { id: 'b5', name: 'SPP Sekolah Dimas', amount: 750000, due: '2026-11-18', paid: true, recurring: 'Bulanan' },
  { id: 'b6', name: 'SPP Sekolah Nadia', amount: 650000, due: '2026-11-18', paid: true, recurring: 'Bulanan' },
  { id: 'b7', name: 'Cicilan Motor — 18/24', amount: 875000, due: '2026-11-28', paid: false, recurring: 'Bulanan' },
  { id: 'b8', name: 'Les Piano Nadia', amount: 350000, due: '2026-11-13', paid: true, recurring: 'Bulanan' },
  { id: 'b9', name: 'Iuran RT & Keamanan', amount: 75000, due: '2026-11-30', paid: false, recurring: 'Bulanan' },
  { id: 'b10', name: 'Langganan Vidio Premier', amount: 49000, due: '2026-11-17', paid: true, recurring: 'Bulanan' },
];

export const GOALS = [
  { id: 'g1', name: 'Dana Darurat', target: 25000000, saved: 16400000, note: 'Target 6x pengeluaran bulanan', color: '#15803d' },
  { id: 'g2', name: 'Liburan Keluarga — Bandung', target: 8000000, saved: 3250000, note: 'Berangkat libur sekolah Desember', color: '#3a7bd5' },
  { id: 'g3', name: 'Laptop untuk Dimas', target: 6500000, saved: 2100000, note: 'Untuk tugas sekolah & coding', color: '#7c5cbf' },
  { id: 'g4', name: 'Renovasi Dapur', target: 15000000, saved: 5750000, note: 'Ganti kitchen set & keramik', color: '#e07b39' },
];

// Monthly totals, June–November 2026, for the trend chart.
export const MONTHLY = [
  { month: 'Jun 2026', income: 17200000, spent: 13850000 },
  { month: 'Jul 2026', income: 17800000, spent: 14900000 },
  { month: 'Agu 2026', income: 18100000, spent: 14200000 },
  { month: 'Sep 2026', income: 17500000, spent: 15100000 },
  { month: 'Okt 2026', income: 18300000, spent: 14750000 },
  { month: 'Nov 2026', income: 18500000, spent: 0 }, // spent filled in live from transactions
];
