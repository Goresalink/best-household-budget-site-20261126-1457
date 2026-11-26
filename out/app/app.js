// RumahBudget — single-page household budget site, no build step, no network.
// All state lives in this file + data.js; edits persist to localStorage
// (guarded — the site works fully even if storage is unavailable).
import { HOUSEHOLD, INCOME_SOURCES, CATEGORIES, TRANSACTIONS, BILLS, GOALS, MONTHLY } from './data.js';

const STORE_KEY = 'rumahbudget-v1';
const TODAY = '2026-11-26';
const DAYS_IN_MONTH = 30;
const DAY_OF_MONTH = 26;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (Array.isArray(s.transactions) && Array.isArray(s.bills) && Array.isArray(s.goals)) return s;
    }
  } catch { /* storage unavailable — fall through to seed data */ }
  return null;
}

function seedState() {
  return {
    transactions: structuredClone(TRANSACTIONS),
    bills: structuredClone(BILLS),
    goals: structuredClone(GOALS),
    budgets: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.budget])),
  };
}

let state = loadState() || seedState();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ---------- helpers ----------
const fmt = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const fmtShort = (n) => {
  if (Math.abs(n) >= 1e6) return 'Rp ' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
  if (Math.abs(n) >= 1e3) return 'Rp ' + Math.round(n / 1e3).toLocaleString('id-ID') + ' rb';
  return fmt(n);
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const catById = (id) => {
  if (id === 'income') return { name: 'Pemasukan', icon: '💰', color: '#15803d' };
  return CATEGORIES.find((c) => c.id === id) || { name: 'Lain-lain', icon: '📦', color: '#64748b' };
};
const dateId = (d) => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };

const totalIncome = () => INCOME_SOURCES.reduce((s, x) => s + x.amount, 0);
const txOut = () => state.transactions.filter((t) => t.type === 'out');
const spentByCat = (cat) => txOut().filter((t) => t.cat === cat).reduce((s, t) => s + t.amount, 0);
const totalSpent = () => txOut().filter((t) => t.cat !== 'tabungan').reduce((s, t) => s + t.amount, 0);
const totalSaved = () => spentByCat('tabungan');
const remaining = () => totalIncome() - totalSpent() - totalSaved();
const totalBudget = () => Object.values(state.budgets).reduce((s, b) => s + b, 0);

function refreshHeader() {
  const el = document.getElementById('month-remaining');
  if (el) el.textContent = fmtShort(remaining());
}

// ---------- shared bits ----------
function progressBar(pct, color) {
  const p = Math.max(0, Math.min(100, pct));
  const cls = pct > 100 ? 'over' : pct >= 80 ? 'warn' : '';
  return `<div class="bar"><i class="${cls}" style="width:${p}%;${color && pct <= 100 ? `background:${color}` : ''}"></i></div>`;
}

function donutSVG() {
  const cats = CATEGORIES.filter((c) => c.id !== 'tabungan' && spentByCat(c.id) > 0)
    .sort((a, b) => spentByCat(b.id) - spentByCat(a.id));
  const total = cats.reduce((s, c) => s + spentByCat(c.id), 0) || 1;
  const R = 15.9155; // circumference 100
  let offset = 25;
  const rings = cats.map((c) => {
    const pct = (spentByCat(c.id) / total) * 100;
    const ring = `<circle r="${R}" cx="21" cy="21" fill="transparent" stroke="${c.color}" stroke-width="7"
      stroke-dasharray="${pct.toFixed(1)} ${100 - pct.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"></circle>`;
    offset -= pct;
    return ring;
  }).join('');
  const legend = cats.map((c) => `<li><span><span class="cat-dot" style="background:${c.color}"></span>${esc(c.name)}</span><b>${fmtShort(spentByCat(c.id))}</b></li>`).join('');
  return `<div class="donut-wrap">
    <svg width="168" height="168" viewBox="0 0 42 42" role="img" aria-label="Pengeluaran per kategori">
      <circle r="${R}" cx="21" cy="21" fill="transparent" stroke="#e8efe9" stroke-width="7"></circle>${rings}
      <text x="21" y="19.5" text-anchor="middle" font-size="4.6" font-weight="800" fill="#22302a">${fmtShort(totalSpent())}</text>
      <text x="21" y="25" text-anchor="middle" font-size="3" fill="#5f6f66">terpakai</text>
    </svg>
    <ul class="legend" style="flex:1;min-width:180px">${legend}</ul>
  </div>`;
}

