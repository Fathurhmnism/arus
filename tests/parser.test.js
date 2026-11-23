const P=require('../parser.js');
const cases=[
 ['GoPay','Pembayaran berhasil','Kamu bayar Rp24.000 ke Kopi Kenangan pakai GoPay.',24000,'out','Kopi Kenangan'],
 ['BCA','Transaksi Debit','Transfer ke ANDI SAPUTRA sebesar IDR 150,000.00 berhasil. Saldo IDR 2,350,000.00',150000,'out','Andi Saputra'],
 ['Mandiri','Livin','Dana masuk Rp4.500.000 dari PT BANK RAKYAT INDONESIA',4500000,'in','Bank Rakyat Indonesia'],
 ['OVO','OVO','Top Up Rp100.000 berhasil. Saldo OVO Cash kamu Rp134.500',100000,'in',null],
 ['BCA','m-BCA','Top up GoPay Rp100.000 berhasil',100000,'out',null],
 ['ShopeePay','ShopeePay','Pembayaran Rp105.000 di Shopee berhasil',105000,'out','Shopee'],
 ['DANA','DANA','Kamu menerima Rp50.000 dari BUDI',50000,'in','Budi'],
 ['BRI','BRImo','Kode OTP kamu 123456. Jangan berikan ke siapa pun',null,null,null],
 ['GoPay','Promo','Diskon hingga Rp20.000 buat GoFood, yuk!',null,null,null],
 ['Binance','Binance','Deposit 50 USDT berhasil',null,null,null],
 ['Jago','Jago','Pembayaran QRIS Rp35.000 ke INDOMARET berhasil',35000,'out','Indomaret'],
];
let ok=0;
for(const [app,title,body,amt,dir,mer] of cases){const r=P.parse({app,title,body});
 const pass=(amt===null? r.skip : (r.amount===amt&&r.direction===dir&&(mer===null||r.merchant===mer)));
 console.log(pass?'OK ':'FAIL',app,'|',body,'=>',JSON.stringify(r)); if(pass)ok++;}
console.log(ok+'/'+cases.length);
const inbox=P.parseInboxText('@@ARUS\napp: GoPay\ntime: 2026-11-20 08:12\ntitle: Pembayaran berhasil\nbody: Kamu bayar Rp24.000\nke Kopi Kenangan\n@@ARUS\napp: BCA\ntime: 2026-11-20 09:00\ntitle: x\nbody: y');
console.log(JSON.stringify(inbox), P.parseTime('2026-11-20 08:12').toString());
// Notifikasi SeaBank asli (23 Nov 2026)
const real = P.parseInboxText(`@@ARUS
app: SeaBank
time: 
title:
subtitle: 
body: 
@@ARUS
app: SeaBank
time: 23 Nov 2026
title:Realtime Transfer
subtitle: 
body: Kamu baru melakukan transfer real-time senilai Rp10.000 pada 23 Nov 2026 15:40. Jika kamu tidak melakukan ini, segera hubungi 1500130.
`);
const r = P.parse(real[0]);
const okReal = real.length === 1 && r.amount === 10000 && r.direction === 'out' && !r.skip && P.parseTime(real[0].time).getHours() === 15 && P.parseTime(real[0].time).getMinutes() === 40;
console.log(okReal ? 'OK  SeaBank asli' : 'FAIL SeaBank asli', JSON.stringify(real), JSON.stringify(r));
