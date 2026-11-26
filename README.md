# Penny (dulu Arus)

Tracker keuangan pribadi untuk iPhone, ditemani Cuki. v2 "Premium gelap": dompet kartu, toples budget, investasi per aset. Data hanya tersimpan di perangkat (localStorage Safari). Tanpa server, tanpa login.

- `index.html`: tampilan dan gaya
- `app.js`: logika aplikasi
- `parser.js`: pembaca teks notifikasi bank/e-wallet (dari Shortcuts)
- `PANDUAN.md`: cara setup di iPhone dan Shortcuts

Uji parser: `node tests/parser.test.js`

Nama aplikasi berganti dari Arus ke Penny di v2. Alamat (fathurhmnism.github.io/arus) dan kunci penyimpanan (`arus.v2`) sengaja tidak diganti supaya data dan Shortcuts pengguna lama tetap jalan.
