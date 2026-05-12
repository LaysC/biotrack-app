"use client";
import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Plus, Play, Square, Coffee, Utensils, Moon, Apple, Sparkles, Timer as TimerIcon, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

import { Onboarding } from "@/components/Onboarding";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CalorieRing, FastRing, ProtocolSelect, Stat, PROTOCOLS } from "@/components/DashboardWidgets";
import { AddMealModal } from "@/components/AddMealModal"; // NOSSO NOVO MODAL!

export default function BioTrack() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Modais
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deleteMealId, setDeleteMealId] = useState<string | null>(null);
  const [addMealModalOpen, setAddMealModalOpen] = useState(false);

  const [onboarded, setOnboarded] = useState(true);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [goal, setGoal] = useState(2000);
  const [userName, setUserName] = useState("Usuário");

  const [meals, setMeals] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const [fasts, setFasts] = useState<any[]>([]);
  const [activeFast, setActiveFast] = useState<any>(null);
  const [protocol, setProtocol] = useState<typeof PROTOCOLS[number]>("16:8");
  const [protoOpen, setProtoOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setMounted(true);
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setUserName(user.email?.split('@')[0] || "Usuário");
      } else {
        router.push("/"); 
      }
      setLoadingAuth(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.uid;

    const fetchProfile = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setGoal(userSnap.data().dailyGoal || 2000);
          setOnboarded(true);
        } else {
          setOnboarded(false);
        }
      } catch (error) {
        setGoal(2000);
        setOnboarded(true); 
      }
    };
    fetchProfile();

    const qMeals = query(collection(db, "meals"), where("userId", "==", userId), orderBy("date", "desc"));
    const unsubMeals = onSnapshot(qMeals, (snapshot) => {
      setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, () => {});

    const qFasts = query(collection(db, "fasts"), where("userId", "==", userId), orderBy("startTime", "desc"));
    const unsubFasts = onSnapshot(qFasts, (snapshot) => {
      const allFasts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setFasts(allFasts.filter((f: any) => f.status === "completed"));
      
      const currentActive = allFasts.find((f: any) => f.status === "active");
      setActiveFast(currentActive || null);
      
      if (currentActive && currentActive.protocol) {
        setProtocol(currentActive.protocol);
      }
    }, () => {});

    return () => { unsubMeals(); unsubFasts(); };
  }, [currentUser]);

  useEffect(() => {
    if (!activeFast) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeFast]);

  const calcGoal = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (!w || !h) return;
    const bmr = 10 * w + 6.25 * h - 5 * 30 + 5;
    setGoal(Math.round((bmr * 1.4) / 10) * 10);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      await setDoc(doc(db, "users", currentUser.uid), { dailyGoal: goal }, { merge: true });
      setOnboarded(true);
    } catch (error) { alert("Erro ao salvar perfil."); }
  };

  // Nova função simplificada chamada pelo Modal
  const handleSaveMealFromModal = async (mealData: any) => {
    if (!currentUser) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await addDoc(collection(db, "meals"), {
        userId: currentUser.uid,
        ...mealData,
        date: today,
        time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        createdAt: new Date().toISOString(),
      });
    } catch (error) { alert("Erro ao salvar refeição."); }
  };

  const toggleFast = async () => {
    if (!currentUser) return;
    try {
      if (!activeFast) {
        await addDoc(collection(db, "fasts"), {
          userId: currentUser.uid, protocol: protocol, startTime: new Date().toISOString(), status: "active"
        });
      } else {
        const endTime = new Date();
        const startTime = new Date(activeFast.startTime);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        await updateDoc(doc(db, "fasts", activeFast.id), {
          endTime: endTime.toISOString(), duration: durationHours.toFixed(1), status: "completed", date: new Date().toLocaleDateString('pt-BR')
        });
      }
    } catch (error) {}
  };

  const targetHours = parseInt(protocol.split(":")[0], 10);
  const elapsedMs = activeFast ? now - new Date(activeFast.startTime).getTime() : 0;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const hh = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");
  const fastPct = activeFast ? Math.min(100, (elapsedMs / (targetHours * 3600 * 1000)) * 100) : 0;

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

  if (!mounted || loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 pb-20">
      
      <ConfirmModal isOpen={logoutModalOpen} title="Sair do BioTrack?" description="Você precisará fazer login novamente." onClose={() => setLogoutModalOpen(false)} onConfirm={() => { auth.signOut(); router.push("/"); }} confirmText="Sair" icon="logout" />
      <ConfirmModal isOpen={!!deleteMealId} title="Apagar Refeição?" description="Esta ação não pode ser desfeita." onClose={() => setDeleteMealId(null)} onConfirm={() => { if (deleteMealId) deleteDoc(doc(db, "meals", deleteMealId)); setDeleteMealId(null); }} confirmText="Apagar" icon="delete" />
      
      {/* O NOVO MODAL FLUTUANTE QUE RESOLVE SEU PROBLEMA */}
      <AddMealModal isOpen={addMealModalOpen} onClose={() => setAddMealModalOpen(false)} onSave={handleSaveMealFromModal} />

      {!onboarded && (
        <Onboarding weight={weight} height={height} goal={goal} setWeight={setWeight} setHeight={setHeight} setGoal={setGoal} calcGoal={calcGoal} onSave={handleSaveProfile} />
      )}

      <div className="mx-auto max-w-md px-5 pt-6 sm:max-w-2xl sm:px-8 sm:pt-10 lg:max-w-6xl lg:px-10">
        
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl capitalize">Olá, {userName}! 👋</h1>
          </div>
          <button onClick={() => setLogoutModalOpen(true)} className="grid h-11 px-4 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:text-red-600 transition font-bold text-xs uppercase shadow-sm">
            Sair
          </button>
        </header>

        {/* BOTÃO GIGANTE PARA ABRIR O MODAL NOVO */}
        <div className="mt-8 mb-2">
          <button onClick={() => setAddMealModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/20 transition hover:bg-emerald-600 hover:scale-[1.02] active:scale-95">
            <Plus size={20} /> Registrar Consumo
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
          
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
                  <button onClick={toggleFast} className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-black shadow-lg transition hover:scale-[1.02] active:scale-[0.98] ${activeFast ? 'bg-white text-rose-500' : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'}`}>
                    {activeFast ? <><Square className="h-4 w-4" /> Encerrar Jejum</> : <><Play className="h-4 w-4 fill-current" /> Iniciar Jejum</>}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Dashboard Limpo: Agora temos mais espaço para os gráficos e histórico! */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
          
          <section className="lg:col-span-3">
            <div className="relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Visão Semanal</h3>
                  <p className="text-xs font-medium text-slate-400">Consumo dos últimos 7 dias</p>
                </div>
              </div>
              <div className="w-full h-56 min-h-[224px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={224} minWidth={0}>
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

          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-base font-bold text-slate-800">Histórico</h3>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="text-xs font-bold text-slate-500 outline-none bg-slate-100 px-2 py-1 rounded border border-slate-200" />
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm h-[290px] overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {filteredMeals.length === 0 && <li className="px-4 py-8 text-center text-xs text-slate-400 font-medium">Nenhuma refeição registrada na data selecionada.</li>}
                {filteredMeals.map((m) => {
                  const Icon = MEAL_TYPES.find((t) => t.label === m.type)?.icon ?? Utensils;
                  return (
                    <li key={m.id} className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-slate-700">{m.description}</div>
                        <div className="text-xs font-medium text-slate-400">{m.type} · {m.time}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-black tabular-nums text-slate-800">{m.calories} <span className="text-[10px] font-bold text-slate-400 uppercase">kcal</span></div>
                        <button onClick={() => setDeleteMealId(m.id)} className="text-slate-300 hover:text-red-500 opacity-100 lg:opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        <footer className="mt-10 px-2 text-center text-[10px] uppercase font-bold tracking-widest text-slate-300 pb-8">
          Aviso: Esta aplicação é um exercício acadêmico e não substitui orientação médica ou nutricional.
        </footer>
      </div>
    </div>
  );
}