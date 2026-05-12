import React from "react";
import { AlertTriangle, LogOut } from "lucide-react";

export function ConfirmModal({ isOpen, title, description, onClose, onConfirm, confirmText = "Confirmar", isDestructive = true, icon = "logout" }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-in zoom-in-95 rounded-3xl bg-white p-6 shadow-2xl">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isDestructive ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {icon === "logout" ? <LogOut size={28} /> : <AlertTriangle size={28} />}
        </div>
        <h2 className="text-center text-xl font-black text-slate-800">{title}</h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          {description}
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`flex-1 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-95 ${isDestructive ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}