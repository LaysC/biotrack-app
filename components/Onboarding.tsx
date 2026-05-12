import React from "react";
import { Apple } from "lucide-react";
import { Field } from "./DashboardWidgets";

export function Onboarding({ weight, height, goal, setWeight, setHeight, setGoal, calcGoal, onSave }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-in zoom-in-95 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <Apple className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800">Configuração Inicial</h2>
            <p className="text-xs font-medium text-slate-400">Vamos calcular sua meta diária.</p>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="Peso (kg)">
            <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="Ex: 70" className="w-full bg-transparent text-base font-bold text-slate-700 outline-none" />
          </Field>
          <Field label="Altura (cm)">
            <input value={height} onChange={(e) => setHeight(e.target.value)} type="number" placeholder="Ex: 175" className="w-full bg-transparent text-base font-bold text-slate-700 outline-none" />
          </Field>
        </div>

        <button onClick={calcGoal} className="mb-6 w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-black uppercase text-emerald-600 transition hover:bg-emerald-100">
          1. Calcular Recomendação
        </button>

        <Field label="Sua Meta Diária (kcal)">
          <input value={goal} onChange={(e) => setGoal(parseInt(e.target.value || "0", 10))} type="number" className="w-full bg-transparent tabular-nums text-3xl font-black text-slate-800 outline-none" />
        </Field>

        <button onClick={onSave} className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800 active:scale-[0.98]">
          2. Salvar e Começar
        </button>
      </div>
    </div>
  );
}