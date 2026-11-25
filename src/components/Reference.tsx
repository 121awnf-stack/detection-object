import type { DetectorStatus } from "../lib/detector";
import { colorOf, idLabel } from "../lib/detector";

const CLASS_LIST = [
  "person",
  "bicycle",
  "car",
  "motorcycle",
  "bus",
  "train",
  "truck",
  "boat",
  "traffic light",
  "stop sign",
  "bench",
  "bird",
  "cat",
  "dog",
  "horse",
  "cow",
  "elephant",
  "backpack",
  "umbrella",
  "handbag",
  "suitcase",
  "bottle",
  "cup",
  "fork",
  "knife",
  "spoon",
  "bowl",
  "banana",
  "apple",
  "orange",
  "chair",
  "couch",
  "potted plant",
  "bed",
  "dining table",
  "laptop",
  "cell phone",
  "clock",
  "scissors",
  "book",
];

const STAGES = [
  { n: "01", t: "INPUT", s: "citra mentah", c: "JPG · PNG · kamera" },
  { n: "02", t: "PRAPROSES", s: "300 × 300", c: "ubah ukuran & normalisasi" },
  { n: "03", t: "BACKBONE", s: "MobileNetV2", c: "ekstraksi fitur berlapis" },
  { n: "04", t: "HEAD", s: "SSD", c: "kotak & skor per sel" },
  { n: "05", t: "NMS", s: "IoU 0,45", c: "buang tumpang tindih" },
  { n: "06", t: "OUTPUT", s: "JSON", c: "kelas · skor · bbox" },
];

const SPECS: [string, string][] = [
  ["Arsitektur", "SSD MobileNet v2 (lite) — deteksi satu tahap"],
  ["Kumpulan latih", "COCO 2017 · 80 kelas · 118 ribu citra"],
  ["Ukuran input", "300 × 300 piksel, dinormalisasi ke [-1, 1]"],
  ["Kotak per sel", "6 anchor dengan rasio 1 : 2 dan 2 : 1"],
  ["Non-maksimum supresi", "IoU 0,45 · maksimum 18 kotak per bingkai"],
  ["Ambang keyakinan", "0,30 – 0,90 · dapat disetel langsung"],
  ["Ukuran bobot", "≈ 4,2 MB · dimuat sekali lalu disimpan peramban"],
  ["Runtime", "TensorFlow.js · backend WebGL, fallback CPU"],
  ["Privasi", "Citra tidak pernah meninggalkan perangkat"],
  ["Lisensi", "Apache 2.0 · TensorFlow Object Detection API"],
];

function Pipeline() {
  return (
    <svg viewBox="0 0 1200 248" className="w-full" role="img" aria-label="Diagram alur kerja deteksi objek">
      <defs>
        <marker id="panah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#16120e" />
        </marker>
        <pattern id="arsir" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#16120e" strokeOpacity="0.14" strokeWidth="2" />
        </pattern>
      </defs>

      <line x1="12" y1="42" x2="1188" y2="42" stroke="#16120e" strokeOpacity="0.28" strokeWidth="1" />
      {STAGES.map((_, i) => (
        <line key={i} x1={16 + i * 200} y1="36" x2={16 + i * 200} y2="48" stroke="#16120e" strokeOpacity="0.28" />
      ))}

      {STAGES.map((s, i) => {
        const x = 16 + i * 200;
        const last = i === STAGES.length - 1;
        return (
          <g key={s.n}>
            <text x={x} y="28" fontFamily="IBM Plex Mono, monospace" fontSize="11" letterSpacing="2" fill="#6b6152">
              {s.n}
            </text>
            <rect
              x={x}
              y="78"
              width="168"
              height="88"
              fill={last ? "#d6371f" : "#e9e1d3"}
              stroke={last ? "#d6371f" : "#16120e"}
              strokeWidth={last ? 1.5 : 1}
            />
            {!last && <rect x={x} y="78" width="168" height="88" fill="url(#arsir)" />}
            <text
              x={x + 16}
              y="114"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="15"
              fontWeight="600"
              letterSpacing="1.5"
              fill={last ? "#f4efe6" : "#16120e"}
            >
              {s.t}
            </text>
            <text
              x={x + 16}
              y="138"
              fontFamily="IBM Plex Mono, monospace"
              fontSize="11"
              letterSpacing="1"
              fill={last ? "#f4efe6" : "#3b332a"}
              opacity={last ? 0.9 : 1}
            >
              {s.s}
            </text>
            <text
              x={x + 16}
              y="196"
              fontFamily="IBM Plex Sans, sans-serif"
              fontSize="12"
              fill="#6b6152"
            >
              {s.c}
            </text>
            {!last && (
              <line
                x1={x + 172}
                y1="122"
                x2={x + 196}
                y2="122"
                stroke="#16120e"
                strokeWidth="1.2"
                markerEnd="url(#panah)"
              />
            )}
          </g>
        );
      })}

      <line x1="12" y1="222" x2="1188" y2="222" stroke="#16120e" strokeOpacity="0.28" strokeDasharray="4 5" />
      <text x="12" y="240" fontFamily="IBM Plex Mono, monospace" fontSize="10" letterSpacing="2.2" fill="#6b6152">
        SELURUH TAHAP BERJALAN DI DALAM PERAMBAN — TANPA PANGGILAN JARINGAN SETELAH BOBOT DIMUAT
      </text>
    </svg>
  );
}

