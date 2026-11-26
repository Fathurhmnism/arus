/* Penny — tracker keuangan pribadi. Data hanya di perangkat (localStorage).
   Catatan: kunci penyimpanan tetap 'arus.v2' (nama lama aplikasi) supaya data pengguna v1 tetap terbaca. */
(function () {
'use strict';
const KEY = 'arus.v2';
const VERSION = '2.0.0';
const $ = s => document.querySelector(s);
const nf = new Intl.NumberFormat('id-ID');
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const AV_COLORS = ['#2B3A55','#3A2E4F','#2E4A40','#4A3826','#4A2E33','#2A4048','#45402A','#353841'];

/* ---------- util ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const dstr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const tstr = d => pad(d.getHours()) + '.' + pad(d.getMinutes());
const today = () => dstr(new Date());
const monthOf = s => s.slice(0, 7);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => (n < 0 ? '−' : '') + 'Rp' + nf.format(Math.round(Math.abs(n)));
function k(n) { const a = Math.abs(n), s = n < 0 ? '−' : '';
  if (a >= 1e9) return s + 'Rp' + (a / 1e9).toLocaleString('id-ID', {maximumFractionDigits: 1}) + ' M';
  if (a >= 1e6) return s + 'Rp' + (a / 1e6).toLocaleString('id-ID', {maximumFractionDigits: 2}) + ' jt';
  if (a >= 1e3) return s + 'Rp' + Math.round(a / 1e3) + 'rb';
  return s + 'Rp' + Math.round(a); }
const parseAmt = s => { const n = parseInt(String(s).replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; };
const monthLabel = m => MONTHS[+m.slice(5) - 1] + ' ' + m.slice(0, 4);
function addMonth(m, d) { let y = +m.slice(0, 4), mo = +m.slice(5) + d; while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; } return y + '-' + pad(mo); }
function dateLabel(s) { if (s === today()) return 'Hari ini'; const y = new Date(); y.setDate(y.getDate() - 1); if (s === dstr(y)) return 'Kemarin';
  const p = s.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]); return DAYS[d.getDay()] + ', ' + p[2] + ' ' + MON[p[1] - 1]; }
const initials = n => { const w = String(n).replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/); return ((w[0] || '?')[0] + ((w[1] || '')[0] || (w[0] || '')[1] || '')).toUpperCase(); };
const avColor = n => { let h = 0; for (const c of String(n)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV_COLORS[h % AV_COLORS.length]; };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const dayIndex = () => Math.floor(Date.now() / 864e5);
const pick = arr => arr[dayIndex() % arr.length];

/* ---------- data ---------- */
const DEFAULT_CATS = [
  ['Makan & minum','expense',['gofood','grabfood','shopeefood','kopi','coffee','kenangan','janji jiwa','fore','starbucks','mcd','kfc','resto','warung','bakso','mie','nasi','martabak','boba','mixue','chatime','teh','sate','ayam','pizza','burger','bakery','roti','cafe','kantin']],
  ['Transport','expense',['gojek','goride','gocar','grab','maxim','krl','commuter','mrt','lrt','transjakarta','kai','tol','parkir','bensin','pertamina','shell','bluebird','taksi','damri','whoosh']],
  ['Belanja','expense',['indomaret','alfamart','alfamidi','superindo','hypermart','lottemart','shopee','tokopedia','lazada','tiktok','blibli','uniqlo','h&m','ikea','ace','informa','gramedia']],
  ['Tagihan & listrik','expense',['pln','token','listrik','pdam','bpjs','indihome','biznet','first media','myrepublic','iuran']],
  ['Pulsa & internet','expense',['pulsa','paket data','telkomsel','xl','axis','indosat','im3','tri','smartfren','by.u']],
  ['Kos / sewa','expense',['kos','kost','sewa','kontrakan','apartemen']],
  ['Hiburan & langganan','expense',['netflix','spotify','youtube','disney','vidio','steam','playstation','cgv','xxi','cinepolis','bioskop','apple.com','icloud','game']],
  ['Kesehatan','expense',['apotek','kimia farma','guardian','watsons','halodoc','klinik','rumah sakit','dokter']],
  ['Keluarga & sosial','expense',['kirim ortu','orang tua','arisan','kondangan','hadiah']],
  ['Sedekah & zakat','expense',['sedekah','zakat','infaq','infak','donasi','kitabisa','masjid']],
  ['Lainnya','expense',[]],
  ['Gaji / uang saku','income',['gaji','payroll','uang saku','honor','salary','allowance']],
  ['Bonus & THR','income',['bonus','thr','insentif']],
  ['Freelance & usaha','income',['invoice','project','proyek','jasa']],
  ['Cashback & refund','income',['cashback','refund','pengembalian']],
  ['Pemasukan lain','income',[]]
];
const DEFAULT_ACCS = [
  ['Tunai','tunai'],['Mandiri','bank'],['BCA','bank'],['BRI','bank'],['Jago','bank'],['SeaBank','bank'],
  ['GoPay','ewallet'],['OVO','ewallet'],['ShopeePay','ewallet'],['DANA','ewallet'],['Stockbit','investasi','IDR'],['Binance','investasi','USD']
];
const KIND_LABEL = { bank: 'Rekening bank', ewallet: 'E-wallet', tunai: 'Tunai', investasi: 'Investasi' };
/* Tunai tidak dipakai di Penny: akunnya disembunyikan dari semua pilihan (data lama tetap tersimpan, tidak dihapus). */
const live = () => S.accounts.filter(a => a.kind !== 'tunai');

function freshState() {
  return {
    v: 2, name: 'Fathur', setupDone: false,
    accounts: DEFAULT_ACCS.map(([name, kind, cur], i) => ({ id: 'a' + i, name, kind, currency: cur || 'IDR', initial: 0, initialCost: 0, valuation: null })).filter(a => a.kind !== 'tunai'),
    categories: DEFAULT_CATS.map(([name, kind, kw], i) => ({ id: 'c' + i, name, kind, kw })),
    transactions: [], inbox: [], merchantMap: {}, budget: 0, lastAccount: 'a6',
    rate: { usdIdr: 16500, date: null, auto: true }, lastBackup: null, hideWealth: false
  };
}
let S;
let storageOK = true;
function load() {
  try { const r = localStorage.getItem(KEY); if (r) { const d = JSON.parse(r); if (d && d.accounts && d.transactions) return Object.assign(freshState(), d); } }
  catch (e) { storageOK = false; }
  return freshState();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); storageOK = true; } catch (e) { storageOK = false; toast('Gagal menyimpan. Penyimpanan HP penuh?'); } }
function commit() { save(); render(); }

const acc = id => S.accounts.find(a => a.id === id);
const cat = id => S.categories.find(c => c.id === id);

/* ---------- hitungan ---------- */
function rateOf(a) { return a.currency === 'USD' ? (S.rate.usdIdr || 0) : 1; }
function investCost(a) { let c = a.initialCost || 0; for (const t of S.transactions) if (t.type === 'transfer') { if (t.toId === a.id) c += t.amount; if (t.accountId === a.id) c -= t.amount; } return c; }
function accountValue(a) {
  if (a.kind === 'investasi') { if (a.assets && a.assets.length) return a.assets.reduce((s, x) => s + (x.value || 0), 0) * rateOf(a);
    const cost = investCost(a); if (!a.valuation) return cost; return a.valuation.value * rateOf(a) + (cost - a.valuation.costAt); }
  let b = a.initial || 0;
  for (const t of S.transactions) {
    if (t.accountId === a.id) b += t.type === 'income' ? t.amount : -t.amount;
    if (t.type === 'transfer' && t.toId === a.id) b += t.amount;
  }
  return b;
}
function wealth() { return S.accounts.reduce((s, a) => s + accountValue(a), 0); }
function spent(filterFn) { let s = 0; for (const t of S.transactions) if (t.type === 'expense' && filterFn(t)) s += t.amount; return s; }
function monthTotals(m) { let inc = 0, exp = 0; for (const t of S.transactions) { if (monthOf(t.date) !== m) continue; if (t.type === 'income') inc += t.amount; if (t.type === 'expense') exp += t.amount; } return { inc, exp }; }
function daily() {
  const td = today(), m = monthOf(td), now = new Date();
  const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(), left = dim - now.getDate() + 1;
  const before = spent(t => monthOf(t.date) === m && t.date < td), todaySpent = spent(t => t.date === td), month = before + todaySpent;
  const jatah = S.budget > 0 ? Math.max(0, (S.budget - before) / left) : 0;
  let mood = 'aman';
  if (S.budget > 0) { if (jatah <= 0) mood = todaySpent > 0 ? 'boncos' : 'hampir'; else { const p = todaySpent / jatah; mood = p > 1 ? 'boncos' : p >= 0.8 ? 'hampir' : 'aman'; } }
  return { todaySpent, jatah, mood, month, sisaBudget: S.budget - month, left, pct: jatah > 0 ? todaySpent / jatah : (todaySpent > 0 ? 2 : 0) };
}

