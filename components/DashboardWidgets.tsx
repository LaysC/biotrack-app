import React from "react";
import { ChevronDown } from "lucide-react";

export const PROTOCOLS = ["14:10", "16:8", "18:6", "20:4", "24h"] as const;

export function CalorieRing({ pct, consumed, goal }: { pct: number; consumed: number; goal: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} className="stroke-slate-100" strokeWidth="10" fill="none" />
        <circle cx="60" cy="60" r={r} className="stroke-emerald-500" strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray={`${dash} ${c}`} style={{ transition: "stroke-dasharray 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-black tabular-nums leading-none text-slate-800">{consumed}</div>
          <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">de {goal}</div>
        </div>
      </div>
    </div>
  );
}

export function FastRing({ pct, children }: { pct: number; children: React.ReactNode }) {
  const r = 92;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-56 w-56">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
        <circle cx="100" cy="100" r={r} stroke="white" strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray={`${dash} ${c}`} style={{ transition: "stroke-dasharray 800ms ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function ProtocolSelect({ value, onChange, open, setOpen, disabled }: any) {
  return (
    <div className="relative">
      <button disabled={disabled} onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-50">
        {value} <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-28 overflow-hidden rounded-xl border border-slate-100 bg-white text-slate-800 shadow-xl">
          {PROTOCOLS.map((p) => (
            <button key={p} onClick={() => { onChange(p); setOpen(false); }} className={`block w-full px-3 py-2 text-left text-sm font-bold hover:bg-slate-50 ${p === value ? "text-orange-500" : ""}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-black tabular-nums text-slate-800">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}