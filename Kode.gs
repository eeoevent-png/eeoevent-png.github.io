/**
 * APLIKASI CREW EXTRAORDINARY · VERSI UJI
 * - Hanya MEMBACA file live (Data Crew, Operasional, Jawaban Evaluasi).
 * - Semua jawaban crew (konfirmasi & evaluasi) DITULIS ke file UJI, bukan ke file live.
 * - Jadwal = Tim Bertugas (live) + tab Plot_Uji (file UJI).
 */

var CFG = {
  DATA_CREW_ID: '1nK-5vSvd70LYo9FvGFVqAT5p4h-EGjLAkDdC07r9o5I',   // Data Crew (khusus Owner)
  DATA_CREW_TAB: 'Jawaban Data Crew',
  OPS_ID: '1DHdQPj1eIF0mPr7WXrralfyedq4gM1KFEcsfDc27RfA',        // Operasional (tim)
  EVAL_ID: '1Qlwjw-CCpCRnFe207AIwu-N_HhXjHXl4RMfxvz0oAf4',        // Jawaban Evaluasi
  UJI_ID: '1R38w6liS4gWHt3E5piVS686velh-TSbH8B12FzcYlUw',         // UJI Aplikasi Crew
  TZ: 'Asia/Jakarta',
  BATAS_SALAH: 5,          // salah PIN 5x -> dikunci sementara
  KUNCI_MENIT: 15,
  SESI_DETIK: 21600,       // login bertahan 6 jam
  EVAL_HARI: 45,           // acara yang bisa dievaluasi: 45 hari terakhir
  LOGO_ID: '1civhBUF0oqzPqDRgAsXbCmJ_30WrwWdm',      // Design › Logo WO › gold.png
  FOTO_TIM_ID: '1DOTQXubh05MQVWHUF_71s6XWb9sz_XFN'   // Design › Foto Tim Extraordinary (cover dashboard).jpg
};

