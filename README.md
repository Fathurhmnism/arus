# Arus

Tracker keuangan pribadi untuk iPhone, ditemani Cuki. Data hanya tersimpan di perangkat (localStorage Safari). Tanpa server, tanpa login.

- `index.html`: tampilan dan gaya
- `app.js`: logika aplikasi
- `parser.js`: pembaca teks notifikasi bank/e-wallet (dari Shortcuts)
- `PANDUAN.md`: cara setup di iPhone dan Shortcuts

Uji parser: `node tests/parser.test.js`
