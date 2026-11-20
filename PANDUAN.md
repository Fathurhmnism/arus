# Panduan Setup Arus di iPhone

Ganti `USERNAME` di bawah dengan username GitHub-mu. Alamat aplikasinya: **https://USERNAME.github.io/arus/**

---

## 1. Mulai pakai (bisa hari ini, iOS 26)

1. Buka **https://USERNAME.github.io/arus/** di **Safari**.
2. Isi nama, budget bulanan, dan saldo tiap akun, lalu ketuk **Gas, mulai!**
3. Catat transaksi lewat tombol **+** di tengah bawah.

> ⚠️ **Jangan** pakai "Tambahkan ke Layar Utama" dari Safari. Di iPhone, aplikasi web yang dipasang dari Safari punya penyimpanan **terpisah** dari Safari. Akibatnya data dari Shortcuts (yang selalu membuka Safari) tidak akan nyambung. Ikon di layar utama nanti kita buat dari **Shortcut "Buka Arus"** (langkah 2), jadi semuanya tetap di satu tempat.

## 2. Shortcut "Buka Arus" (iOS 26 sudah bisa)

Shortcut ini membuka aplikasinya sekaligus membawa isi kotak masuk dari notifikasi.

1. Buka app **Pintasan (Shortcuts)**, ketuk **+**, beri nama **Buka Arus**.
2. Tambahkan tindakan berikut, berurutan:
   1. **Dapatkan File** (Get File). Matikan *Tampilkan Pemilih Dokumen*. Isi path `Arus/kotak-masuk.txt`. Matikan *Error Jika Tidak Ditemukan*.
   2. **Jika** (If) *File* **memiliki nilai apa pun**:
      1. **Enkode Base64** (Base64 Encode) dari *File*. Atur *Jeda Baris* = **Tidak Ada**.
      2. **Enkode URL** (URL Encode) dari *Teks Ter-enkode Base64*.
      3. **Teks**: `https://USERNAME.github.io/arus/#inbox=` lalu sisipkan variabel *Teks Ter-enkode URL* tepat di belakangnya (tanpa spasi).
      4. **Buka URL** (Open URLs) dari *Teks*.
      5. **Hapus File** (Delete Files) dari *File*. Matikan *Konfirmasi Sebelum Menghapus*.
   3. **Jika Tidak** (Otherwise):
      1. **Buka URL**: `https://USERNAME.github.io/arus/#beranda`
3. Ketuk nama shortcut di atas, pilih **Tambahkan ke Layar Utama**. Pakai gambar Cuki (simpan dari https://USERNAME.github.io/arus/apple-touch-icon.png) dan beri nama **Arus**.

Mulai sekarang, buka Arus selalu dari ikon ini.

## 3. Pencatatan otomatis dari notifikasi (butuh iOS 27)

Satu otomasi untuk setiap aplikasi: Mandiri, BCA, BRI, Jago, SeaBank, GoPay, OVO, ShopeePay, DANA. Binance tidak perlu.

1. Pintasan → tab **Otomatisasi** → **+** → pilih pemicu **Notifikasi**.
2. **App**: pilih aplikasinya (mis. GoPay). Biarkan filter judul/pesan kosong.
3. Pilih **Jalankan Segera** dan matikan *Beri Tahu Saat Dijalankan*.
4. Tambahkan tindakan:
   1. **Teks**, isi persis seperti ini (bagian dalam `[...]` adalah variabel, pilih dari menu variabel):
      ```
      @@ARUS
      app: GoPay
      time: [Tanggal Saat Ini, format kustom: yyyy-MM-dd HH:mm]
      title: [Input Pintasan → Judul]
      body: [Input Pintasan → Isi/Pesan]
      ```
      Baris `app:` diisi nama akun persis seperti di Arus (GoPay, BCA, dst.).
   2. **Tambahkan ke File Teks** (Append to Text File). Isi teks = *Teks* di atas, path = `Arus/kotak-masuk.txt`, *Buat Baris Baru* menyala. Kalau ada pilihan lokasi, pilih **Di iPhone Saya**.
5. Ulangi untuk aplikasi lain. Cara cepatnya: buat satu dulu sampai berhasil, lalu tinggal ganti App dan baris `app:`.

## 4. Uji teknis (lakukan sekali, setelah iOS 27)

1. Buat otomasi untuk **satu** aplikasi dulu (mis. GoPay).
2. Lakukan transaksi kecil, misalnya bayar Rp1.000 atau top up.
3. Buka app **File** → cek apakah `Arus/kotak-masuk.txt` ada dan isinya memuat teks notifikasinya.
4. Ketuk ikon **Arus**. Transaksinya harus muncul di **Kotak masuk** dengan nominal yang benar.
5. Laporkan hasilnya ke Claude. Kalau ada yang salah baca (nominal, merchant, keluar/masuk), sertakan teks aslinya. Teks itu bisa dilihat di kartu kotak masuk → *Teks notifikasi asli*.

Kalau langkah 3 gagal (file tidak terbentuk, atau isi judul/pesan kosong), berarti pemicu notifikasi belum bisa membaca isinya. Di situ kita cari jalan lain.

## 5. Kebiasaan harian

- Sekali sehari, buka Arus → **Kotak masuk** → cek tebakan kategori → **Simpan**. Untuk yang tebakannya sudah benar, pakai **Simpan semua yang udah yakin**.
- Transaksi tunai: catat manual lewat **+**.
- Sesekali perbarui nilai **Stockbit** dan **Binance** di menu **Aset**.
- Setiap 2 minggu: **Pengaturan → Simpan backup**, lalu simpan ke app File di iPhone.

## Privasi

- Semua data keuangan hanya tersimpan di Safari iPhone-mu dan di file kotak masuk di iPhone. Kode aplikasi ada di GitHub, tapi datamu tidak pernah dikirim ke sana.
- Data dari Shortcuts dikirim lewat bagian `#` di alamat. Bagian ini tidak pernah dikirim ke server mana pun, termasuk GitHub.
- Satu-satunya akses internet aplikasi ini adalah mengambil kurs USD→IDR (open.er-api.com), dan permintaan itu tidak membawa data apa pun tentang kamu.