/* ---------- Cuki (v2: jas + kacamata emas) ---------- */
const HAIR = '<g fill="#1A1410"><circle cx="34" cy="40" r="10"/><circle cx="38" cy="27" r="11"/><circle cx="50" cy="18" r="11"/><circle cx="63" cy="14" r="11"/><circle cx="76" cy="18" r="11"/><circle cx="86" cy="28" r="10.5"/><circle cx="88" cy="41" r="9"/><circle cx="48" cy="30" r="10"/><circle cx="62" cy="27" r="10"/><circle cx="75" cy="30" r="10"/></g><g fill="none" stroke="#3A2C22" stroke-width="1.4" stroke-linecap="round"><path d="M44 18a4 4 0 1 1 5 4"/><path d="M59 12a4 4 0 1 1 5 4"/><path d="M72 16a4 4 0 1 1 5 4"/><path d="M33 28a4 4 0 1 1 5 4"/><path d="M82 26a4 4 0 1 1 5 4"/></g>';
const SUIT = '<path d="M22 130c0-22 16-38 38-38s38 16 38 38z" fill="#1C2333"/><path d="M48 93l12 22 12-22z" fill="#F3EFE7"/><path d="M57.5 99h5l2 18-4.5 5-4.5-5z" fill="#C9A96E"/><path d="M48 93l12 22-7 6-11-24z" fill="#252E42"/><path d="M72 93l-12 22 7 6 11-24z" fill="#252E42"/><circle cx="83" cy="112" r="2" fill="#C9A96E"/>';
const SKIN = '#A8744C';
const GLASSES = '<g fill="none" stroke="#C9A96E" stroke-width="2.2"><circle cx="48" cy="56" r="8.5"/><circle cx="72" cy="56" r="8.5"/><path d="M56.5 56h7M39.5 54l-6-2M80.5 54l6-2"/></g>';
function cuki(mood, size) {
  size = size || 92; const h = Math.round(size * 130 / 120);
  const head = `<circle cx="60" cy="56" r="29" fill="${SKIN}"/><ellipse cx="31" cy="58" rx="4" ry="6" fill="${SKIN}"/><ellipse cx="89" cy="58" rx="4" ry="6" fill="${SKIN}"/>`;
  let face, cls = 'cuki-calm', label = 'Cuki tenang';
  if (mood === 'boncos') { label = 'Cuki pasrah'; cls = 'cuki-sigh';
    face = `<path d="M44 57h8M68 57h8" stroke="#1A1410" stroke-width="2.4" stroke-linecap="round"/><path d="M41 47l9 3M79 47l-9 3" stroke="#1A1410" stroke-width="2" stroke-linecap="round"/><path d="M52 74q8-5 16 0" fill="none" stroke="#5A3520" stroke-width="2.2" stroke-linecap="round"/><path d="M90 40q4 7 1 10q-3 3-6 0q-2-4 5-10z" fill="#8DB8F0" opacity=".85"/>`; }
  else if (mood === 'hampir') { label = 'Cuki waspada';
    face = `<circle cx="48" cy="57" r="2.6" fill="#1A1410"/><circle cx="72" cy="57" r="2.6" fill="#1A1410"/><path d="M41 46l10-2M79 46l-10-2" stroke="#1A1410" stroke-width="2" stroke-linecap="round"/><path d="M53 73h14" stroke="#5A3520" stroke-width="2.2" stroke-linecap="round"/><path d="M89 42q3 6 1 8q-2 2-4 0q-2-3 3-8z" fill="#8DB8F0" opacity=".75"/>`; }
  else face = `<circle cx="48" cy="57" r="2.6" fill="#1A1410"/><circle cx="72" cy="57" r="2.6" fill="#1A1410"/><path d="M42 46q6-3 11 0M67 46q5-3 11 0" fill="none" stroke="#1A1410" stroke-width="2" stroke-linecap="round"/><path d="M51 71q9 7 18 0" fill="none" stroke="#5A3520" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg class="${cls}" width="${size}" height="${h}" viewBox="0 0 120 130" role="img" aria-label="${label}">${SUIT}${head}${HAIR}${face}${GLASSES}</svg>`;
}
const COPY = {
  aman: { bubble: ['Masih aman. Pertahankan ritmenya.', 'Dompet tenang, saya juga.', 'Hari yang rapi. Lanjutkan.'] },
  hampir: { bubble: ['Jatah hari ini mulai menipis. Pilih yang penting saja.', 'Sedikit lagi batasnya. Mungkin kopi besok bisa diseduh sendiri.'] },
  boncos: { bubble: ['Jatah hari ini sudah lewat. Besok kita mulai lebih rapi.', 'Hari ini cukup boros. Dompetnya butuh istirahat.'] }
};
function saveToast(t, mood) {
  if (t.type === 'income') return pick([`${k(t.amount)} masuk. Selamat, jangan buru-buru dihabiskan.`, `Tercatat: pemasukan ${k(t.amount)}.`]);
  if (t.type === 'transfer') return `Tercatat: pindah ${k(t.amount)} ke ${acc(t.toId) ? acc(t.toId).name : 'akun lain'}.`;
  const what = t.merchant || (cat(t.categoryId) || {}).name || 'pengeluaran';
  if (mood === 'boncos') return pick([`${k(t.amount)} untuk ${what}. Jatah hari ini sudah lewat, pelan-pelan ya.`, `Tercatat, ${k(t.amount)} untuk ${what}. Besok kita rem sedikit.`]);
  return pick([`Tercatat: ${k(t.amount)} untuk ${what}.`, `${k(t.amount)} untuk ${what}, sudah dicatat.`]);
}

/* ---------- saran kategori ---------- */
function suggestCats(merchant, text, kind) {
  const list = S.categories.filter(c => c.kind === kind), out = [];
  const m = norm(merchant), t = norm(text);
  if (m && S.merchantMap[m] && cat(S.merchantMap[m]) && cat(S.merchantMap[m]).kind === kind) out.push(S.merchantMap[m]);
  for (const c of list) for (const kw of (c.kw || [])) { const w = norm(kw); if (w && ((' ' + m + ' ').includes(' ' + w) || (' ' + t + ' ').includes(' ' + w))) { if (!out.includes(c.id)) out.push(c.id); break; } }
  const freq = {}; for (const tx of S.transactions.slice(-200)) if (tx.categoryId && cat(tx.categoryId) && cat(tx.categoryId).kind === kind) freq[tx.categoryId] = (freq[tx.categoryId] || 0) + 1;
  Object.keys(freq).sort((a, b) => freq[b] - freq[a]).forEach(id => { if (!out.includes(id)) out.push(id); });
  list.forEach(c => { if (!out.includes(c.id)) out.push(c.id); });
  return out;
}
function learn(merchant, catId) { const m = norm(merchant); if (m && catId) S.merchantMap[m] = catId; }

/* ---------- kotak masuk ---------- */
function matchAccount(app) {
  const a = norm(app); if (!a) return null;
  return (live().find(x => norm(x.name) === a) || live().find(x => a.includes(norm(x.name)) || norm(x.name).includes(a)) || {}).id || null;
}
function ingest(entries) {
  let added = 0, skipped = 0;
  for (const e of entries) {
    const at = ArusParser.parseTime(e.time);
    const dup = S.inbox.concat([]).find(x => x.app === e.app && x.body === e.body && x.title === e.title && Math.abs(new Date(x.at) - at) < 180000);
    const dupTx = S.transactions.find(x => x.rawKey && x.rawKey === (e.app + '|' + e.title + '|' + e.body + '|' + dstr(at)));
    if (dup || dupTx) continue;
    const p = ArusParser.parse(e);
    const item = { id: uid(), at: at.toISOString(), app: e.app, title: e.title, body: e.body, p, accountId: matchAccount(e.app), status: p.skip ? 'skipped' : 'pending', ui: {} };
    if (!p.skip) {
      item.ui.type = p.direction === 'in' ? 'income' : p.direction === 'out' ? 'expense' : null;
      const own = S.accounts.find(a => a.id !== item.accountId && new RegExp('\\b' + norm(a.name) + '\\b').test(norm(e.title + ' ' + e.body)));
      if (own && (p.kind === 'topup' || p.kind === 'transfer') && p.direction === 'out') { item.ui.type = 'transfer'; item.ui.toId = own.id; }
      if (item.ui.type === 'expense' || item.ui.type === 'income') item.ui.catId = (suggestCats(p.merchant, e.title + ' ' + e.body, item.ui.type)[0]);
      added++;
    } else skipped++;
    S.inbox.push(item);
  }
  pairTransfers();
  S.inbox = S.inbox.filter(x => x.status !== 'skipped' || Date.now() - new Date(x.at) < 7 * 864e5);
  save();
  return { added, skipped };
}
function pairTransfers() {
  const pend = S.inbox.filter(x => x.status === 'pending' && !x.pairId && x.p && x.p.amount);
  for (const a of pend) {
    if (a.pairId || a.p.direction !== 'out') continue;
    const b = pend.find(y => !y.pairId && y !== a && y.p.direction === 'in' && y.p.amount === a.p.amount && y.accountId && y.accountId !== a.accountId && Math.abs(new Date(y.at) - new Date(a.at)) <= 3600000);
    if (b) { a.pairId = b.id; b.pairId = a.id; }
  }
}
function importFromHash() {
  const h = location.hash;
  if (!h.startsWith('#inbox=')) return false;
  let txt = '';
  try {
    const b64 = decodeURIComponent(h.slice(7)).replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
    const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    txt = new TextDecoder('utf-8').decode(bytes);
  } catch (e) { toast('Data dari Shortcuts gagal dibaca.'); }
  history.replaceState(null, '', location.pathname + '#kotak');
  if (txt) { const r = ingest(ArusParser.parseInboxText(txt)); setTimeout(() => toast(r.added ? `${r.added} transaksi baru masuk kotak masuk.` : 'Tidak ada transaksi baru.'), 300); }
  return true;
}
function saveInboxItem(it) {
  const at = new Date(it.at), ty = it.ui.type;
  const t = { id: uid(), date: dstr(at), time: tstr(at), type: ty, amount: it.p.amount, accountId: it.accountId, merchant: it.p.merchant || '', note: '', source: 'notif', rawKey: it.app + '|' + it.title + '|' + it.body + '|' + dstr(at) };
  if (ty === 'transfer') t.toId = it.ui.toId; else { t.categoryId = it.ui.catId; learn(t.merchant, t.categoryId); }
  S.transactions.push(t);
  S.inbox = S.inbox.filter(x => x.id !== it.id);
  return t;
}
function itemReady(it) {
  if (!it.accountId || !it.p.amount || !it.ui.type) return false;
  if (it.ui.type === 'transfer') return !!it.ui.toId && it.ui.toId !== it.accountId;
  return !!it.ui.catId;
}

/* ---------- tampilan ---------- */
let curMonth = monthOf(today()), filter = 'all', query = '';
const VIEWS = ['beranda', 'kotak', 'riwayat', 'aset', 'budget', 'pengaturan', 'lainnya', 'akun'];
const view = () => { const h = location.hash.replace('#', ''); return VIEWS.includes(h) ? h : 'beranda'; };
function header(title, sub, right) {
  return `<header class="top"><div><div class="d">${esc(sub)}</div><h1>${esc(title)}</h1></div><div class="r">${right || ''}</div></header>`;
}
function txRow(t, withDate) {
  const a = acc(t.accountId), c = cat(t.categoryId);
  let title, sub, cls = '', sign = '−';
  if (t.type === 'transfer') { title = 'Transfer'; sub = `${a ? a.name : '?'} → ${acc(t.toId) ? acc(t.toId).name : '?'}`; sign = ''; }
  else { title = t.merchant || (c ? c.name : 'Tanpa kategori'); sub = [t.merchant && c ? c.name : '', a ? a.name : '', t.time || ''].filter(Boolean).join(' · '); }
  if (t.type === 'income') { cls = 'plus'; sign = '+'; }
  const name = t.type === 'transfer' ? 'TF' : initials(title);
  return `<button class="row" data-act="tx-edit" data-id="${t.id}"><span class="av" style="background:${t.type === 'transfer' ? '#2A2D35' : avColor(title)}">${esc(name)}</span><span class="m"><b>${esc(title)}</b><span>${esc(sub)}${t.note ? ' · ' + esc(t.note) : ''}</span></span><span class="v num ${cls}">${sign}${nf.format(t.amount)}${withDate ? `<small>${esc(dateLabel(t.date))}</small>` : ''}</span></button>`;
}
const sortTx = list => list.slice().sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')) || (b.created || 0) - (a.created || 0));

