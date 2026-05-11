"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  addDoc, collection, query, where, onSnapshot, 
  orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc 
} from "firebase/firestore";
import {
  Settings, Flame, Search, Plus, Play, Square, ChevronDown,
  Coffee, Utensils, Moon, Apple, Sparkles, TrendingUp, Timer as TimerIcon, Edit2, Trash2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type MealType = "Café" | "Almoço" | "Jantar" | "Lanche" | "Ceia";

const PROTOCOLS = ["14:10", "16:8", "18:6", "20:4", "24h"] as const;
const MEAL_TYPES: { label: MealType; icon: typeof Coffee }[] = [
  { label: "Café", icon: Coffee },
  { label: "Almoço", icon: Utensils },
  { label: "Lanche", icon: Apple },
  { label: "Jantar", icon: Moon },
];

export default function BioTrack() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [onboarded, setOnboarded] = useState(true);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState(2000);
  const [userName, setUserName] = useState("Usuário");

  const [meals, setMeals] = useState<any[]>([]);
  const [mealName, setMealName] = useState("");
  const [mealKcal, setMealKcal] = useState("");
  const [mealType, setMealType] = useState<MealType>("Almoço");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [fasts, setFasts] = useState<any[]>([]);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [protocol, setProtocol] = useState<typeof PROTOCOLS[number]>("16:8");
  const [protoOpen, setProtoOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !auth.currentUser) return;
    const userId = auth.currentUser.uid;
    setUserName(auth.currentUser.email?.split('@')[0] || "Usuário");

    const fetchProfile = async () => {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setGoal(userSnap.data().dailyGoal || 2000);
        setOnboarded(true);
      } else {
        setOnboarded(false); 
      }
    };
    fetchProfile();

    const qMeals = query(collection(db, "meals"), where("userId", "==", userId), orderBy("date", "desc"));
    const unsubMeals = onSnapshot(qMeals, (snapshot) => {
      setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qFasts = query(collection(db, "fasts"), where("userId", "==", userId), orderBy("startTime", "desc"));
    const unsubFasts = onSnapshot(qFasts, (snapshot) => {
      const allFasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      setFasts(allFasts.filter((f: any) => f.status === "completed"));
      
      const currentActive = allFasts.find((f: any) => f.status === "active");
      setActiveFast(currentActive || null);
      
      if (currentActive && currentActive.protocol) {
        setProtocol(currentActive.protocol);
      }
    });

    return () => { unsubMeals(); unsubFasts(); };
  }, [mounted]);

  useEffect(() => {
    if (!activeFast) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeFast]);

  const targetHours = parseInt(protocol.split(":")[0], 10);
  const elapsedMs = activeFast ? now - new Date(activeFast.startTime).getTime() : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");
  const fastPct = activeFast ? Math.min(100, (elapsedMs / (targetHours * 3600 * 1000)) * 100) : 0;

  const calcGoal = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return;
    const bmr = 10 * w + 6.25 * h - 5 * 30 + 5;
    setGoal(Math.round((bmr * 1.4) / 10) * 10);
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { dailyGoal: goal }, { merge: true });
    setOnboarded(true);
  };

  const addMeal = async () => {
    const k = parseInt(mealKcal, 10);
    if (!auth.currentUser || !mealName.trim() || !k) return;
    const today = new Date().toISOString().split('T')[0];
    
    await addDoc(collection(db, "meals"), {
      userId: auth.currentUser.uid,
      description: mealName,
      calories: k,
      type: mealType,
      date: today,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    });
    setMealName(""); setMealKcal("");
  };

  const toggleFast = async () => {
    if (!auth.currentUser) return;

    if (!activeFast) {
      await addDoc(collection(db, "fasts"), {
        userId: auth.currentUser.uid,
        protocol: protocol,
        startTime: new Date().toISOString(),
        status: "active"
      });
    } else {
      const endTime = new Date();
      const startTime = new Date(activeFast.startTime);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      await updateDoc(doc(db, "fasts", activeFast.id), {
        endTime: endTime.toISOString(),
        duration: durationHours.toFixed(1),
        status: "completed",
        date: new Date().toLocaleDateString('pt-BR')
      });
    }
  };

  const filteredMeals = meals.filter(m => m.date === filterDate);
  const consumedToday = meals.filter(m => m.date === new Date().toISOString().split('T')[0]).reduce((s, m) => s + m.calories, 0);
  const pct = Math.min(100, Math.round((consumedToday / goal) * 100));

  const chartData = meals.reduce((acc: any[], meal) => {
    const day = meal.date.slice(5, 10).replace('-', '/');
    const existing = acc.find(item => item.day === day);
    if (existing) existing.kcal += meal.calories;
    else acc.push({ day, kcal: meal.calories, fullDate: meal.date });
    return acc;
  }, []).sort((a, b) => a.fullDate.localeCompare(b.fullDate)).slice(-7);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      
      {/* ONBOARDING MODAL */}
      {!onboarded && (
        <Onboarding
          weight={weight} height={height} goal={goal}
          setWeight={setWeight} setHeight={setHeight} setGoal={setGoal}
          calcGoal={calcGoal} onSave={handleSaveProfile}
        />
      )}

      <div className="mx-auto max-w-md px-5 pb-28 pt-6 sm:max-w-2xl sm:px-8 sm:pt-10 lg:max-w-6xl lg:px-10">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl capitalize">Olá, {userName}! 👋</h1>
          </div>
          <button onClick={() => { auth.signOut(); router.push("/"); }} className="grid h-11 px-4 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-red-600 transition font-bold text-xs uppercase shadow-sm">
            Sair
          </button>
        </header>

        {/* TOP ROW: Rings */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
          
          {/* Calorie Ring Card */}
          <section className="lg:col-span-2">
            <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-10 blur-3xl bg-emerald-500" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center gap-6">
                  <CalorieRing pct={pct} consumed={consumedToday} goal={goal} />
                  <div className="flex-1 space-y-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">
                      <Sparkles className="h-3 w-3" /> Hoje
                    </div>
                    <div>
                      <div className="text-3xl font-black tracking-tight text-slate-800">{goal - consumedToday > 0 ? goal - consumedToday : 0} kcal</div>
                      <div className="text-sm font-medium text-slate-400">restantes da meta</div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                  <Stat label="Consumidas" value={`${consumedToday}`} />
                  <Stat label="Meta" value={`${goal}`} />
                  <Stat label="Progresso" value={`${pct}%`} />
                </div>
              </div>
            </div>
          </section>

          {/* Fasting Widget */}
          <section className="lg:col-span-3">
            <div className="relative h-full overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br from-orange-400 to-rose-500 shadow-md">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_0%,_white,_transparent_50%)]" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">Jejum Intermitente</p>
                  <h2 className="mt-1 text-lg font-bold">{activeFast ? "Em Jejum" : "Pronto para iniciar"}</h2>
                </div>
                <ProtocolSelect value={protocol} onChange={setProtocol} open={protoOpen} setOpen={setProtoOpen} disabled={!!activeFast} />
              </div>

              <div className="relative mt-4 flex flex-col items-center gap-5 lg:flex-row lg:justify-around lg:gap-6">
                <FastRing pct={fastPct}>
                  <div className="text-center">
                    <div className="font-mono text-4xl font-black tabular-nums tracking-tight sm:text-5xl">
                      {hh}:{mm}:<span className="text-white/70">{ss}</span>
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] font-bold text-white/80">
                      Meta {targetHours}h · {Math.round(fastPct)}%
                    </div>
                  </div>
                </FastRing>

                <div className="w-full max-w-xs space-y-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-wider text-white/70">Início</div>
                    <div className="mt-0.5 text-sm font-bold">
                      {activeFast ? new Date(activeFast.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-wider text-white/70">Término previsto</div>
                    <div className="mt-0.5 text-sm font-bold">
                      {activeFast ? new Date(new Date(activeFast.startTime).getTime() + targetHours * 3600 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : `+${targetHours}h após início`}
                    </div>
                  </div>
                  <button
                    onClick={toggleFast}
                    className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black shadow-lg transition hover:scale-[1.02] active:scale-[0.98] ${activeFast ? 'bg-white text-rose-500' : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'}`}
                  >
                    {activeFast ? <><Square className="h-4 w-4" /> Encerrar Jejum</> : <><Play className="h-4 w-4 fill-current" /> Iniciar Jejum</>}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* MID ROW: Quick Add + Weekly Chart */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
          
          {/* Quick Add */}
          <section className="lg:col-span-2">
            <div className="h-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800">Adicionar Refeição</h3>
                <span className="text-[10px] uppercase font-bold text-slate-400">Rápido</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="O que você comeu?" className="flex-1 bg-transparent text-sm outline-none font-medium text-slate-700" />
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Flame className="h-4 w-4 text-emerald-500" />
                  <input value={mealKcal} onChange={(e) => setMealKcal(e.target.value)} type="number" placeholder="Calorias totais" className="flex-1 bg-transparent text-sm outline-none font-medium text-slate-700" />
                  <span className="text-xs font-bold text-slate-400">kcal</span>
                </div>

                <div className="flex flex-wrap gap-2 py-2">
                  {MEAL_TYPES.map(({ label, icon: Icon }) => (
                    <button
                      key={label} onClick={() => setMealType(label)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${mealType === label ? "border-emerald-500 bg-emerald-500 text-white shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600"}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>

                <button onClick={addMeal} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98] shadow-md">
                  <Plus className="h-4 w-4" /> Registrar Consumo
                </button>
              </div>
            </div>
          </section>

          {/* Weekly Chart */}
          <section className="lg:col-span-3">
            <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Visão Semanal</h3>
                  <p className="text-xs font-medium text-slate-400">Consumo dos últimos 7 dias</p>
                </div>
              </div>
              <div className="w-full h-48 min-h-[192px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={192} minWidth={0}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                    <YAxis hide domain={[0, goal + 500]} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none'}} />
                    <ReferenceLine y={goal} stroke="#10b981" strokeDasharray="3 3" />
                    <Bar dataKey="kcal" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>

        {/* TIMELINE (Listas) */}
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-800">Histórico</h3>
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="text-xs font-bold text-slate-500 outline-none bg-slate-100 px-2 py-1 rounded border border-slate-200" />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100 lg:grid lg:grid-cols-2 lg:divide-y-0">
              
              {/* Refeições do Dia */}
              {filteredMeals.length === 0 && <li className="px-4 py-8 text-center text-xs text-slate-400 font-medium">Nenhuma refeição registrada na data selecionada.</li>}
              {filteredMeals.map((m, i) => {
                const Icon = MEAL_TYPES.find((t) => t.label === m.type)?.icon ?? Utensils;
                return (
                  <li key={m.id} className={`group flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${i % 2 === 0 ? "lg:border-r lg:border-slate-100" : ""} lg:border-b lg:border-slate-100`}>
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-700">{m.description}</div>
                      <div className="text-xs font-medium text-slate-400">{m.type} · {m.time}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-black tabular-nums text-slate-800">{m.calories} <span className="text-[10px] font-bold text-slate-400 uppercase">kcal</span></div>
                      <button onClick={() => deleteDoc(doc(db, "meals", m.id))} className="text-slate-300 hover:text-red-500 opacity-100 lg:opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                    </div>
                  </li>
                );
              })}

              {/* Jejuns Concluídos Recentes */}
              {fasts.slice(0, 4).map((f, i) => (
                <li key={f.id} className={`flex items-center gap-3 px-4 py-3.5 bg-orange-50/30 ${i % 2 === 0 ? "lg:border-r lg:border-slate-100" : ""} lg:border-b lg:border-slate-100`}>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500 text-white">
                    <TimerIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-700">Jejum {f.protocol}</div>
                    <div className="text-xs font-medium text-slate-400">Concluído · {f.date}</div>
                  </div>
                  <div className="text-sm font-black tabular-nums text-orange-600">{f.duration}h</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Footer Ético */}
        <footer className="mt-10 px-2 text-center text-[10px] uppercase font-bold tracking-widest text-slate-300 pb-8">
          Aviso: Esta aplicação é um exercício acadêmico e não substitui orientação médica ou nutricional.
        </footer>
      </div>
    </div>
  );
}

/* ---------- Sub components ---------- */

function CalorieRing({ pct, consumed, goal }: { pct: number; consumed: number; goal: number }) {
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

function FastRing({ pct, children }: { pct: number; children: React.ReactNode }) {
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

function ProtocolSelect({ value, onChange, open, setOpen, disabled }: any) {
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

function Onboarding({ weight, height, goal, setWeight, setHeight, setGoal, calcGoal, onSave }: any) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
            <Apple className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-800">Configuração Inicial</h2>
            <p className="text-xs font-medium text-slate-400">Vamos calcular sua meta diária.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Peso (kg)">
            <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" placeholder="Ex: 70" className="w-full bg-transparent text-base font-bold outline-none text-slate-700" />
          </Field>
          <Field label="Altura (cm)">
            <input value={height} onChange={(e) => setHeight(e.target.value)} type="number" placeholder="Ex: 175" className="w-full bg-transparent text-base font-bold outline-none text-slate-700" />
          </Field>
        </div>

        <button onClick={calcGoal} className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 py-3 text-xs font-black uppercase text-emerald-600 transition hover:bg-emerald-100 mb-6">
          1. Calcular Recomendação
        </button>

        <Field label="Sua Meta Diária (kcal)">
          <input value={goal} onChange={(e) => setGoal(parseInt(e.target.value || "0", 10))} type="number" className="w-full bg-transparent text-3xl font-black tabular-nums outline-none text-slate-800" />
        </Field>

        <button onClick={onSave} className="mt-5 w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-bold text-white transition hover:bg-slate-800 shadow-xl active:scale-[0.98]">
          2. Salvar e Começar
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-black tabular-nums text-slate-800">{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}