import { useCallback, useEffect, useRef, useState } from "react";
import { Boxes, CropMarks, ScanSweep, type Size } from "./Boxes";
import type { Detection } from "../lib/detector";
import { colorOf, groupOf, useDetector } from "../lib/detector";

type Detector = ReturnType<typeof useDetector>;
type Phase = "menunggu" | "pindai" | "selesai" | "gagal";

export function PlateStage({ detector }: { detector: Detector }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [items, setItems] = useState<Detection[]>([]);
  const [ms, setMs] = useState(0);
  const [phase, setPhase] = useState<Phase>("menunggu");
  const [threshold, setThreshold] = useState(0.5);
  const [imgError, setImgError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (detector.status === "error") setPhase("gagal");
  }, [detector.status]);

  useEffect(() => {
    if (!size || detector.status !== "ready") return;
    let cancelled = false;
    setPhase("pindai");
    const t = window.setTimeout(async () => {
      try {
        const el = imgRef.current;
        if (!el) return;
        const res = await detector.run(el, 0.35, 18);
        if (cancelled) return;
        setItems(res.items);
        setMs(res.ms);
        setPhase("selesai");
      } catch {
        if (!cancelled) setPhase("gagal");
      }
    }, 650);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, detector.status, nonce]);

  const onImgLoad = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    setSize({ w: el.naturalWidth || 1536, h: el.naturalHeight || 1024 });
  }, []);

  const shown = items.filter((d) => d.score >= threshold);
  const counts = shown.reduce<Record<string, number>>((acc, d) => {
    acc[groupOf(d.cls)] = (acc[groupOf(d.cls)] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section id="pelat" className="mx-auto max-w-[1500px] scroll-mt-16 px-4 pt-12 sm:px-8 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-ink/25 pb-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="kicker text-vermilion">Pelat 01</span>
            <span className="h-px w-8 bg-ink/30" />
            <span className="kicker text-mute">Jalan Raya · Citra Dokumenter</span>
          </div>
          <h2 className="mt-3 font-display text-[clamp(2.1rem,5.2vw,4.25rem)] leading-[0.95] tracking-[-0.02em]">
            Interpretasi otomatis atas satu bingkai
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 border border-ink/25 bg-paper2 px-3 py-2">
            <span className="kicker text-mute">Ambang</span>
            <input
              type="range"
              min={30}
              max={90}
              value={Math.round(threshold * 100)}
              onChange={(e) => setThreshold(Number(e.target.value) / 100)}
              className="h-1 w-28 cursor-pointer appearance-none rounded-none bg-ink/25 accent-vermilion"
              aria-label="Ambang keyakinan pelat 01"
              aria-valuemin={30}
              aria-valuemax={90}
              aria-valuenow={Math.round(threshold * 100)}
              aria-valuetext={`${Math.round(threshold * 100)} persen`}
            />
            <span className="font-mono text-[11px] tabular text-ink">{Math.round(threshold * 100)}%</span>
          </label>
          <button
            onClick={() => {
              setItems([]);
              setNonce((n) => n + 1);
            }}
            className="border border-ink bg-ink px-4 py-2.5 transition-colors hover:bg-vermilion hover:border-vermilion"
          >
            <span className="kicker text-paper">Pindai Ulang</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-x-8 gap-y-8 pt-8">
        {/* ————— pelat citra ————— */}
        <div className="col-span-12 lg:col-span-8">
          <div className="relative border border-ink/25 bg-paper2 p-3">
            <CropMarks />
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <span className="kicker text-ink2">Pelat 01 / Jalan Raya</span>
              <span className="kicker text-mute tabular">{size ? `${size.w} × ${size.h} px` : "—"}</span>
            </div>

            <div
              className="relative mt-3 w-full overflow-hidden bg-ink transition-[aspect-ratio] duration-300"
              style={{ aspectRatio: size ? `${size.w} / ${size.h}` : "3 / 2" }}
            >
              {imgError ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, #2a2119 0 12px, #1c1611 12px 24px)",
                  }}
                >
                  <span className="kicker text-paper2">Citra tidak tersedia</span>
                  <button
                    onClick={() => {
                      setImgError(false);
                      setNonce((n) => n + 1);
                    }}
                    className="border border-paper2/60 px-3 py-2 kicker text-paper2 transition-colors hover:bg-paper2 hover:text-ink"
                  >
                    Muat ulang pelat
                  </button>
                </div>
              ) : (
                <img
                  ref={imgRef}
                  key={nonce}
                  src="images/plate-jalan.jpg"
                  alt="Citra dokumenter persimpangan jalan dengan mobil, pesepeda, pejalan kaki, dan bangku"
                  onLoad={onImgLoad}
                  onError={() => setImgError(true)}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}

              {/* bidang bantu: garis rambut + sasaran tengah */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-full w-px bg-paper/15" />
                <div className="absolute left-0 top-1/2 h-px w-full bg-paper/15" />
              </div>

              {!imgError && <Boxes items={items} size={size} threshold={threshold} />}
              {phase === "pindai" && <ScanSweep label="Memindai · SSD MobileNet v2" />}

              {phase === "menunggu" && detector.status === "loading" && (
                <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-ink/80 via-ink/10 to-transparent p-4">
                  <div>
                    <div className="kicker text-paper2">Memuat bobot model</div>
                    <div className="mt-2 h-[3px] w-52 bg-paper2/25">
                      <div className="sweep-line h-full w-1/3 bg-vermilion" />
                    </div>
                  </div>
                </div>
              )}

              {phase === "gagal" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/85 p-6 text-center">
                  <span className="kicker text-vermilion">Model tidak dapat dimuat</span>
                  <p className="max-w-sm text-[12px] leading-relaxed text-paper2/80">
                    Bobot detektor belum tersedia. Periksa koneksi lalu muat ulang — seluruh inferensi tetap
                    berlangsung di peramban Anda.
                  </p>
                  <button
                    onClick={() => {
                      setPhase("menunggu");
                      detector.retry();
                    }}
                    className="border border-paper2/60 px-3 py-2 kicker text-paper2 transition-colors hover:bg-paper2 hover:text-ink"
                  >
                    Coba lagi
                  </button>
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="kicker text-mute">
                Sumber: citra dokumenter · Pemrosesan lokal · Tanpa unggahan
              </span>
              <span className="kicker text-mute tabular">
                {phase === "selesai" ? `Inferensi ${ms.toFixed(0)} ms` : "Menunggu inferensi"}
              </span>
            </div>
          </div>
        </div>

        {/* ————— rail ledger ————— */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="flex h-full flex-col border-t-2 border-ink pt-3 lg:border-l lg:border-t-2 lg:border-l-ink/15 lg:pl-6">
            <div className="flex items-baseline justify-between">
              <h3 className="kicker text-ink">Hasil Interpretasi</h3>
              <span className="font-mono text-[11px] tabular text-vermilion">
                {String(shown.length).padStart(2, "0")} objek
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {(["manusia", "kendaraan", "hewan", "rumah"] as const).map((g) => (
                <span key={g} className="kicker text-mute">
                  {g} <span className="tabular text-ink">{counts[g] ?? 0}</span>
                </span>
              ))}
            </div>

            <ol
              className="mt-4 max-h-[420px] overflow-y-auto pr-1"
              aria-live="polite"
              aria-label="Daftar objek terdeteksi pada pelat 01"
            >
              {shown.length === 0 && (
                <li className="border border-dashed border-ink/25 px-4 py-8 text-center">
                  <p className="kicker text-mute">Belum ada objek pada ambang ini</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink2">
                    Turunkan ambang keyakinan atau jalankan pemindaian ulang.
                  </p>
                </li>
              )}
              {shown.map((d, i) => (
                <li key={d.id} className="ledger-row fade-up py-2.5" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="flex items-start gap-3">
                    <span className="mt-[3px] font-mono text-[10px] tabular text-mute">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="mt-[5px] h-2.5 w-2.5 shrink-0"
                      style={{ backgroundColor: colorOf(d.cls) }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-[13px] font-semibold capitalize text-ink">{d.label}</span>
                        <span className="font-mono text-[11px] tabular text-vermilion">
                          {(d.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-between gap-3">
                        <span className="kicker text-mute">{d.cls}</span>
                        <span className="font-mono text-[9px] tabular text-mute">
                          x{Math.round(d.bbox[0])} y{Math.round(d.bbox[1])} w{Math.round(d.bbox[2])} h
                          {Math.round(d.bbox[3])}
                        </span>
                      </div>
                      <div className="mt-1.5 h-[3px] w-full bg-ink/12">
                        <div
                          className="h-full transition-[width] duration-500"
                          style={{ width: `${d.score * 100}%`, backgroundColor: colorOf(d.cls) }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="relative mt-auto pt-5">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink/25 pt-3">
                <div>
                  <div className="kicker text-mute">Total objek</div>
                  <div className="font-mono text-[13px] tabular text-ink">{String(shown.length).padStart(2, "0")}</div>
                </div>
                <div>
                  <div className="kicker text-mute">Waktu inferensi</div>
                  <div className="font-mono text-[13px] tabular text-ink">{ms.toFixed(0)} ms</div>
                </div>
                <div>
                  <div className="kicker text-mute">Ambang</div>
                  <div className="font-mono text-[13px] tabular text-ink">{Math.round(threshold * 100)}%</div>
                </div>
                <div>
                  <div className="kicker text-mute">Backend</div>
                  <div className="font-mono text-[13px] tabular uppercase text-ink">{detector.backend}</div>
                </div>
              </div>
              <div className="stamp mt-6 inline-block px-3 py-1.5">
                <span className="kicker">Diverifikasi lokal</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