function vOnboarding() {
  return `<div class="onb">${header('Halo, ' + S.name, 'Selamat datang di Penny')}
  <div class="hero"><div class="who">${cuki('aman')}<div class="bubble">Saya Cuki, asisten dompetmu. Isi dua hal ini dulu, sisanya bisa menyusul.</div></div></div>
  <div class="box pad form">
    <label for="ob-name">Panggil kamu siapa?<input id="ob-name" value="${esc(S.name)}" maxlength="20"></label>
    <label for="ob-budget">Budget pengeluaran per bulan<div class="amtin"><span>Rp</span><input id="ob-budget" inputmode="numeric" placeholder="0" value="${S.budget ? nf.format(S.budget) : ''}"></div></label>
    <p class="note">Batas belanja bulananmu (di luar tabungan dan investasi). Dari angka ini Penny menghitung toples dan jatah harian. Belum yakin? Isi perkiraan dulu, bisa diubah kapan saja.</p>
  </div>
  <div class="box pad form"><div class="lab">Saldo sekarang di tiap akun (opsional)</div>
  ${live().filter(a => a.kind !== 'investasi').map(a => `<label for="ob-${a.id}">${esc(a.name)}<input id="ob-${a.id}" inputmode="numeric" placeholder="0" data-amt value="${a.initial ? nf.format(a.initial) : ''}"></label>`).join('')}
  <p class="note">Aset Stockbit dan Binance bisa diisi nanti di layar Investasi.</p></div>
  <button class="btn pri" data-act="ob-done">Mulai</button>
  <div class="box pad form"><div class="lab">Sudah pernah memakai Penny (dulu Arus) sebelumnya?</div><p class="note">Pulihkan dari file backup (.json), semua datamu kembali.</p><button class="btn" data-act="restore">Pulihkan dari backup</button></div></div>`;
}