function txRow(t) {
  const c = catById(t.cat);
  const sign = t.type === 'in' ? '+' : '−';
  const cls = t.type === 'in' ? 'in' : 'out';
  return `<tr>
    <td class="hide-sm">${dateId(t.date)}</td>
    <td>${esc(t.desc)}</td>
    <td><span class="cat-dot" style="background:${c.color}"></span>${esc(c.name)}</td>
    <td class="num ${cls}">${sign} ${fmt(t.amount)}</td>
    <td><button class="danger" data-del-tx="${t.id}" title="Hapus transaksi ini">Hapus</button></td>
  </tr>`;
}

// ---------- views ----------
function viewDashboard() {
  const income = totalIncome(), spent = totalSpent(), saved = totalSaved(), left = remaining();
  const unpaid = state.bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 6);
  const over = CATEGORIES.filter((c) => spentByCat(c.id) / state.budgets[c.id] >= 0.8 && spentByCat(c.id) > 0);
  return `
  <div class="page-head">
    <h1>Selamat datang, Keluarga Santoso 👋</h1>
    <p class="lede">Ringkasan keuangan bulan ${esc(HOUSEHOLD.month)} — hari ke-${DAY_OF_MONTH} dari ${DAYS_IN_MONTH}.
    Pemasukan sudah masuk semua; tersisa ${DAYS_IN_MONTH - DAY_OF_MONTH} hari sampai gajian berikutnya.</p>
    ${over.length ? `<p class="notice warn">⚠️ ${over.map((c) => esc(c.name)).join(', ')} sudah memakai ≥ 80% anggarannya. Cek halaman <a href="#/budgets">Anggaran</a>.</p>` : ''}
  </div>
  <section class="cards">
    <div class="card accent"><div class="label">Pemasukan</div><div class="big">${fmt(income)}</div><div class="sub">Gaji + freelance + toko online</div></div>
    <div class="card"><div class="label">Pengeluaran</div><div class="big">${fmt(spent)}</div><div class="sub">Di luar tabungan · <b>${Math.round((spent / income) * 100)}%</b> dari pemasukan</div></div>
    <div class="card"><div class="label">Ditabung</div><div class="big">${fmt(saved)}</div><div class="sub"><b>${Math.round((saved / state.budgets.tabungan) * 100)}%</b> dari target Rp 3 jt</div></div>
    <div class="card"><div class="label">Sisa bulan ini</div><div class="big">${fmt(left)}</div><div class="sub">Bisa dipakai sampai 30 Nov</div></div>
  </section>
  <div class="grid2">
    <section class="panel"><h2>Ke mana uang pergi <a href="#/reports">Lihat laporan →</a></h2>${donutSVG()}</section>
    <section class="panel"><h2>Tagihan yang belum lunas <a href="#/bills">Semua tagihan →</a></h2>
      ${unpaid.length ? `<table><thead><tr><th>Tagihan</th><th>Jatuh tempo</th><th class="num">Jumlah</th></tr></thead><tbody>
        ${unpaid.map((b) => `<tr><td>${esc(b.name)}</td><td>${dateId(b.due)}</td><td class="num"><b>${fmt(b.amount)}</b></td></tr>`).join('')}
      </tbody></table><p class="mini" style="margin-top:.6rem">Total belum lunas: <b>${fmt(unpaid.reduce((s, b) => s + b.amount, 0))}</b> — cicilan motor jatuh tempo 28 Nov.</p>`
      : '<p class="empty">Semua tagihan bulan ini sudah lunas. 🎉</p>'}
    </section>
  </div>
  <div class="grid2">
    <section class="panel"><h2>Transaksi terakhir <a href="#/transactions">Semua transaksi →</a></h2>
      <table><thead><tr><th class="hide-sm">Tanggal</th><th>Deskripsi</th><th>Kategori</th><th class="num">Jumlah</th></tr></thead><tbody>
      ${recent.map((t) => { const c = catById(t.cat); return `<tr><td class="hide-sm">${dateId(t.date)}</td><td>${esc(t.desc)}</td><td><span class="cat-dot" style="background:${c.color}"></span>${esc(c.name)}</td><td class="num ${t.type === 'in' ? 'in' : 'out'}">${t.type === 'in' ? '+' : '−'} ${fmt(t.amount)}</td></tr>`; }).join('')}
      </tbody></table>
    </section>
    <section class="panel"><h2>Tabungan &amp; tujuan <a href="#/goals">Semua tujuan →</a></h2>
      ${state.goals.map((g) => { const pct = Math.round((g.saved / g.target) * 100); return `
        <div style="margin-bottom:.9rem"><div class="bar-row"><span><b>${esc(g.name)}</b></span><span>${fmtShort(g.saved)} / ${fmtShort(g.target)} · ${pct}%</span></div>
        ${progressBar(pct, g.color)}</div>`; }).join('')}
      <p class="mini">Total terkumpul: <b>${fmt(state.goals.reduce((s, g) => s + g.saved, 0))}</b> dari target <b>${fmt(state.goals.reduce((s, g) => s + g.target, 0))}</b>.</p>
    </section>
  </div>`;
}

