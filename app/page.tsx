"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged // <-- NOVA FUNÇÃO AQUI
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Apple, Loader2, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  const router = useRouter();

  // GUARDA-COSTAS DA ROTA: Se já tiver logado, manda pro Dashboard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      }
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
      alert("Erro na autenticação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Por favor, digite seu e-mail no campo acima primeiro.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
    } catch (error: any) {
      alert("Erro ao enviar e-mail: " + error.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4 font-sans">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 w-full max-w-md border border-slate-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg shadow-emerald-200 mb-4">
            <Apple size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">BioTrack</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 text-center">
            {isRegister ? "Crie sua conta preenchendo os dados abaixo" : "Acompanhe sua saúde com inteligência"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-slate-300 pointer-events-none" size={18} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  required={isRegister}
                />
              </div>
            </div>
          )}

          {!isRegister && (
            <div className="text-right">
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 uppercase tracking-tighter transition"
              >
                Esqueceu a senha?
              </button>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-bold transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 mt-2 ${
              isRegister ? "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700" : "bg-slate-900 shadow-slate-200 hover:bg-slate-800"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isRegister ? "Criar Minha Conta" : "Entrar no BioTrack"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50 text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsRegister(!isRegister);
              setPassword("");
              setConfirmPassword("");
            }} 
            className="text-sm font-bold text-slate-500 hover:text-emerald-600 transition"
          >
            {isRegister ? "Já possui uma conta? Faça login" : "Não tem conta? Registre-se gratuitamente"}
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
        Trabalho Acadêmico • TSI Senac
      </div>
    </div>
  );
}