/* ---------- dompet ---------- */
const CARD_SKIN = {
  bca: 'bca', bri: 'bri', mandiri: 'mandiri', seabank: 'seabank', jago: 'jago',
  gopay: 'gopay', ovo: 'ovo', shopeepay: 'shopeepay', dana: 'dana'
};
const skinOf = a => CARD_SKIN[norm(a.name).replace(/\s+/g, '')] || 'netral';
const walletTotal = () => S.accounts.filter(a => a.kind === 'bank' || a.kind === 'ewallet').reduce((s, a) => s + accountValue(a), 0);
const money = n => S.hideWealth ? 'Rp •••' : rp(n);
const STEP = 44, CARD_H = 206, WALLET_H = 150;
let selCard = null;
function greet() { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam'; }

function vBeranda() {
  const banks = S.accounts.filter(a => a.kind === 'bank'), ews = S.accounts.filter(a => a.kind === 'ewallet');
  const pend = S.inbox.filter(x => x.status === 'pending').length;
  const eye = S.hideWealth ? '<path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/>' : '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
  let h = `<header class="top"><div class="hi"><span class="cuki-av">${cuki('aman', 38)}</span><div><div class="d">${greet()}, ${esc(S.name)}</div><h1>Dompet</h1></div></div>
    <div class="r"><button class="pill iconbtn" data-act="toggle-wealth" aria-label="${S.hideWealth ? 'Tampilkan saldo' : 'Sembunyikan saldo'}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${eye}</svg></button></div></header>`;
  if (!storageOK) h += `<div class="box pad note">Penyimpanan HP tidak bisa dipakai di mode ini (Private Browsing?). Data akan hilang saat ditutup.</div>`;

  h += `<section class="wallet-stage" id="stage" aria-label="Kartu bank">`;
  banks.forEach((a, i) => {
    const tx = sortTx(S.transactions.filter(t => t.accountId === a.id || t.toId === a.id)).slice(0, 4);
    h += `<button class="card skin-${skinOf(a)}" data-act="card" data-id="${a.id}" data-i="${i}" aria-label="Kartu ${esc(a.name)}, saldo ${S.hideWealth ? 'disembunyikan' : rp(accountValue(a))}">
      <span class="c-top"><span class="c-name">${esc(a.name)}</span><span class="c-bal num">${money(accountValue(a))}</span></span>
      <span class="c-sub"><span class="c-chip"></span><span class="c-no">TABUNGAN${a.last4 ? ' · •••• ' + esc(a.last4) : ''}</span></span></button>
      <div class="card-detail" data-for="${a.id}"><div class="sec"><h2>Transaksi ${esc(a.name)}</h2><button class="link" data-act="acc-edit" data-id="${a.id}">Atur akun</button></div>
      ${tx.length ? `<div class="list">${tx.map(t => txRow(t, true)).join('')}</div>` : `<div class="empty">Belum ada transaksi di akun ini.</div>`}
      <button class="btn sm" data-act="card" data-id="${a.id}">Tutup</button></div>`;
  });
  h += `<div class="wallet" id="wallet"><span class="w-clasp"></span><div class="w-total"><span>Total saldo · ${banks.length + ews.length} akun</span><b class="num">${money(walletTotal())}</b></div></div></section>`;

  if (ews.length) h += `<div class="ew-wrap" id="ew"><div class="sec"><h2>E-wallet</h2></div><div class="ew-row">${ews.map(a => `<button class="ewc skin-${skinOf(a)}" data-act="acc-edit" data-id="${a.id}" aria-label="${esc(a.name)}, saldo ${S.hideWealth ? 'disembunyikan' : rp(accountValue(a))}"><span class="c-name">${esc(a.name)}</span><span class="num">${S.hideWealth ? '•••' : k(accountValue(a))}</span><span class="c-chip"></span></button>`).join('')}</div></div>`;

  h += `<div id="rest">`;
  if (pend) h += `<button class="chip" data-act="go" data-to="kotak"><span>${pend} transaksi dari notifikasi menunggu dicek.</span><span>Cek</span></button>`;
  const recent = sortTx(S.transactions).slice(0, 6);
  h += `<div class="sec"><h2>Terbaru</h2><a href="#riwayat">Semua</a></div>`;
  h += recent.length ? `<div class="box list">${recent.map(t => txRow(t, true)).join('')}</div>` : `<div class="box empty">Belum ada transaksi. Ketuk <b>+</b> untuk mencatat.</div>`;
  if (backupDue()) h += `<button class="chip calm" data-act="go" data-to="pengaturan"><span>Sudah lama belum backup. Sebaiknya sekarang.</span><span>Backup</span></button>`;
  h += `</div>`;
  return h;
}
function layoutWallet(animate) {
  const st = $('#stage'); if (!st) return;
  if (!animate) st.classList.add('noanim');
  const cards = [...st.querySelectorAll('.card')], n = cards.length, wl = $('#wallet');
  const front = n - 1, sel = cards.findIndex(c => c.dataset.id === selCard);
  if (selCard && sel < 0) selCard = null;
  st.querySelectorAll('.card-detail').forEach(d => d.classList.toggle('on', d.dataset.for === selCard));
  let wTop;
  if (sel < 0) {
    cards.forEach((c, i) => { c.style.top = i * STEP + 'px'; c.style.zIndex = i + 1; c.style.left = c.style.right = Math.max(0, (front - i) * 4) + 'px'; c.classList.toggle('front', i === front); });
    wTop = n ? front * STEP + 96 : 0;
  } else {
    const det = st.querySelector('.card-detail.on'); det.style.top = (CARD_H + 16) + 'px';
    wTop = CARD_H + 16 + det.offsetHeight + 28;
    let j = 0;
    cards.forEach((c, i) => { if (i === sel) { c.style.top = '0px'; c.style.zIndex = 30; c.style.left = c.style.right = '0px'; c.classList.add('front'); }
      else { c.style.top = (wTop - 22 + j * 8) + 'px'; c.style.zIndex = 1 + j; c.style.left = c.style.right = (12 + j * 4) + 'px'; c.classList.remove('front'); j++; } });
  }
  wl.style.top = wTop + 'px';
  st.style.height = (wTop + WALLET_H) + 'px';
  st.classList.toggle('open', sel >= 0);
  document.querySelectorAll('#ew,#rest').forEach(e => e.classList.toggle('dim', sel >= 0));
  if (!animate) { st.offsetHeight; st.classList.remove('noanim'); }
}
function backupDue() { return S.transactions.length > 10 && (!S.lastBackup || Date.now() - new Date(S.lastBackup) > 14 * 864e5); }

function vKotak() {
  const pend = S.inbox.filter(x => x.status === 'pending').sort((a, b) => b.at.localeCompare(a.at));
  const skipped = S.inbox.filter(x => x.status === 'skipped');
  const ready = pend.filter(x => !x.pairId && itemReady(x));
  let h = header('Kotak masuk', pend.length ? pend.length + ' menunggu dicek' : 'Semua beres', `<button class="pill" data-act="paste-notif">+ Tempel</button>`);
  if (ready.length > 1) h += `<button class="btn pri" data-act="inbox-save-all">Simpan ${ready.length} yang sudah siap</button>`;
  if (!pend.length) h += `<div class="box empty">${cuki('aman', 80)}<p>Kosong. Transaksi dari notifikasi akan muncul di sini.</p></div>`;
  const shown = new Set();
  for (const it of pend) {
    if (shown.has(it.id)) continue; shown.add(it.id);
    const mate = it.pairId && S.inbox.find(x => x.id === it.pairId);
    if (mate) { shown.add(mate.id); const out = it.p.direction === 'out' ? it : mate, inn = out === it ? mate : it;
      h += `<div class="box pad inbox-card"><div class="h"><span class="tag">TRANSFER ANTAR AKUN</span><span class="amt num">${nf.format(out.p.amount)}</span></div>
      <b>${esc(acc(out.accountId) ? acc(out.accountId).name : out.app)} → ${esc(acc(inn.accountId) ? acc(inn.accountId).name : inn.app)}</b>
      <p class="note">Dua notifikasi dengan nominal sama dan waktu berdekatan. Kemungkinan besar ini pindah uang antar akunmu sendiri, bukan belanja.</p>
      <div class="btnrow"><button class="btn sm" data-act="unpair" data-id="${out.id}">Bukan transfer</button><button class="btn sm pri" data-act="pair-save" data-id="${out.id}">Simpan transfer</button></div></div>`;
      continue; }
    h += inboxCard(it);
  }
  if (skipped.length) h += `<div class="sec"><h2>Dibuang otomatis</h2><span class="note">${skipped.length}</span></div><div class="box list">${skipped.slice(-10).reverse().map(it => `<div class="row"><span class="av" style="background:#2A2D35">${esc(initials(it.app))}</span><span class="m"><b>${esc(it.p.reason || 'Bukan transaksi')}</b><span>${esc(it.title + ' ' + it.body)}</span></span><button class="btn sm" data-act="unskip" data-id="${it.id}">Ini transaksi</button></div>`).join('')}</div>`;
  return h;
}
function inboxCard(it) {
  const a = acc(it.accountId), ty = it.ui.type;
  const time = new Date(it.at);
  const seg = [['expense', 'Keluar'], ['income', 'Masuk'], ['transfer', 'Transfer']].map(([v, l]) => `<button data-act="ib-type" data-id="${it.id}" data-v="${v}" aria-pressed="${ty === v}">${l}</button>`).join('');
  let body = '';
  if (!it.accountId) body += `<label class="lab">Akun mana?<select data-ib="acc" data-id="${it.id}" class="inp"><option value="">Pilih akun</option>${live().map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>`;
  if (!it.p.amount) body += `<label class="lab">Nominal<input data-ib="amt" data-id="${it.id}" inputmode="numeric" class="inp"></label>`;
  if (ty === 'transfer') body += `<div class="lab">${it.p.direction === 'in' ? 'Dari akun' : 'Ke akun'}</div><div class="accs">${live().filter(x => x.id !== it.accountId).map(x => `<button data-act="ib-to" data-id="${it.id}" data-v="${x.id}" aria-pressed="${it.ui.toId === x.id}">${esc(x.name)}</button>`).join('')}</div>`;
  else if (ty) { const sug = suggestCats(it.p.merchant, it.title + ' ' + it.body, ty).slice(0, 7);
    body += `<div class="cats">${sug.map(id => `<button data-act="ib-cat" data-id="${it.id}" data-v="${id}" aria-pressed="${it.ui.catId === id}">${esc(cat(id).name)}</button>`).join('')}</div>`; }
  const sign = ty === 'income' ? '+' : ty === 'expense' ? '−' : '';
  return `<div class="box pad inbox-card"><div class="h"><div><span class="tag">${esc(a ? a.name : it.app || '?')}</span> <span class="note">${dateLabel(dstr(time))} ${tstr(time)}</span></div><span class="amt num ${ty === 'income' ? 'plus' : ''}">${it.p.amount ? sign + nf.format(it.p.amount) : '?'}</span></div>
  <b>${esc(it.p.merchant || 'Merchant tidak terbaca')}</b>
  <div class="seg">${seg}</div>${body}
  <details><summary class="note">Teks notifikasi asli</summary><div class="raw">${esc([it.title, it.body].filter(Boolean).join('\n'))}</div></details>
  <div class="btnrow"><button class="btn sm" data-act="ib-skip" data-id="${it.id}">Abaikan</button><button class="btn sm" data-act="ib-edit" data-id="${it.id}">Ubah detail</button><button class="btn sm pri" data-act="ib-save" data-id="${it.id}" ${itemReady(it) ? '' : 'disabled'}>Simpan</button></div></div>`;
}

function vRiwayat() {
  const max = monthOf(today());
  const list = sortTx(S.transactions.filter(t => monthOf(t.date) === curMonth && (filter === 'all' || t.type === filter)));
  const q = norm(query);
  const shown = q ? list.filter(t => norm([t.merchant, t.note, (cat(t.categoryId) || {}).name, (acc(t.accountId) || {}).name].join(' ')).includes(q)) : list;
  const mt = monthTotals(curMonth);
  let h = header('Riwayat', 'Semua transaksi');
  h += `<div class="monthbar"><button data-act="month" data-d="-1" aria-label="Bulan sebelumnya">‹</button><span>${monthLabel(curMonth)}</span><button data-act="month" data-d="1" aria-label="Bulan berikutnya" ${curMonth >= max ? 'disabled' : ''}>›</button></div>`;
  h += `<div class="tiles"><div class="tile box" style="box-shadow:none"><span>Masuk</span><b class="num plus">${k(mt.inc)}</b></div><div class="tile box" style="box-shadow:none"><span>Keluar</span><b class="num">${k(mt.exp)}</b></div></div>`;
  h += `<div class="filters">${[['all', 'Semua'], ['expense', 'Keluar'], ['income', 'Masuk'], ['transfer', 'Transfer']].map(([v, l]) => `<button class="fchip" data-act="filter" data-v="${v}" aria-pressed="${filter === v}">${l}</button>`).join('')}</div>`;
  h += `<div class="form"><input id="q" type="search" placeholder="Cari merchant, kategori, akun" value="${esc(query)}" aria-label="Cari transaksi"></div><div id="rlist">${riwayatList(shown)}</div>`;
  return h;
}
function riwayatList(list) {
  if (!list.length) return `<div class="box empty">Tidak ada transaksi di sini.</div>`;
  const groups = {}; list.forEach(t => (groups[t.date] = groups[t.date] || []).push(t));
  return Object.keys(groups).sort().reverse().map(d => { const out = groups[d].reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
    return `<div class="day"><span>${esc(dateLabel(d))}</span><span class="num">${out ? '−' + nf.format(out) : ''}</span></div><div class="box list">${groups[d].map(t => txRow(t)).join('')}</div>`; }).join('');
}

/* ---------- investasi per aset ---------- */
const ASSET_TYPES = { saham: ['Saham', 'lot'], reksadana: ['Reksa dana', 'unit'], kripto: ['Kripto', 'koin'], lainnya: ['Lainnya', ''] };
const invAccs = () => S.accounts.filter(a => a.kind === 'investasi');
const assetRp = (a, x) => (x.value || 0) * rateOf(a);
function migrateAssets() {
  // v1 menyimpan satu nilai per akun investasi; v2 merinci per aset. Nilai lama dijadikan satu aset awal, tidak dihapus.
  let changed = false;
  for (const a of invAccs()) {
    if (a.assets) continue;
    const cost = investCost(a);
    if (a.valuation || cost > 0) { a.assets = [{ id: uid(), name: 'Portofolio ' + a.name, type: 'lainnya', qty: null, value: a.valuation ? a.valuation.value + (cost - (a.valuation.costAt || 0)) / rateOf(a) : cost / rateOf(a), cost, date: (a.valuation && a.valuation.date) || today() }]; }
    else a.assets = [];
    changed = true;
  }
  if (changed) save();
}
function invTotals() {
  let v = 0, c = 0;
  for (const a of invAccs()) for (const x of (a.assets || [])) { v += assetRp(a, x); c += x.cost || 0; }
  return { v, c, g: v - c };
}
function recordInv() {
  const t = invTotals().v, d = today(); S.invHist = S.invHist || [];
  const last = S.invHist[S.invHist.length - 1];
  if (last && last.d === d) { if (last.v !== t) { last.v = t; save(); } }
  else if (t > 0 || S.invHist.length) { S.invHist.push({ d, v: t }); save(); }
}
const pct = (g, c) => c > 0 ? (g >= 0 ? '+' : '−') + Math.abs(g / c * 100).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : '';
let invRange = '3B';
function invChart() {
  const days = { '1M': 7, '1B': 31, '3B': 92, '1T': 366, 'Semua': 1e5 }[invRange];
  const from = dstr(new Date(Date.now() - days * 864e5));
  const pts = (S.invHist || []).filter(p => p.d >= from);
  const pills = Object.keys({ '1M': 1, '1B': 1, '3B': 1, '1T': 1, 'Semua': 1 }).map(r => `<button data-act="inv-range" data-v="${r}" aria-pressed="${r === invRange}">${r}</button>`).join('');
  let svg;
  if (pts.length < 2) svg = `<div class="chart-empty note">Grafik mulai terisi setelah nilai investasimu tercatat lebih dari satu hari.</div>`;
  else {
    const W = 340, H = 140, vs = pts.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
    const xy = pts.map((p, i) => [i / (pts.length - 1) * W, 12 + (1 - (p.v - lo) / span) * (H - 24)]);
    const up = vs[vs.length - 1] >= vs[0], col = up ? 'var(--good)' : 'var(--bad)';
    const line = xy.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
    svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Grafik nilai portofolio ${invRange}, ${up ? 'naik' : 'turun'}"><path d="M0 ${H / 3}H${W}M0 ${H * 2 / 3}H${W}" stroke="var(--line)" stroke-width="1"/><polygon points="0,${H} ${line} ${W},${H}" fill="${col}" opacity=".08"/><polyline points="${line}" fill="none" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
  }
  return `${svg}<div class="seg range">${pills}</div>`;
}
function vAset() {
  recordInv();
  const t = invTotals();
  let h = header('Investasi', invAccs().map(a => a.name).join(' · ') || 'Belum ada akun investasi');
  h += `<section class="inv-head"><span class="note">Nilai portofolio</span><span class="inv-total num">${S.hideWealth ? 'Rp •••' : rp(t.v)}</span>
    ${t.c > 0 ? `<span class="num" style="color:${t.g >= 0 ? 'var(--good)' : 'var(--bad)'}">${t.g >= 0 ? '▲' : '▼'} ${rp(Math.abs(t.g))} (${pct(t.g, t.c)}) <span class="note">· sejak beli</span></span>` : ''}</section>`;
  h += invChart();
  for (const a of invAccs()) {
    const list = a.assets || [], sum = list.reduce((s, x) => s + assetRp(a, x), 0);
    h += `<div class="sec"><h2>${esc(a.name.toUpperCase())}${a.currency === 'USD' ? ` · kurs ${rp(S.rate.usdIdr)}` : ''}</h2><span class="note num">${k(sum)}</span></div>`;
    h += `<div class="box list">${list.map(x => { const v = assetRp(a, x), g = v - (x.cost || 0), ty = ASSET_TYPES[x.type] || ASSET_TYPES.lainnya;
      const qty = x.qty ? `${x.qty.toLocaleString('id-ID', { maximumFractionDigits: 8 })} ${ty[1]}`.trim() : '';
      const sub = [ty[0], qty, a.currency === 'USD' ? '$' + (x.value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 }) : ''].filter(Boolean).join(' · ');
      return `<button class="row" data-act="asset-edit" data-acc="${a.id}" data-id="${x.id}"><span class="m"><b>${esc(x.name)}</b><span>${esc(sub)}</span></span><span class="v num">${rp(v)}${x.cost > 0 ? `<small style="color:${g >= 0 ? 'var(--good)' : 'var(--bad)'}">${pct(g, x.cost)}</small>` : ''}</span></button>`; }).join('') || '<div class="empty">Belum ada aset.</div>'}</div>
      <div class="btnrow"><button class="btn sm" data-act="asset-new" data-acc="${a.id}">+ Tambah aset</button>${a.currency === 'USD' ? '<button class="btn sm" data-act="rate-edit">Atur kurs</button>' : ''}</div>`;
  }
  h += `<p class="note">Nilai aset diperbarui manual. Ketuk aset untuk mengubah nilai, jumlah, atau modalnya.</p>`;
  return h;
}
function assetForm(accId, x) {
  const a = acc(accId), isNew = !x; x = x || { name: '', type: 'saham', qty: null, value: null, cost: 0 };
  const cur = a.currency === 'USD' ? '$' : 'Rp';
  openSheet(isNew ? 'Aset baru · ' + a.name : x.name, `<div class="form">
    <label for="as-name">Nama aset<input id="as-name" maxlength="32" value="${esc(x.name)}" placeholder="mis. BBRI, BTC, Reksa dana pasar uang"></label>
    <label for="as-type">Jenis<select id="as-type">${Object.keys(ASSET_TYPES).map(t => `<option value="${t}" ${x.type === t ? 'selected' : ''}>${ASSET_TYPES[t][0]}</option>`).join('')}</select></label>
    <label for="as-qty">Jumlah (lot / unit / koin, opsional)<input id="as-qty" inputmode="decimal" value="${x.qty != null ? String(x.qty).replace('.', ',') : ''}" placeholder="mis. 20 atau 0,0061"></label>
    <label for="as-val">Nilai sekarang (${cur})<div class="amtin"><span>${cur}</span><input id="as-val" inputmode="decimal" value="${x.value != null ? String(x.value).replace('.', ',') : ''}" placeholder="0"></div></label>
    <label for="as-cost">Modal yang sudah kamu keluarkan (Rp)<input id="as-cost" inputmode="numeric" data-amt value="${x.cost ? nf.format(x.cost) : ''}" placeholder="0"></label>
    <p class="err" id="as-err"></p>
    <div class="btnrow">${!isNew ? `<button class="btn danger" data-act="asset-del" data-acc="${a.id}" data-id="${x.id}">Hapus</button>` : ''}<button class="btn pri" style="flex:1" data-act="asset-save" data-acc="${a.id}" data-id="${x.id || ''}">Simpan</button></div></div>`);
}
const parseDec = v => { v = String(v || '').trim(); if (!v) return null; if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, ''); const n = parseFloat(v); return isNaN(n) ? null : n; };
function assetSave(accId, id) {
  const a = acc(accId), name = $('#as-name').value.trim(), value = parseDec($('#as-val').value);
  if (!name) return $('#as-err').textContent = 'Nama asetnya diisi dulu.';
  if (value == null) return $('#as-err').textContent = 'Nilai sekarang diisi dulu.';
  const data = { name, type: $('#as-type').value, qty: parseDec($('#as-qty').value), value, cost: parseAmt($('#as-cost').value), date: today() };
  a.assets = a.assets || [];
  if (id) Object.assign(a.assets.find(x => x.id === id), data); else a.assets.push(Object.assign({ id: uid() }, data));
  closeSheet(); commit(); toast('Aset disimpan.');
}

