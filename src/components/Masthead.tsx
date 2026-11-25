import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { DetectorStatus } from "../lib/detector";

const NAV = [
  { id: "pelat", label: "Pelat" },
  { id: "meja-kerja", label: "Meja Kerja" },
  { id: "kelas", label: "Indeks Kelas" },
  { id: "alur", label: "Alur Kerja" },
  { id: "spesifikasi", label: "Spesifikasi" },
];

export function StatusBar({ status }: { status: DetectorStatus }) {
  const map: Record<DetectorStatus, { text: string; color: string; pulse: boolean }> = {
    loading: { text: "Model · Memuat", color: "#b3792c", pulse: true },
    ready: { text: "Model · Siap", color: "#4f6b3f", pulse: false },
    error: { text: "Model · Galat", color: "#d6371f", pulse: true },
  };
  const s = map[status];
  return (
    <div
      className="flex items-center gap-2 border border-ink/20 px-2.5 py-1.5"
      role="status"
      aria-label={`Status model: ${s.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.pulse ? "pulse-dot" : ""}`}
        style={{ backgroundColor: s.color }}
        aria-hidden="true"
      />
      <span className="kicker text-ink2">{s.text}</span>
    </div>
  );
}

export function TopBar({ status }: { status: DetectorStatus }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/20 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="kicker text-vermilion">Konsol Deteksi</span>
          <span className="kicker hidden text-mute sm:inline">v1.0 · Runtime Lokal</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigasi Utama">
          {NAV.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className="kicker text-ink2 transition-colors hover:text-vermilion"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <StatusBar status={status} />
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center border border-ink/25 text-ink transition-colors hover:border-vermilion hover:text-vermilion lg:hidden"
            aria-label={mobileOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <nav
          className="border-t border-ink/20 bg-paper px-4 py-3 shadow-lg lg:hidden"
          aria-label="Navigasi Seluler"
        >
          <div className="flex flex-col space-y-2.5">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={() => setMobileOpen(false)}
                className="kicker block border-b border-ink/10 py-1.5 text-ink2 transition-colors hover:text-vermilion"
              >
                {n.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Masthead() {
  return (
    <section className="mx-auto max-w-[1500px] px-4 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-ink pt-2.5">
        <span className="kicker text-ink2">Lembar Kerja Teknik No. 04 — Visi Komputer</span>
        <span className="kicker text-mute">Disusun 2026 · Edisi Peramban</span>
      </div>
      <div className="mt-2 border-t border-ink/25" />

      <div className="grid grid-cols-12 gap-x-6 pt-6 sm:pt-8">
        <h1 className="col-span-12 font-display leading-[0.82] tracking-[-0.025em]">
          <span className="block text-[clamp(3.2rem,12.5vw,11.5rem)]">DETEKSI</span>
          <span className="block text-[clamp(3.2rem,12.5vw,11.5rem)]">
            OBJEK
            <span className="ml-3 align-super font-mono text-[11px] font-medium tracking-[0.18em] text-vermilion sm:ml-5">
              SSD · COCO · 80 KELAS
            </span>
          </span>
        </h1>

        <div className="col-span-12 mt-6 grid gap-6 border-t border-ink/25 pt-5 md:grid-cols-12">
          <p className="font-display text-[clamp(1.35rem,2.6vw,2.15rem)] leading-[1.15] text-ink md:col-span-7">
            Konsol pengenalan objek yang berjalan{" "}
            <em className="text-vermilion">sepenuhnya di dalam peramban</em> — tanpa unggah ke server,
            tanpa antrean, tanpa kunci API.
          </p>
          <div className="space-y-3 text-[13px] leading-[1.65] text-ink2 md:col-span-5">
            <p>
              Citra diproses langsung di perangkat Anda memakai TensorFlow.js dengan model SSD MobileNet
              v2 yang dilatih pada kumpulan data COCO. Setiap kotak pembatas yang Anda lihat adalah hasil
              inferensi nyata, bukan ilustrasi.
            </p>
            <p className="text-mute">
              Gulir ke bawah untuk memindai pelat contoh, mengunggah citra sendiri, atau menyalakan kamera
              langsung.
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-2 border-y-2 border-ink md:grid-cols-5">
        {[
          ["Model", "SSD MobileNet v2"],
          ["Ukuran input", "300 × 300 px"],
          ["Kelas latih", "80 (COCO)"],
          ["Latenzi", "≈ 40 ms / citra"],
          ["Runtime", "WebGL · CPU"],
        ].map(([k, v], i) => (
          <div
            key={k}
            className={`px-3 py-3.5 ${i < 4 ? "border-b border-ink/15 md:border-b-0 md:border-r" : ""} ${
              i % 2 === 0 ? "border-r border-ink/15 md:border-r" : ""
            }`}
          >
            <dt className="kicker text-mute">{k}</dt>
            <dd className="mt-1.5 font-mono text-[12px] font-medium tabular text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Marquee() {
  const line =
    "80 KELAS COCO  —  INFERENSI LOKAL  —  TANPA SERVER  —  SSD MOBILENET V2  —  NON-MAKSIMUM SUPRESI  —  TENSORFLOW.JS  —  ";
  return (
    <div className="mt-8 overflow-hidden border-y border-ink/20 bg-ink py-2.5">
      <div className="marquee-track flex w-max whitespace-nowrap">
        {[0, 1].map((k) => (
          <span key={k} className="kicker px-0 text-paper2/90">
            {line.repeat(4)}
          </span>
        ))}
      </div>
    </div>
  );
}
