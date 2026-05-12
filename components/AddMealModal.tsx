import React, { useState } from "react";
import { Search, Loader2, X, Scale, Coffee, Utensils, Moon, Apple, Info } from "lucide-react";

type MealType = "Café" | "Almoço" | "Lanche" | "Jantar" | "Ceia";

const MEAL_TYPES: { label: MealType; icon: any }[] = [
  { label: "Café", icon: Coffee },
  { label: "Almoço", icon: Utensils },
  { label: "Lanche", icon: Apple },
  { label: "Jantar", icon: Moon },
];

export function AddMealModal({ isOpen, onClose, onSave }: any) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingApi, setLoadingApi] = useState(false);

  // Estados do alimento (Sempre baseados na regra dos 100g)
  const [selectedFood, setSelectedFood] = useState("");
  const [baseKcal, setBaseKcal] = useState<number | "">(""); // Kcal em 100g
  const [grams, setGrams] = useState<number | "">(100); // Quantidade comida
  const [mealType, setMealType] = useState<MealType>("Almoço");
  const [isManual, setIsManual] = useState(false);

  if (!isOpen) return null;

  // 1. Busca na API (Já traz a Kcal por 100g)
  const searchFoodApi = async () => {
    if (!searchTerm.trim()) return;
    setLoadingApi(true);
    try {
      const res = await fetch(`https://br.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page_size=15`);
      const data = await res.json();
      const validProducts = (data.products || []).filter((p: any) => p.nutriments?.["energy-kcal_100g"]);
      setSearchResults(validProducts);
    } catch (err) {
      alert("Erro ao buscar na API.");
    } finally {
      setLoadingApi(false);
    }
  };

  // 2. Seleciona da API
  const handleSelectFood = (item: any) => {
    setSelectedFood(item.product_name || "Alimento");
    setBaseKcal(Math.round(item.nutriments?.["energy-kcal_100g"] || 0));
    setGrams(100); 
    setIsManual(false);
    setStep(2); 
  };

  // 3. Força a regra dos 100g até no registro manual
  const handleManualEntry = () => {
    setSelectedFood(searchTerm || "Alimento Personalizado");
    setBaseKcal(""); // Limpa para o usuário preencher a base de 100g
    setGrams(100);
    setIsManual(true);
    setStep(2);
  };

  // 4. Salva no Firebase
  const handleSave = () => {
    // A matemática maravilhosa da porção!
    const finalKcal = Math.round((Number(baseKcal) / 100) * Number(grams)); 
    
    onSave({
      description: selectedFood,
      calories: finalKcal, // Salva o total calculado!
      type: mealType,
      baseKcal100g: Number(baseKcal), // Salva a base no banco para histórico
      gramsConsumed: Number(grams) // Salva o peso no banco para histórico
    });
    
    setStep(1); setSearchTerm(""); setSearchResults([]); onClose();
  };

  const totalKcal = (baseKcal && grams) ? Math.round((Number(baseKcal) / 100) * Number(grams)) : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 sm:px-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-10 sm:zoom-in-95 overflow-hidden rounded-t-[2rem] sm:rounded-3xl bg-white shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800">
            {step === 1 ? "Buscar Alimento" : "Calcular Porção"}
          </h2>
          <button onClick={() => { setStep(1); onClose(); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && searchFoodApi()}
                    placeholder="Ex: Arroz, Frango, Maçã..." 
                    className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none" 
                    autoFocus
                  />
                </div>
                <button onClick={searchFoodApi} className="rounded-2xl bg-emerald-500 px-5 text-white font-bold hover:bg-emerald-600 transition shadow-md">
                  {loadingApi ? <Loader2 className="h-5 w-5 animate-spin" /> : "Buscar"}
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {searchResults.map((item, idx) => (
                  <button key={idx} onClick={() => handleSelectFood(item)} className="w-full flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50 shadow-sm">
                    <div className="flex-1 truncate pr-4">
                      <p className="truncate text-sm font-bold text-slate-700">{item.product_name}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400">{item.brands || "Genérico"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-600">{Math.round(item.nutriments?.["energy-kcal_100g"])} <span className="text-[10px] font-bold">kcal</span></p>
                      <p className="text-[10px] font-bold text-slate-400">por 100g</p>
                    </div>
                  </button>
                ))}
                
                {searchTerm && !loadingApi && (
                  <button onClick={handleManualEntry} className="w-full mt-4 rounded-xl border border-dashed border-slate-300 py-4 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition">
                    Criar "{searchTerm}" com base em 100g
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              
              <div className="text-center">
                <input 
                  value={selectedFood}
                  onChange={(e) => setSelectedFood(e.target.value)}
                  className={`text-xl font-black text-slate-800 text-center w-full bg-transparent outline-none ${isManual ? 'border-b border-dashed border-slate-300 pb-1' : ''}`}
                  disabled={!isManual}
                />
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 space-y-5">
                
                {/* A REGRA DOS 100g ESTÁ AQUI */}
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Info size={18} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Calorias base (em 100g)</label>
                    <div className="flex items-end gap-1">
                      <input 
                        type="number" 
                        value={baseKcal} 
                        onChange={(e) => setBaseKcal(Number(e.target.value))} 
                        className="w-full bg-transparent text-xl font-black text-emerald-600 outline-none" 
                        disabled={!isManual}
                        placeholder="Ex: 250"
                      />
                      <span className="text-xs font-bold text-slate-400 pb-1">kcal</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm text-slate-400">
                    <Scale size={18} />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Quantidade Consumida</label>
                    <div className="flex items-end gap-1">
                      <input 
                        type="number" 
                        value={grams} 
                        onChange={(e) => setGrams(Number(e.target.value))} 
                        className="w-full bg-transparent text-2xl font-black text-slate-800 outline-none" 
                        autoFocus
                      />
                      <span className="text-xs font-bold text-slate-400 pb-1">gramas</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Tipo de Refeição</label>
                <div className="grid grid-cols-2 gap-2">
                  {MEAL_TYPES.map(({ label, icon: Icon }) => (
                    <button
                      key={label} onClick={() => setMealType(label)}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-3 text-xs font-bold transition ${mealType === label ? "border-emerald-500 bg-emerald-500 text-white shadow-md" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4 flex items-center justify-between text-white mt-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Ingerido</p>
                  <p className="text-3xl font-black">{totalKcal} <span className="text-sm font-medium">kcal</span></p>
                </div>
                <button 
                  onClick={handleSave} 
                  disabled={!grams || !baseKcal} 
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  Registrar
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}