function viewTransactions() {
  const cats = CATEGORIES;
  return `
  <div class="page-head"><h1>Transaksi</h1>
  <p class="lede">Semua pemasukan dan pengeluaran ${esc(HOUSEHOLD.month)} (${state.transactions.length} transaksi).
  Tambah transaksi baru di bawah — langsung tersimpan di peramban Anda.</p></div>
  <section class="panel"><h2>Tambah transaksi</h2>
    <form id="add-tx" class="inline-form">
      <div class="span2"><label for="tx-date">Tanggal</label><input id="tx-date" type="date" value="${TODAY}" min="2026-11-01" max="2026-11-30" required></div>
      <div class="span3"><label for="tx-desc">Deskripsi</label><input id="tx-desc" type="text" placeholder="cth. Belanja mingguan — Super Indo" required maxlength="80"></div>
      <div><label for="tx-cat">Kategori</label><select id="tx-cat">${cats.map((c) => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('')}<option value="income">💰 Pemasukan</option></select></div>
      <div><label for="tx-type">Jenis</label><select id="tx-type"><option value="out">Pengeluaran</option><option value="in">Pemasukan</option></select></div>
      <div><label for="tx-amount">Jumlah (Rp)</label><input id="tx-amount" type="number" min="1000" step="500" placeholder="150000" required></div>
      <div><button type="submit">+ Tambah</button></div>
    </form>
    <p id="tx-msg" class="mini" aria-live="polite"></p>
  </section>
  <section class="panel"><h2>Daftar transaksi</h2>
    <div class="toolbar">
      <div class="field"><label for="f-search">Cari</label><input id="f-search" type="search" placeholder="Cari deskripsi…"></div>
      <div class="field"><label for="f-cat">Kategori</label><select id="f-cat"><option value="">Semua kategori</option>${cats.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}<option value="income">Pemasukan</option></select></div>
      <div class="field"><label for="f-type">Jenis</label><select id="f-type"><option value="">Semua</option><option value="in">Pemasukan</option><option value="out">Pengeluaran</option></select></div>
    </div>
    <div id="tx-table-wrap"></div>
    <p class="mini" style="margin-top:.7rem"><button class="secondary small" id="reset-data">Reset ke data contoh</button>
    Menghapus semua perubahan Anda dan mengembalikan 30 transaksi contoh November 2026.</p>
  </section>`;
}

