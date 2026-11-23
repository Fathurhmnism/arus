/* Arus — pengurai teks notifikasi bank & e-wallet.
   Shortcuts hanya menyimpan teks mentah; semua logika membaca nominal,
   arah (keluar/masuk), dan merchant ada di sini supaya mudah diperbaiki
   tanpa mengubah Shortcuts di iPhone. */
var ArusParser = (function () {
  'use strict';

  var EWALLETS = ['gopay', 'ovo', 'shopeepay', 'dana'];
  var IGNORE_APPS = ['binance'];

  var NON_TX = ['otp', 'kode verifikasi', 'kode otp', 'jangan berikan', 'jangan bagikan', 'promo', 'voucher', 'diskon',
    'dapatkan', 'hingga', 's.d.', 'sampai dengan', 'kuota terbatas', 'buruan', 'yuk ', 'ayo ', 'gratis ongkir', 'login baru',
    'perangkat baru', 'ganti pin', 'pengingat', 'jatuh tempo', 'tagihan kamu akan'];
  var IN_STRONG = ['diterima', 'menerima', 'dana masuk', 'uang masuk', 'transfer masuk', 'saldo masuk', 'cashback',
    'refund', 'pengembalian dana', 'dikembalikan', 'kredit ', 'incoming', 'received', 'telah masuk', 'berhasil masuk'];
  var TOPUP = ['top up', 'topup', 'top-up', 'isi saldo', 'isi ulang saldo'];
  var OUT = ['pembayaran', 'bayar', 'dibayar', 'membayar', 'transfer ke', 'transfer keluar', 'kirim', 'dikirim', 'mengirim',
    'tarik tunai', 'penarikan', 'debit', 'pembelian', 'membeli', 'belanja', 'keluar', 'qris', 'payment', 'paid', 'sent',
    'transaksi berhasil', 'transaksi sukses', 'berhasil transfer'];

  function lower(s) { return String(s || '').toLowerCase(); }
  function has(t, list) { for (var i = 0; i < list.length; i++) if (t.indexOf(list[i]) >= 0) return list[i]; return null; }

  /* "25.000" | "25.000,00" | "25,000.00" | "25000" -> 25000 */
  function parseNumber(str) {
    var s = String(str).replace(/\s/g, '').replace(/[.,]+$/, '');
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
    if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) return parseFloat(s.replace(/,/g, ''));
    if (/^\d+,\d{1,2}$/.test(s)) return parseFloat(s.replace(',', '.'));
    if (/^\d+\.\d{1,2}$/.test(s)) return parseFloat(s);
    if (/^\d+$/.test(s)) return parseFloat(s);
    return NaN;
  }

  function findAmount(text) {
    var re = /(rp|idr)\s*\.?\s*(\d[\d.,]*)/gi, m, best = null;
    while ((m = re.exec(text))) {
      var before = lower(text.slice(Math.max(0, m.index - 22), m.index));
      var n = parseNumber(m[2]);
      if (isNaN(n) || n <= 0) continue;
      if (/saldo|sisa|balance|limit|total saldo|min\.|minimal|maks/.test(before)) continue;
      best = Math.round(n);
      break;
    }
    return best;
  }

  function titleCase(s) {
    return s.replace(/\s+/g, ' ').trim().split(' ').map(function (w) {
      if (w.length <= 3 && w === w.toUpperCase()) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }

  var STOP = '(?:\\s+(?:berhasil|sebesar|senilai|telah|sudah|sukses|pada|tanggal|tgl|via|dengan|menggunakan|pakai|rp|idr|sejumlah|ref|no\\.?)\\b|[.,!;:()\\n]|$)';
  var RE_TO = new RegExp('(?:\\bke|\\bdi|\\bkepada|\\buntuk|\\bat|\\bto|\\bmerchant)\\s*:?\\s+([A-Za-z0-9&\'*\\-/ ]{2,40}?)' + STOP, 'i');
  var RE_FROM = new RegExp('(?:\\bdari|\\bfrom|\\boleh)\\s*:?\\s+([A-Za-z0-9&\'*\\-/ ]{2,40}?)' + STOP, 'i');

  function cleanMerchant(s) {
    if (!s) return null;
    s = s.replace(/\*+/g, ' ').replace(/\b(pt|cv|tbk)\b\.?/gi, ' ').replace(/\s+/g, ' ').trim();
    if (!s || /^\d+$/.test(s) || /^(rekening|akun|kamu|anda|rp|idr)$/i.test(s)) return null;
    return titleCase(s);
  }

  function findMerchant(text, direction) {
    var m = direction === 'in' ? (RE_FROM.exec(text) || RE_TO.exec(text)) : RE_TO.exec(text);
    return m ? cleanMerchant(m[1]) : null;
  }

  /* entry: {app, title, body, time} -> hasil analisis */
  function parse(entry) {
    var app = lower(entry.app).trim();
    var text = [entry.title, entry.body].filter(Boolean).join('. ');
    var t = lower(text);
    var res = { amount: null, direction: null, merchant: null, kind: null, skip: false, reason: null, confidence: 0 };

    if (has(app, IGNORE_APPS)) { res.skip = true; res.reason = 'Notifikasi investasi (nilai diperbarui manual)'; return res; }
    res.amount = findAmount(text);
    var nonTx = has(t, NON_TX);
    if (!res.amount) { res.skip = true; res.reason = nonTx ? 'Bukan transaksi (' + nonTx.trim() + ')' : 'Tidak ada nominal'; return res; }
    if (nonTx && !has(t, ['berhasil', 'sukses', 'diterima'])) { res.skip = true; res.reason = 'Sepertinya promo/info (' + nonTx.trim() + ')'; return res; }

    var isWallet = has(app, EWALLETS);
    var topup = has(t, TOPUP);
    if (has(t, IN_STRONG)) res.direction = 'in';
    else if (topup) { res.direction = isWallet && !/top ?up ke|isi saldo ke/.test(t) ? 'in' : 'out'; res.kind = 'topup'; }
    else if (has(t, OUT)) res.direction = 'out';
    if (/transfer/.test(t)) res.kind = res.kind || 'transfer';

    res.merchant = findMerchant(text, res.direction);
    res.confidence = (res.amount ? 0.4 : 0) + (res.direction ? 0.4 : 0) + (res.merchant ? 0.2 : 0);
    return res;
  }

  /* Format file kotak masuk dari Shortcuts:
     @@ARUS
     app: BCA
     time: 2026-11-20 08:12
     title: ...
     body: ... (boleh beberapa baris) */
  function parseInboxText(raw) {
    var out = [];
    String(raw || '').replace(/\r/g, '').split('@@ARUS').forEach(function (block) {
      if (!block.trim()) return;
      var e = { app: '', time: '', title: '', subtitle: '', body: '' }, cur = null;
      block.split('\n').forEach(function (line) {
        var m = /^(app|time|title|subtitle|body|message)\s*:\s?(.*)$/i.exec(line);
        if (m) { cur = m[1].toLowerCase(); if (cur === 'message') cur = 'body'; e[cur] = m[2]; }
        else if (cur === 'body' || cur === 'title' || cur === 'subtitle') e[cur] += (e[cur] ? '\n' : '') + line;
      });
      e.title = [e.title.trim(), e.subtitle.trim()].filter(Boolean).join(' · '); delete e.subtitle; e.body = e.body.trim(); e.app = e.app.trim(); e.time = e.time.trim();
      if (e.app || e.body || e.title) out.push(e);
    });
    return out;
  }

  /* "2026-11-20 08:12" | ISO | "20 Nov 2026 08.12" -> Date */
  function parseTime(s) {
    if (!s) return new Date();
    var m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2})[:.](\d{2})/.exec(s);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    var d = new Date(s);
    return isNaN(d) ? new Date() : d;
  }

  return { parse: parse, parseNumber: parseNumber, parseInboxText: parseInboxText, parseTime: parseTime };
})();
if (typeof module !== 'undefined') module.exports = ArusParser;
