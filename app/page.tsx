"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Apple, Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Se já estiver logado, manda pro dashboard direto
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
      else setChecking(false);
    });
    return () => unsub();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister && password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Conta criada com sucesso! Faça login para continuar.");
        setIsRegister(false);
        setPassword("");
        setConfirmPassword("");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/dashboard");
      }
    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { alert("Digite seu e-mail primeiro."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("E-mail de recuperação enviado!");
    } catch (error: any) {
      alert("Erro: " + error.message);
    }
  };

  if (checking) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-600 text-sm animate-pulse">Carregando...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      {/* Glow de fundo */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <Apple size={28} />
          </div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">BioTrack</h1>
          <p className="text-zinc-600 text-xs font-medium mt-1 text-center">
            {isRegister ? "Crie sua conta" : "Acompanhe calorias e jejum"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-3">

            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={15} />
                <input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition text-sm text-zinc-200 placeholder:text-zinc-600"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={15} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-3 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition text-sm text-zinc-200 placeholder:text-zinc-600"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirmar senha (só no cadastro) */}
            {isRegister && (
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1.5">
                  Confirmar senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" size={15} />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required={isRegister}
                    className="w-full pl-9 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition text-sm text-zinc-200 placeholder:text-zinc-600"
                  />
                </div>
              </div>
            )}

            {/* Esqueceu a senha */}
            {!isRegister && (
              <div className="text-right">
                <button type="button" onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-zinc-600 hover:text-emerald-400 uppercase tracking-wider transition">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Botão principal */}
            <button type="submit" disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-1 ${
                isRegister
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-zinc-100 text-zinc-900 hover:bg-white"
              }`}>
              {loading
                ? <Loader2 className="animate-spin" size={18} />
                : <>{isRegister ? "Criar conta" : "Entrar"} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Alternar login/cadastro */}
          <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
            <button type="button"
              onClick={() => { setIsRegister(!isRegister); setPassword(""); setConfirmPassword(""); }}
              className="text-xs font-semibold text-zinc-600 hover:text-emerald-400 transition">
              {isRegister ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>

        {/* Aviso ético */}
        <p className="mt-6 text-center text-[9px] font-bold uppercase tracking-widest text-zinc-800">
          Aplicação acadêmica · não substitui orientação médica
        </p>
      </div>
    </div>
  );
}
