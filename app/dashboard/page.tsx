"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  addDoc, collection, query, where, onSnapshot,
  orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Flame, Search, Plus, Play, Square, ChevronDown,
  Coffee, Utensils, Moon, Apple, TrendingUp, Timer as TimerIcon, Edit2, Trash2, LogOut, Target
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type MealType = "Café" | "Almoço" | "Jantar" | "Lanche" | "Ceia";
const PROTOCOLS = ["14:10", "16:8", "18:6", "20:4", "24h", "Custom"] as const;
const MEAL_TYPES: { label: MealType; icon: typeof Coffee }[] = [
  { label: "Café", icon: Coffee },
  { label: "Almoço", icon: Utensils },
  { label: "Lanche", icon: Apple },
  { label: "Jantar", icon: Moon },
];

export default function BioTrack() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  const [onboarded, setOnboarded] = useState(true);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState(2000);
  const [userName, setUserName] = useState("Usuário");

  const [editingGoal, setEditingGoal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState("");

  const [meals, setMeals] = useState<any[]>([]);
  const [mealName, setMealName] = useState("");
  const [mealKcal, setMealKcal] = useState("");
  const [mealType, setMealType] = useState<MealType>("Almoço");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editKcal, setEditKcal] = useState("");
  const [editType, setEditType] = useState<MealType>("Almoço");
  const [deletingMeal, setDeletingMeal] = useState<any>(null);

  // Estados para busca de alimentos da API
  const [foodSuggestions, setFoodSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [fasts, setFasts] = useState<any[]>([]);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [protocol, setProtocol] = useState<typeof PROTOCOLS[number]>("16:8");
  const [customHours, setCustomHours] = useState("20");
  const [protoOpen, setProtoOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // ── Proteção de rota real via onAuthStateChanged ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
      } else {
        setAuthReady(true);
        setUserName(user.email?.split("@")[0] || "Usuário");

        const fetchProfile = async () => {
          const snap = await getDoc(doc(db, "users", user.uid));
          if (snap.exists()) {
            setGoal(snap.data().dailyGoal || 2000);
            setOnboarded(true);
          } else {
            setOnboarded(false);
          }
        };
        fetchProfile();

        const qMeals = query(collection(db, "meals"), where("userId", "==", user.uid), orderBy("date", "desc"));
        const unsubMeals = onSnapshot(qMeals, (s) => setMeals(s.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qFasts = query(collection(db, "fasts"), where("userId", "==", user.uid), orderBy("startTime", "desc"));
        const unsubFasts = onSnapshot(qFasts, (s) => {
          const all = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setFasts(all.filter((f: any) => f.status === "completed"));
          const active = all.find((f: any) => f.status === "active");
          setActiveFast(active || null);
          if (active?.protocol) setProtocol(active.protocol);
        });

        return () => { unsubMeals(); unsubFasts(); };
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!activeFast) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeFast]);

  const targetHours = protocol === "Custom" ? (parseInt(customHours, 10) || 20) : parseInt(protocol.split(":")[0], 10);
  const elapsedMs = activeFast ? now - new Date(activeFast.startTime).getTime() : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");
  const fastPct = activeFast ? Math.min(100, (elapsedMs / (targetHours * 3600 * 1000)) * 100) : 0;

  const calcGoal = () => {
    const w = parseFloat(weight), h = parseFloat(height);
    if (!w || !h) return;
    setGoal(Math.round(((10 * w + 6.25 * h - 5 * 30 + 5) * 1.4) / 10) * 10);
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { dailyGoal: goal }, { merge: true });
    setOnboarded(true);
  };

  const saveGoal = async () => {
    const v = parseInt(editGoalValue, 10);
    if (!auth.currentUser || !v || v < 500) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { dailyGoal: v }, { merge: true });
    setGoal(v); setEditingGoal(false);
  };

  const fetchFoodSuggestions = async (query: string, type: MealType) => {
    if (query.length < 2) { setFoodSuggestions([]); setShowSuggestions(false); return; }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/foods?type=${type}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setFoodSuggestions(data.slice(0, 6));
      setShowSuggestions(data.length > 0);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchFoodsByType = async (type: MealType) => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`/api/foods?type=${type}`);
      const data = await res.json();
      setFoodSuggestions(data.slice(0, 6));
      setShowSuggestions(true);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectFood = (food: any) => {
    setMealName(food.name);
    setMealKcal(String(food.calories));
    setMealType(food.type as MealType);
    setShowSuggestions(false);
    setFoodSuggestions([]);
  };

  const addMeal = async () => {
    const k = parseInt(mealKcal, 10);
    if (!auth.currentUser || !mealName.trim() || !k) return;
    await addDoc(collection(db, "meals"), {
      userId: auth.currentUser.uid,
      description: mealName, calories: k, type: mealType,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      createdAt: new Date().toISOString(),
    });
    setMealName(""); setMealKcal("");
  };

  const openEdit = (meal: any) => {
    setEditingMeal(meal); setEditName(meal.description);
    setEditKcal(String(meal.calories)); setEditType(meal.type);
  };

  const saveEdit = async () => {
    if (!editingMeal) return;
    const k = parseInt(editKcal, 10);
    if (!editName.trim() || !k) return;
    await updateDoc(doc(db, "meals", editingMeal.id), { description: editName, calories: k, type: editType });
    setEditingMeal(null);
  };

  const confirmDelete = async () => {
    if (!deletingMeal) return;
    await deleteDoc(doc(db, "meals", deletingMeal.id));
    setDeletingMeal(null);
  };

  const toggleFast = async () => {
    if (!auth.currentUser) return;
    if (!activeFast) {
      await addDoc(collection(db, "fasts"), {
        userId: auth.currentUser.uid,
        protocol: protocol === "Custom" ? `${customHours}h` : protocol,
        startTime: new Date().toISOString(), status: "active",
      });
    } else {
      const end = new Date();
      const dur = (end.getTime() - new Date(activeFast.startTime).getTime()) / 3600000;
      await updateDoc(doc(db, "fasts", activeFast.id), {
        endTime: end.toISOString(), duration: dur.toFixed(1),
        status: "completed", date: end.toLocaleDateString("pt-BR"),
      });
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const filteredMeals = meals.filter(m => m.date === filterDate);
  const consumedToday = meals.filter(m => m.date === today).reduce((s, m) => s + m.calories, 0);
  const pct = Math.min(100, Math.round((consumedToday / goal) * 100));

  const chartData = meals.reduce((acc: any[], meal) => {
    const day = meal.date.slice(5, 10).replace("-", "/");
    const ex = acc.find(i => i.day === day);
    if (ex) ex.kcal += meal.calories;
    else acc.push({ day, kcal: meal.calories, fullDate: meal.date });
    return acc;
  }, []).sort((a, b) => a.fullDate.localeCompare(b.fullDate)).slice(-7);

  const fastChartData = fasts.filter(f => f.endTime).map(f => ({
    day: new Date(f.endTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }).slice(0, 5),
    horas: parseFloat(parseFloat(f.duration).toFixed(1)),
    fullDate: f.endTime,
  })).sort((a, b) => a.fullDate.localeCompare(b.fullDate)).slice(-7);

  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const mealsWeek = meals.filter(m => new Date(m.date) >= sevenDaysAgo);
  const fastsWeek = fasts.filter(f => f.endTime && new Date(f.endTime) >= sevenDaysAgo);
  const uniqueDays = [...new Set(mealsWeek.map(m => m.date))];
  const avgKcal = uniqueDays.length > 0 ? Math.round(mealsWeek.reduce((s, m) => s + m.calories, 0) / uniqueDays.length) : 0;
  const avgFastH = fastsWeek.length > 0 ? (fastsWeek.reduce((s, f) => s + parseFloat(f.duration), 0) / fastsWeek.length).toFixed(1) : "0";

  if (!authReady) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 text-sm font-medium animate-pulse">Carregando...</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100">

      {/* ONBOARDING */}
      {!onboarded && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <Apple className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">Configuração inicial</h2>
                <p className="text-xs text-zinc-500">Defina sua meta calórica diária</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <DarkField label="Peso (kg)">
                <input value={weight} onChange={e => setWeight(e.target.value)} type="number" placeholder="70" className="w-full bg-transparent text-sm font-bold outline-none text-zinc-100" />
              </DarkField>
              <DarkField label="Altura (cm)">
                <input value={height} onChange={e => setHeight(e.target.value)} type="number" placeholder="175" className="w-full bg-transparent text-sm font-bold outline-none text-zinc-100" />
              </DarkField>
            </div>
            <button onClick={calcGoal} className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition mb-4">
              Calcular recomendação
            </button>
            <DarkField label="Meta diária (kcal)">
              <input value={goal} onChange={e => setGoal(parseInt(e.target.value || "0", 10))} type="number" className="w-full bg-transparent text-2xl font-black tabular-nums outline-none text-zinc-100" />
            </DarkField>
            <button onClick={handleSaveProfile} className="mt-4 w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white hover:bg-emerald-600 transition">
              Salvar e começar
            </button>
          </div>
        </div>
      )}

      {/* MODAL EDITAR META */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-zinc-100 mb-1">Editar meta diária</h2>
            <p className="text-xs text-zinc-500 mb-4">Atual: {goal} kcal</p>
            <DarkField label="Nova meta (kcal)">
              <input autoFocus value={editGoalValue} onChange={e => setEditGoalValue(e.target.value)} type="number" placeholder={String(goal)} className="w-full bg-transparent text-2xl font-black tabular-nums outline-none text-zinc-100" />
            </DarkField>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setEditingGoal(false)} className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-bold text-zinc-400 hover:bg-zinc-800 transition">Cancelar</button>
              <button onClick={saveGoal} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      {deletingMeal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/10 text-red-400 mb-4">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-zinc-100">Excluir refeição?</h2>
            <p className="text-sm text-zinc-500 mt-1 mb-5">
              <span className="text-zinc-300 font-semibold">"{deletingMeal.description}"</span> será removida permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingMeal(null)} className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-bold text-zinc-400 hover:bg-zinc-800 transition">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR REFEIÇÃO */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-zinc-100 mb-4">Editar refeição</h2>
            <div className="space-y-3">
              <DarkField label="Descrição">
                <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-transparent text-sm font-semibold outline-none text-zinc-100" />
              </DarkField>
              <DarkField label="Calorias (kcal)">
                <input value={editKcal} onChange={e => setEditKcal(e.target.value)} type="number" className="w-full bg-transparent text-sm font-semibold outline-none text-zinc-100" />
              </DarkField>
              <div className="flex flex-wrap gap-2">
                {MEAL_TYPES.map(({ label, icon: Icon }) => (
                  <button key={label} type="button" onClick={() => setEditType(label)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition ${editType === label ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}>
                    <Icon className="h-3 w-3" /> {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditingMeal(null)} className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm font-bold text-zinc-400 hover:bg-zinc-800 transition">Cancelar</button>
                <button onClick={saveEdit} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT PRINCIPAL ── */}
      <div className="mx-auto max-w-md px-4 pb-20 pt-5 sm:max-w-2xl sm:px-6 lg:max-w-6xl lg:px-8">

        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })}
            </p>
            <h1 className="text-xl font-bold text-zinc-100 capitalize">Olá, {userName}</h1>
          </div>
          <button onClick={() => { auth.signOut(); router.push("/"); }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition">
            <LogOut size={14} /> Sair
          </button>
        </header>

        {/* ROW 1: Calorias + Jejum */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

          {/* Card Calorias */}
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Hoje</span>
                <button onClick={() => { setEditGoalValue(String(goal)); setEditingGoal(true); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-600 hover:text-emerald-400 hover:border-emerald-500/30 transition">
                  <Target size={10} /> Meta: {goal} kcal
                </button>
              </div>

              {/* Barra de progresso */}
              <div className="mb-3">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-3xl font-black tabular-nums text-zinc-100">{consumedToday}</span>
                  <span className="text-xs text-zinc-600 font-bold mb-1">kcal</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: pct > 100 ? "#ef4444" : pct > 85 ? "#f97316" : "#10b981" }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-zinc-600">{pct}% da meta</span>
                  <span className="text-[10px] text-zinc-600">{Math.max(0, goal - consumedToday)} restantes</span>
                </div>
              </div>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800">
                <MiniStat label="Consumido" value={String(consumedToday)} unit="kcal" color="text-emerald-400" />
                <MiniStat label="Meta" value={String(goal)} unit="kcal" color="text-zinc-400" />
                <MiniStat label="Saldo" value={String(Math.abs(goal - consumedToday))} unit={goal > consumedToday ? "sobra" : "excesso"} color={consumedToday > goal ? "text-red-400" : "text-zinc-400"} />
              </div>
            </div>
          </section>

          {/* Card Jejum */}
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Jejum intermitente</span>
                  <p className="text-sm font-bold text-zinc-100 mt-0.5">{activeFast ? "Em jejum agora" : "Pronto para iniciar"}</p>
                </div>
                <ProtocolSelect value={protocol} onChange={setProtocol} open={protoOpen} setOpen={setProtoOpen} disabled={!!activeFast} customHours={customHours} setCustomHours={setCustomHours} />
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
                {/* Timer + anel compacto */}
                <div className="flex items-center gap-4">
                  <CompactFastRing pct={fastPct} />
                  <div>
                    <div className="font-mono text-3xl font-black tabular-nums text-zinc-100">{hh}:{mm}<span className="text-zinc-600">:{ss}</span></div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-0.5">Meta {targetHours}h · {Math.round(fastPct)}%</div>
                  </div>
                </div>

                {/* Info + botão */}
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-zinc-800 px-3 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Início</div>
                      <div className="text-sm font-bold text-zinc-300 mt-0.5">
                        {activeFast ? new Date(activeFast.startTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </div>
                    </div>
                    <div className="rounded-xl bg-zinc-800 px-3 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Término</div>
                      <div className="text-sm font-bold text-zinc-300 mt-0.5">
                        {activeFast ? new Date(new Date(activeFast.startTime).getTime() + targetHours * 3600000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : `+${targetHours}h`}
                      </div>
                    </div>
                  </div>
                  <button onClick={toggleFast}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeFast ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20" : "bg-orange-500 text-white hover:bg-orange-600"}`}>
                    {activeFast ? <><Square className="h-3.5 w-3.5" /> Encerrar jejum</> : <><Play className="h-3.5 w-3.5 fill-current" /> Iniciar jejum</>}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ROW 2: Adicionar refeição + Gráfico calorias */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-3">Adicionar refeição</h3>
              <div className="space-y-2">
                {/* Campo de busca com sugestões */}
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/50 px-3 py-2 focus-within:border-emerald-500/50 transition">
                    <Search className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <input
                      value={mealName}
                      onChange={e => {
                        setMealName(e.target.value);
                        fetchFoodSuggestions(e.target.value, mealType);
                      }}
                      onFocus={() => {
                        if (mealName.length < 2) fetchFoodsByType(mealType);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                      placeholder="Buscar ou digitar alimento..."
                      className="flex-1 bg-transparent text-sm outline-none text-zinc-200 placeholder:text-zinc-600"
                    />
                    {loadingSuggestions && <div className="h-3 w-3 rounded-full border-2 border-zinc-600 border-t-emerald-500 animate-spin shrink-0" />}
                  </div>

                  {/* Dropdown de sugestões */}
                  {showSuggestions && foodSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
                      {foodSuggestions.map(food => (
                        <button
                          key={food.id}
                          type="button"
                          onMouseDown={() => selectFood(food)}
                          className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-zinc-800 transition group"
                        >
                          <span className="text-sm text-zinc-300 group-hover:text-zinc-100 truncate">{food.name}</span>
                          <span className="text-xs font-bold text-emerald-500 shrink-0 ml-2">{food.calories} kcal</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/50 px-3 py-2 focus-within:border-emerald-500/50 transition">
                  <Flame className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <input
                    value={mealKcal}
                    onChange={e => setMealKcal(e.target.value)}
                    type="number"
                    placeholder="Calorias"
                    className="flex-1 bg-transparent text-sm outline-none text-zinc-200 placeholder:text-zinc-600"
                  />
                  <span className="text-xs text-zinc-600 font-bold">kcal</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {MEAL_TYPES.map(({ label, icon: Icon }) => (
                    <button key={label} onClick={() => { setMealType(label); fetchFoodsByType(label); }}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${mealType === label ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"}`}>
                      <Icon className="h-3 w-3" /> {label}
                    </button>
                  ))}
                </div>
                <button onClick={addMeal} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition active:scale-[0.98]">
                  <Plus className="h-4 w-4" /> Registrar
                </button>
              </div>
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1">Calorias — últimos 7 dias</h3>
              <div className="w-full h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10, fontWeight: "bold" }} />
                    <YAxis hide domain={[0, goal + 300]} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ borderRadius: "10px", border: "1px solid #27272a", background: "#18181b", color: "#e4e4e7", fontSize: 12 }} />
                    <ReferenceLine y={goal} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Bar dataKey="kcal" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} fillOpacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>

        {/* ROW 3: Resumo semana + Gráfico jejum */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <section className="lg:col-span-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-3">Resumo da semana</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-3 py-2.5">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Média diária</div>
                    <div className="text-xl font-black tabular-nums text-zinc-100">{avgKcal} <span className="text-xs text-zinc-600 font-bold">kcal</span></div>
                  </div>
                  <Flame className="h-6 w-6 text-emerald-500/40" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-3 py-2.5">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Jejuns concluídos</div>
                    <div className="text-xl font-black tabular-nums text-zinc-100">{fastsWeek.length} <span className="text-xs text-zinc-600 font-bold">na semana</span></div>
                  </div>
                  <TimerIcon className="h-6 w-6 text-orange-500/40" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-zinc-800/60 px-3 py-2.5">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">Média por jejum</div>
                    <div className="text-xl font-black tabular-nums text-zinc-100">{avgFastH} <span className="text-xs text-zinc-600 font-bold">horas</span></div>
                  </div>
                  <TrendingUp className="h-6 w-6 text-rose-500/40" />
                </div>
              </div>
            </div>
          </section>

          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-1">Jejum — últimos 7 dias</h3>
              {fastChartData.length === 0 ? (
                <div className="flex h-44 items-center justify-center text-xs text-zinc-700 font-medium">Nenhum jejum concluído ainda.</div>
              ) : (
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fastChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#52525b", fontSize: 10, fontWeight: "bold" }} />
                      <YAxis hide domain={[0, 24]} />
                      <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ borderRadius: "10px", border: "1px solid #27272a", background: "#18181b", color: "#e4e4e7", fontSize: 12 }} formatter={(v: any) => [`${v}h`, "Jejum"]} />
                      <ReferenceLine y={16} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.5} />
                      <Bar dataKey="horas" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={36} fillOpacity={0.85} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ROW 4: Histórico */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-600">Histórico de refeições</h3>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="text-xs font-bold text-zinc-500 outline-none bg-zinc-800 px-2 py-1 rounded-lg border border-zinc-700 [color-scheme:dark]" />
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {filteredMeals.length === 0 ? (
              <div className="py-10 text-center text-xs text-zinc-700 font-medium">Nenhuma refeição nesta data.</div>
            ) : (
              <ul className="divide-y divide-zinc-800 lg:grid lg:grid-cols-2 lg:divide-y-0">
                {filteredMeals.map((m, i) => {
                  const Icon = MEAL_TYPES.find(t => t.label === m.type)?.icon ?? Utensils;
                  return (
                    <li key={m.id} className={`group flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition ${i % 2 === 0 ? "lg:border-r lg:border-zinc-800" : ""} lg:border-b lg:border-zinc-800`}>
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-800 text-emerald-500">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-200">{m.description}</div>
                        <div className="text-[10px] text-zinc-600">{m.type} · {m.time}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black tabular-nums text-zinc-300">{m.calories}<span className="text-[10px] text-zinc-600 ml-0.5">kcal</span></span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button onClick={() => openEdit(m)} className="grid h-6 w-6 place-items-center rounded-md text-zinc-600 hover:text-blue-400 hover:bg-zinc-800 transition"><Edit2 size={12} /></button>
                          <button onClick={() => setDeletingMeal(m)} className="grid h-6 w-6 place-items-center rounded-md text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Histórico de jejuns */}
          {fasts.length > 0 && (
            <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Jejuns recentes</h3>
              </div>
              <ul className="divide-y divide-zinc-800">
                {fasts.slice(0, 5).map(f => (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-500/10 text-orange-400">
                      <TimerIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-200">Jejum {f.protocol}</div>
                      <div className="text-[10px] text-zinc-600">Concluído · {f.date}</div>
                    </div>
                    <span className="text-sm font-black tabular-nums text-orange-400">{f.duration}h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <footer className="mt-8 text-center text-[9px] uppercase font-bold tracking-widest text-zinc-800">
          Aplicação acadêmica · não substitui orientação médica ou nutricional
        </footer>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function CompactFastRing({ pct }: { pct: number }) {
  const r = 28, c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} stroke="#27272a" strokeWidth="5" fill="none" />
        <circle cx="32" cy="32" r={r} stroke="#f97316" strokeWidth="5" strokeLinecap="round" fill="none"
          strokeDasharray={`${(pct / 100) * c} ${c}`} style={{ transition: "stroke-dasharray 800ms ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[10px] font-black text-zinc-400">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function ProtocolSelect({ value, onChange, open, setOpen, disabled, customHours, setCustomHours }: any) {
  return (
    <div className="relative flex items-center gap-2">
      {value === "Custom" && !disabled && (
        <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1">
          <input type="number" min="1" max="72" value={customHours} onChange={e => setCustomHours(e.target.value)}
            className="w-7 bg-transparent text-xs font-black text-zinc-300 outline-none tabular-nums text-center" />
          <span className="text-[10px] text-zinc-600 font-bold">h</span>
        </div>
      )}
      <button disabled={disabled} onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[10px] font-black uppercase text-zinc-400 hover:border-zinc-600 transition disabled:opacity-40">
        {value} <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1.5 w-32 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
          {PROTOCOLS.map(p => (
            <button key={p} onClick={() => { onChange(p); setOpen(false); }}
              className={`block w-full px-3 py-2 text-left text-xs font-bold hover:bg-zinc-800 transition ${p === value ? "text-orange-400" : "text-zinc-400"}`}>
              {p === "Custom" ? "Personalizado" : p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-base font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[9px] text-zinc-700 font-bold uppercase">{label}</div>
      <div className="text-[9px] text-zinc-700">{unit}</div>
    </div>
  );
}

function DarkField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block rounded-xl border border-zinc-800 bg-zinc-800/50 px-3 py-2.5 focus-within:border-emerald-500/50 transition">
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">{label}</span>
      {children}
    </label>
  );
}