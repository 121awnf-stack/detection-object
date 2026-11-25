import type { Detection } from "../lib/detector";
import { colorOf } from "../lib/detector";

export type Size = { w: number; h: number };

/** Tanda potong (crop mark) di empat sudut, seperti pada lembar interpretasi citra. */
export function CropMarks({ color = "#16120e" }: { color?: string }) {
  const base = "absolute h-3 w-3 opacity-60";
  return (
    <>
      <span className={`${base} -left-[1px] -top-[1px] border-l border-t`} style={{ borderColor: color }} />
      <span className={`${base} -right-[1px] -top-[1px] border-r border-t`} style={{ borderColor: color }} />
      <span className={`${base} -bottom-[1px] -left-[1px] border-b border-l`} style={{ borderColor: color }} />
      <span className={`${base} -bottom-[1px] -right-[1px] border-b border-r`} style={{ borderColor: color }} />
    </>
  );
}

export function Boxes({
  items,
  size,
  threshold = 0.35,
}: {
  items: Detection[];
  size: Size | null;
  threshold?: number;
}) {
  if (!size || size.w === 0 || size.h === 0) return null;
  const visible = items.filter((d) => d.score >= threshold);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {visible.map((d, i) => {
        const [x, y, w, h] = d.bbox;
        const left = (x / size.w) * 100;
        const top = (y / size.h) * 100;
        const width = (w / size.w) * 100;
        const height = (h / size.h) * 100;
        const c = colorOf(d.cls);
        const nearTop = top < 10;
        return (
          <div
            key={d.id}
            className="draw-in absolute"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`,
              animationDelay: `${Math.min(i, 12) * 110}ms`,
            }}
          >
            <div className="absolute inset-0 border" style={{ borderColor: c, opacity: 0.5 }} />
            <span className="absolute left-0 top-0 h-[10px] w-[10px] border-l-2 border-t-2" style={{ borderColor: c }} />
            <span className="absolute right-0 top-0 h-[10px] w-[10px] border-r-2 border-t-2" style={{ borderColor: c }} />
            <span className="absolute bottom-0 left-0 h-[10px] w-[10px] border-b-2 border-l-2" style={{ borderColor: c }} />
            <span className="absolute bottom-0 right-0 h-[10px] w-[10px] border-b-2 border-r-2" style={{ borderColor: c }} />
            <div
              className="absolute left-0 flex items-center gap-1.5 whitespace-nowrap px-1.5 py-[3px] font-mono text-[9px] font-medium uppercase leading-none tracking-[0.12em] text-paper"
              style={{ backgroundColor: c, top: nearTop ? "0px" : "-17px" }}
            >
              <span>{d.label}</span>
              <span className="tabular opacity-80">{(d.score * 100).toFixed(0)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Garis sapuan pemindai — hanya tampil saat status MEMINDAI. */
export function ScanSweep({ label = "MEMINDAI" }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="sweep-line absolute inset-x-0 top-0 h-[2px] bg-vermilion/80 shadow-[0_0_18px_2px_rgba(214,55,31,0.35)]" />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-vermilion/[0.07] to-transparent" />
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-ink/85 px-2 py-1.5">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-vermilion" />
        <span className="kicker text-paper">{label}</span>
      </div>
    </div>
  );
}
