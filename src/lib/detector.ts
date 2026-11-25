import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { useCallback, useEffect, useRef, useState } from "react";

export type Box = [number, number, number, number]; // x, y, w, h in px

export type Detection = {
  id: string;
  /** kelas COCO asli (Inggris), dipertahankan agar cocok dengan label model */
  cls: string;
  label: string;
  score: number;
  bbox: Box;
};

export type DetectorStatus = "loading" | "ready" | "error";

/** Terjemahan kelas COCO → Indonesia untuk antarmuka. */
export const ID_LABELS: Record<string, string> = {
  person: "orang",
  bicycle: "sepeda",
  car: "mobil",
  motorcycle: "sepeda motor",
  airplane: "pesawat",
  bus: "bus",
  train: "kereta",
  truck: "truk",
  boat: "perahu",
  "traffic light": "lampu lalu lintas",
  "fire hydrant": "hidran",
  "stop sign": "rambu berhenti",
  "parking meter": "meteran parkir",
  bench: "bangku",
  bird: "burung",
  cat: "kucing",
  dog: "anjing",
  horse: "kuda",
  sheep: "domba",
  cow: "sapi",
  elephant: "gajah",
  bear: "beruang",
  zebra: "zebra",
  giraffe: "jerapah",
  backpack: "ransel",
  payung: "payung",
  umbrella: "payung",
  handbag: "tas tangan",
  tie: "dasi",
  suitcase: "koper",
  frisbee: "frisbee",
  ski: "ski",
  snowboard: "papan salju",
  "sports ball": "bola",
  kite: "layang-layang",
  "baseball bat": "tongkat bisbol",
  "baseball glove": "sarung tangan bisbol",
  skateboard: "papan luncur",
  surfboard: "papan selancar",
  "tennis racket": "raket tenis",
  bottle: "botol",
  "wine glass": "gelas anggur",
  cup: "cangkir",
  fork: "garpu",
  knife: "pisau",
  spoon: "sendok",
  bowl: "mangkuk",
  banana: "pisang",
  apple: "apel",
  sandwich: "roti lapis",
  orange: "jeruk",
  broccoli: "brokoli",
  carrot: "wortel",
  "hot dog": "sosis",
  pizza: "pizza",
  donat: "donat",
  donut: "donat",
  cake: "kue",
  chair: "kursi",
  couch: "sofa",
  "potted plant": "tanaman pot",
  bed: "tempat tidur",
  "dining table": "meja makan",
  toilet: "kloset",
  tv: "televisi",
  laptop: "laptop",
  mouse: "tetikus",
  remote: "remote",
  keyboard: "papan ketik",
  "cell phone": "ponsel",
  microwave: "microwave",
  oven: "oven",
  toaster: "pemanggang roti",
  sink: "wastafel",
  refrigerator: "kulkas",
  book: "buku",
  clock: "jam",
  vase: "vas",
  scissors: "gunting",
  "teddy bear": "boneka beruang",
  "hair drier": "pengering rambut",
  "tooth brush": "sikat gigi",
};

export const GROUPS: Record<string, "manusia" | "kendaraan" | "hewan" | "rumah"> = {
  person: "manusia",
  bicycle: "kendaraan",
  car: "kendaraan",
  motorcycle: "kendaraan",
  airplane: "kendaraan",
  bus: "kendaraan",
  train: "kendaraan",
  truck: "kendaraan",
  boat: "kendaraan",
  bird: "hewan",
  cat: "hewan",
  dog: "hewan",
  horse: "hewan",
  sheep: "hewan",
  cow: "hewan",
  elephant: "hewan",
  bear: "hewan",
  zebra: "hewan",
  giraffe: "hewan",
};

export const groupOf = (cls: string) => GROUPS[cls] ?? "rumah";
export const idLabel = (cls: string) => ID_LABELS[cls] ?? cls;

const GROUP_COLOR: Record<string, string> = {
  manusia: "#d6371f",
  kendaraan: "#1b3a57",
  hewan: "#4f6b3f",
  rumah: "#b3792c",
};
export const colorOf = (cls: string) => GROUP_COLOR[groupOf(cls)] ?? "#d6371f";

let modelPromise: Promise<cocoSsd.ObjectDetection> | null = null;

export function loadModel(): Promise<cocoSsd.ObjectDetection> {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.ready();
        return await cocoSsd.load({ base: "lite_mobilenet_v2" });
      } catch (first) {
        // WebGL tidak tersedia (mis. peramban tanpa GPU) → jatuhkan ke CPU.
        try {
          await tf.setBackend("cpu");
          await tf.ready();
          return await cocoSsd.load({ base: "lite_mobilenet_v2" });
        } catch {
          throw first;
        }
      }
    })();
  }
  return modelPromise;
}

export function resetModel() {
  modelPromise = null;
}

type Source = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

export function useDetector() {
  const [status, setStatus] = useState<DetectorStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [backend, setBackend] = useState<string>("—");
  const mounted = useRef(true);

  const boot = useCallback(() => {
    setStatus("loading");
    setError(null);
    loadModel()
      .then(() => {
        if (!mounted.current) return;
        setBackend(tf.getBackend() ?? "—");
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (!mounted.current) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    boot();
    return () => {
      mounted.current = false;
    };
  }, [boot]);

  const run = useCallback(
    async (el: Source, minScore = 0.4, maxBoxes = 18): Promise<{ items: Detection[]; ms: number }> => {
      const model = await loadModel();
      const t0 = performance.now();
      let preds: cocoSsd.DetectedObject[];
      try {
        preds = await model.detect(el, maxBoxes, minScore);
      } catch {
        // backend aktif gagal menghitung → coba sekali lagi di CPU
        await tf.setBackend("cpu");
        await tf.ready();
        preds = await model.detect(el, maxBoxes, minScore);
      }
      const ms = performance.now() - t0;
      const items: Detection[] = preds.map((p, i) => ({
        id: `${p.class}-${i}-${Math.round(p.score * 1000)}`,
        cls: p.class,
        label: idLabel(p.class),
        score: p.score,
        bbox: [p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]] as Box,
      }));
      return { items, ms };
    },
    [],
  );

  return { status, error, backend, run, retry: () => { resetModel(); boot(); } };
}