function vAkun() {
  let h = header('Akun & saldo', 'Semua rekening dan e-wallet', `<button class="pill" data-act="go" data-to="lainnya">← Balik</button>`);
  for (const kind of ['bank', 'ewallet']) {
    const list = S.accounts.filter(a => a.kind === kind); if (!list.length) continue;
    h += `<div class="sec"><h2>${KIND_LABEL[kind]}</h2><span class="note num">${k(list.reduce((s, a) => s + accountValue(a), 0))}</span></div><div class="box list">`;
    h += list.map(a => `<button class="row" data-act="acc-edit" data-id="${a.id}"><span class="av" style="background:${avColor(a.name)}">${esc(initials(a.name))}</span><span class="m"><b>${esc(a.name)}</b><span>${a.last4 ? '•••• ' + esc(a.last4) : KIND_LABEL[a.kind]}</span></span><span class="v num">${rp(accountValue(a))}</span></button>`).join('') + `</div>`;
  }
  h += `<button class="btn" data-act="acc-new">+ Tambah akun</button>`;
  return h;
}

/* ---------- toples ---------- */
const JAR = 'M48 30 L48 46 C48 60 28 64 28 86 L28 200 C28 214 40 223 56 223 L144 223 C160 223 172 214 172 200 L172 86 C172 64 152 60 152 46 L152 30 Z';
function jarSvg(id, f, w, detail, warn) {
  f = Math.max(0, Math.min(1, f || 0));
  let seed = 7 + id.length * 13; for (const c of id) seed = (seed * 31 + c.charCodeAt(0)) % 2147483647;
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647, u = (a, b) => a + rnd() * (b - a);
  const g = warn ? ['#F2C2A2', '#C98763', '#7E4A31'] : ['#F7E2A6', '#D2A955', '#8C6526'];
  const top = 216 - f * 146, h = Math.round(w * 1.2);
  const coin = (x, y, r, ring) => `<g transform="rotate(${r.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"><ellipse cx="${x.toFixed(0)}" cy="${(y + 2.6).toFixed(1)}" rx="13" ry="5.4" fill="${g[2]}"/><ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(1)}" rx="13" ry="5.4" fill="url(#${id}co)"/>${ring ? `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(1)}" rx="8" ry="3.2" fill="none" stroke="${g[2]}" stroke-width=".7" opacity=".6"/>` : ''}</g>`;
  let coins = '';
  if (f > 0) {
    coins += `<rect x="0" y="${(top + 10).toFixed(0)}" width="200" height="240" fill="${g[2]}" opacity=".55"/>`;
    for (let y = 218; y > top; y -= detail ? 6.5 : 9) for (let x = 24 + u(0, 14); x < 178; x += u(19, 25)) coins += coin(x, y + u(-2, 2), u(-14, 14), detail);
    for (let i = 0; i < (detail ? 4 : 2); i++) coins += coin(u(50, 150), top + u(-3, 2), u(-35, 35), false);
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 200 240" aria-hidden="true"><defs>
<clipPath id="${id}c"><path transform="translate(100 130) scale(.94) translate(-100 -130)" d="${JAR}"/></clipPath>
<linearGradient id="${id}gl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".18" stop-color="#fff" stop-opacity=".03"/><stop offset=".75" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient>
<linearGradient id="${id}co" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset=".55" stop-color="${g[1]}"/><stop offset="1" stop-color="${g[2]}"/></linearGradient>
<linearGradient id="${id}hl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<radialGradient id="${id}sh"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="100" cy="226" rx="82" ry="11" fill="url(#${id}sh)"/><path d="${JAR}" fill="url(#${id}gl)"/>
<g clip-path="url(#${id}c)">${coins}</g>
<path d="${JAR}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="${detail ? 1.6 : 3}"/>
<path d="M40 92 C38 130 38 170 42 205" fill="none" stroke="url(#${id}hl)" stroke-width="7" stroke-linecap="round" opacity=".8"/>
<path d="M162 100 C164 140 164 175 161 198" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2.5" stroke-linecap="round"/>
<path d="M58 70 C66 64 76 62 86 62" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
<path d="M36 214 C60 226 140 226 164 214" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3"/>
<ellipse cx="100" cy="30" rx="52" ry="7" fill="#0C0D10" fill-opacity=".35" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>
<ellipse cx="100" cy="31" rx="47" ry="5" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1"/></svg>`;
}
const catBudgets = () => S.catBudget || {};
function vBudget() {
  const d = daily(), m = monthOf(today());
  const by = {}; S.transactions.forEach(t => { if (t.type === 'expense' && monthOf(t.date) === m) by[t.categoryId] = (by[t.categoryId] || 0) + t.amount; });
  const ids = Object.keys(by).sort((a, b) => by[b] - by[a]), total = ids.reduce((s, i) => s + by[i], 0);
  let avg = 0, n = 0; for (let i = 1; i <= 3; i++) { const e = monthTotals(addMonth(m, -i)).exp; if (e) { avg += e; n++; } }
  let h = header('Budget', MONTHS[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + ' · ' + d.left + ' hari lagi', `<button class="pill" data-act="budget-edit">Ubah</button>`);
  if (S.budget > 0) {
    const sisa = S.budget - d.month, f = sisa / S.budget;
    h += `<section class="jar-hero">${jarSvg('jm', f, 170, true, f < 0.15)}
      <span class="note">Sisa budget bulan ini</span>
      <span class="big2 num">${sisa < 0 ? '−' : ''}${rp(Math.abs(sisa))}</span>
      <span class="note num">dari ${rp(S.budget)} · <span style="color:var(--ink)">${k(Math.max(0, sisa) / d.left)} / hari</span></span></section>`;
  } else h += `<div class="box pad form"><p class="note">Budget bulanan belum diatur. Dari angka ini Penny menghitung isi toples dan jatah harianmu.</p><button class="btn pri" data-act="budget-edit">Atur budget bulanan</button></div>`;

  const cb = catBudgets(), jarCats = S.categories.filter(c => c.kind === 'expense' && cb[c.id] > 0);
  h += `<div class="sec"><h2>Per kategori</h2><button class="link" data-act="catbudget-edit">${jarCats.length ? 'Atur' : '+ Atur budget kategori'}</button></div>`;
  let low = null;
  if (jarCats.length) {
    h += `<div class="jar-grid">${jarCats.map(c => { const left = (cb[c.id] - (by[c.id] || 0)) / cb[c.id], warn = left < 0.15;
      if (warn && (!low || left < low.left)) low = { c, left, over: (by[c.id] || 0) - cb[c.id] };
      return `<button class="jar-cell" data-act="catbudget-edit" aria-label="${esc(c.name)}, sisa ${Math.max(0, Math.round(left * 100))} persen">${jarSvg('k' + c.id, left, 56, false, warn)}<span class="jn">${esc(c.name)}</span><span class="jp" style="color:${warn ? 'var(--bad)' : 'var(--muted)'}">${left < 0 ? 'lewat ' + k(-left * cb[c.id]) : 'sisa ' + Math.round(left * 100) + '%'}</span></button>`; }).join('')}</div>`;
  } else h += `<div class="box pad note">Beri budget per kategori (misalnya Makan atau Date) supaya tiap kategori punya toplesnya sendiri.</div>`;

  let line = null;
  if (low) line = low.over > 0 ? `Toples ${esc(low.c.name)} sudah lewat ${k(low.over)}. Bulan ini mungkin cukup sampai di sini.` : `Toples <span style="color:var(--bad)">${esc(low.c.name)}</span> tinggal ${Math.max(0, Math.round(low.left * 100))}%. Pelan-pelan dulu di kategori ini.`;
  else if (S.budget > 0) line = d.sisaBudget < 0 ? `Budget bulan ini sudah lewat ${k(-d.sisaBudget)}. Kita rapikan lagi bulan depan.` : d.sisaBudget / S.budget < 0.2 ? `Sisa budget tinggal sedikit untuk ${d.left} hari. Pilih yang penting saja.` : 'Masih aman. Pertahankan ritmenya.';
  if (line) h += `<div class="cuki-line"><span class="cuki-av">${cuki(low || d.sisaBudget < 0 ? 'hampir' : 'aman', 38)}</span><p>${line}</p></div>`;

  if (n) h += `<p class="note">Rata-rata pengeluaranmu ${n} bulan terakhir: <b class="num" style="color:var(--ink)">${rp(avg / n)}</b> per bulan.</p>`;
  h += `<div class="sec"><h2>Habis ke mana saja</h2><span class="note num">${k(total)}</span></div>`;
  h += ids.length ? `<div class="box pad" style="display:flex;flex-direction:column;gap:14px">${ids.map(id => { const c = cat(id), p = by[id] / total * 100;
    return `<div style="display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;gap:8px"><span>${esc(c ? c.name : 'Tanpa kategori')}</span><span class="num"><b style="font-weight:500">${k(by[id])}</b> <span class="note">· ${Math.round(p)}%</span></span></div><div class="bar"><i style="width:${p}%;background:var(--gold)"></i></div></div>`; }).join('')}</div>` : `<div class="box empty">Belum ada pengeluaran bulan ini.</div>`;
  return h;
}
function catBudgetForm() {
  const cb = catBudgets();
  openSheet('Budget per kategori', `<div class="form"><p class="note">Isi angka untuk kategori yang mau punya toples. Kosongkan untuk menghapus toplesnya.</p>
  ${S.categories.filter(c => c.kind === 'expense').map(c => `<label for="cb-${c.id}">${esc(c.name)}<input id="cb-${c.id}" data-cb="${c.id}" inputmode="numeric" data-amt placeholder="0" value="${cb[c.id] ? nf.format(cb[c.id]) : ''}"></label>`).join('')}
  <p class="note" id="cb-sum"></p><button class="btn pri" data-act="catbudget-save">Simpan</button></div>`);
}

function vPengaturan() {
  let h = header('Pengaturan', 'Penny v' + VERSION, `<button class="pill" data-act="go" data-to="lainnya">← Balik</button>`);
  h += `<div class="box pad form"><label for="set-name">Nama panggilan<input id="set-name" value="${esc(S.name)}" maxlength="20"></label><button class="btn sm" data-act="save-name">Simpan nama</button></div>`;
  h += `<div class="sec"><h2>Backup</h2><span class="note">Terakhir: ${S.lastBackup ? esc(dateLabel(S.lastBackup.slice(0, 10))) : 'belum pernah'}</span></div>
  <div class="box pad form"><p class="note">Datamu hanya tersimpan di HP ini. Simpan backup ke app Files secara rutin (pilih di iPhone, bukan iCloud, kalau ingin sepenuhnya offline).</p>
  <div class="btnrow"><button class="btn pri" data-act="backup">Simpan backup</button><button class="btn" data-act="restore">Pulihkan</button><button class="btn" data-act="csv">Ekspor CSV</button></div></div>`;
  h += `<div class="sec"><h2>Kategori</h2><button class="link" data-act="cat-new">+ Tambah</button></div><div class="box list">${S.categories.map(c => `<button class="row" data-act="cat-edit" data-id="${c.id}"><span class="av" style="background:${avColor(c.name)}">${esc(initials(c.name))}</span><span class="m"><b>${esc(c.name)}</b><span>${c.kind === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span></span></button>`).join('')}</div>`;
  h += `<div class="sec"><h2>Lain-lain</h2></div><div class="box pad btnrow"><button class="btn" data-act="cuki-preview">Lihat mood Cuki</button><button class="btn danger" data-act="reset">Hapus semua data</button></div>`;
  return h;
}

function vLainnya() {
  const pend = S.inbox.filter(x => x.status === 'pending').length;
  const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const item = (to, icon, title, sub) => `<button class="row" data-act="go" data-to="${to}">${ic(icon)}<span class="m"><b>${title}</b><span>${sub}</span></span><span class="go" aria-hidden="true">›</span></button>`;
  let h = header('Lainnya', 'Penny v' + VERSION);
  h += `<div class="box list menu">
    ${item('kotak', '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>', 'Kotak masuk', pend ? pend + ' transaksi menunggu dicek' : 'Semua sudah rapi')}
    ${item('akun', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>', 'Akun & saldo', 'Rekening, e-wallet, tambah akun')}
    ${item('riwayat', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'Riwayat', 'Semua transaksi per bulan')}
    ${item('pengaturan', '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', 'Pengaturan', 'Backup, kategori, nama')}
  </div>`;
  return h;
}

function render() {
  const v = S.setupDone ? view() : 'onboarding';
  const fn = { onboarding: vOnboarding, beranda: vBeranda, kotak: vKotak, riwayat: vRiwayat, aset: vAset, budget: vBudget, pengaturan: vPengaturan, lainnya: vLainnya, akun: vAkun }[v];
  $('#main').innerHTML = fn();
  if (v === 'beranda') layoutWallet(false);
  const navV = ['kotak', 'riwayat', 'pengaturan', 'akun'].includes(v) ? 'lainnya' : v;
  document.querySelectorAll('nav.tabs a[data-v]').forEach(a => a.dataset.v === navV ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  $('nav.tabs').style.display = v === 'onboarding' ? 'none' : '';
  document.querySelectorAll('[data-amt], #ob-budget').forEach(bindAmt);
  const q = $('#q'); if (q) q.addEventListener('input', () => { query = q.value; const list = sortTx(S.transactions.filter(t => monthOf(t.date) === curMonth && (filter === 'all' || t.type === filter))); const qq = norm(query);
    $('#rlist').innerHTML = riwayatList(qq ? list.filter(t => norm([t.merchant, t.note, (cat(t.categoryId) || {}).name, (acc(t.accountId) || {}).name].join(' ')).includes(qq)) : list); });
  document.querySelectorAll('[data-ib]').forEach(el => el.addEventListener('change', () => { const it = S.inbox.find(x => x.id === el.dataset.id); if (!it) return;
    if (el.dataset.ib === 'acc') it.accountId = el.value || null; if (el.dataset.ib === 'amt') it.p.amount = parseAmt(el.value) || null; save(); render(); }));
}

/* ---------- sheet & dialog ---------- */
function openSheet(title, html) { const s = $('#sheet'); s.innerHTML = `<div class="hd"><h2>${esc(title)}</h2><button class="pill" data-act="close">Tutup</button></div>` + html; s.classList.add('on'); $('#backdrop').classList.add('on'); s.scrollTop = 0; s.querySelectorAll('[data-amt]').forEach(bindAmt); }
function closeSheet() { $('#sheet').classList.remove('on'); $('#backdrop').classList.remove('on'); }
let tt; function toast(m) { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => e.classList.remove('on'), 2800); }
function confirmBox(msg, yes) { return new Promise(res => { const d = $('#dialog'); $('#dlgMsg').textContent = msg; $('#dlgYes').textContent = yes || 'Ya'; d.classList.add('on');
  const done = v => { d.classList.remove('on'); $('#dlgYes').onclick = $('#dlgNo').onclick = null; res(v); }; $('#dlgYes').onclick = () => done(true); $('#dlgNo').onclick = () => done(false); }); }
function bindAmt(el) { if (el._b) return; el._b = 1; el.addEventListener('input', () => { const n = parseAmt(el.value); el.value = n ? nf.format(n) : ''; }); }

/* form transaksi */
let D = null;
function txForm(t, preset) {
  if (t) D = Object.assign({}, t, { _edit: true });
  else { const n = new Date(); D = Object.assign({ type: 'expense', amount: 0, date: dstr(n), time: tstr(n), accountId: (acc(S.lastAccount) && acc(S.lastAccount).kind !== 'tunai' ? S.lastAccount : (live()[0] || {}).id), merchant: '', note: '' }, preset || {}); }
  renderTxForm();
}
function readTx() { const g = id => { const e = document.getElementById(id); return e ? e.value : undefined; };
  if (g('f-amt') !== undefined) D.amount = parseAmt(g('f-amt')); if (g('f-date')) D.date = g('f-date'); if (g('f-time')) D.time = g('f-time').replace(':', '.');
  if (g('f-merchant') !== undefined) D.merchant = g('f-merchant').trim(); if (g('f-note') !== undefined) D.note = g('f-note').trim(); }
function renderTxForm() {
  const ty = D.type;
  const accs = live().filter(a => ty === 'transfer' || a.kind !== 'investasi');
  let h = `<div class="form"><div class="seg">${[['expense', 'Keluar'], ['income', 'Masuk'], ['transfer', 'Transfer']].map(([v, l]) => `<button data-act="f-type" data-v="${v}" aria-pressed="${ty === v}">${l}</button>`).join('')}</div>
  <div class="amtin"><span>Rp</span><input id="f-amt" inputmode="numeric" placeholder="0" autocomplete="off" value="${D.amount ? nf.format(D.amount) : ''}" aria-label="Jumlah"></div>
  <div class="lab">${ty === 'income' ? 'Masuk ke' : 'Dari'}</div><div class="accs">${accs.map(a => `<button data-act="f-acc" data-v="${a.id}" aria-pressed="${D.accountId === a.id}">${esc(a.name)}</button>`).join('')}</div>`;
  if (ty === 'transfer') h += `<div class="lab">Ke</div><div class="accs">${live().filter(a => a.id !== D.accountId).map(a => `<button data-act="f-to" data-v="${a.id}" aria-pressed="${D.toId === a.id}">${esc(a.name)}</button>`).join('')}</div>`;
  else { const sug = suggestCats(D.merchant, '', ty); if (!D.categoryId || !cat(D.categoryId) || cat(D.categoryId).kind !== ty) D.categoryId = D._edit ? D.categoryId : null;
    h += `<div class="lab">Kategori</div><div class="cats">${sug.map(id => `<button data-act="f-cat" data-v="${id}" aria-pressed="${D.categoryId === id}">${esc(cat(id).name)}</button>`).join('')}</div>`;
    h += `<label for="f-merchant">${ty === 'income' ? 'Dari siapa' : 'Merchant / tempat'} (opsional)<input id="f-merchant" maxlength="40" value="${esc(D.merchant)}" placeholder="${ty === 'income' ? 'mis. Kantor' : 'mis. Kopi Kenangan'}"></label>`; }
  h += `<div class="row2"><label for="f-date">Tanggal<input type="date" id="f-date" value="${esc(D.date)}" max="${today()}"></label><label for="f-time">Jam<input type="time" id="f-time" value="${esc((D.time || '').replace('.', ':'))}"></label></div>
  <label for="f-note">Catatan (opsional)<input id="f-note" maxlength="80" value="${esc(D.note)}"></label><p class="err" id="f-err"></p>
  <div class="btnrow">${D._edit ? '<button class="btn danger" data-act="tx-del">Hapus</button>' : ''}<button class="btn pri" style="flex:1" data-act="tx-save">Simpan</button></div></div>`;
  openSheet(D._edit ? 'Ubah transaksi' : 'Catat', h);
  const m = $('#f-merchant'); if (m) m.addEventListener('change', () => { readTx(); if (!D.categoryId) { const s = suggestCats(D.merchant, '', D.type); if (s.length && S.merchantMap[norm(D.merchant)]) { D.categoryId = s[0]; renderTxForm(); } } });
  if (!D._edit) setTimeout(() => { const a = $('#f-amt'); if (a) a.focus(); }, 250);
}
function saveTx() {
  readTx(); const e = $('#f-err');
  if (!(D.amount > 0)) return e.textContent = 'Nominalnya diisi dulu.';
  if (!acc(D.accountId)) return e.textContent = 'Pilih akunnya.';
  if (D.type === 'transfer' && (!acc(D.toId) || D.toId === D.accountId)) return e.textContent = 'Pilih akun tujuan yang beda.';
  if (D.type !== 'transfer' && !D.categoryId) return e.textContent = 'Pilih kategorinya.';
  const t = { id: D.id || uid(), date: D.date, time: D.time, type: D.type, amount: D.amount, accountId: D.accountId, note: D.note || '', source: D.source || 'manual', created: D.created || Date.now() };
  if (D.rawKey) t.rawKey = D.rawKey;
  if (D.type === 'transfer') t.toId = D.toId; else { t.categoryId = D.categoryId; t.merchant = D.merchant || ''; learn(t.merchant, t.categoryId); }
  const i = S.transactions.findIndex(x => x.id === t.id);
  if (i >= 0) S.transactions[i] = t; else S.transactions.push(t);
  if (D.fromInbox) S.inbox = S.inbox.filter(x => x.id !== D.fromInbox);
  S.lastAccount = t.accountId;
  closeSheet(); commit(); toast(D._edit ? 'Perubahan disimpan.' : saveToast(t, daily().mood));
}

/* akun */
function accForm(a) {
  const isNew = !a; a = a || { name: '', kind: 'ewallet', currency: 'IDR', initial: 0, initialCost: 0 };
  const inv = a.kind === 'investasi';
  let h = `<div class="form"><label for="a-name">Nama<input id="a-name" maxlength="24" value="${esc(a.name)}"></label>`;
  if (isNew) h += `<label for="a-kind">Jenis<select id="a-kind">${Object.keys(KIND_LABEL).filter(k2 => k2 !== 'tunai').map(k2 => `<option value="${k2}">${KIND_LABEL[k2]}</option>`).join('')}</select></label>`;
  if (inv && !isNew) h += `<p class="note">Nilai akun ini dihitung dari aset-asetnya. Ubah nilai di layar Investasi.</p>`;
  else if (!isNew) { const cur = accountValue(a);
    h += `<label for="a-real">Saldo sebenarnya sekarang<div class="amtin"><span>Rp</span><input id="a-real" inputmode="numeric" data-amt value="${nf.format(Math.max(0, cur))}"></div></label><p class="note">Kalau beda sama yang di app (misal ada transaksi kelewat), isi saldo aslinya. Penny menyesuaikan otomatis.</p>`; }
  else h += `<label for="a-init">Saldo sekarang<div class="amtin"><span>Rp</span><input id="a-init" inputmode="numeric" data-amt placeholder="0"></div></label>`;
  if (isNew || a.kind === 'bank' || a.kind === 'ewallet') h += `<label for="a-last4">4 digit terakhir no. rekening (opsional)<input id="a-last4" inputmode="numeric" maxlength="4" pattern="[0-9]*" value="${esc(a.last4 || '')}" placeholder="mis. 4021"></label>`;
  h += `<p class="err" id="a-err"></p><div class="btnrow">${!isNew ? `<button class="btn danger" data-act="acc-del" data-id="${a.id}">Hapus</button>` : ''}<button class="btn pri" style="flex:1" data-act="acc-save" data-id="${a.id || ''}">Simpan</button></div></div>`;
  openSheet(isNew ? 'Akun baru' : a.name, h);
}
function accSave(id) {
  const name = $('#a-name').value.trim(); if (!name) return $('#a-err').textContent = 'Namanya diisi dulu.';
  const l4el = $('#a-last4'), last4 = l4el ? l4el.value.replace(/\D/g, '').slice(-4) : '';
  if (!id) { const kind = $('#a-kind').value; S.accounts.push({ id: uid(), name, kind, currency: 'IDR', initial: kind === 'investasi' ? 0 : parseAmt($('#a-init').value), initialCost: 0, valuation: null, assets: kind === 'investasi' ? [] : undefined, last4: kind === 'bank' || kind === 'ewallet' ? last4 : '' }); }
  else { const a = acc(id); a.name = name; if (l4el) a.last4 = last4;
    if (a.kind === 'investasi') { /* nilai dari aset */ }
    else { const real = parseAmt($('#a-real').value); a.initial += real - accountValue(a); } }
  closeSheet(); commit(); toast('Akun disimpan.');
}

/* ---------- aksi ---------- */
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  if (el.tagName === 'A') ev.preventDefault();
  const it = id ? S.inbox.find(x => x.id === id) : null;
  switch (a) {
    case 'close': closeSheet(); break;
    case 'go': location.hash = '#' + el.dataset.to; break;
    case 'card': selCard = selCard === id ? null : id; layoutWallet(true); if (selCard) window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'ob-done': {
      S.name = ($('#ob-name').value.trim() || 'Kamu'); S.budget = parseAmt($('#ob-budget').value);
      S.accounts.forEach(x => { const e = document.getElementById('ob-' + x.id); if (e) x.initial = parseAmt(e.value); });
      S.setupDone = true; location.hash = '#beranda'; commit(); toast('Siap. Mulai sekarang Cuki menemani dompetmu.'); break; }
    case 'toggle-wealth': S.hideWealth = !S.hideWealth; commit(); break;
    case 'month': curMonth = addMonth(curMonth, +el.dataset.d); render(); break;
    case 'filter': filter = el.dataset.v; render(); break;
    case 'tx-new': txForm(null); break;
    case 'tx-edit': { const t = S.transactions.find(x => x.id === id); if (t) txForm(t); break; }
    case 'f-type': readTx(); D.type = el.dataset.v; if (D.type !== 'transfer') D.categoryId = null; renderTxForm(); break;
    case 'f-acc': readTx(); D.accountId = el.dataset.v; if (D.toId === D.accountId) D.toId = null; renderTxForm(); break;
    case 'f-to': readTx(); D.toId = el.dataset.v; renderTxForm(); break;
    case 'f-cat': D.categoryId = el.dataset.v; el.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === el))); break;
    case 'tx-save': saveTx(); break;
    case 'tx-del': confirmBox('Hapus transaksi ini?', 'Hapus').then(ok => { if (!ok) return; S.transactions = S.transactions.filter(x => x.id !== D.id); closeSheet(); commit(); toast('Dihapus.'); }); break;
    case 'budget-edit': openSheet('Budget bulanan', `<div class="form"><div class="amtin"><span>Rp</span><input id="b-amt" inputmode="numeric" data-amt value="${S.budget ? nf.format(S.budget) : ''}" aria-label="Budget bulanan"></div><p class="note">Batas total pengeluaran sebulan (di luar tabungan, investasi, dan transfer antar akun).</p><button class="btn pri" data-act="budget-save">Simpan</button></div>`); break;
    case 'inv-range': invRange = el.dataset.v; render(); break;
    case 'asset-new': assetForm(el.dataset.acc, null); break;
    case 'asset-edit': { const a = acc(el.dataset.acc); const x = a && (a.assets || []).find(y => y.id === id); if (x) assetForm(a.id, x); break; }
    case 'asset-save': assetSave(el.dataset.acc, id); break;
    case 'asset-del': confirmBox('Hapus aset ini?', 'Hapus').then(ok => { if (!ok) return; const a = acc(el.dataset.acc); a.assets = a.assets.filter(y => y.id !== id); closeSheet(); commit(); toast('Aset dihapus.'); }); break;
    case 'catbudget-edit': catBudgetForm(); break;
    case 'catbudget-save': { const cb = {}; document.querySelectorAll('[data-cb]').forEach(e => { const v = parseAmt(e.value); if (v > 0) cb[e.dataset.cb] = v; }); S.catBudget = cb; closeSheet(); commit(); toast('Toples kategori diperbarui.'); break; }
    case 'budget-save': S.budget = parseAmt($('#b-amt').value); closeSheet(); commit(); toast('Budget disimpan. Toples dan jatah harian ikut menyesuaikan.'); break;
    case 'acc-edit': accForm(acc(id)); break;
    case 'acc-new': accForm(null); break;
    case 'acc-save': accSave(id); break;
    case 'acc-del': if (S.transactions.some(t => t.accountId === id || t.toId === id)) { $('#a-err').textContent = 'Akun ini masih dipakai transaksi, jadi tidak bisa dihapus.'; break; }
      confirmBox('Hapus akun ini?', 'Hapus').then(ok => { if (!ok) return; S.accounts = S.accounts.filter(x => x.id !== id); closeSheet(); commit(); }); break;
    case 'rate-edit': openSheet('Kurs USD', `<div class="form"><label for="r-val">1 USD = Rp<input id="r-val" inputmode="numeric" data-amt value="${nf.format(S.rate.usdIdr)}"></label><div class="btnrow"><button class="btn" data-act="rate-auto">Ambil otomatis</button><button class="btn pri" style="flex:1" data-act="rate-save">Simpan manual</button></div></div>`); break;
    case 'rate-save': S.rate = { usdIdr: parseAmt($('#r-val').value) || S.rate.usdIdr, date: new Date().toISOString(), auto: false }; closeSheet(); commit(); break;
    case 'rate-auto': S.rate.auto = true; S.rate.date = null; closeSheet(); fetchRate(true); break;
    /* kotak masuk */
    case 'ib-type': if (it) { it.ui.type = el.dataset.v; if (it.ui.type !== 'transfer') it.ui.catId = suggestCats(it.p.merchant, it.title + ' ' + it.body, it.ui.type)[0]; save(); render(); } break;
    case 'ib-cat': if (it) { it.ui.catId = el.dataset.v; save(); render(); } break;
    case 'ib-to': if (it) { it.ui.toId = el.dataset.v; save(); render(); } break;
    case 'ib-save': if (it && itemReady(it)) { const t = saveInboxItem(it); commit(); toast(saveToast(t, daily().mood)); } break;
    case 'ib-skip': if (it) { S.inbox = S.inbox.filter(x => x.id !== id); commit(); toast('Diabaikan.'); } break;
    case 'ib-edit': if (it) { const at = new Date(it.at); D = { type: it.ui.type || 'expense', amount: it.p.amount || 0, date: dstr(at), time: tstr(at), accountId: it.accountId || (live()[0] || {}).id, toId: it.ui.toId, categoryId: it.ui.catId, merchant: it.p.merchant || '', note: '', source: 'notif', fromInbox: it.id, rawKey: it.app + '|' + it.title + '|' + it.body + '|' + dstr(at) }; renderTxForm(); } break;
    case 'inbox-save-all': { const ready = S.inbox.filter(x => x.status === 'pending' && !x.pairId && itemReady(x)); ready.forEach(saveInboxItem); commit(); toast(`${ready.length} transaksi tercatat sekaligus.`); break; }
    case 'unpair': if (it) { const mate = S.inbox.find(x => x.id === it.pairId); delete it.pairId; if (mate) delete mate.pairId; save(); render(); } break;
    case 'pair-save': if (it) { const mate = S.inbox.find(x => x.id === it.pairId); const at = new Date(it.at);
      const t = { id: uid(), date: dstr(at), time: tstr(at), type: 'transfer', amount: it.p.amount, accountId: it.accountId, toId: mate.accountId, note: '', source: 'notif', rawKey: it.app + '|' + it.title + '|' + it.body + '|' + dstr(at) };
      S.transactions.push(t); S.inbox = S.inbox.filter(x => x.id !== it.id && x.id !== mate.id); commit(); toast(saveToast(t)); } break;
    case 'unskip': if (it) { it.status = 'pending'; it.p.skip = false; it.ui = { type: it.p.direction === 'in' ? 'income' : 'expense' }; it.ui.catId = suggestCats(it.p.merchant, it.title + ' ' + it.body, it.ui.type)[0]; save(); render(); } break;
    case 'paste-notif': openSheet('Tempel notifikasi', `<div class="form"><label for="pn-app">Dari aplikasi<select id="pn-app">${live().map(x => `<option>${esc(x.name)}</option>`).join('')}</select></label><label for="pn-text">Teks notifikasi<textarea id="pn-text" placeholder="mis. Pembayaran Rp24.000 ke Kopi Kenangan berhasil"></textarea></label><p class="note">Untuk mencoba, atau saat Shortcuts sedang bermasalah. Teksnya dibaca sama seperti notifikasi otomatis.</p><button class="btn pri" data-act="paste-go">Masukkan ke kotak masuk</button></div>`); break;
    case 'paste-go': { const txt = $('#pn-text').value.trim(); if (!txt) break; const r = ingest([{ app: $('#pn-app').value, time: '', title: '', body: txt }]); closeSheet(); location.hash = '#kotak'; render(); toast(r.added ? 'Masuk kotak masuk.' : 'Sepertinya bukan transaksi, jadi masuk "Dibuang otomatis".'); break; }
    /* pengaturan */
    case 'save-name': S.name = $('#set-name').value.trim() || S.name; commit(); toast('Baik, ' + S.name + '.'); break;
    case 'backup': doBackup(); break;
    case 'restore': $('#importFile').click(); break;
    case 'csv': doCsv(); break;
    case 'cat-new': catForm(null); break;
    case 'cat-edit': catForm(cat(id)); break;
    case 'cat-save': { const name = $('#c-name').value.trim(); if (!name) break; if (id) cat(id).name = name; else S.categories.push({ id: uid(), name, kind: $('#c-kind').value, kw: [] }); closeSheet(); commit(); break; }
    case 'cat-del': if (S.transactions.some(t => t.categoryId === id)) { toast('Kategori ini sudah dipakai. Ganti namanya saja.'); break; } S.categories = S.categories.filter(c => c.id !== id); closeSheet(); commit(); break;
    case 'cuki-preview': openSheet('Mood Cuki', `<div class="hero" style="flex-direction:row;justify-content:space-around;align-items:flex-end">${cuki('aman', 84)}${cuki('hampir', 84)}${cuki('boncos', 84)}</div><p class="note" style="margin-top:12px">Aman (&lt; 80% jatah) · Hampir habis (80–100%) · Boncos (&gt; 100%)</p>`); break;
    case 'reset': confirmBox('Hapus SEMUA data di HP ini? Ini tidak bisa dibatalkan. Backup dulu kalau ragu.', 'Hapus semua').then(ok => { if (!ok) return; S = freshState(); commit(); }); break;
  }
});
function catForm(c) { openSheet(c ? 'Ubah kategori' : 'Kategori baru', `<div class="form"><label for="c-name">Nama<input id="c-name" maxlength="28" value="${esc(c ? c.name : '')}"></label>${c ? '' : `<label for="c-kind">Jenis<select id="c-kind"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>`}<div class="btnrow">${c ? `<button class="btn danger" data-act="cat-del" data-id="${c.id}">Hapus</button>` : ''}<button class="btn pri" style="flex:1" data-act="cat-save" data-id="${c ? c.id : ''}">Simpan</button></div></div>`); }

