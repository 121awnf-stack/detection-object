import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Download, ImageUp, SwitchCamera, Trash2 } from "lucide-react";
import { Boxes, CropMarks, ScanSweep, type Size } from "./Boxes";
import type { Detection } from "../lib/detector";
import { colorOf, groupOf, useDetector } from "../lib/detector";

type Detector = ReturnType<typeof useDetector>;

const SAMPLES = [
  { src: "images/plate-jalan.jpg", name: "jalan-raya.jpg", cap: "Jalan raya" },
  { src: "images/plate-pasar.jpg", name: "pasar-pagi.jpg", cap: "Pasar pagi" },
  { src: "images/plate-bengkel.jpg", name: "meja-bengkel.jpg", cap: "Meja bengkel" },
];

const GROUPS_TAB = ["semua", "manusia", "kendaraan", "hewan", "rumah"] as const;

export function Workbench({ detector }: { detector: Detector }) {
  const [tab, setTab] = useState<"unggah" | "kamera">("unggah");
  const [src, setSrc] = useState<string | null>(SAMPLES[1].src);
  const [name, setName] = useState(SAMPLES[1].name);
  const [size, setSize] = useState<Size | null>(null);
  const [nonce, setNonce] = useState(0);
  const [items, setItems] = useState<Detection[]>([]);
  const [ms, setMs] = useState(0);
  const [busy, setBusy] = useState(false);
  const [threshold, setThreshold] = useState(0.5);
  const [group, setGroup] = useState<(typeof GROUPS_TAB)[number]>("semua");
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [dragOver, setDragOver] = useState(false);
  const [objUrl, setObjUrl] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastRunRef = useRef(0);
  const busyRef = useRef(false);

  // Bersihkan Blob URL saat unmount agar tidak terjadi kebocoran memori (memory leak)
  useEffect(() => {
    return () => {
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [objUrl]);

  const analyse = useCallback(
    async (el: HTMLImageElement | HTMLVideoElement) => {
      setBusy(true);
      try {
        const res = await detector.run(el, 0.35, 18);
        setItems(res.items);
        setMs(res.ms);
      } catch {
        setItems([]);
      } finally {
        setBusy(false);
      }
    },
    [detector],
  );

  // deteksi otomatis saat citra contoh / unggahan selesai dimuat
  useEffect(() => {
    if (tab !== "unggah" || !size || detector.status !== "ready") return;
    const el = imgRef.current;
    if (el) void analyse(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, nonce, detector.status, tab]);

  const stopCam = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    busyRef.current = false;
    setCamOn(false);
  }, []);

  useEffect(() => () => stopCam(), [stopCam]);

  const startCam = useCallback(
    async (facing: "environment" | "user" = facingMode) => {
      setCamError(null);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play();
        setCamOn(true);

        // Gunakan requestAnimationFrame dengan throttling ~350ms demi kelancaran main-thread
        const loop = async (timestamp: number) => {
          if (!streamRef.current) return;
          if (!busyRef.current && videoRef.current && timestamp - lastRunRef.current > 350) {
            busyRef.current = true;
            lastRunRef.current = timestamp;
            try {
              const res = await detector.run(videoRef.current, 0.4, 12);
              setItems(res.items);
              setMs(res.ms);
            } catch {
              /* abaikan bingkai yang gagal */
            } finally {
              busyRef.current = false;
            }
          }
          animFrameRef.current = requestAnimationFrame(loop);
        };

        animFrameRef.current = requestAnimationFrame(loop);
      } catch {
        setCamError("Kamera tidak dapat diakses. Periksa izin peramban, lalu coba lagi.");
      }
    },
    [detector, facingMode],
  );

  const toggleFacingMode = useCallback(() => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    if (camOn) {
      void startCam(next);
    }
  }, [facingMode, camOn, startCam]);

  const acceptFile = useCallback(
    (file: File | undefined | null) => {
      if (!file || !file.type.startsWith("image/")) return;
      if (objUrl) URL.revokeObjectURL(objUrl);
      const url = URL.createObjectURL(file);
      setObjUrl(url);
      setSrc(url);
      setName(file.name);
      setSize(null);
      setItems([]);
      setNonce((n) => n + 1);
      setTab("unggah");
    },
    [objUrl],
  );

  // tempel citra dari papan klip
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file) acceptFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile]);

  const shown = items.filter((d) => d.score >= threshold && (group === "semua" || groupOf(d.cls) === group));

  const exportJson = () => {
    const payload = {
      berkas: name,
      waktu: new Date().toISOString(),
      model: "SSD MobileNet v2 (COCO) · TensorFlow.js",
      ambang_keyakinan: Number(threshold.toFixed(2)),
      waktu_inferensi_ms: Number(ms.toFixed(1)),
      jumlah_objek: shown.length,
      deteksi: shown.map((d) => ({
        kelas: d.cls,
        label: d.label,
        keyakinan: Number(d.score.toFixed(4)),
        bbox: d.bbox.map((v) => Math.round(v)),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deteksi-objek.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="meja-kerja" className="mx-auto max-w-[1500px] scroll-mt-16 px-4 pt-20 sm:px-8 sm:pt-24">
      <div className="grid grid-cols-12 items-end gap-x-8 gap-y-5 border-b-2 border-ink pb-4">
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center gap-3">
            <span className="kicker text-vermilion">Meja Kerja</span>
            <span className="h-px w-8 bg-ink/30" />
            <span className="kicker text-mute">Unggah · Kamera Langsung</span>
          </div>
          <h2 className="mt-3 font-display text-[clamp(2.1rem,5.2vw,4.25rem)] leading-[0.95] tracking-[-0.02em]">
            Pindai citra Anda sendiri
          </h2>
        </div>
        <p className="col-span-12 max-w-md text-[13px] leading-[1.7] text-ink2 lg:col-span-5">
          Seret berkas gambar ke area kerja, tempel dengan <span className="font-mono text-[12px]">Ctrl+V</span>,
          atau nyalakan kamera. Tidak satu pun piksel yang dikirim keluar dari perangkat ini.
        </p>
      </div>

      {/* kendali */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex border border-ink">
          {(["unggah", "kamera"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === "unggah") stopCam();
              }}
              className={`px-4 py-2.5 transition-colors ${
                tab === t ? "bg-ink text-paper" : "bg-transparent text-ink hover:bg-ink/8"
              }`}
            >
              <span className="kicker">{t === "unggah" ? "Unggah Citra" : "Kamera Langsung"}</span>
            </button>
          ))}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 border border-ink bg-ink px-4 py-2.5 text-paper transition-colors hover:border-vermilion hover:bg-vermilion">
          <ImageUp size={14} strokeWidth={2} />
          <span className="kicker">Pilih berkas</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />
        </label>

        <label className="flex items-center gap-3 border border-ink/25 bg-paper2 px-3 py-2">
          <span className="kicker text-mute">Ambang</span>
          <input
            type="range"
            min={30}
            max={90}
            value={Math.round(threshold * 100)}
            onChange={(e) => setThreshold(Number(e.target.value) / 100)}
            className="h-1 w-24 cursor-pointer appearance-none bg-ink/25 accent-vermilion"
            aria-label="Ambang keyakinan meja kerja"
            aria-valuemin={30}
            aria-valuemax={90}
            aria-valuenow={Math.round(threshold * 100)}
            aria-valuetext={`${Math.round(threshold * 100)} persen`}
          />
          <span className="font-mono text-[11px] tabular text-ink">{Math.round(threshold * 100)}%</span>
        </label>

        <button
          onClick={exportJson}
          disabled={shown.length === 0}
          className="inline-flex items-center gap-2 border border-ink/30 px-4 py-2.5 transition-colors enabled:hover:border-ink enabled:hover:bg-ink enabled:hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={14} strokeWidth={2} />
          <span className="kicker">Ekspor JSON</span>
        </button>

        {tab === "kamera" &&
          (camOn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={stopCam}
                className="inline-flex items-center gap-2 border border-vermilion bg-vermilion px-4 py-2.5 text-paper transition-colors hover:bg-vermilion-d"
              >
                <CameraOff size={14} strokeWidth={2} />
                <span className="kicker">Hentikan</span>
              </button>
              <button
                onClick={toggleFacingMode}
                title="Ganti kamera depan / belakang"
                className="inline-flex items-center gap-2 border border-ink/30 px-3 py-2.5 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
              >
                <SwitchCamera size={14} strokeWidth={2} />
                <span className="kicker">{facingMode === "environment" ? "Belakang" : "Depan"}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => startCam(facingMode)}
              className="inline-flex items-center gap-2 border border-ink px-4 py-2.5 transition-colors hover:bg-ink hover:text-paper"
            >
              <Camera size={14} strokeWidth={2} />
              <span className="kicker">Aktifkan kamera</span>
            </button>
          ))}
      </div>

      <div className="mt-6 grid grid-cols-12 gap-x-8 gap-y-6">
        {/* area citra */}
        <div className="col-span-12 lg:col-span-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            className={`relative border p-3 transition-colors ${
              dragOver ? "border-vermilion bg-vermilion/8" : "border-ink/25 bg-paper2"
            }`}
          >
            <CropMarks />
            <div className="flex items-center justify-between border-b border-ink/20 pb-2">
              <span className="kicker text-ink2">{tab === "kamera" ? "Masukan · Kamera" : `Berkas · ${name}`}</span>
              <span className="kicker text-mute tabular">
                {tab === "kamera" ? (camOn ? "Langsung" : "Nonaktif") : busy ? "Memproses" : `${shown.length} objek`}
              </span>
            </div>

            {tab === "unggah" ? (
              src ? (
                <div
                  className="relative mx-auto mt-3"
                  style={
                    size
                      ? {
                          aspectRatio: `${size.w} / ${size.h}`,
                          width: `min(100%, ${(520 * size.w) / size.h}px)`,
                        }
                      : { aspectRatio: "3 / 2", width: "100%" }
                  }
                >
                  <img
                    ref={imgRef}
                    key={`${src}-${nonce}`}
                    src={src}
                    alt={name}
                    onLoad={(e) => {
                      const el = e.currentTarget;
                      setSize({ w: el.naturalWidth || 1, h: el.naturalHeight || 1 });
                    }}
                    onError={() => setSrc(null)}
                    className="absolute inset-0 h-full w-full"
                  />
                  <Boxes items={items} size={size} threshold={threshold} />
                  {busy && <ScanSweep label="Memproses citra" />}
                </div>
              ) : (
                <div className="mt-3 flex aspect-[3/2] w-full flex-col items-center justify-center gap-3 border border-dashed border-ink/30 bg-paper/60">
                  <ImageUp size={26} strokeWidth={1.5} className="text-mute" />
                  <p className="kicker text-mute">Jatuhkan citra di sini</p>
                  <p className="max-w-xs px-4 text-center text-[12px] leading-relaxed text-ink2">
                    Mendukung JPG, PNG, dan WebP. Anda juga dapat menempel citra langsung dari papan klip.
                  </p>
                </div>
              )
            ) : (
              <div
                className="relative mt-3 w-full overflow-hidden bg-ink"
                style={{ aspectRatio: size && camOn ? `${size.w} / ${size.h}` : "3 / 2" }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth) setSize({ w: v.videoWidth, h: v.videoHeight });
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <Boxes items={items} size={camOn ? size : null} threshold={threshold} />
                {!camOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <Camera size={26} strokeWidth={1.5} className="text-paper2/70" />
                    <p className="kicker text-paper2">Kamera nonaktif</p>
                    <p className="max-w-xs text-[12px] leading-relaxed text-paper2/70">
                      {camError ?? "Aktifkan kamera untuk memulai deteksi beruntun pada setiap bingkai."}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="kicker text-mute">Seret &amp; letakkan · Ctrl+V untuk menempel</span>
              <div className="flex items-center gap-3">
                <span className="kicker text-mute tabular">{ms.toFixed(0)} ms</span>
                <button
                  onClick={() => {
                    setItems([]);
                    if (tab === "unggah" && size) setNonce((n) => n + 1);
                  }}
                  className="inline-flex items-center gap-1.5 kicker text-mute transition-colors hover:text-vermilion"
                >
                  <Trash2 size={12} strokeWidth={2} /> Bersihkan
                </button>
              </div>
            </div>
          </div>

          {/* contoh citra */}
          <div className="mt-5">
            <div className="flex items-center gap-3">
              <span className="kicker text-mute">Citra contoh</span>
              <span className="h-px flex-1 bg-ink/15" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {SAMPLES.map((s) => {
                const active = src === s.src;
                return (
                  <button
                    key={s.src}
                    onClick={() => {
                      stopCam();
                      setTab("unggah");
                      setSrc(s.src);
                      setName(s.name);
                      setSize(null);
                      setItems([]);
                      setNonce((n) => n + 1);
                    }}
                    className={`group relative overflow-hidden border transition-colors ${
                      active ? "border-vermilion" : "border-ink/20 hover:border-ink"
                    }`}
                  >
                    <img
                      src={s.src}
                      alt={s.cap}
                      className="aspect-[3/2] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <span
                      className={`absolute bottom-0 left-0 px-2 py-1 kicker ${
                        active ? "bg-vermilion text-paper" : "bg-ink/85 text-paper2"
                      }`}
                    >
                      {s.cap}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* tabel hasil */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="flex h-full flex-col border-t-2 border-ink pt-3 lg:border-l lg:border-l-ink/15 lg:pl-6">
            <div className="flex items-baseline justify-between">
              <h3 className="kicker text-ink">Tabel Deteksi</h3>
              <span className="font-mono text-[11px] tabular text-vermilion">
                {String(shown.length).padStart(2, "0")} baris
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {GROUPS_TAB.map((g) => (
                <button
                  key={g}
                  onClick={() => setGroup(g)}
                  className={`border px-2.5 py-1.5 kicker transition-colors ${
                    group === g
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/20 text-mute hover:border-ink hover:text-ink"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-[28px_1fr_58px_44px] gap-x-2 border-b border-ink pb-1.5">
              <span className="kicker text-mute">No</span>
              <span className="kicker text-mute">Kelas</span>
              <span className="kicker text-right text-mute">Yakin</span>
              <span className="kicker text-right text-mute">Grup</span>
            </div>

            <div
              className="max-h-[360px] overflow-y-auto"
              aria-live="polite"
              aria-label="Hasil tabel deteksi meja kerja"
            >
              {shown.length === 0 ? (
                <div className="mt-4 border border-dashed border-ink/25 px-4 py-10 text-center">
                  <p className="kicker text-mute">Belum ada hasil</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-ink2">
                    {detector.status === "loading"
                      ? "Model masih dimuat. Tunggu sebentar lalu pindai."
                      : "Unggah citra atau aktifkan kamera untuk memulai inferensi."}
                  </p>
                </div>
              ) : (
                shown.map((d, i) => (
                  <div
                    key={d.id}
                    className="ledger-row fade-up grid grid-cols-[28px_1fr_58px_44px] items-center gap-x-2 py-2"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className="font-mono text-[10px] tabular text-mute">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: colorOf(d.cls) }} aria-hidden />
                      <span className="truncate text-[12px] font-semibold capitalize text-ink">{d.label}</span>
                    </span>
                    <span className="text-right font-mono text-[11px] tabular text-ink">
                      {(d.score * 100).toFixed(1)}
                    </span>
                    <span className="text-right kicker text-mute">{groupOf(d.cls).slice(0, 4)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink/25 pt-3">
              <div>
                <div className="kicker text-mute">Inferensi</div>
                <div className="font-mono text-[13px] tabular text-ink">{ms.toFixed(0)} ms</div>
              </div>
              <div>
                <div className="kicker text-mute">Backend</div>
                <div className="font-mono text-[13px] tabular uppercase text-ink">{detector.backend}</div>
              </div>
              <div>
                <div className="kicker text-mute">Maks. kotak</div>
                <div className="font-mono text-[13px] tabular text-ink">18</div>
              </div>
              <div>
                <div className="kicker text-mute">NMS · IoU</div>
                <div className="font-mono text-[13px] tabular text-ink">0,45</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
