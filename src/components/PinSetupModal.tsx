import React, { useState } from "react";
import { Lock, Unlock, X, ShieldCheck, AlertCircle, Trash2 } from "lucide-react";

interface PinSetupModalProps {
  appPin: string;
  setAppPin: (pin: string) => void;
  onClose: () => void;
}

export default function PinSetupModal({ appPin, setAppPin, onClose }: PinSetupModalProps) {
  // Mode: "initial" (creating new PIN), "verify" (verifying current PIN to unlock settings), "verified" (has validated current and can set new / delete)
  const [step, setStep] = useState<"initial" | "verify" | "verified">(() => {
    return appPin ? "verify" : "initial";
  });

  const [pinInput, setPinInput] = useState<string>("");
  const [pinConfirm, setPinConfirm] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Handler: Verifying current PIN
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (pinInput === appPin) {
      setStep("verified");
      setPinInput("");
    } else {
      setErrorMsg("PIN Keamanan salah! Silakan coba lagi.");
    }
  };

  // Handler: Setting brand new PIN
  const handleSetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (pinInput.length < 4 || pinInput.length > 6) {
      setErrorMsg("PIN harus terdiri dari 4 sampai 6 digit angka.");
      return;
    }

    if (!/^\d+$/.test(pinInput)) {
      setErrorMsg("PIN hanya boleh berupa angka (0-9).");
      return;
    }

    if (pinInput !== pinConfirm) {
      setErrorMsg("Konfirmasi PIN tidak cocok dengan PIN baru.");
      return;
    }

    setAppPin(pinInput);
    setSuccessMsg("PIN Keamanan berhasil diaktifkan!");
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // Handler: Deleting/Disabling PIN
  const handleDeletePin = () => {
    setAppPin("");
    setSuccessMsg("Pengaman PIN dinonaktifkan. Aplikasi kini bersifat publik.");
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col justify-between">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-[#111827] text-sm font-heading flex items-center space-x-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span>Pengaturan Keamanan PIN</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-2xl flex items-center space-x-2 text-xs font-bold transition">
              <ShieldCheck className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-2xl flex items-center space-x-2 text-xs font-bold transition">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP: Verify Current PIN */}
          {step === "verify" && (
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500 font-medium">
                  Sistem dikunci PIN. Masukkan PIN saat ini untuk mengubah pengaturan keamanan.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-left">
                  PIN Sekarang
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-2xl p-3.5 text-center text-lg font-black tracking-[0.4em] placeholder:tracking-normal transition outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Verifikasi PIN
              </button>
            </form>
          )}

          {/* STEP: Set New PIN / Fresh Initial Setup */}
          {step === "initial" && (
            <form onSubmit={handleSetNewPin} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-500 font-medium">
                  Buat PIN 4-6 digit angka untuk memproteksi buku kas ketika diakses publik di hosting.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    PIN Baru (Angka)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Angka 4 sampai 6 digit"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-2xl p-3 text-center text-sm font-bold tracking-[0.2em] transition outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Konfirmasi PIN Baru
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pinConfirm}
                    onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
                    placeholder="Masukkan ulang PIN baru"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-100 rounded-2xl p-3 text-center text-sm font-bold tracking-[0.2em] transition outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Aktifkan Pengaman PIN
              </button>
            </form>
          )}

          {/* STEP: Verified and can change or disable PIN */}
          {step === "verified" && (
            <div className="space-y-5 text-center">
              <p className="text-xs text-slate-500 font-medium">
                PIN Anda berhasil diverifikasi. Silakan pilih opsi keamanan di bawah ini:
              </p>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("initial");
                    setPinInput("");
                    setPinConfirm("");
                  }}
                  className="py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-bold text-xs transition cursor-pointer"
                >
                  Ganti PIN Baru
                </button>

                <button
                  type="button"
                  onClick={handleDeletePin}
                  className="py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus PIN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