/* ---------- logo & foto (dibaca dari Drive pemilik, tidak perlu dibuka untuk publik) ---------- */
function izinkanAkses() {   // jalankan SEKALI dari editor supaya Google meminta izin akses Drive
  Logger.log(DriveApp.getFileById(CFG.LOGO_ID).getName() + ' · ' + DriveApp.getFileById(CFG.FOTO_TIM_ID).getName());
  Logger.log('Logo: ' + (gambar_(CFG.LOGO_ID, 300) ? 'OK' : 'GAGAL') + ' · Foto tim: ' + (gambar_(CFG.FOTO_TIM_ID, 800) ? 'OK' : 'GAGAL'));
}
function gambar_(id, lebar) {
  var cache = CacheService.getScriptCache(), kunci = 'img2_' + id + '_' + lebar;
  var n = +(cache.get(kunci + '_n') || 0);
  if (n) {
    var bag = cache.getAll(Array.apply(null, Array(n)).map(function (_, i) { return kunci + '_' + i; }));
    var s = '';
    for (var i = 0; i < n; i++) { if (!bag[kunci + '_' + i]) { s = ''; break; } s += bag[kunci + '_' + i]; }
    if (s) return s;
  }
  var blob = null;
  try {   // 1) versi kecil lewat thumbnail Drive
    var r = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + id + '&sz=w' + lebar,
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    var ct = String(r.getHeaders()['Content-Type'] || '');
    if (r.getResponseCode() === 200 && /^image\//.test(ct)) blob = r.getBlob();
  } catch (e) {}
  var file = DriveApp.getFileById(id);
  if (!blob && file.getSize() < 300000) blob = file.getBlob();   // 2) file asli bila kecil
  if (!blob) blob = file.getThumbnail();                         // 3) thumbnail bawaan
  if (!blob) return '';
  var uri = 'data:' + (blob.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(blob.getBytes());
  var potong = {}, jml = Math.ceil(uri.length / 90000);
  for (var k = 0; k < jml; k++) potong[kunci + '_' + k] = uri.substr(k * 90000, 90000);
  potong[kunci + '_n'] = String(jml);
  try { cache.putAll(potong, 21600); } catch (e) {}
  return uri;
}
function aset() {   // dipanggil halaman setelah tampil, supaya halaman masuk tidak lambat
  var out = {};
  try { out.logo = gambar_(CFG.LOGO_ID, 300); } catch (e) { out.logo = ''; }
  try { out.tim = gambar_(CFG.FOTO_TIM_ID, 800); } catch (e) { out.tim = ''; }
  return out;
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Extraordinary')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ---------- util ---------- */
function rapikan_(t) {
  // nama dalam kurung dibuang: "Aisyah (Icung)" -> "Aisyah"
  return String(t || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim().toLowerCase()
    .replace(/(^|\s)([a-z])/g, function (c) { return c.toUpperCase(); });
}
function norm_(t) { return String(t || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function digit_(t) { return String(t || '').replace(/\D/g, ''); }
function hariIni_() {
  var s = Utilities.formatDate(new Date(), CFG.TZ, 'yyyy-MM-dd').split('-');
  return new Date(+s[0], +s[1] - 1, +s[2]);
}
function tglDariKunci_(kunci) {            // "Klien · 02/11/2026" -> Date
  var m = String(kunci || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}
function keTanggal_(v) {
  if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  var m = String(v || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}
var HARI_ = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
var BULAN_ = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function labelTgl_(d) { return HARI_[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_[d.getMonth()] + ' ' + d.getFullYear(); }
function ddmmyyyy_(d) { return Utilities.formatDate(d, CFG.TZ, 'dd/MM/yyyy'); }

/* ---------- data crew & login ---------- */
function crew_() {
  var v = SpreadsheetApp.openById(CFG.DATA_CREW_ID).getSheetByName(CFG.DATA_CREW_TAB).getDataRange().getValues();
  var out = [];
  for (var i = 1; i < v.length; i++) {
    if (!v[i][1] || !v[i][2]) continue;
    out.push({
      lengkap: String(v[i][1]).trim(),
      panggilan: rapikan_(v[i][2]),
      hp4: digit_(v[i][4]).slice(-4),
      domisili: String(v[i][5] || '').trim(),
      hari: String(v[i][6] || '').trim()
    });
  }
  return out;   // baris terakhir menang bila crew mengisi ulang
}

function daftarNama() {     // [{n: nama panggilan, pin: true bila wajib PIN 6 digit}]
  var peta = petaPeran_(), seen = {}, list = [];
  crew_().forEach(function (c) {
    if (seen[c.panggilan]) return;
    seen[c.panggilan] = 1;
    list.push({ n: c.panggilan, pin: PERAN_PIN_.indexOf(peta[norm_(c.lengkap)]) >= 0 });
  });
  return list.sort(function (a, b) { return a.n.localeCompare(b.n); });
}

function masuk(panggilan, pin) {
  var cache = CacheService.getScriptCache();
  var kunciSalah = 'salah_' + norm_(panggilan);
  var salah = +(cache.get(kunciSalah) || 0);
  if (salah >= CFG.BATAS_SALAH) {
    return { ok: false, pesan: 'Terlalu banyak percobaan. Coba lagi ' + CFG.KUNCI_MENIT + ' menit lagi.' };
  }
  var cocok = null, perluPin = false, pinKosong = false;
  var peta = petaPeran_();
  crew_().forEach(function (c) {
    if (c.panggilan !== panggilan) return;
    if (PERAN_PIN_.indexOf(peta[norm_(c.lengkap)]) >= 0) {
      perluPin = true;
      var p = pinKhusus_(c.lengkap);
      if (p.length !== 6) { pinKosong = true; return; }
      if (p === digit_(pin)) cocok = c;
    } else if (c.hp4 && c.hp4 === digit_(pin)) cocok = c;
  });
  if (!cocok && perluPin && pinKosong) {
    return { ok: false, pesan: 'PIN untuk akunmu belum diatur. Hubungi owner.' };
  }
  if (!cocok) {
    cache.put(kunciSalah, String(salah + 1), CFG.KUNCI_MENIT * 60);
    var sisa = CFG.BATAS_SALAH - salah - 1;
    return { ok: false, pesan: (perluPin ? 'PIN tidak cocok.' : 'Nama atau 4 digit HP tidak cocok.') + (sisa > 0 ? ' Sisa ' + sisa + ' percobaan.' : '') };
  }
  cache.remove(kunciSalah);
  var token = Utilities.getUuid();
  cache.put('sesi_' + token, cocok.lengkap, CFG.SESI_DETIK);
  return { ok: true, token: token, data: dataSaya_(cocok.lengkap) };
}

function sesi_(token) {
  var n = token ? CacheService.getScriptCache().get('sesi_' + token) : null;
  if (!n) throw new Error('SESI_HABIS');
  return n;
}

function muatData(token) { return dataSaya_(sesi_(token)); }

/* ---------- plot (jadwal & riwayat) ---------- */
function plot_() {
  var rows = [];
  function ambil(sh, mulai, kolKonf) {
    if (!sh) return;
    var last = sh.getLastRow();
    if (last < mulai) return;
    var v = sh.getRange(mulai, 1, last - mulai + 1, 11).getDisplayValues();
    v.forEach(function (r) {
      if (!r[0] || !r[1]) return;
      rows.push({ kunci: r[0].trim(), nama: r[1].trim(), jobdesk: r[2], catatan: r[3], klien: r[5],
                  lokasi: r[6], tl: r[7], konfLive: kolKonf >= 0 ? r[kolKonf] : '', tgl: tglDariKunci_(r[0]) });
    });
  }
  var ops = SpreadsheetApp.openById(CFG.OPS_ID);
  ambil(ops.getSheetByName('Tim Bertugas'), 6, 10);
  ambil(ops.getSheetByName('Arsip Tim Bertugas'), 3, 9);
  return rows.filter(function (r) { return r.tgl; });
}

/* Jawaban konfirmasi yang baru dikirim dari aplikasi (15 menit), dipakai sampai
   script Sales Lead selesai menulisnya ke Tim Bertugas kolom K. */
function konfirmasiUji_() {
  try { return JSON.parse(CacheService.getScriptCache().get('konfbaru') || '{}'); } catch (e) { return {}; }
}

/* ---------- skor adil (sama aturan Apresiasi Tim) ---------- */
function rentangDuaKuartal_() {
  var t = hariIni_();
  var q = Math.floor(t.getMonth() / 3);
  var akhir = new Date(t.getFullYear(), q * 3 + 3, 1);
  var awal = new Date(t.getFullYear(), q * 3 - 3, 1);
  return { awal: awal, akhir: akhir };
}

function evaluasiSemua_() {
  var out = [];
  function ambil(id, tab) {
    var sh = SpreadsheetApp.openById(id).getSheetByName(tab);
    if (!sh || sh.getLastRow() < 2) return;
    sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues().forEach(function (r) {
      if (!r[1] || !r[4]) return;
      out.push({ penilai: String(r[1]).trim(), tgl: keTanggal_(r[2]) || keTanggal_(r[0]),
                 rekan: String(r[4]).trim(), nilai: Number(String(r[6]).replace(',', '.')) });
    });
  }
  ambil(CFG.EVAL_ID, 'Form Responses 1');
  return out;
}

function skor_(nama, evals) {
  var r = rentangDuaKuartal_();
  var per = {}, semua = [];
  evals.forEach(function (e) {
    if (!e.tgl || e.tgl < r.awal || e.tgl >= r.akhir) return;
    if (norm_(e.penilai) === norm_(e.rekan)) return;          // tanpa nilai diri
    if (!(e.nilai >= 1 && e.nilai <= 5)) return;
    (per[e.rekan] = per[e.rekan] || []).push(e.nilai);
    semua.push(e.nilai);
  });
  if (!semua.length) return null;
  var rata = semua.reduce(function (a, b) { return a + b; }, 0) / semua.length;
  var hasil = Object.keys(per).map(function (n) {
    var x = per[n].slice().sort(function (a, b) { return a - b; });
    var dinilai = x.length;
    if (x.length >= 5) x.shift();                              // buang 1 terendah
    var jml = x.reduce(function (a, b) { return a + b; }, 0);
    return { nama: n, skor: (jml + 5 * rata) / (x.length + 5), dinilai: dinilai };
  });
  var layak = hasil.filter(function (h) { return h.dinilai >= 5; }).sort(function (a, b) { return b.skor - a.skor; });
  var saya = hasil.filter(function (h) { return norm_(h.nama) === norm_(nama); })[0];
  if (!saya) return { skor: null, dinilai: 0, peringkat: null, total: layak.length };
  var idx = layak.map(function (h) { return norm_(h.nama); }).indexOf(norm_(nama));
  return { skor: Math.round(saya.skor * 100) / 100, dinilai: saya.dinilai,
           peringkat: idx >= 0 ? idx + 1 : null, total: layak.length };
}

/* ---------- peran (dari Daftar Crew kolom Peran Tetap) ---------- */
function petaPeran_() {
  var v = SpreadsheetApp.openById(CFG.OPS_ID).getSheetByName('Daftar Crew').getRange('A6:B80').getValues();
  var peta = {};
  v.forEach(function (r) {
    if (!r[0]) return;
    var p = String(r[1]).toLowerCase();
    peta[norm_(r[0])] = /owner/.test(p) ? 'owner' : /sales/.test(p) ? 'sales' : /wedding planner/.test(p) ? 'wp'
      : /project manager/.test(p) ? 'pm' : /produksi/.test(p) ? 'produksi' : 'crew';
  });
  return peta;
}
function peran_(nama) { return petaPeran_()[norm_(nama)] || 'crew'; }

/* ---------- PIN 6 digit untuk peran dengan akses luas ---------- */
var PERAN_PIN_ = ['owner', 'sales', 'wp'];
function pinKhusus_(nama) {           // tab PIN_Khusus di file UJI: A Nama Lengkap, B PIN
  var sh = SpreadsheetApp.openById(CFG.DATA_CREW_ID).getSheetByName('PIN_Khusus');   // Data Crew (khusus Owner)
  if (!sh || sh.getLastRow() < 2) return '';
  var v = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getDisplayValues();
  for (var i = 0; i < v.length; i++) if (norm_(v[i][0]) === norm_(nama)) return digit_(v[i][1]);
  return '';
}
var LABEL_PERAN_ = { owner: 'Owner', sales: 'Sales', wp: 'Wedding Planner', pm: 'Project Manager', produksi: 'Tim Produksi', crew: 'Crew' };

/* ---------- Dashboard Tim (dibaca dari tab Dashboard Operasional, cache 5 menit) ---------- */
function tglTeks_(t) {                      // "Sen, 2 Nov 2026" -> Date
  var m = String(t || '').match(/(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!m) return null;
  var b = BULAN_.map(function (x) { return x.toLowerCase(); }).indexOf(m[2].toLowerCase());
  return b < 0 ? null : new Date(+m[3], b, +m[1]);
}

function bacaDashboard_() {
  var cache = CacheService.getScriptCache();
  var j = cache.get('dash_tim_v1');
  if (j) return JSON.parse(j);
  var v = SpreadsheetApp.openById(CFG.OPS_ID).getSheetByName('Dashboard').getRange('A1:P150').getDisplayValues();
  function cari(label) { for (var i = 0; i < v.length; i++) if (String(v[i][1]).indexOf(label) === 0) return i; return -1; }
  function ambil(mulai) {
    var out = [];
    if (mulai < 2) return out;
    for (var i = mulai; i < v.length; i++) { if (!v[i][1] && !v[i][2] && !v[i][4]) break; out.push(v[i]); }
    return out;
  }
  var k = cari('TOTAL WEDDING');
  var kpi = k >= 0 ? { akanDatang: v[k + 1][9], h7: v[k + 1][11], h30: v[k + 1][13], tbc: v[k + 1][15] } : {};
  var acara = ambil(cari('ACARA TERDEKAT') + 2).map(function (r) {
    return { h: r[1], tanggal: r[2], klien: r[4], lokasi: r[7], paket: r[10], tamu: r[11], pic: r[12], status: r[14], jenis: r[15] };
  });
  var agenda = ambil(cari('AGENDA MENDATANG') + 2).map(function (r) {
    return { tanggal: r[1], jam: r[3], klien: r[4], agenda: r[7], pic: r[10], lokasi: r[13] };
  });
  var d = cari('DEAL BULAN INI');
  var deal = ambil(d + 2).map(function (r) {
    return { tglDeal: r[1], klien: r[3], tanggal: r[6], tamu: r[8], kota: r[9], jenis: r[11], jadwal: r[14] };
  });
  var e = SpreadsheetApp.openById(CFG.EVAL_ID).getSheetByName('Ekspor_Tim').getRange('A1:R13').getDisplayValues();
  function skorTeks(s) { var n = Number(String(s).replace(',', '.')); return isNaN(n) ? s : n.toFixed(2).replace('.', ','); }
  var top = [], aktif = [], juara = [];
  for (var i = 2; i < e.length; i++) {
    if (e[i][0]) top.push({ nama: e[i][0], skor: skorTeks(e[i][1]), dinilai: e[i][2] });
    if (e[i][4]) aktif.push({ nama: e[i][4], jumlah: e[i][5] });
    if (i <= 9 && e[i][11] && e[i][12]) juara.push({ jobdesk: e[i][11], nama: e[i][12], skor: skorTeks(e[i][13]) });
  }
  var hasil = {
    kpi: kpi, acara: acara, agenda: agenda, deal: deal, judulDeal: d >= 0 ? v[d][1] : '',
    apresiasi: { kuartal: e[2] ? e[2][10] : '', top: top.slice(0, 10), aktif: aktif.slice(0, 5), juara: juara }
  };
  try { cache.put('dash_tim_v1', JSON.stringify(hasil), 300); } catch (err) {}
  return hasil;
}

/* ---------- Daftar Wedding per tahun (sheet "Wedding <tahun>"), untuk semua kecuali Crew ---------- */
function daftarWedding_() {
  var cache = CacheService.getScriptCache();
  var j = cache.get('wedding_v1');
  if (j) return JSON.parse(j);
  var today = hariIni_();
  var hasil = { tahun: [], data: {} };
  SpreadsheetApp.openById(CFG.OPS_ID).getSheets().forEach(function (sh) {
    var m = sh.getName().match(/^Wedding (\d{4})$/);
    if (!m || sh.getLastRow() < 4) return;
    var th = m[1];
    var v = sh.getRange(4, 1, sh.getLastRow() - 3, 16).getDisplayValues();
    var list = [], cur = -1;
    var BLN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
    v.forEach(function (r) {
      var a = String(r[0]).trim().toLowerCase();
      if (a) cur = BLN.indexOf(a) >= 0 ? BLN.indexOf(a) : (/confirm|tbc/.test(a) ? -1 : cur);   // blok bulan di kolom A
      var klien = String(r[1]).trim();
      if (!klien || /^nama/i.test(klien)) return;
      var tgl = tglTeks_(r[3]) || tglTeks_(r[15]);
      var bln = tgl ? tgl.getMonth() : cur;
      list.push({
        bulan: bln, urut: tgl ? tgl.getTime() : (bln >= 0 ? new Date(+th, bln, 28).getTime() : 9e15),
        hari: r[2], tanggal: r[3], klien: klien, lokasi: r[4], tamu: r[5], acara: r[6], jam: r[7], paket: r[8],
        status: r[9], wp: r[10], pm: r[11], tl: r[12], notes: r[14], lewat: tgl ? tgl < today : false
      });
    });
    list.sort(function (a, b) { return a.urut - b.urut; });
    hasil.tahun.push(th);
    hasil.data[th] = list;
  });
  hasil.tahun.sort();
  try { cache.put('wedding_v1', JSON.stringify(hasil), 300); } catch (err) {}
  return hasil;
}

function dashboardTim_(lengkap, plots, konfUji) {
  var d = bacaDashboard_();
  var acara = d.acara.map(function (a) {
    var tgl = tglTeks_(a.tanggal);
    var base = { h: a.h, tanggal: a.tanggal, klien: a.klien, lokasi: a.lokasi, jenis: a.jenis };
    if (!lengkap) return base;
    var tim = plots.filter(function (p) {
      return tgl && p.tgl && p.tgl.getTime() === tgl.getTime() && norm_(p.klien) === norm_(a.klien);
    }).map(function (p) {
      var kf = konfUji[p.nama + '|' + p.kunci] || p.konfLive || '';
      return { nama: p.nama, jobdesk: p.jobdesk, konf: /tidak/i.test(kf) ? 'tidak' : (/bisa/i.test(kf) ? 'bisa' : '') };
    });
    return Object.assign(base, { paket: a.paket, tamu: a.tamu, pic: a.pic, status: a.status, tim: tim });
  });
  return {
    lengkap: lengkap,
    kpi: { akanDatang: d.kpi.akanDatang, h7: d.kpi.h7, h30: d.kpi.h30, deal: d.deal.length },
    acara: acara,
    agenda: lengkap ? d.agenda : [],
    deal: lengkap ? d.deal : [],
    judulDeal: d.judulDeal,
    wedding: lengkap ? daftarWedding_() : null,
    apresiasi: d.apresiasi
  };
}

/* ---------- Sales (Data Lead) — hanya untuk Sales & Owner, tahap 1: hanya baca ---------- */
var SALES_ID_ = '1BZASwx_CmyXKgXrx9tULJvmPwfhSzGGJlpnTji5nn-w';
function linkIG_(t) {
  t = String(t || '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  t = t.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '').split(/[\s/?]/)[0];
  return t ? 'https://instagram.com/' + t : '';
}
function dataSales_() {
  var sh = SpreadsheetApp.openById(SALES_ID_).getSheetByName('Data Lead');
  var last = sh.getLastRow();
  var v = sh.getRange(1, 1, Math.max(last, 7), 40).getDisplayValues();
  var k = v[3] || [];
  var ringkas = { total: k[0], baru: k[2], penawaran: k[4], followup: k[6], deal: k[8], nodeal: k[10], perluFU: k[12] };
  var lead = [];
  for (var i = 6; i < v.length; i++) {
    var r = v[i];
    if (!r[1]) continue;
    var status = r[24] || r[23] || 'Baru';
    var tgl = r[6] || [r[7], r[8]].filter(String).join(' ');
    lead.push({
      masuk: r[0], nama: r[1], jenis: r[4], tanggal: tgl, statusTanggal: r[5], kota: r[9], venue: r[12] || r[11],
      tamu: r[13], dari: r[14], kebutuhan: r[15], vendorDeal: r[16], budget: r[17] || r[36], konsep: r[18],
      venueInginkan: r[19], waktuHubungi: r[20], catatan: r[21], respon: r[22], status: status,
      umur: r[30], tindakan: r[32], wa: digit_(r[26]) ? 'https://wa.me/' + digit_(r[26]) : '', ig: linkIG_(r[3])
    });
  }
  lead.reverse();   // terbaru di atas
  return { ringkas: ringkas, lead: lead };
}

/* ---------- semua data untuk 1 orang ---------- */
function dataSaya_(nama) {
  var me = crew_().filter(function (c) { return c.lengkap === nama; }).pop() || { panggilan: nama, hari: '', domisili: '' };
  var today = hariIni_();
  var plots = plot_();
  var konfUji = konfirmasiUji_();
  var evals = evaluasiSemua_();
  var peran = peran_(nama);
  var fiturCrew = ['crew', 'pm', 'wp', 'owner'].indexOf(peran) >= 0;   // akses bertumpuk
  var timLengkap = peran !== 'crew';
  var punyaSaya = plots.filter(function (p) { return norm_(p.nama) === norm_(nama); });

  var jadwal = punyaSaya.filter(function (p) { return p.tgl >= today; })
    .sort(function (a, b) { return a.tgl - b.tgl; })
    .map(function (p) {
      var k = konfUji[nama + '|' + p.kunci] || p.konfLive || '';
      return { kunci: p.kunci, tanggal: labelTgl_(p.tgl), hMinus: Math.round((p.tgl - today) / 86400000),
               klien: p.klien, lokasi: p.lokasi, jobdesk: p.jobdesk, tl: p.tl, catatan: p.catatan,
               konfirmasi: /tidak/i.test(k) ? 'tidak' : (/bisa/i.test(k) ? 'bisa' : '') };
    });

  var lalu = punyaSaya.filter(function (p) { return p.tgl < today; }).sort(function (a, b) { return b.tgl - a.tgl; });
  var riwayat = lalu.map(function (p) { return { klien: p.klien, tanggal: labelTgl_(p.tgl), jobdesk: p.jobdesk }; });

  var batas = new Date(today.getTime() - CFG.EVAL_HARI * 86400000);
  var sudahNilai = {};
  evals.forEach(function (e) {
    if (norm_(e.penilai) === norm_(nama) && e.tgl) sudahNilai[norm_(e.rekan) + '|' + ddmmyyyy_(e.tgl)] = 1;
  });
  var bisaDievaluasi = lalu.filter(function (p) { return p.tgl >= batas; }).map(function (p) {
    var rekan = [], ada = {};
    plots.forEach(function (q) {
      if (q.kunci !== p.kunci || norm_(q.nama) === norm_(nama) || ada[norm_(q.nama)]) return;
      ada[norm_(q.nama)] = 1;
      rekan.push({ nama: q.nama, jobdesk: q.jobdesk });
    });
    if (p.tl && norm_(p.tl) !== norm_(nama) && !ada[norm_(p.tl)]) rekan.push({ nama: p.tl, jobdesk: 'Team Leader' });
    rekan.forEach(function (x) { x.sudah = !!sudahNilai[norm_(x.nama) + '|' + ddmmyyyy_(p.tgl)]; });
    return { kunci: p.kunci, label: labelTgl_(p.tgl) + ' · ' + p.klien, rekan: rekan };
  });

  return {
    peran: peran, labelPeran: LABEL_PERAN_[peran], fiturCrew: fiturCrew,
    tim: dashboardTim_(timLengkap, plots, konfUji),
    sales: (peran === 'sales' || peran === 'owner') ? dataSales_() : null,
    panggilan: me.panggilan, domisili: me.domisili,
    hari: me.hari ? me.hari.split(/\s*,\s*/) : [],
    jadwal: jadwal, riwayat: riwayat, evaluasi: bisaDievaluasi,
    skor: skor_(nama, evals), jumlahAcara: lalu.length
  };
}

/* ---------- aksi ---------- */
/* Konfirmasi dikirim lewat form Konfirmasi yang sudah ada, supaya script Sales Lead
   (saatKonfirmasi) tetap mencatat ke Log_Tugas + Tim Bertugas K dan mengirim email "cari pengganti". */
var FORM_KONFIRMASI_ = 'https://docs.google.com/forms/d/e/1FAIpQLSfnavcLqMpXdv1XQMfshjd7IuKfFxrtVb3gwbV-QYAV3ECAAg/formResponse';
function konfirmasi(token, kunci, jawaban, alasan) {
  var nama = sesi_(token);
  var p = plot_().filter(function (x) { return x.kunci === kunci && norm_(x.nama) === norm_(nama); })[0];
  if (!p) throw new Error('Jadwal ini tidak ditemukan atas namamu. Muat ulang aplikasi.');
  var key = p.kunci + '|' + p.nama;
  var log = SpreadsheetApp.openById(CFG.DATA_CREW_ID).getSheetByName('Log_Tugas');
  var kunciLog = log.getLastRow() > 1 ? log.getRange(2, 1, log.getLastRow() - 1, 1).getDisplayValues().map(function (r) { return r[0]; }) : [];
  if (kunciLog.indexOf(key) < 0) {
    throw new Error('Jadwal ini baru di-plot dan sedang diproses sistem (±1 jam). Coba konfirmasi lagi nanti.');
  }
  var isi = {
    'entry.215889430': key, 'entry.471213924': p.nama, 'entry.2042624012': p.kunci, 'entry.357613291': p.jobdesk,
    'entry.1907613259': jawaban === 'bisa' ? 'Bisa' : 'Tidak bisa', 'entry.1496110721': jawaban === 'bisa' ? '' : (alasan || '')
  };
  var r = UrlFetchApp.fetch(FORM_KONFIRMASI_, { method: 'post', payload: isi, muteHttpExceptions: true, followRedirects: true });
  var teks = r.getContentText();
  if (r.getResponseCode() >= 400 || /accounts\.google\.com\/(ServiceLogin|v3\/signin)/.test(teks)) {
    throw new Error('Konfirmasi gagal terkirim. Coba lagi, atau hubungi admin.');
  }
  var cache = CacheService.getScriptCache(), lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var map = konfirmasiUji_();
    map[p.nama + '|' + p.kunci] = jawaban === 'bisa' ? '✅ Bisa' : '❌ Tidak bisa';
    cache.put('konfbaru', JSON.stringify(map), 900);
  } finally { lock.releaseLock(); }
  return dataSaya_(nama);
}

function kirimEvaluasi(token, kunci, rekan, nilai, alasan, saran) {
  var nama = sesi_(token);
  nilai = Number(nilai);
  if (!(nilai >= 1 && nilai <= 5)) throw new Error('Pilih nilai 1 sampai 5.');
  if (!String(alasan || '').trim()) throw new Error('Alasan penilaian wajib diisi.');
  var p = plot_().filter(function (x) { return x.kunci === kunci; });
  if (!p.length) throw new Error('Acara tidak ditemukan.');
  var ikut = p.some(function (x) { return norm_(x.nama) === norm_(nama); });
  if (!ikut) throw new Error('Kamu tidak tercatat di acara ini.');
  var r = p.filter(function (x) { return norm_(x.nama) === norm_(rekan); })[0];
  var jobdesk = r ? r.jobdesk : (norm_(p[0].tl) === norm_(rekan) ? 'Team Leader' : '');
  if (!jobdesk) throw new Error('Rekan tidak tercatat di acara ini.');
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    // langsung ke Jawaban Evaluasi (Form Responses 1), kolom sama dengan form Evaluasi
    SpreadsheetApp.openById(CFG.EVAL_ID).getSheetByName('Form Responses 1')
      .appendRow([new Date(), nama, p[0].tgl, p[0].lokasi, rekan, jobdesk, nilai, alasan, saran || '']);
  } finally { lock.releaseLock(); }
  return dataSaya_(nama);
}
