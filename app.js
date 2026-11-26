/* Arus — tracker keuangan pribadi. Data hanya di perangkat (localStorage). */
(function () {
'use strict';
const KEY = 'arus.v2';
const VERSION = '1.0.0';
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

function freshState() {
  return {
    v: 2, name: 'Fathur', setupDone: false,
    accounts: DEFAULT_ACCS.map(([name, kind, cur], i) => ({ id: 'a' + i, name, kind, currency: cur || 'IDR', initial: 0, initialCost: 0, valuation: null })),
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
  if (a.kind === 'investasi') { const cost = investCost(a); if (!a.valuation) return cost; return a.valuation.value * rateOf(a) + (cost - a.valuation.costAt); }
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

/* ---------- Cuki ---------- */
const HAIR = '<g fill="#1B1F3B" stroke="#111" stroke-width="2.5"><circle cx="30" cy="46" r="10"/><circle cx="33" cy="32" r="11"/><circle cx="44" cy="21" r="11"/><circle cx="58" cy="16" r="11"/><circle cx="72" cy="18" r="11"/><circle cx="84" cy="26" r="11"/><circle cx="90" cy="40" r="10"/></g><g fill="#1B1F3B"><circle cx="46" cy="32" r="10"/><circle cx="60" cy="28" r="10"/><circle cx="74" cy="31" r="10"/></g><g fill="none" stroke="#4A5290" stroke-width="1.6" stroke-linecap="round"><path d="M40 20 a4 4 0 1 1 5 4"/><path d="M56 14 a4 4 0 1 1 5 4"/><path d="M70 17 a4 4 0 1 1 5 4"/><path d="M83 25 a4 4 0 1 1 5 4"/><path d="M30 31 a4 4 0 1 1 5 4"/><path d="M52 29 a4 4 0 1 1 5 4"/><path d="M68 30 a4 4 0 1 1 5 4"/></g>';
const TEE = '<circle cx="38" cy="90" r="8" fill="#1A1A1A" stroke="#111" stroke-width="2.5"/><circle cx="82" cy="90" r="8" fill="#1A1A1A" stroke="#111" stroke-width="2.5"/><rect x="32" y="82" width="56" height="44" rx="14" fill="#1A1A1A" stroke="#111" stroke-width="3"/><text x="60" y="96" text-anchor="middle" font-size="8" font-weight="700" font-family="Space Grotesk, sans-serif" fill="#fff" letter-spacing="1">BONCOS</text><path d="M63 99 L54 111 L60 111 L56 122 L67 107 L61 107 L65 99 Z" fill="#C6FF3D" stroke="#111" stroke-width="1"/>';
const arm = (d) => `<path d="${d}" stroke="#111" stroke-width="10" stroke-linecap="round"/><path d="${d}" stroke="#B97A4E" stroke-width="5" stroke-linecap="round"/>`;
function cuki(mood, size) {
  size = size || 92; const h = Math.round(size * 130 / 120);
  if (mood === 'boncos') return `<svg width="${size}" height="${h}" viewBox="0 0 120 130" role="img" aria-label="Cuki pingsan"><g class="cuki-soul"><path d="M88 6 Q100 4 102 16 Q104 28 96 30 Q100 34 94 34 Q90 30 86 33 Q84 28 84 22 Q82 8 88 6 Z" fill="#fff" stroke="#111" stroke-width="2"/><circle cx="90" cy="18" r="1.6" fill="#111"/><circle cx="97" cy="18" r="1.6" fill="#111"/></g><g class="cuki-body">${TEE}<circle cx="60" cy="54" r="34" fill="#A97A5A" stroke="#111" stroke-width="3"/><g transform="translate(0 2)">${HAIR}</g><path d="M41 54 L51 64 M51 54 L41 64 M69 54 L79 64 M79 54 L69 64" stroke="#111" stroke-width="3" stroke-linecap="round"/><ellipse cx="60" cy="76" rx="6" ry="7" fill="#111"/><path d="M30 64 L30 72 M34 66 L34 74" stroke="#2340FF" stroke-width="2" stroke-linecap="round"/></g></svg>`;
  if (mood === 'hampir') return `<svg class="cuki-shake" width="${size}" height="${h}" viewBox="0 0 120 130" role="img" aria-label="Cuki keringetan">${arm('M38 96 L30 118')}${arm('M82 96 L90 118')}${TEE}<circle cx="60" cy="52" r="34" fill="#B97A4E" stroke="#111" stroke-width="3"/>${HAIR}<path d="M38 50 L52 45 M68 45 L82 50" stroke="#111" stroke-width="3" stroke-linecap="round"/><ellipse cx="46" cy="59" rx="5" ry="7" fill="#111"/><ellipse cx="74" cy="59" rx="5" ry="7" fill="#111"/><circle cx="44.5" cy="56.5" r="2" fill="#fff"/><circle cx="72.5" cy="56.5" r="2" fill="#fff"/><path d="M48 75 q3 -4 6 0 t6 0 t6 0 t6 0" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/><path class="cuki-drip" d="M95 38 Q101 48 98 53 Q95 57 92 53 Q89 48 95 38 Z" fill="#7DD3FC" stroke="#111" stroke-width="2"/><path class="cuki-drip d2" d="M24 42 Q29 50 27 54 Q24 57 21 54 Q19 50 24 42 Z" fill="#7DD3FC" stroke="#111" stroke-width="2"/></svg>`;
  return `<svg class="cuki-bounce" width="${size}" height="${h}" viewBox="0 0 120 130" role="img" aria-label="Cuki senang"><path class="cuki-spark" d="M10 30 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z" fill="#C6FF3D" stroke="#111" stroke-width="1.5"/><path class="cuki-spark d2" d="M104 18 l2.5 -6 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 z" fill="#fff" stroke="#111" stroke-width="1.5"/><path class="cuki-spark d3" d="M106 76 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 z" fill="#FF5FA2" stroke="#111" stroke-width="1.5"/>${arm('M36 94 L20 74')}${arm('M84 94 L100 74')}${TEE}<circle cx="60" cy="52" r="34" fill="#B97A4E" stroke="#111" stroke-width="3"/>${HAIR}<ellipse cx="47" cy="58" rx="7" ry="9" fill="#111"/><ellipse cx="73" cy="58" rx="7" ry="9" fill="#111"/><circle cx="44.5" cy="54.5" r="3" fill="#fff"/><circle cx="70.5" cy="54.5" r="3" fill="#fff"/><circle cx="49" cy="61.5" r="1.4" fill="#fff"/><circle cx="75" cy="61.5" r="1.4" fill="#fff"/><ellipse cx="37" cy="69" rx="5" ry="3" fill="#D9646E"/><ellipse cx="83" cy="69" rx="5" ry="3" fill="#D9646E"/><path d="M50 71 Q60 84 70 71 Z" fill="#111" stroke="#111" stroke-width="2" stroke-linejoin="round"/><path d="M55 77 Q60 81 65 77 Q60 75 55 77 Z" fill="#FF5FA2"/></svg>`;
}
const COPY = {
  aman: { bubble: ['Dompet kita sehat walafiat. Gaskeun!', 'Aman jaya. Aku bisa rebahan tenang.', 'Hari ini kamu waras finansial. Bangga aku.', 'Vibes dompet: adem ayem.'],
          status: d => `Aman bestie, sisa ${k(d.jatah - d.todaySpent)}. Boba? Gas.` },
  nol:  { bubble: ['Belum jajan hari ini? Valid, salut.', 'Nol rupiah. Kamu lagi tapa ya?'], status: d => `Jatah hari ini ${k(d.jatah)}. Belum kesentuh sama sekali.` },
  hampir: { bubble: ['Eh eh eh, pelan-pelan napa. Aku deg-degan nih.', 'Rem, rem, REM!', 'Dompet mulai keringetan, aku juga.'],
          status: d => d.jatah - d.todaySpent > 0 ? `Jatah tinggal ${k(d.jatah - d.todaySpent)}, rem dikit ya ges.` : 'Jatah hari ini udah abis. Puasa jajan dulu ya.' },
  boncos: { bubble: ['Aku pingsan dulu. Bangunin kalau udah gajian.', 'Udah, aku nyerah. Dompet kalah telak.', 'Ini bukan boros, ini bencana.'],
          status: d => `Boncos ${k(d.todaySpent - d.jatah)}. Dompetmu nangis, kamu ketawa.` },
  nobudget: { bubble: ['Kasih tau budget bulananmu dong, biar aku bisa ngitung jatah harian.'], status: () => 'Budget bulanan belum diatur.' }
};
function saveToast(t, mood) {
  if (t.type === 'income') return pick([`Cuan masuk ${k(t.amount)}! Jangan langsung checkout ya.`, `${k(t.amount)} masuk. Rezeki anak soleh.`]);
  if (t.type === 'transfer') return `Kecatet: pindah ${k(t.amount)} ke ${acc(t.toId) ? acc(t.toId).name : 'akun lain'}.`;
  const what = t.merchant || (cat(t.categoryId) || {}).name || 'jajan';
  if (mood === 'boncos') return pick([`${k(t.amount)} lagi. Lagi, lagi, lagi.`, `${k(t.amount)} buat ${what}. Cuki pingsan makin dalem.`]);
  return pick([`Kecatet! ${k(t.amount)} buat ${what}, worth it ga tuh?`, `Oke, ${k(t.amount)} melayang buat ${what}. Kecatet.`]);
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
  return (S.accounts.find(x => norm(x.name) === a) || S.accounts.find(x => a.includes(norm(x.name)) || norm(x.name).includes(a)) || {}).id || null;
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
  if (txt) { const r = ingest(ArusParser.parseInboxText(txt)); setTimeout(() => toast(r.added ? `${r.added} transaksi baru masuk kotak masuk.` : 'Nggak ada transaksi baru.'), 300); }
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
const VIEWS = ['beranda', 'kotak', 'riwayat', 'aset', 'budget', 'pengaturan', 'lainnya'];
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
  return `<div class="onb">${header('Halo, ' + S.name + '!', 'Kenalan dulu')}
  <div class="hero"><div class="who">${cuki('aman')}<div class="bubble">Aku Cuki, penjaga dompetmu. Isi dua hal ini dulu, sisanya bisa nanti.</div></div></div>
  <div class="box pad form">
    <label for="ob-name">Panggil kamu siapa?<input id="ob-name" value="${esc(S.name)}" maxlength="20"></label>
    <label for="ob-budget">Budget pengeluaran per bulan<div class="amtin"><span>Rp</span><input id="ob-budget" inputmode="numeric" placeholder="mis. 3.000.000" value="${S.budget ? nf.format(S.budget) : ''}"></div></label>
    <p class="note">Ini batas belanja bulananmu (di luar tabungan & investasi). Dari sini aku hitung jatah harian. Nggak yakin? Isi perkiraan dulu, bisa diubah kapan aja.</p>
  </div>
  <div class="box pad form"><div class="lab">Saldo sekarang di tiap akun (opsional)</div>
  ${S.accounts.filter(a => a.kind !== 'investasi').map(a => `<label for="ob-${a.id}">${esc(a.name)}<input id="ob-${a.id}" inputmode="numeric" placeholder="0" data-amt value="${a.initial ? nf.format(a.initial) : ''}"></label>`).join('')}
  <p class="note">Stockbit & Binance bisa diisi nanti di menu Aset.</p></div>
  <button class="btn pri" data-act="ob-done">Gas, mulai!</button>
  <div class="box pad form"><div class="lab">Udah pernah pakai Arus di tempat lain?</div><p class="note">Pulihkan dari file backup (.json), datamu balik semua.</p><button class="btn" data-act="restore">Pulihkan dari backup</button></div></div>`;
}

function vBeranda() {
  const d = daily(), w = wealth();
  const moodKey = S.budget <= 0 ? 'nobudget' : d.todaySpent === 0 ? 'nol' : d.mood;
  const mood = moodKey === 'nol' || moodKey === 'nobudget' ? 'aman' : moodKey;
  const C = COPY[moodKey];
  const pend = S.inbox.filter(x => x.status === 'pending').length;
  const pct = Math.min(100, Math.round(d.pct * 100));
  const meterColor = d.mood === 'boncos' ? 'var(--pink)' : d.mood === 'hampir' ? 'var(--warn)' : 'var(--lime)';
  const statusColor = moodKey === 'boncos' ? 'var(--bad)' : moodKey === 'hampir' ? 'var(--warn)' : 'var(--good)';
  const now = new Date();
  let h = header('Yo, ' + S.name + '!', DAYS[now.getDay()] + ' ' + pad(now.getDate()) + '.' + pad(now.getMonth() + 1),
    `<button class="pill num" data-act="toggle-wealth" aria-label="Total kekayaan, ketuk untuk sembunyikan atau tampilkan">${S.hideWealth ? 'Rp•••' : k(w)}</button><button class="pill iconbtn" data-act="go" data-to="pengaturan" aria-label="Pengaturan"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>`);
  if (!storageOK) h += `<div class="box pad note">Penyimpanan HP nggak bisa dipakai di mode ini (Private Browsing?). Data bakal hilang saat ditutup.</div>`;
  h += `<section class="hero"><div class="who">${cuki(mood)}<div class="bubble">${esc(pick(C.bubble))}</div></div>
    <span class="lbl">Hari ini udah keluar</span><span class="big num">${rp(d.todaySpent)}</span>`;
  if (S.budget > 0) {
    h += `<span class="sub">dari jatah harian ${k(d.jatah)}</span>
    <div class="meter" role="img" aria-label="${pct}% jatah harian terpakai"><i style="width:${d.mood === 'boncos' ? 100 : pct}%;background:${meterColor}"></i>${d.mood === 'boncos' && d.jatah > 0 ? `<b>+${Math.round((d.pct - 1) * 100)}%</b>` : ''}</div>
    <span class="status" style="color:${statusColor}">${esc(C.status(d))}</span>
    <div class="tiles"><div class="tile"><span>Bulan ini keluar</span><b class="num">${k(d.month)}</b></div><div class="tile"><span>Sisa budget</span><b class="num">${k(d.sisaBudget)}</b></div></div>`;
  } else h += `<button class="btn pri" data-act="budget-edit">Atur budget bulanan</button>`;
  h += `</section>`;
  h += pend ? `<button class="chip" data-act="go" data-to="kotak"><span>${d.mood === 'boncos' ? `${pend} transaksi di-ghosting. Kayak kamu ke mantan.` : `${pend} transaksi nungguin kamu, jangan di-ghosting.`}</span><span style="white-space:nowrap">CEK →</span></button>`
            : `<button class="chip calm" data-act="go" data-to="kotak"><span>Kotak masuk bersih. Rapi banget.</span><span style="white-space:nowrap">BUKA →</span></button>`;
  const todays = sortTx(S.transactions.filter(t => t.date === today() && t.type === 'expense'));
  h += `<div class="sec"><h2>Jajan hari ini</h2>${todays.length > 5 ? `<a href="#riwayat">+${todays.length - 5} lainnya</a>` : `<span class="note">${todays.length} transaksi</span>`}</div>`;
  h += todays.length ? `<div class="box list">${todays.slice(0, 5).map(t => txRow(t)).join('')}</div>` : `<div class="box empty">Belum ada jajan. Ketuk <b>+</b> buat nyatet.</div>`;
  if (backupDue()) h += `<button class="chip calm" data-act="go" data-to="pengaturan"><span>Udah lama nggak backup. Jaga-jaga, yuk.</span><span>BACKUP →</span></button>`;
  return h;
}
function backupDue() { return S.transactions.length > 10 && (!S.lastBackup || Date.now() - new Date(S.lastBackup) > 14 * 864e5); }

function vKotak() {
  const pend = S.inbox.filter(x => x.status === 'pending').sort((a, b) => b.at.localeCompare(a.at));
  const skipped = S.inbox.filter(x => x.status === 'skipped');
  const ready = pend.filter(x => !x.pairId && itemReady(x));
  let h = header('Kotak masuk', pend.length ? pend.length + ' nunggu dicek' : 'Semua beres', `<button class="pill" data-act="paste-notif">+ Tempel</button>`);
  if (ready.length > 1) h += `<button class="btn pri" data-act="inbox-save-all">Simpan ${ready.length} yang udah yakin</button>`;
  if (!pend.length) h += `<div class="box empty">${cuki('aman', 80)}<p>Kosong melompong. Transaksi dari notifikasi bakal muncul di sini.</p></div>`;
  const shown = new Set();
  for (const it of pend) {
    if (shown.has(it.id)) continue; shown.add(it.id);
    const mate = it.pairId && S.inbox.find(x => x.id === it.pairId);
    if (mate) { shown.add(mate.id); const out = it.p.direction === 'out' ? it : mate, inn = out === it ? mate : it;
      h += `<div class="box pad inbox-card"><div class="h"><span class="tag">TRANSFER ANTAR AKUN</span><span class="amt num">${nf.format(out.p.amount)}</span></div>
      <b>${esc(acc(out.accountId) ? acc(out.accountId).name : out.app)} → ${esc(acc(inn.accountId) ? acc(inn.accountId).name : inn.app)}</b>
      <p class="note">Dua notifikasi dengan nominal sama berdekatan. Kemungkinan besar kamu mindahin uang sendiri, bukan jajan.</p>
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
  if (!it.accountId) body += `<label class="lab">Akun mana?<select data-ib="acc" data-id="${it.id}" class="inp"><option value="">Pilih akun</option>${S.accounts.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>`;
  if (!it.p.amount) body += `<label class="lab">Nominal<input data-ib="amt" data-id="${it.id}" inputmode="numeric" class="inp"></label>`;
  if (ty === 'transfer') body += `<div class="lab">${it.p.direction === 'in' ? 'Dari akun' : 'Ke akun'}</div><div class="accs">${S.accounts.filter(x => x.id !== it.accountId).map(x => `<button data-act="ib-to" data-id="${it.id}" data-v="${x.id}" aria-pressed="${it.ui.toId === x.id}">${esc(x.name)}</button>`).join('')}</div>`;
  else if (ty) { const sug = suggestCats(it.p.merchant, it.title + ' ' + it.body, ty).slice(0, 7);
    body += `<div class="cats">${sug.map(id => `<button data-act="ib-cat" data-id="${it.id}" data-v="${id}" aria-pressed="${it.ui.catId === id}">${esc(cat(id).name)}</button>`).join('')}</div>`; }
  const sign = ty === 'income' ? '+' : ty === 'expense' ? '−' : '';
  return `<div class="box pad inbox-card"><div class="h"><div><span class="tag">${esc(a ? a.name : it.app || '?')}</span> <span class="note">${dateLabel(dstr(time))} ${tstr(time)}</span></div><span class="amt num ${ty === 'income' ? 'plus' : ''}">${it.p.amount ? sign + nf.format(it.p.amount) : '?'}</span></div>
  <b>${esc(it.p.merchant || 'Merchant nggak kebaca')}</b>
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
  if (!list.length) return `<div class="box empty">Nggak ada transaksi di sini.</div>`;
  const groups = {}; list.forEach(t => (groups[t.date] = groups[t.date] || []).push(t));
  return Object.keys(groups).sort().reverse().map(d => { const out = groups[d].reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
    return `<div class="day"><span>${esc(dateLabel(d))}</span><span class="num">${out ? '−' + nf.format(out) : ''}</span></div><div class="box list">${groups[d].map(t => txRow(t)).join('')}</div>`; }).join('');
}

function vAset() {
  const w = wealth();
  let h = header('Aset', 'Total kekayaan');
  h += `<div class="hero"><span class="lbl">Total kekayaan bersih</span><span class="big num" style="font-size:38px">${rp(w)}</span><span class="sub">Kurs USD: ${rp(S.rate.usdIdr)}${S.rate.date ? ' · per ' + esc(dateLabel(S.rate.date.slice(0, 10))) : ''} ${S.rate.auto ? '(otomatis)' : '(manual)'}</span><div class="btnrow"><button class="btn sm" data-act="rate-edit">Atur kurs</button></div></div>`;
  for (const kind of ['bank', 'ewallet', 'tunai', 'investasi']) {
    const list = S.accounts.filter(a => a.kind === kind); if (!list.length) continue;
    const sum = list.reduce((s, a) => s + accountValue(a), 0);
    h += `<div class="sec"><h2>${KIND_LABEL[kind]}</h2><span class="note num">${k(sum)}</span></div><div class="box list">`;
    h += list.map(a => { const v = accountValue(a); let sub = KIND_LABEL[a.kind];
      if (a.kind === 'investasi') { const cost = investCost(a), g = v - cost; sub = a.valuation ? `Modal ${k(cost)} · ${g >= 0 ? '+' : ''}${cost > 0 ? (g / cost * 100).toLocaleString('id-ID', {maximumFractionDigits: 1}) + '%' : k(g)}` : 'Ketuk untuk isi nilai'; if (a.currency === 'USD' && a.valuation) sub += ` · $${a.valuation.value.toLocaleString('en-US')}`; }
      return `<button class="row" data-act="acc-edit" data-id="${a.id}"><span class="av" style="background:${avColor(a.name)}">${esc(initials(a.name))}</span><span class="m"><b>${esc(a.name)}</b><span>${esc(sub)}</span></span><span class="v num">${rp(v)}</span></button>`; }).join('');
    h += `</div>`;
  }
  h += `<button class="btn" data-act="acc-new">+ Tambah akun</button>`;
  return h;
}

function vBudget() {
  const d = daily(), m = monthOf(today());
  const by = {}; S.transactions.forEach(t => { if (t.type === 'expense' && monthOf(t.date) === m) by[t.categoryId] = (by[t.categoryId] || 0) + t.amount; });
  const ids = Object.keys(by).sort((a, b) => by[b] - by[a]), total = ids.reduce((s, i) => s + by[i], 0);
  let avg = 0, n = 0; for (let i = 1; i <= 3; i++) { const e = monthTotals(addMonth(m, -i)).exp; if (e) { avg += e; n++; } }
  let h = header('Budget', monthLabel(m));
  h += `<div class="box pad form"><div class="h" style="display:flex;justify-content:space-between;align-items:center"><span class="lab">Budget bulanan</span><button class="btn sm" data-act="budget-edit">Ubah</button></div>
  <span class="big2 num">${S.budget ? rp(S.budget) : 'Belum diatur'}</span>`;
  if (S.budget) { const p = Math.min(100, d.month / S.budget * 100);
    h += `<div class="bar"><i style="width:${p}%;background:${p >= 100 ? 'var(--pink)' : p >= 80 ? 'var(--warn)' : 'var(--lime)'}"></i></div><p class="note num">Terpakai ${rp(d.month)} · sisa ${rp(d.sisaBudget)} · ${d.left} hari lagi · jatah harian ${k(d.jatah)}</p>`; }
  if (n) h += `<p class="note">Rata-rata pengeluaranmu ${n} bulan terakhir: <b class="num">${rp(avg / n)}</b>/bulan.</p>`;
  h += `</div><div class="sec"><h2>Habis ke mana aja</h2><span class="note num">${k(total)}</span></div>`;
  h += ids.length ? `<div class="box pad" style="display:flex;flex-direction:column;gap:12px">${ids.map(id => { const c = cat(id), p = by[id] / total * 100;
    return `<div style="display:flex;flex-direction:column;gap:5px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(c ? c.name : 'Tanpa kategori')}</b><span class="num"><b>${k(by[id])}</b> · ${Math.round(p)}%</span></div><div class="bar"><i style="width:${p}%;background:${avColor(c ? c.name : 'x')}"></i></div></div>`; }).join('')}</div>` : `<div class="box empty">Belum ada pengeluaran bulan ini.</div>`;
  return h;
}

function vPengaturan() {
  let h = header('Pengaturan', 'Arus v' + VERSION, `<button class="pill" data-act="go" data-to="lainnya">← Balik</button>`);
  h += `<div class="box pad form"><label for="set-name">Nama panggilan<input id="set-name" value="${esc(S.name)}" maxlength="20"></label><button class="btn sm" data-act="save-name">Simpan nama</button></div>`;
  h += `<div class="sec"><h2>Backup</h2><span class="note">Terakhir: ${S.lastBackup ? esc(dateLabel(S.lastBackup.slice(0, 10))) : 'belum pernah'}</span></div>
  <div class="box pad form"><p class="note">Datamu cuma ada di HP ini. Simpan backup ke app Files (bukan iCloud kalau mau 100% offline) secara rutin.</p>
  <div class="btnrow"><button class="btn pri" data-act="backup">Simpan backup</button><button class="btn" data-act="restore">Pulihkan</button><button class="btn" data-act="csv">Ekspor CSV</button></div></div>`;
  h += `<div class="sec"><h2>Kategori</h2><button class="link" data-act="cat-new">+ Tambah</button></div><div class="box list">${S.categories.map(c => `<button class="row" data-act="cat-edit" data-id="${c.id}"><span class="av" style="background:${avColor(c.name)}">${esc(initials(c.name))}</span><span class="m"><b>${esc(c.name)}</b><span>${c.kind === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span></span></button>`).join('')}</div>`;
  h += `<div class="sec"><h2>Lain-lain</h2></div><div class="box pad btnrow"><button class="btn" data-act="cuki-preview">Intip mood Cuki</button><button class="btn danger" data-act="reset">Hapus semua data</button></div>`;
  return h;
}

function vLainnya() {
  const pend = S.inbox.filter(x => x.status === 'pending').length;
  const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const item = (to, icon, title, sub) => `<button class="row" data-act="go" data-to="${to}">${ic(icon)}<span class="m"><b>${title}</b><span>${sub}</span></span><span class="go" aria-hidden="true">›</span></button>`;
  let h = header('Lainnya', 'Arus v' + VERSION);
  h += `<div class="box list menu">
    ${item('kotak', '<path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>', 'Kotak masuk', pend ? pend + ' transaksi menunggu dicek' : 'Semua sudah rapi')}
    ${item('riwayat', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'Riwayat', 'Semua transaksi per bulan')}
    ${item('pengaturan', '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', 'Pengaturan', 'Backup, kategori, nama')}
  </div>`;
  return h;
}

function render() {
  const v = S.setupDone ? view() : 'onboarding';
  const fn = { onboarding: vOnboarding, beranda: vBeranda, kotak: vKotak, riwayat: vRiwayat, aset: vAset, budget: vBudget, pengaturan: vPengaturan, lainnya: vLainnya }[v];
  $('#main').innerHTML = fn();
  const navV = ['kotak', 'riwayat', 'pengaturan'].includes(v) ? 'lainnya' : v;
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
  else { const n = new Date(); D = Object.assign({ type: 'expense', amount: 0, date: dstr(n), time: tstr(n), accountId: S.lastAccount || S.accounts[0].id, merchant: '', note: '' }, preset || {}); }
  renderTxForm();
}
function readTx() { const g = id => { const e = document.getElementById(id); return e ? e.value : undefined; };
  if (g('f-amt') !== undefined) D.amount = parseAmt(g('f-amt')); if (g('f-date')) D.date = g('f-date'); if (g('f-time')) D.time = g('f-time').replace(':', '.');
  if (g('f-merchant') !== undefined) D.merchant = g('f-merchant').trim(); if (g('f-note') !== undefined) D.note = g('f-note').trim(); }
function renderTxForm() {
  const ty = D.type;
  const accs = S.accounts.filter(a => ty === 'transfer' || a.kind !== 'investasi');
  let h = `<div class="form"><div class="seg">${[['expense', 'Keluar'], ['income', 'Masuk'], ['transfer', 'Transfer']].map(([v, l]) => `<button data-act="f-type" data-v="${v}" aria-pressed="${ty === v}">${l}</button>`).join('')}</div>
  <div class="amtin"><span>Rp</span><input id="f-amt" inputmode="numeric" placeholder="0" autocomplete="off" value="${D.amount ? nf.format(D.amount) : ''}" aria-label="Jumlah"></div>
  <div class="lab">${ty === 'income' ? 'Masuk ke' : 'Dari'}</div><div class="accs">${accs.map(a => `<button data-act="f-acc" data-v="${a.id}" aria-pressed="${D.accountId === a.id}">${esc(a.name)}</button>`).join('')}</div>`;
  if (ty === 'transfer') h += `<div class="lab">Ke</div><div class="accs">${S.accounts.filter(a => a.id !== D.accountId).map(a => `<button data-act="f-to" data-v="${a.id}" aria-pressed="${D.toId === a.id}">${esc(a.name)}</button>`).join('')}</div>`;
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
  if (!(D.amount > 0)) return e.textContent = 'Nominalnya diisi dulu dong.';
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
  if (isNew) h += `<label for="a-kind">Jenis<select id="a-kind">${Object.keys(KIND_LABEL).map(k2 => `<option value="${k2}">${KIND_LABEL[k2]}</option>`).join('')}</select></label>`;
  if (inv) { const cur = a.currency, val = a.valuation ? a.valuation.value : '';
    h += `<label for="a-val">Nilai portofolio sekarang (${cur})<div class="amtin"><span>${cur === 'USD' ? '$' : 'Rp'}</span><input id="a-val" inputmode="decimal" value="${val}" placeholder="0"></div></label>
    <label for="a-cost">Modal yang sudah ada sebelum pakai Arus (Rp)<input id="a-cost" inputmode="numeric" data-amt value="${a.initialCost ? nf.format(a.initialCost) : ''}"></label>
    <p class="note">Top up dari bank dicatat sebagai <b>Transfer</b> ke ${esc(a.name || 'akun ini')}, otomatis nambah modal. Nilai pasar cukup diperbarui sesekali.</p>`; }
  else if (!isNew) { const cur = accountValue(a);
    h += `<label for="a-real">Saldo sebenarnya sekarang<div class="amtin"><span>Rp</span><input id="a-real" inputmode="numeric" data-amt value="${nf.format(Math.max(0, cur))}"></div></label><p class="note">Kalau beda sama yang di app (misal ada transaksi kelewat), isi saldo aslinya. Arus menyesuaikan otomatis.</p>`; }
  else h += `<label for="a-init">Saldo sekarang<div class="amtin"><span>Rp</span><input id="a-init" inputmode="numeric" data-amt placeholder="0"></div></label>`;
  h += `<p class="err" id="a-err"></p><div class="btnrow">${!isNew ? `<button class="btn danger" data-act="acc-del" data-id="${a.id}">Hapus</button>` : ''}<button class="btn pri" style="flex:1" data-act="acc-save" data-id="${a.id || ''}">Simpan</button></div></div>`;
  openSheet(isNew ? 'Akun baru' : a.name, h);
}
function accSave(id) {
  const name = $('#a-name').value.trim(); if (!name) return $('#a-err').textContent = 'Namanya diisi dulu.';
  if (!id) { const kind = $('#a-kind').value; S.accounts.push({ id: uid(), name, kind, currency: 'IDR', initial: kind === 'investasi' ? 0 : parseAmt($('#a-init').value), initialCost: 0, valuation: null }); }
  else { const a = acc(id); a.name = name;
    if (a.kind === 'investasi') { const v = parseFloat(String($('#a-val').value).replace(/\./g, '').replace(',', '.')); a.initialCost = parseAmt($('#a-cost').value);
      if (!isNaN(v)) a.valuation = { value: v, costAt: investCost(a), date: today() }; }
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
    case 'ob-done': {
      S.name = ($('#ob-name').value.trim() || 'Bestie'); S.budget = parseAmt($('#ob-budget').value);
      S.accounts.forEach(x => { const e = document.getElementById('ob-' + x.id); if (e) x.initial = parseAmt(e.value); });
      S.setupDone = true; location.hash = '#beranda'; commit(); toast('Siap! Aku jagain dompetmu mulai sekarang.'); break; }
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
    case 'budget-save': S.budget = parseAmt($('#b-amt').value); closeSheet(); commit(); toast('Budget disimpan. Jatah harian dihitung ulang.'); break;
    case 'acc-edit': accForm(acc(id)); break;
    case 'acc-new': accForm(null); break;
    case 'acc-save': accSave(id); break;
    case 'acc-del': if (S.transactions.some(t => t.accountId === id || t.toId === id)) { $('#a-err').textContent = 'Akun ini masih dipakai transaksi, jadi nggak bisa dihapus.'; break; }
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
    case 'ib-edit': if (it) { const at = new Date(it.at); D = { type: it.ui.type || 'expense', amount: it.p.amount || 0, date: dstr(at), time: tstr(at), accountId: it.accountId || S.accounts[0].id, toId: it.ui.toId, categoryId: it.ui.catId, merchant: it.p.merchant || '', note: '', source: 'notif', fromInbox: it.id, rawKey: it.app + '|' + it.title + '|' + it.body + '|' + dstr(at) }; renderTxForm(); } break;
    case 'inbox-save-all': { const ready = S.inbox.filter(x => x.status === 'pending' && !x.pairId && itemReady(x)); ready.forEach(saveInboxItem); commit(); toast(`${ready.length} transaksi kecatet sekaligus. Efisien!`); break; }
    case 'unpair': if (it) { const mate = S.inbox.find(x => x.id === it.pairId); delete it.pairId; if (mate) delete mate.pairId; save(); render(); } break;
    case 'pair-save': if (it) { const mate = S.inbox.find(x => x.id === it.pairId); const at = new Date(it.at);
      const t = { id: uid(), date: dstr(at), time: tstr(at), type: 'transfer', amount: it.p.amount, accountId: it.accountId, toId: mate.accountId, note: '', source: 'notif', rawKey: it.app + '|' + it.title + '|' + it.body + '|' + dstr(at) };
      S.transactions.push(t); S.inbox = S.inbox.filter(x => x.id !== it.id && x.id !== mate.id); commit(); toast(saveToast(t)); } break;
    case 'unskip': if (it) { it.status = 'pending'; it.p.skip = false; it.ui = { type: it.p.direction === 'in' ? 'income' : 'expense' }; it.ui.catId = suggestCats(it.p.merchant, it.title + ' ' + it.body, it.ui.type)[0]; save(); render(); } break;
    case 'paste-notif': openSheet('Tempel notifikasi', `<div class="form"><label for="pn-app">Dari aplikasi<select id="pn-app">${S.accounts.map(x => `<option>${esc(x.name)}</option>`).join('')}</select></label><label for="pn-text">Teks notifikasi<textarea id="pn-text" placeholder="mis. Pembayaran Rp24.000 ke Kopi Kenangan berhasil"></textarea></label><p class="note">Buat ngetes atau kalau Shortcuts lagi error. Teksnya dibaca sama persis kayak notifikasi otomatis.</p><button class="btn pri" data-act="paste-go">Masukin ke kotak masuk</button></div>`); break;
    case 'paste-go': { const txt = $('#pn-text').value.trim(); if (!txt) break; const r = ingest([{ app: $('#pn-app').value, time: '', title: '', body: txt }]); closeSheet(); location.hash = '#kotak'; render(); toast(r.added ? 'Masuk kotak masuk.' : 'Kayaknya bukan transaksi, masuk "Dibuang otomatis".'); break; }
    /* pengaturan */
    case 'save-name': S.name = $('#set-name').value.trim() || S.name; commit(); toast('Oke, ' + S.name + '.'); break;
    case 'backup': doBackup(); break;
    case 'restore': $('#importFile').click(); break;
    case 'csv': doCsv(); break;
    case 'cat-new': catForm(null); break;
    case 'cat-edit': catForm(cat(id)); break;
    case 'cat-save': { const name = $('#c-name').value.trim(); if (!name) break; if (id) cat(id).name = name; else S.categories.push({ id: uid(), name, kind: $('#c-kind').value, kw: [] }); closeSheet(); commit(); break; }
    case 'cat-del': if (S.transactions.some(t => t.categoryId === id)) { toast('Kategori ini udah dipakai, ganti nama aja.'); break; } S.categories = S.categories.filter(c => c.id !== id); closeSheet(); commit(); break;
    case 'cuki-preview': openSheet('Mood Cuki', `<div class="hero" style="flex-direction:row;justify-content:space-around;align-items:flex-end">${cuki('aman', 84)}${cuki('hampir', 84)}${cuki('boncos', 84)}</div><p class="note" style="margin-top:12px">Aman (&lt; 80% jatah) · Hampir habis (80–100%) · Boncos (&gt; 100%)</p>`); break;
    case 'reset': confirmBox('Hapus SEMUA data di HP ini? Nggak bisa dibatalin. Backup dulu kalau ragu.', 'Hapus semua').then(ok => { if (!ok) return; S = freshState(); commit(); }); break;
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
async function doBackup() { const ok = await shareOrDownload('arus-backup-' + today() + '.json', JSON.stringify(Object.assign({}, S, { exportedAt: new Date().toISOString(), app: 'Arus' })), 'application/json');
  if (ok) { S.lastBackup = new Date().toISOString(); commit(); toast('Backup disimpan. Aman.'); } }
function doCsv() { const rows = [['Tanggal', 'Jam', 'Jenis', 'Jumlah', 'Akun', 'Ke akun', 'Kategori', 'Merchant', 'Catatan']];
  sortTx(S.transactions).reverse().forEach(t => rows.push([t.date, t.time || '', { expense: 'Keluar', income: 'Masuk', transfer: 'Transfer' }[t.type], t.amount, (acc(t.accountId) || {}).name || '', (acc(t.toId) || {}).name || '', (cat(t.categoryId) || {}).name || '', t.merchant || '', t.note || '']));
  shareOrDownload('arus-transaksi-' + today() + '.csv', '﻿' + rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v).join(',')).join('\n'), 'text/csv'); }
$('#importFile').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { let d; try { d = JSON.parse(r.result); } catch (x) { toast('File-nya bukan backup Arus.'); return; }
  if (!d || !d.accounts || !d.transactions) { toast('File-nya bukan backup Arus.'); return; }
  confirmBox(`Pulihkan backup (${d.transactions.length} transaksi)? Data sekarang bakal diganti.`, 'Pulihkan').then(ok => { if (!ok) return; delete d.exportedAt; delete d.app; S = Object.assign(freshState(), d); S.setupDone = true; commit(); toast('Backup dipulihkan.'); }); }; r.readAsText(f); e.target.value = ''; });

/* ---------- kurs ---------- */
function fetchRate(force) {
  if (!S.rate.auto) return;
  if (!force && S.rate.date && Date.now() - new Date(S.rate.date) < 12 * 3600e3) return;
  fetch('https://open.er-api.com/v6/latest/USD').then(r => r.json()).then(j => { const v = j && j.rates && j.rates.IDR; if (v) { S.rate = { usdIdr: Math.round(v), date: new Date().toISOString(), auto: true }; save(); if (view() === 'aset' || view() === 'beranda') render(); if (force) toast('Kurs diperbarui: ' + rp(v)); } })
    .catch(() => { if (force) toast('Gagal ambil kurs. Isi manual dulu ya.'); });
}

/* ---------- mulai ---------- */
window.addEventListener('hashchange', () => { if (importFromHash()) { render(); return; } closeSheet(); render(); window.scrollTo(0, 0); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
S = load();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
importFromHash();
render();
fetchRate(false);
window.Arus = { get state() { return S; }, ingest, daily, wealth, accountValue, render };
})();