function renderTxTable() {
  const q = (document.getElementById('f-search')?.value || '').toLowerCase();
  const fc = document.getElementById('f-cat')?.value || '';
  const ft = document.getElementById('f-type')?.value || '';
  const rows = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .filter((t) => (!q || t.desc.toLowerCase().includes(q)) && (!fc || t.cat === fc) && (!ft || t.type === ft));
  const inSum = rows.filter((t) => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const outSum = rows.filter((t) => t.type === 'out').reduce((s, t) => s + t.amount, 0);
  const wrap = document.getElementById('tx-table-wrap');
  if (!wrap) return;
  wrap.innerHTML = rows.length ? `<table><thead><tr><th class="hide-sm">Tanggal</th><th>Deskripsi</th><th>Kategori</th><th class="num">Jumlah</th><th></th></tr></thead>
    <tbody>${rows.map(txRow).join('')}</tbody>
    <tfoot><tr><td colspan="3"><b>${rows.length} transaksi tampil</b></td><td class="num"><span class="in">+ ${fmt(inSum)}</span><br><span class="out">− ${fmt(outSum)}</span></td><td></td></tr></tfoot></table>`
    : '<p class="empty">Tidak ada transaksi yang cocok dengan filter. Ubah pencarian atau tambahkan transaksi baru.</p>';
}
function viewBudgets() {
  const totalB = totalBudget();
  const spentAll = txOut().reduce((s, t) => s + t.amount, 0);
  return `
  <div class="page-head"><h1>Anggaran Bulanan</h1>
  <p class="lede">Anggaran ${esc(HOUSEHOLD.month)}: <b>${fmt(totalB)}</b> direncanakan dari pemasukan
  <b>${fmt(totalIncome())}</b>. Terpakai <b>${fmt(spentAll)}</b> (${Math.round((spentAll / totalB) * 100)}%).
  Ubah angka anggaran kapan saja — perubahannya langsung tersimpan.</p></div>
  <div class="grid3">
  ${CATEGORIES.map((c) => {
    const spent = spentByCat(c.id);
    const budget = state.budgets[c.id];
    const pct = budget ? Math.round((spent / budget) * 100) : 0;
    const leftB = budget - spent;
    const status = pct > 100 ? '<span class="pill due">Melebihi anggaran</span>'
      : pct >= 80 ? '<span class="pill warn">Hampir habis</span>' : '<span class="pill">Aman</span>';
    return `<section class="card">
      <h3>${c.icon} ${esc(c.name)} ${status}</h3>
      <div class="bar-row"><span>Terpakai <b>${fmt(spent)}</b></span><span>dari ${fmt(budget)}</span></div>
      ${progressBar(pct, c.color)}
      <div class="bar-row"><span>${pct}% terpakai</span><span>${leftB >= 0 ? `Sisa <b>${fmt(leftB)}</b>` : `Lebih <b>${fmt(-leftB)}</b>`}</span></div>
      <div class="goal-actions">
        <input type="number" min="0" step="50000" value="${budget}" data-budget-input="${c.id}" aria-label="Anggaran ${esc(c.name)}">
        <button class="small secondary" data-budget-save="${c.id}">Simpan</button>
      </div>
    </section>`;
  }).join('')}
  </div>
  <section class="panel"><h2>Aturan 50 / 30 / 20</h2>
    <p>Kebutuhan (50%): <b>${fmt(totalIncome() * 0.5)}</b> · Keinginan (30%): <b>${fmt(totalIncome() * 0.3)}</b> ·
    Tabungan (20%): <b>${fmt(totalIncome() * 0.2)}</b>. Bulan ini keluarga memakai
    <b>${Math.round((totalSpent() / totalIncome()) * 100)}%</b> untuk belanja dan
    <b>${Math.round((totalSaved() / totalIncome()) * 100)}%</b> untuk tabungan.
    Hitung dengan angka Anda sendiri di <a href="#/tools">Kalkulator</a>.</p></section>`;
}

function viewBills() {
  const unpaid = state.bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const paid = state.bills.filter((b) => b.paid);
  const unpaidTotal = unpaid.reduce((s, b) => s + b.amount, 0);
  const next = unpaid[0];
  return `
  <div class="page-head"><h1>Tagihan &amp; Pembayaran Rutin</h1>
  <p class="lede">${paid.length} dari ${state.bills.length} tagihan bulan ini sudah lunas.
  ${next ? `Berikutnya: <b>${esc(next.name)}</b> — ${fmt(next.amount)}, jatuh tempo ${dateId(next.due)}.` : 'Semua tagihan sudah lunas. 🎉'}</p></div>
  <section class="cards" style="grid-template-columns:repeat(3,1fr)">
    <div class="card"><div class="label">Sudah lunas</div><div class="big">${paid.length} tagihan</div><div class="sub">${fmt(paid.reduce((s, b) => s + b.amount, 0))} terbayar</div></div>
    <div class="card"><div class="label">Belum lunas</div><div class="big">${fmt(unpaidTotal)}</div><div class="sub">${unpaid.length} tagihan menunggu</div></div>
    <div class="card"><div class="label">Total tagihan / bulan</div><div class="big">${fmt(state.bills.reduce((s, b) => s + b.amount, 0))}</div><div class="sub">Semua tagihan rutin keluarga</div></div>
  </section>
  <section class="panel"><h2>Tambah tagihan</h2>
    <form id="add-bill" class="inline-form">
      <div class="span2"><label for="bill-name">Nama tagihan</label><input id="bill-name" type="text" placeholder="cth. Langganan air minum" required maxlength="60"></div>
      <div><label for="bill-amount">Jumlah (Rp)</label><input id="bill-amount" type="number" min="1000" step="1000" placeholder="100000" required></div>
      <div><label for="bill-due">Jatuh tempo</label><input id="bill-due" type="date" value="2026-11-30" min="2026-11-01" max="2026-12-31" required></div>
      <div><label for="bill-rec">Periode</label><select id="bill-rec"><option>Bulanan</option><option>Tahunan</option><option>Sekali saja</option></select></div>
      <div><button type="submit">+ Tambah</button></div>
    </form>
    <p id="bill-msg" class="mini" aria-live="polite"></p>
  </section>
  <section class="panel"><h2>Semua tagihan — November 2026</h2>
    <table><thead><tr><th>Tagihan</th><th class="hide-sm">Periode</th><th>Jatuh tempo</th><th class="num">Jumlah</th><th>Status</th><th></th></tr></thead><tbody>
    ${[...state.bills].sort((a, b) => a.due.localeCompare(b.due)).map((b) => {
      const late = !b.paid && b.due < TODAY;
      return `<tr><td>${esc(b.name)}</td><td class="hide-sm">${esc(b.recurring)}</td><td>${dateId(b.due)}</td>
      <td class="num"><b>${fmt(b.amount)}</b></td>
      <td>${b.paid ? '<span class="pill paid">✓ Lunas</span>' : late ? '<span class="pill due">Terlambat</span>' : '<span class="pill warn">Menunggu</span>'}</td>
      <td>${b.paid ? '' : `<button class="small" data-pay-bill="${b.id}">Tandai lunas</button>`}</td></tr>`;
    }).join('')}
    </tbody></table></section>`;
}

function viewGoals() {
  const savedAll = state.goals.reduce((s, g) => s + g.saved, 0);
  const targetAll = state.goals.reduce((s, g) => s + g.target, 0);
  return `
  <div class="page-head"><h1>Tabungan &amp; Tujuan</h1>
  <p class="lede">Total terkumpul <b>${fmt(savedAll)}</b> dari target <b>${fmt(targetAll)}</b>
  (${Math.round((savedAll / targetAll) * 100)}%). Tambah dana ke tujuan mana pun — progresnya langsung berubah.</p></div>
  <div class="grid2 even">
  ${state.goals.map((g) => {
    const pct = Math.round((g.saved / g.target) * 100);
    const leftG = g.target - g.saved;
    return `<section class="card">
      <div class="goal-head"><strong>${esc(g.name)}</strong><span>${pct}%</span></div>
      <p class="mini">${esc(g.note)}</p>
      ${progressBar(pct, g.color)}
      <div class="bar-row"><span>Terkumpul <b>${fmt(g.saved)}</b></span><span>Target ${fmt(g.target)}</span></div>
      <p class="mini">${leftG > 0 ? `Kurang <b>${fmt(leftG)}</b> lagi.` : '🎉 Target tercapai!'}</p>
      <div class="goal-actions">
        <input type="number" min="1000" step="10000" placeholder="Jumlah (Rp)" data-goal-input="${g.id}" aria-label="Tambah dana ${esc(g.name)}">
        <button class="small" data-goal-add="${g.id}">+ Tambah dana</button>
      </div>
    </section>`;
  }).join('')}
  </div>
  <section class="panel"><h2>Buat tujuan baru</h2>
    <form id="add-goal" class="inline-form">
      <div class="span2"><label for="goal-name">Nama tujuan</label><input id="goal-name" type="text" placeholder="cth. Umroh keluarga" required maxlength="60"></div>
      <div><label for="goal-target">Target (Rp)</label><input id="goal-target" type="number" min="100000" step="50000" placeholder="10000000" required></div>
      <div><label for="goal-saved">Sudah terkumpul (Rp)</label><input id="goal-saved" type="number" min="0" step="50000" value="0" required></div>
      <div><label for="goal-note">Catatan</label><input id="goal-note" type="text" placeholder="cth. Target akhir tahun" maxlength="80"></div>
      <div><button type="submit">+ Buat tujuan</button></div>
    </form>
    <p id="goal-msg" class="mini" aria-live="polite"></p>
  </section>`;
}

function viewReports() {
  const months = MONTHLY.map((m) => m.month === 'Nov 2026' ? { ...m, spent: totalSpent() } : m);
  const maxV = Math.max(...months.flatMap((m) => [m.income, m.spent]));
  const cats = CATEGORIES.filter((c) => spentByCat(c.id) > 0).sort((a, b) => spentByCat(b.id) - spentByCat(a.id));
  const spent = totalSpent();
  const biggest = [...txOut()].filter((t) => t.cat !== 'tabungan').sort((a, b) => b.amount - a.amount)[0];
  const projected = Math.round((spent / DAY_OF_MONTH) * DAYS_IN_MONTH);
  const avg6 = Math.round(months.slice(0, 5).reduce((s, m) => s + m.spent, 0) / 5);
  return `
  <div class="page-head"><h1>Laporan — 6 Bulan Terakhir</h1>
  <p class="lede">Pemasukan vs pengeluaran Juni–November 2026. November dihitung dari transaksi yang tercatat sampai 26 Nov.</p></div>
  <section class="panel"><h2>Pemasukan vs pengeluaran</h2>
    <div class="chart-bars">
      ${months.map((m) => `<div class="chart-col"><div class="pair">
        <i class="inc" style="height:${Math.round((m.income / maxV) * 150)}px" title="Pemasukan ${fmt(m.income)}"></i>
        <i class="out" style="height:${Math.round((m.spent / maxV) * 150)}px" title="Pengeluaran ${fmt(m.spent)}"></i>
      </div><div class="mlabel">${esc(m.month)}<br><b>${fmtShort(m.income)}</b> / ${fmtShort(m.spent)}</div></div>`).join('')}
    </div>
    <div class="chart-key"><span><i style="background:#1d6b4a"></i>Pemasukan</span><span><i style="background:#d96c3a"></i>Pengeluaran</span></div>
  </section>
  <div class="grid2">
    <section class="panel"><h2>Pengeluaran per kategori — November</h2>
      <table><thead><tr><th>Kategori</th><th class="num">Jumlah</th><th class="num">Porsi</th></tr></thead><tbody>
      ${cats.map((c) => `<tr><td><span class="cat-dot" style="background:${c.color}"></span>${esc(c.name)}</td><td class="num"><b>${fmt(spentByCat(c.id))}</b></td><td class="num">${Math.round((spentByCat(c.id) / (spent + totalSaved())) * 100)}%</td></tr>`).join('')}
      </tbody></table>
    </section>
    <section class="panel"><h2>Yang bisa dipetik bulan ini</h2>
      <div class="tip" style="margin-bottom:.7rem">💡 <b>Pengeluaran terbesar:</b> ${esc(biggest.desc)} — ${fmt(biggest.amount)} pada ${dateId(biggest.date)} (${esc(catById(biggest.cat).name)}).</div>
      <div class="tip" style="margin-bottom:.7rem">📈 <b>Proyeksi akhir bulan:</b> dengan rata-rata ${fmt(Math.round(spent / DAY_OF_MONTH))}/hari, pengeluaran November diproyeksikan ${fmt(projected)} — ${projected <= totalBudget() ? 'masih di bawah total anggaran.' : 'di atas total anggaran, hati-hati.'}</div>
      <div class="tip" style="margin-bottom:.7rem">📊 <b>Rata-rata 5 bulan lalu:</b> ${fmt(avg6)}/bulan. November sejauh ini ${spent < avg6 ? 'lebih hemat' : 'lebih boros'} dari rata-rata itu.</div>
      <div class="tip">🏆 <b>Kategori paling boros:</b> ${esc(cats[0].name)} (${fmt(spentByCat(cats[0].id))}). ${cats[0].id === 'belanja' ? 'Coba belanja 2x seminggu dengan daftar tetap — biasanya memangkas 10–15%.' : 'Cek rinciannya di halaman Transaksi.'}</div>
    </section>
  </div>
  <section class="panel"><h2>Sumber pemasukan</h2>
    <table><thead><tr><th>Sumber</th><th class="hide-sm">Jenis</th><th class="hide-sm">Tanggal terima</th><th class="num">Jumlah</th><th class="num">Porsi</th></tr></thead><tbody>
    ${INCOME_SOURCES.map((s) => `<tr><td>${esc(s.source)}</td><td class="hide-sm">${esc(s.kind)}</td><td class="hide-sm">Tiap tanggal ${s.day}</td><td class="num"><b>${fmt(s.amount)}</b></td><td class="num">${Math.round((s.amount / totalIncome()) * 100)}%</td></tr>`).join('')}
    </tbody></table>
  </section>`;
}

function viewTools() {
  const income = totalIncome();
  const needs = Math.round(income * 0.5), wants = Math.round(income * 0.3), save = Math.round(income * 0.2);
  return `
  <div class="page-head"><h1>Kalkulator Keluarga</h1>
  <p class="lede">Tiga alat hitung cepat untuk merencanakan anggaran rumah tangga. Semua dihitung langsung di peramban Anda — tidak ada data yang dikirim ke mana pun.</p></div>
  <div class="grid2">
    <section class="panel"><h2>Aturan 50 / 30 / 20</h2>
      <p class="mini">Bagi pemasukan bulanan: 50% kebutuhan, 30% keinginan, 20% tabungan &amp; utang.</p>
      <label for="calc-income">Pemasukan bulanan (Rp)</label>
      <input id="calc-income" type="number" min="0" step="100000" value="${income}">
      <div class="split">
        <div class="cell"><div class="label">Kebutuhan · 50%</div><div class="amt" id="calc-needs">${fmt(needs)}</div></div>
        <div class="cell"><div class="label">Keinginan · 30%</div><div class="amt" id="calc-wants">${fmt(wants)}</div></div>
        <div class="cell"><div class="label">Tabungan · 20%</div><div class="amt" id="calc-save">${fmt(save)}</div></div>
      </div>
      <div class="result-box">Dengan pemasukan keluarga <b>${fmt(income)}</b>, target tabungan idealnya <span class="big">${fmt(save)}</span> per bulan — keluarga saat ini menabung ${fmt(totalSaved())}.</div>
    </section>
    <section class="panel"><h2>Dana darurat</h2>
      <p class="mini">Idealnya 3–6x pengeluaran pokok bulanan. Dana darurat keluarga sekarang: <b>${fmt(state.goals.find((g) => g.id === 'g1')?.saved || 0)}</b>.</p>
      <label for="calc-expense">Pengeluaran pokok per bulan (Rp)</label>
      <input id="calc-expense" type="number" min="0" step="100000" value="9000000">
      <label for="calc-months" style="margin-top:.6rem">Berapa bulan cadangan?</label>
      <select id="calc-months"><option value="3">3 bulan — minimum</option><option value="6" selected>6 bulan — ideal</option><option value="12">12 bulan — sangat aman</option></select>
      <div class="result-box">Target dana darurat: <span class="big" id="calc-emergency">${fmt(9000000 * 6)}</span><br>
      <span class="mini" id="calc-emergency-note">Terkumpul 16,4 jt dari 54 jt — kurang 37,6 jt lagi (sekitar 25 bulan bila menabung 1,5 jt/bulan).</span></div>
    </section>
  </div>
  <section class="panel"><h2>Uang saku harian — sisa bulan ini</h2>
    <p class="mini">Sisa uang <b>${fmt(remaining())}</b> dibagi ${DAYS_IN_MONTH - DAY_OF_MONTH} hari tersisa (27–30 Nov).
    Tagihan yang belum lunas (${fmt(state.bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0))}) sudah dikurangi dulu.</p>
    <div class="result-box">Batas belanja harian yang aman: <span class="big">${fmt(Math.max(0, (remaining() - state.bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0)) / (DAYS_IN_MONTH - DAY_OF_MONTH)))}</span> per hari.</div>
  </section>`;
}

// ---------- router ----------
const ROUTES = {
  '': viewDashboard,
  transactions: viewTransactions,
  budgets: viewBudgets,
  bills: viewBills,
  goals: viewGoals,
  reports: viewReports,
  tools: viewTools,
};

function render() {
  const route = (location.hash.replace(/^#\/?/, '') || '').split('?')[0];
  const view = ROUTES[route] || viewDashboard;
  document.getElementById('view').innerHTML = view();
  document.querySelectorAll('.mainnav a').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
  refreshHeader();
  if (route === 'transactions') renderTxTable();
  bindPage(route);
  window.scrollTo(0, 0);
}

function rerender() { save(); render(); }

function bindPage(route) {
  // delete transaction (delegated, works on every page that lists them)
  document.querySelectorAll('[data-del-tx]').forEach((b) => b.addEventListener('click', () => {
    state.transactions = state.transactions.filter((t) => t.id !== b.dataset.delTx);
    rerender();
  }));
  document.querySelectorAll('[data-pay-bill]').forEach((b) => b.addEventListener('click', () => {
    const bill = state.bills.find((x) => x.id === b.dataset.payBill);
    if (bill) { bill.paid = true; rerender(); }
  }));
  document.querySelectorAll('[data-budget-save]').forEach((b) => b.addEventListener('click', () => {
    const input = document.querySelector(`[data-budget-input="${b.dataset.budgetSave}"]`);
    const v = Number(input?.value);
    if (Number.isFinite(v) && v >= 0) { state.budgets[b.dataset.budgetSave] = Math.round(v); rerender(); }
  }));
  document.querySelectorAll('[data-goal-add]').forEach((b) => b.addEventListener('click', () => {
    const input = document.querySelector(`[data-goal-input="${b.dataset.goalAdd}"]`);
    const v = Number(input?.value);
    const goal = state.goals.find((x) => x.id === b.dataset.goalAdd);
    if (goal && Number.isFinite(v) && v > 0) { goal.saved += Math.round(v); rerender(); }
    else if (input) { input.focus(); input.style.outline = '2px solid #c0392b'; }
  }));

  if (route === 'transactions') {
    ['f-search', 'f-cat', 'f-type'].forEach((id) => document.getElementById(id)?.addEventListener('input', renderTxTable));
    document.getElementById('add-tx')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const desc = document.getElementById('tx-desc').value.trim();
      const amount = Number(document.getElementById('tx-amount').value);
      const date = document.getElementById('tx-date').value;
      const cat = document.getElementById('tx-cat').value;
      const type = document.getElementById('tx-type').value;
      if (!desc || !Number.isFinite(amount) || amount <= 0 || !date) return;
      state.transactions.push({ id: 't' + Date.now(), date, desc, cat, type, amount: Math.round(amount) });
      rerender();
      const msg = document.getElementById('tx-msg');
      if (msg) msg.textContent = `✓ Ditambahkan: ${desc} — ${fmt(amount)}.`;
    });
    document.getElementById('reset-data')?.addEventListener('click', () => {
      state = seedState();
      rerender();
    });
  }
  if (route === 'bills') {
    document.getElementById('add-bill')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('bill-name').value.trim();
      const amount = Number(document.getElementById('bill-amount').value);
      const due = document.getElementById('bill-due').value;
      const recurring = document.getElementById('bill-rec').value;
      if (!name || !Number.isFinite(amount) || amount <= 0 || !due) return;
      state.bills.push({ id: 'b' + Date.now(), name, amount: Math.round(amount), due, paid: false, recurring });
      rerender();
      const msg = document.getElementById('bill-msg');
      if (msg) msg.textContent = `✓ Ditambahkan: ${name} — ${fmt(amount)}, jatuh tempo ${dateId(due)}.`;
    });
  }
  if (route === 'goals') {
    document.getElementById('add-goal')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('goal-name').value.trim();
      const target = Number(document.getElementById('goal-target').value);
      const saved0 = Number(document.getElementById('goal-saved').value) || 0;
      const note = document.getElementById('goal-note').value.trim() || 'Tujuan baru keluarga';
      if (!name || !Number.isFinite(target) || target <= 0) return;
      state.goals.push({ id: 'g' + Date.now(), name, target: Math.round(target), saved: Math.round(saved0), note, color: '#0e7490' });
      rerender();
      const msg = document.getElementById('goal-msg');
      if (msg) msg.textContent = `✓ Tujuan baru dibuat: ${name} — target ${fmt(target)}.`;
    });
  }
  if (route === 'tools') {
    const incomeInput = document.getElementById('calc-income');
    const updateSplit = () => {
      const inc = Number(incomeInput.value) || 0;
      document.getElementById('calc-needs').textContent = fmt(inc * 0.5);
      document.getElementById('calc-wants').textContent = fmt(inc * 0.3);
      document.getElementById('calc-save').textContent = fmt(inc * 0.2);
    };
    incomeInput?.addEventListener('input', updateSplit);
    const expInput = document.getElementById('calc-expense');
    const monthsSel = document.getElementById('calc-months');
    const updateEmergency = () => {
      const exp = Number(expInput.value) || 0;
      const m = Number(monthsSel.value) || 6;
      const target = exp * m;
      document.getElementById('calc-emergency').textContent = fmt(target);
      const have = state.goals.find((g) => g.id === 'g1')?.saved || 0;
      const note = document.getElementById('calc-emergency-note');
      if (note) {
        const gap = target - have;
        note.textContent = gap > 0
          ? `Terkumpul ${fmt(have)} dari ${fmt(target)} — kurang ${fmt(gap)} lagi (sekitar ${Math.ceil(gap / 1500000)} bulan bila menabung Rp 1,5 jt/bulan).`
          : `🎉 Dana darurat sudah mencukupi target ${m} bulan!`;
      }
    };
    expInput?.addEventListener('input', updateEmergency);
    monthsSel?.addEventListener('change', updateEmergency);
  }
}

window.addEventListener('hashchange', render);
render();
