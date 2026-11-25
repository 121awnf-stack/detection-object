# 🔍 Deteksi Objek — Konsol Pengenalan Objek di Peramban

Aplikasi web modern berbasis **React 19**, **TypeScript**, **Tailwind CSS v4**, dan **TensorFlow.js** untuk melakukan inferensi deteksi objek secara *real-time* langsung di dalam peramban (*100% in-browser client-side inference*). 

Aplikasi ini mengusung estetika visual bergaya **Lembar Kerja Teknik / Vintage Technical Editorial Specsheet** dengan tipografi berkarakter (*Instrument Serif*, *IBM Plex Mono*, dan *IBM Plex Sans*), menyajikan pengalaman laboratorium visi komputer yang elegan, interaktif, dan berorientasi privasi.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi & Dependensi](#-teknologi--dependensi)
- [Arsitektur & Alur Inferensi](#-arsitektur--alur-inferensi)
- [Struktur Proyek](#-struktur-proyek)
- [Prasyarat & Instalasi](#-prasyarat--instalasi)
- [Cara Penggunaan](#-cara-penggunaan)
- [Audit Singkat (Kelebihan & Kekurangan)](#-audit-singkat-kelebihan--kekurangan)
- [Rencana Pengembangan (Roadmap)](#-rencana-pengembangan-roadmap)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

1. **Privasi Penuh (Zero Server Upload)**:
   - Seluruh pemrosesan citra dan inferensi kecerdasan buatan berjalan murni di sisi klien (*client-side*).
   - Tidak ada gambar, rekaman video, atau data kamera yang dikirim ke server luar atau cloud API pihak ketiga.
2. **Model Ringan & Terakselerasi**:
   - Didukung oleh model **SSD MobileNet v2** (@tensorflow-models/coco-ssd) yang dilatih pada dataset COCO 2017 (80 kelas objek).
   - Akselerasi perangkat keras via backend **WebGL** dengan mekanisme *fallback* otomatis ke **CPU** jika GPU tidak tersedia.
3. **Meja Kerja Serbaguna (Multi-input Playground)**:
   - **Unggah Berkas**: Dukungan format JPG, PNG, dan WebP.
   - **Seret & Jatuhkan (Drag & Drop)**: Unggah cepat dengan menjatuhkan citra ke area kerja.
   - **Tempel dari Papan Klip (Ctrl+V)**: Tangkap dan tempel tangkapan layar langsung dari clipboard.
   - **Kamera Langsung (Webcam)**: Pemindaian real-time bingkai demi bingkai dengan visualisasi pemindai aktif.
   - **Koleksi Contoh Citra**: Tiga preset siap uji (Jalan Raya, Pasar Pagi, Meja Bengkel).
4. **Kendali & Analisis Real-time**:
   - **Ambang Keyakinan Dinamis (Threshold)**: Penggeser interaktif 30% – 90% untuk memfilter sensitivitas deteksi.
   - **Filter Kategori Objek**: Kategorisasi objek ke dalam kelompok *Manusia*, *Kendaraan*, *Hewan*, dan *Rumah Tangga*.
   - **Visualisasi Bounding Box Interaktif**: Kotak pembatas presisi dilengkapi label Indonesia, persentase keyakinan, dan penanda sudut (*crop marks*).
   - **Ekspor JSON**: Unduh hasil koordinat bounding box, label, skor keyakinan, dan metadata latensi dalam satu klik.
5. **Kompilasi Berkas Tunggal (Single-File Build)**:
   - Terintegrasi dengan `vite-plugin-singlefile`, memungkinkan build aplikasi dikompilasi menjadi satu berkas HTML mandiri (`dist/index.html`) yang dapat dijalankan secara luring (*offline*) tanpa server web.

---

## 🛠 Teknologi & Dependensi

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework Utama** | [React 19](https://react.dev/) | Library UI reaktif performa tinggi generasi terbaru |
| **Bahasa** | [TypeScript 5.9](https://www.typescriptlang.org/) | Type-safety penuh pada seluruh komponen dan modul inferensi |
| **Build Tool** | [Vite 7.3](https://vite.dev/) | Bundler modern kilat dengan Hot Module Replacement (HMR) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Engine CSS utility-first terbaru via `@tailwindcss/vite` |
| **AI / Machine Learning** | [TensorFlow.js 4.22](https://www.tensorflow.org/js) & [COCO-SSD 2.2](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) | Engine inferensi neural network di peramban WebGL/CPU |
| **Ikon** | [Lucide React](https://lucide.dev/) | Ikon vektor elegan dan ringan |
| **Tipografi** | Google Fonts | *Instrument Serif*, *IBM Plex Mono*, *IBM Plex Sans* |

---

## 🧠 Arsitektur & Alur Inferensi

Alur kerja visi komputer di aplikasi ini terdiri dari 6 tahapan pemrosesan:

```
[01. INPUT]          Citra mentah (JPG/PNG/Webcam)
      │
      ▼
[02. PRAPROSES]      Penskalaan resolusi ke 300 × 300 piksel & normalisasi nilai [-1, 1]
      │
      ▼
[03. BACKBONE]       MobileNet v2 mengekstraksi peta fitur konvolusional berlapis
      │
      ▼
[04. HEAD]           Single Shot MultiBox Detector (SSD) memprediksi kotak dan skor per anchor
      │
      ▼
[05. NMS]            Non-Maximum Suppression (IoU 0.45) menyaring kotak yang tumpang tindih
      │
      ▼
[06. OUTPUT]         Transformasi koordinat piksel, pelabelan bahasa Indonesia, & render UI
```

---

## 📁 Struktur Proyek

```plaintext
detection-object/
├── public/
│   └── images/              # Aset citra sampel (plate-jalan.jpg, plate-pasar.jpg, plate-bengkel.jpg)
├── src/
│   ├── components/
│   │   ├── Boxes.tsx        # Komponen Bounding Box, CropMarks, dan Animasi ScanSweep
│   │   ├── Masthead.tsx     # Header aplikasi, status bar model, dan ticker marquee
│   │   ├── PlateStage.tsx   # Panggung demonstrasi utama (Pelat 01)
│   │   ├── Reference.tsx    # Kamus 40 kelas COCO, diagram alur SVG, dan lembar spesifikasi
│   │   └── Workbench.tsx    # Meja kerja interaktif (Unggah, Webcam, Filter, Ekspor JSON)
│   ├── lib/
│   │   └── detector.ts      # Custom hook `useDetector()`, pemetaan kelas ID, dan loader TensorFlow
│   ├── utils/
│   │   └── cn.ts            # Utility merger class Tailwind (clsx + tailwind-merge)
│   ├── App.tsx              # Komponen induk layout aplikasi
│   ├── index.css            # Desain tema retro-editorial, custom font, dan animasi keyframes
│   └── main.tsx             # Entry point React DOM
├── index.html               # Berkas HTML utama dengan konfigurasi font dan meta
├── package.json             # Konfigurasi dependensi dan skrip proyek
├── tsconfig.json            # Konfigurasi kompilator TypeScript
└── vite.config.ts           # Konfigurasi Vite, Tailwind plugin, dan SingleFile bundle
```

---

## 🚀 Prasyarat & Instalasi

Pastikan perangkat Anda telah terpasang **Node.js** (versi 18 LTS atau lebih baru disarankan) dan **npm** / **pnpm** / **yarn**.

### 1. Kloning atau Buka Direktori Proyek

```bash
cd "detection-object"
```

### 2. Pasang Dependensi

```bash
npm install
```

### 3. Jalankan Server Pengembangan (Dev Mode)

```bash
npm run dev
```

Buka URL lokal yang muncul di terminal (biasanya `http://localhost:5173`) pada peramban yang mendukung WebGL (Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari).

### 4. Kompilasi untuk Produksi (Build)

```bash
npm run build
```

Hasil kompilasi akan tersimpan di direktori `dist/index.html`. Berkas ini berupa **single-file self-contained bundle** (CSS, JS, dan SVG terinjeksi langsung) sehingga dapat dibuka langsung dengan klik ganda (*file://*) atau disajikan melalui web server statis.

### 5. Pratinjau Hasil Kompilasi

```bash
npm run preview
```

---

## 📖 Cara Penggunaan

### 1. Panggung Pelat 01
- Saat pertama kali dimuat, aplikasi akan mengunduh bobot model COCO-SSD (~4,2 MB) ke memori cache peramban.
- Begitu status berubah menjadi **Model · Siap**, citra contoh akan dipindai otomatis.
- Geser slider **Ambang** (30% - 90%) untuk mengatur batas toleransi keyakinan deteksi.
- Klik tombol **Pindai Ulang** untuk mengulang proses pengenalan objek.

### 2. Meja Kerja (Workbench)
- **Tab Unggah Citra**:
  - Klik **Pilih berkas** untuk memilih citra dari penyimpanan lokal.
  - Seret dan lepaskan file gambar langsung ke atas kotak kerja.
  - Salin gambar dari aplikasi lain dan tekan `Ctrl + V` di halaman web.
- **Tab Kamera Langsung**:
  - Klik **Aktifkan kamera** dan berikan izin akses webcam pada peramban.
  - Model akan mendeteksi objek secara kontinyu pada feed video streaming.
  - Klik **Hentikan** untuk mematikan kamera.
- **Filter & Ekspor**:
  - Gunakan tombol filter kategori (*semua, manusia, kendaraan, hewan, rumah*) untuk memilah objek.
  - Klik **Ekspor JSON** untuk mengunduh log deteksi dalam format terstruktur.

---

## 📊 Audit Singkat (Kelebihan & Kekurangan)

### ✅ Kelebihan
1. **Keamanan & Privasi Maksimal**: Tanpa perantara server luar; data pengguna tidak pernah bocor ke cloud.
2. **Desain Visual Sangat Berkarakter**: Gaya tipografi editorial retro-laboratorium yang unik, rapi, dan konsisten.
3. **Fleksibilitas Input Lengkap**: Mendukung file picker, drag-and-drop, clipboard paste, dan webcam langsung.
4. **Mekanisme Fallback Cerdas**: Otomatis beralih ke backend CPU jika akselerasi WebGL bermasalah.
5. **Distribusi Sangat Mudah**: Menggunakan `vite-plugin-singlefile` sehingga hasil build berupa berkas HTML mandiri yang ringan dibawa ke mana saja.

### ⚠️ Kekurangan Awal & Status Perbaikan Terkini
1. **Aspek Rasio Citra vs Posisi Kotak** *(Telah Diperbaiki ✅)*: Kontainer di `PlateStage.tsx` kini secara dinamis mengikuti aspek rasio alami citra (`aspectRatio: size.w / size.h`) dan `object-contain`, sehingga posisi kotak pembatas selalu 100% presisi.
2. **Manajemen Memori Object URL** *(Telah Diperbaiki ✅)*: Ditambahkan efek pembersihan `URL.revokeObjectURL(objUrl)` pada siklus hidup `useEffect` unmount di `Workbench.tsx`.
3. **Loop Kamera & Beban Main-Thread** *(Telah Diperbaiki ✅)*: Loop webcam dimigrasikan dari `setInterval` ke `requestAnimationFrame` dengan pembatas waktu (*throttled* ~350ms) plus tombol alih kamera depan/belakang (*Switch Camera*).
4. **Navigasi Seluler & Aksesibilitas (A11y)** *(Telah Diperbaiki ✅)*: Ditambahkan tombol menu drawer navigasi mobile responsif, `aria-live="polite"` untuk pembaca layar pada hasil deteksi, atribut nilai slider `aria-valuetext`, dan peningkatan kontras teks sekunder.
5. **Keterbatasan Arsitektur Model Dasar**: Model `lite_mobilenet_v2` bawaan dirancang ringan (~4,2 MB) dengan 80 kelas COCO standar, sehingga tetap memiliki batasan alami dalam mengenali objek di luar 80 kelas tersebut atau dalam kondisi oklusi ekstrem.

---

## 🗺 Rencana Pengembangan (Roadmap)

- [x] Menambahkan *toggle* pergantian kamera depan / belakang (*environment* vs *user* camera).
- [x] Implementasi `requestAnimationFrame` untuk deteksi webcam yang ramah main-thread.
- [x] Drawer menu responsif untuk navigasi pada layar ponsel.
- [x] Peningkatan standar aksesibilitas (A11y) dan ARIA live regions.
- [ ] Dukungan ekspor citra hasil anotasi (*Annotated Canvas Image Export* ke format PNG).
- [ ] Pilihan integrasi model alternatif berpresisi tinggi (misal: MediaPipe Objectron atau YOLO ONNX Runtime Web).
- [ ] Unit testing dan visual regression testing dengan Vitest & Playwright.

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi **MIT**. Model bawaan [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) menggunakan lisensi **Apache 2.0**.