export function Reference({ status }: { status: DetectorStatus }) {
  return (
    <>
      {/* ————— indeks kelas ————— */}
      <section id="kelas" className="mx-auto max-w-[1500px] scroll-mt-16 px-4 pt-20 sm:px-8 sm:pt-24">
        <div className="grid grid-cols-12 items-end gap-x-8 gap-y-5 border-b-2 border-ink pb-4">
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center gap-3">
              <span className="kicker text-vermilion">Indeks Kelas</span>
              <span className="h-px w-8 bg-ink/30" />
              <span className="kicker text-mute">40 dari 80 kelas COCO</span>
            </div>
            <h2 className="mt-3 font-display text-[clamp(2.1rem,5.2vw,4.25rem)] leading-[0.95] tracking-[-0.02em]">
              Kamus objek yang dikenali
            </h2>
          </div>
          <p className="col-span-12 max-w-md text-[13px] leading-[1.7] text-ink2 lg:col-span-5">
            Setiap label diberi warna menurut kelompoknya — <span className="text-vermilion">manusia</span>,{" "}
            <span className="text-navy">kendaraan</span>, <span className="text-moss">hewan</span>, dan{" "}
            <span className="text-ochre">rumah tangga</span>. Warna yang sama dipakai pada seluruh kotak
            pembatas di halaman ini.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
          {CLASS_LIST.map((cls, i) => (
            <div key={cls} className="ledger-row flex items-baseline gap-2.5 py-2.5">
              <span className="font-mono text-[10px] tabular text-mute">{String(i + 1).padStart(2, "0")}</span>
              <span className="h-2 w-2 shrink-0 translate-y-[-1px]" style={{ backgroundColor: colorOf(cls) }} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-ink">{idLabel(cls)}</div>
                <div className="kicker truncate text-mute">{cls}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ————— alur kerja ————— */}
      <section id="alur" className="mx-auto max-w-[1500px] scroll-mt-16 px-4 pt-20 sm:px-8 sm:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-ink/25 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="kicker text-vermilion">Alur Kerja</span>
              <span className="h-px w-8 bg-ink/30" />
              <span className="kicker text-mute">Enam tahap</span>
            </div>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,4.4vw,3.5rem)] leading-[0.95] tracking-[-0.02em]">
              Dari piksel menuju label
            </h2>
          </div>
          <p className="max-w-sm text-[13px] leading-[1.7] text-ink2">
            Diagram berikut menggambarkan urutan pemrosesan yang sama setiap kali sebuah citra dipindai.
          </p>
        </div>
        <div className="mt-8 overflow-x-auto border border-ink/20 bg-paper2 p-5">
          <div className="min-w-[860px]">
            <Pipeline />
          </div>
        </div>
      </section>

      {/* ————— spesifikasi ————— */}
      <section id="spesifikasi" className="mx-auto max-w-[1500px] scroll-mt-16 px-4 pt-20 sm:px-8 sm:pt-24">
        <div className="grid grid-cols-12 gap-x-8 gap-y-8">
          <div className="col-span-12 lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="kicker text-vermilion">Spesifikasi</span>
              <span className="h-px w-8 bg-ink/30" />
            </div>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,4.4vw,3.5rem)] leading-[0.95] tracking-[-0.02em]">
              Lembar data
            </h2>
            <p className="mt-4 max-w-sm text-[13px] leading-[1.7] text-ink2">
              Nilai di bawah ini berlaku untuk konfigurasi bawaan konsol. Ambang keyakinan dan jumlah kotak
              maksimum dapat diubah langsung dari meja kerja.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 border border-ink/25 px-3 py-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${status === "ready" ? "bg-moss" : status === "loading" ? "bg-ochre pulse-dot" : "bg-vermilion"}`}
              />
              <span className="kicker text-ink2">
                Status model: {status === "ready" ? "siap" : status === "loading" ? "memuat" : "galat"}
              </span>
            </div>
          </div>

          <dl className="col-span-12 border-t border-ink lg:col-span-8">
            {SPECS.map(([k, v]) => (
              <div
                key={k}
                className="ledger-row grid grid-cols-1 gap-x-6 py-3 sm:grid-cols-[minmax(0,15rem)_1fr]"
              >
                <dt className="kicker pt-1 text-mute">{k}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-ink sm:mt-0">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ————— kolofon ————— */}
      <footer className="mt-24 border-t-2 border-ink bg-ink text-paper2">
        <div className="mx-auto max-w-[1500px] px-4 py-12 sm:px-8">
          <div className="grid grid-cols-12 gap-x-8 gap-y-10">
            <div className="col-span-12 lg:col-span-6">
              <h2 className="font-display text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.86] tracking-[-0.025em] text-paper">
                DETEKSI
                <br />
                OBJEK
              </h2>
              <p className="mt-5 max-w-md text-[13px] leading-[1.8] text-paper2/75">
                Konsol ini adalah lembar kerja terbuka untuk memeriksa bagaimana sebuah detektor objek
                membaca dunia. Seluruh inferensi berjalan di perangkat Anda; tidak ada citra, teks, atau
                data kamera yang dikirim ke server mana pun.
              </p>
            </div>

            <div className="col-span-12 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:col-span-6">
              <div>
                <div className="kicker text-paper2/50">Bagian</div>
                <ul className="mt-3 space-y-2">
                  {[
                    ["pelat", "Pelat 01"],
                    ["meja-kerja", "Meja Kerja"],
                    ["kelas", "Indeks Kelas"],
                    ["alur", "Alur Kerja"],
                    ["spesifikasi", "Spesifikasi"],
                  ].map(([id, label]) => (
                    <li key={id}>
                      <a href={`#${id}`} className="text-[13px] text-paper2/85 transition-colors hover:text-vermilionl">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="kicker text-paper2/50">Teknologi</div>
                <ul className="mt-3 space-y-2 text-[13px] text-paper2/85">
                  <li>TensorFlow.js</li>
                  <li>SSD MobileNet v2</li>
                  <li>COCO 2017</li>
                  <li>WebGL / CPU</li>
                </ul>
              </div>
              <div>
                <div className="kicker text-paper2/50">Tipografi</div>
                <ul className="mt-3 space-y-2 text-[13px] text-paper2/85">
                  <li>Instrument Serif</li>
                  <li>IBM Plex Mono</li>
                  <li>IBM Plex Sans</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-paper2/20 pt-5">
            <span className="kicker text-paper2/55">
              Lembar kerja teknik No. 04 · Disusun 2026 · Edisi peramban
            </span>
            <div className="flex items-center gap-4">
              <span className="kicker text-paper2/55">Nomor pelat 01—03</span>
              <div className="border border-vermilionl px-3 py-1.5 text-vermilionl">
                <span className="kicker">Inferensi lokal</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