/* ---------- backup ---------- */
async function shareOrDownload(name, text, type) {
  const blob = new Blob([text], { type });
  try { const f = new File([blob], name, { type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: name }); return true; } }
  catch (e) { if (e && e.name === 'AbortError') return false; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return true;
}
async function doBackup() { const ok = await shareOrDownload('penny-backup-' + today() + '.json', JSON.stringify(Object.assign({}, S, { exportedAt: new Date().toISOString(), app: 'Penny' })), 'application/json');
  if (ok) { S.lastBackup = new Date().toISOString(); commit(); toast('Backup tersimpan.'); } }
function doCsv() { const rows = [['Tanggal', 'Jam', 'Jenis', 'Jumlah', 'Akun', 'Ke akun', 'Kategori', 'Merchant', 'Catatan']];
  sortTx(S.transactions).reverse().forEach(t => rows.push([t.date, t.time || '', { expense: 'Keluar', income: 'Masuk', transfer: 'Transfer' }[t.type], t.amount, (acc(t.accountId) || {}).name || '', (acc(t.toId) || {}).name || '', (cat(t.categoryId) || {}).name || '', t.merchant || '', t.note || '']));
  shareOrDownload('penny-transaksi-' + today() + '.csv', '﻿' + rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',')).join('\n'), 'text/csv'); }
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { let d; try { d = JSON.parse(r.result); } catch (x) { toast('File ini bukan backup Penny.'); return; }
  if (!d || !d.accounts || !d.transactions) { toast('File ini bukan backup Penny.'); return; }
  confirmBox(`Pulihkan backup (${d.transactions.length} transaksi)? Data sekarang akan diganti.`, 'Pulihkan').then(ok => { if (!ok) return; delete d.exportedAt; delete d.app; S = Object.assign(freshState(), d); S.setupDone = true; commit(); toast('Backup dipulihkan.'); }); }; r.readAsText(f); e.target.value = ''; });

/* ---------- kurs ---------- */
function fetchRate(force) {
  if (!S.rate.auto) return;
  if (!force && S.rate.date && Date.now() - new Date(S.rate.date) < 12 * 3600e3) return;
  fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()).then(j => { const v = j && j.rates && j.rates.IDR; if (v) { S.rate = { usdIdr: Math.round(v), date: new Date().toISOString(), auto: true }; save(); if (view() === 'aset' || view() === 'beranda') render(); if (force) toast('Kurs diperbarui: ' + rp(v)); } })
    .catch(() => { if (force) toast('Gagal mengambil kurs. Isi manual dulu.'); });
}

/* ---------- mulai ---------- */
window.addEventListener('hashchange', () => { selCard = null; if (importFromHash()) { render(); return; } closeSheet(); render(); window.scrollTo(0, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
S = load();
migrateAssets();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
importFromHash();
render();
fetchRate(false);
window.Arus = { get state() { return S; }, ingest, daily, wealth, accountValue, render };
})();
