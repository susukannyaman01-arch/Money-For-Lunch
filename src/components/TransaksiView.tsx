/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Camera, 
  Eye, 
  Trash2, 
  Save, 
  Search, 
  PlusCircle, 
  ListTodo,
  Info,
  Edit
} from "lucide-react";
import { 
  Bidang, 
  Kegiatan, 
  SubKegiatan, 
  SumberDana, 
  Anggaran, 
  Transaksi 
} from "../types";

interface TransaksiViewProps {
  bidang: Bidang[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
  sumberDana: SumberDana[];
  anggaran: Anggaran[];
  transaksi: Transaksi[];
  onAddTransaksi: (newTx: Omit<Transaksi, "id" | "timestamp">) => void;
  onUpdateTransaksi: (id: string, updatedTx: Omit<Transaksi, "id" | "timestamp">) => void;
  onDeleteTransaksi: (id: string) => void;
  setViewReceipt: (url: string, name: string) => void;
}

export default function TransaksiView({
  bidang,
  kegiatan,
  subKegiatan,
  sumberDana,
  anggaran,
  transaksi,
  onAddTransaksi,
  onUpdateTransaksi,
  onDeleteTransaksi,
  setViewReceipt
}: TransaksiViewProps) {
  // Form States
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [tipe, setTipe] = useState<"Pemasukan" | "Pengeluaran">("Pengeluaran");
  const [selectedBidangId, setSelectedBidangId] = useState<number | "">("");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | "">("");
  const [selectedSubId, setSelectedSubId] = useState<number | "">("");
  const [selectedSumberId, setSelectedSumberId] = useState<number | "">("");
  const [jumlah, setJumlah] = useState<number | "">("");
  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [keterangan, setKeterangan] = useState<string>("");
  const [bukti, setBukti] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // Search recent list state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAutoTx, setShowAutoTx] = useState<boolean>(true);

  // IDR Currency Formatter
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Filtered dropdowns for cascading selection
  const filteredKegiatans = useMemo(() => {
    if (selectedBidangId === "") return [];
    return kegiatan.filter((k) => k.id_bidang === Number(selectedBidangId));
  }, [kegiatan, selectedBidangId]);

  const filteredSubs = useMemo(() => {
    if (selectedKegiatanId === "") return [];
    return subKegiatan.filter((s) => s.id_kegiatan === Number(selectedKegiatanId));
  }, [subKegiatan, selectedKegiatanId]);

  // Very important: Sumber Dana choices are filtered by checking which ones actually have a budget allocated in MASTER_ANGGARAN for the selected sub ID!
  const filteredSumbers = useMemo(() => {
    if (selectedSubId === "") return [];
    return anggaran
      .filter((a) => a.id_sub === Number(selectedSubId))
      .map((a) => {
        const sObj = sumberDana.find((s) => s.id_sumber === a.id_sumber);
        return {
          id_sumber: a.id_sumber,
          nama_sumber: sObj ? sObj.nama_sumber : "Lain-lain",
          pagu: a.pagu
        };
      });
  }, [anggaran, selectedSubId, sumberDana]);

  // Real-time Balance Display Widget Calculations
  const activeAnggaranMatch = useMemo(() => {
    if (selectedSubId === "" || selectedSumberId === "") return null;
    return anggaran.find(
      (a) => a.id_sub === Number(selectedSubId) && a.id_sumber === Number(selectedSumberId)
    ) || null;
  }, [anggaran, selectedSubId, selectedSumberId]);

  const activeWidgetCalculations = useMemo(() => {
    if (!activeAnggaranMatch) return null;
    
    // Sum all spending on this budget
    let terpakai = 0;
    transaksi.forEach((tx) => {
      if (tx.id_anggaran === activeAnggaranMatch.id) {
        if (tx.tipe === "Pengeluaran") {
          terpakai += tx.jumlah;
        } else if (tx.tipe === "Pemasukan" && tx.ref_id) {
          // Refunds / temporary loan return decreases the total spent, freeing up budget!
          terpakai -= tx.jumlah;
        }
      }
    });

    const sisa = activeAnggaranMatch.pagu - terpakai;
    return {
      pagu: activeAnggaranMatch.pagu,
      terpakai,
      sisa
    };
  }, [activeAnggaranMatch, transaksi]);

  // Photo upload base64 converter
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBukti(reader.result);
      }
    };
    reader.onerror = () => {
      alert("Gagal membaca file gambar.");
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedFile = () => {
    setBukti("");
    setFileName("");
    const fileInput = document.getElementById("tx-bukti-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleStartEdit = (tx: Transaksi) => {
    const ang = anggaran.find((a) => a.id === tx.id_anggaran);
    if (!ang) {
      alert("Rekening anggaran untuk transaksi ini tidak ditemukan.");
      return;
    }

    setEditingTxId(tx.id);
    setTipe(tx.tipe);
    setSelectedBidangId(ang.id_bidang);
    setSelectedKegiatanId(ang.id_kegiatan);
    setSelectedSubId(ang.id_sub);
    setSelectedSumberId(ang.id_sumber);
    setJumlah(tx.jumlah);
    setTanggal(tx.tanggal);
    setKeterangan(tx.keterangan || "");
    setBukti(tx.bukti || "");
    setFileName(tx.bukti ? "bukti_tersimpan.png" : "");

    // Scroll smoothly to form container
    const formEl = document.getElementById("tx-form-container");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
    setTipe("Pengeluaran");
    setSelectedBidangId("");
    setSelectedKegiatanId("");
    setSelectedSubId("");
    setSelectedSumberId("");
    setJumlah("");
    setTanggal(new Date().toISOString().substring(0, 10));
    setKeterangan("");
    clearSelectedFile();
  };

  // Submit Transaction Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAnggaranMatch) {
      alert("Mohon selesaikan pemilihan rekening desa berjenjang!");
      return;
    }

    const txAmount = Number(jumlah);
    if (!txAmount || txAmount <= 0) {
      alert("Nominal transaksi harus lebih dari Rp 0!");
      return;
    }

    // Check budget limit for Pengeluaran
    if (tipe === "Pengeluaran" && activeWidgetCalculations) {
      // In edit mode, we exclude the current transaction's previous amount from the check
      let currentAllowance = activeWidgetCalculations.sisa;
      if (editingTxId) {
        const originalTx = transaksi.find(t => t.id === editingTxId);
        if (originalTx && originalTx.id_anggaran === activeAnggaranMatch.id && originalTx.tipe === "Pengeluaran") {
          currentAllowance += originalTx.jumlah;
        }
      }

      if (txAmount > currentAllowance) {
        alert(
          `Sisa pagu tidak cukup! Nominal belanja (${formatIDR(txAmount)}) melebihi sisa anggaran (${formatIDR(currentAllowance)}).`
        );
        return;
      }
    }

    if (editingTxId) {
      onUpdateTransaksi(editingTxId, {
        tipe,
        id_anggaran: activeAnggaranMatch.id,
        jumlah: txAmount,
        tanggal,
        keterangan,
        bukti: bukti || undefined
      });
      setEditingTxId(null);
    } else {
      onAddTransaksi({
        tipe,
        id_anggaran: activeAnggaranMatch.id,
        jumlah: txAmount,
        tanggal,
        keterangan,
        bukti: bukti || undefined
      });
    }

    // Reset Form
    setJumlah("");
    setKeterangan("");
    clearSelectedFile();
    setSelectedBidangId("");
    setSelectedKegiatanId("");
    setSelectedSubId("");
    setSelectedSumberId("");
  };

  // Recent Transactions List (Can include automated ones)
  const recentManualTransactions = useMemo(() => {
    let list = transaksi.slice();
    if (!showAutoTx) {
      list = list.filter((t) => !t.ref_id);
    }
    // Sort chronological: oldest to newest
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id.localeCompare(b.id));
  }, [transaksi, showAutoTx]);

  // Search Filter on recent table list
  const filteredRecentTxs = useMemo(() => {
    return recentManualTransactions.filter((t) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const subName = (t.subKegiatan || "").toLowerCase();
      const sDana = (t.sumberDana || "").toLowerCase();
      const label = (t.keterangan || "").toLowerCase();
      const amountStr = String(t.jumlah);
      const dateStr = t.tanggal;
      return (
        subName.includes(q) || 
        sDana.includes(q) || 
        label.includes(q) || 
        amountStr.includes(q) || 
        dateStr.includes(q)
      );
    });
  }, [recentManualTransactions, searchQuery]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Left: Form Catat Transaksi */}
      <div id="tx-form-container" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 lg:col-span-1 h-fit scroll-mt-6">
        <div className="border-b border-slate-50 pb-3">
          <h3 className="text-base font-extrabold text-slate-800 font-heading flex items-center">
            {editingTxId ? (
              <>
                <Edit className="w-5 h-5 text-indigo-600 mr-2 animate-bounce" />
                Edit Transaksi: {editingTxId}
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 text-indigo-600 mr-2" />
                Catat Transaksi Baru
              </>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            {editingTxId 
              ? "Ubah data realisasi dana belanja atau penerimaan hibah kas desa."
              : "Pencatatan realisasi dana belanja atau penerimaan hibah kas desa."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipe Selector Buttons */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Tipe Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipe("Pengeluaran")}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                  tipe === "Pengeluaran"
                    ? "border-red-500/30 bg-red-50/70 text-red-600 ring-2 ring-red-500/5 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-400"
                }`}
              >
                <span className="inline-flex items-center">
                  Belanja (Out)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTipe("Pemasukan")}
                className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition duration-200 cursor-pointer ${
                  tipe === "Pemasukan"
                    ? "border-emerald-500/30 bg-emerald-50/70 text-emerald-600 ring-2 ring-emerald-500/5 shadow-sm"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-400"
                }`}
              >
                <span className="inline-flex items-center">
                  Penerimaan (In)
                </span>
              </button>
            </div>
          </div>

          {/* Cascading selectors */}
          <div className="space-y-3">
            {/* Bidang */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bidang Anggaran
              </label>
              <select
                value={selectedBidangId}
                onChange={(e) => {
                  setSelectedBidangId(e.target.value === "" ? "" : Number(e.target.value));
                  setSelectedKegiatanId("");
                  setSelectedSubId("");
                  setSelectedSumberId("");
                }}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition"
              >
                <option value="">Pilih Bidang</option>
                {bidang.map((b) => (
                  <option key={b.id_bidang} value={b.id_bidang}>
                    {b.id_bidang} - {b.nama_bidang}
                  </option>
                ))}
              </select>
            </div>

            {/* Kegiatan */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Kegiatan Desa
              </label>
              <select
                value={selectedKegiatanId}
                disabled={selectedBidangId === ""}
                onChange={(e) => {
                  setSelectedKegiatanId(e.target.value === "" ? "" : Number(e.target.value));
                  setSelectedSubId("");
                  setSelectedSumberId("");
                }}
                required
                className="w-full bg-slate-50 disabled:opacity-40 disabled:hover:bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition max-w-full"
              >
                <option value="">Pilih Kegiatan</option>
                {filteredKegiatans.map((k) => (
                  <option key={k.id_kegiatan} value={k.id_kegiatan}>
                    {k.nama_kegiatan}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Kegiatan */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Sub-Kegiatan
              </label>
              <select
                value={selectedSubId}
                disabled={selectedKegiatanId === ""}
                onChange={(e) => {
                  setSelectedSubId(e.target.value === "" ? "" : Number(e.target.value));
                  setSelectedSumberId("");
                }}
                required
                className="w-full bg-slate-50 disabled:opacity-40 disabled:hover:bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition max-w-full"
              >
                <option value="">Pilih Sub-Kegiatan</option>
                {filteredSubs.map((s) => (
                  <option key={s.id_sub} value={s.id_sub}>
                    {s.nama_sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Sumber Dana */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Sumber Dana & Pagu Alokasi
              </label>
              <select
                value={selectedSumberId}
                disabled={selectedSubId === ""}
                onChange={(e) => {
                  setSelectedSumberId(e.target.value === "" ? "" : Number(e.target.value));
                }}
                required
                className="w-full bg-slate-50 disabled:opacity-40 disabled:hover:bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition"
              >
                <option value="">Pilih Sumber Dana</option>
                {filteredSumbers.map((fs) => (
                  <option key={fs.id_sumber} value={fs.id_sumber}>
                    {fs.nama_sumber} ({formatIDR(fs.pagu)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Real-time Pagu Display Widget */}
          {activeWidgetCalculations && (
            <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-2.5">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center"><Info className="w-3.5 h-3.5 text-indigo-500 mr-1" /> Informasi Rekening Pagu</span>
                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                  Matched Anggaran
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Pagu</p>
                  <p className="text-[11px] font-extrabold text-slate-700 mt-0.5">{formatIDR(activeWidgetCalculations.pagu)}</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Terpakai</p>
                  <p className="text-[11px] font-extrabold text-amber-600 mt-0.5">{formatIDR(activeWidgetCalculations.terpakai)}</p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Sisa Pagu</p>
                  <p className="text-[11px] font-extrabold text-emerald-600 mt-0.5">{formatIDR(activeWidgetCalculations.sisa)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nominal & Tanggal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nominal (Rp)
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="Misal: 500000"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tanggal Keuangan
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Keterangan Penggunaan
            </label>
            <textarea
              required
              rows={2}
              placeholder="Detail peruntukan atau bukti administrasi dana..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none transition"
            />
          </div>

          {/* Bukti Transaksi (File Picker Uploader) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Bukti Transaksi (Pilih File / Foto)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id="tx-bukti-input"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => document.getElementById("tx-bukti-input")?.click()}
                className="flex flex-1 items-center justify-center space-x-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition font-semibold text-xs text-slate-600 shadow-sm"
              >
                <Camera className="w-4 h-4 text-indigo-500" />
                <span className="truncate max-w-[150px]">
                  {fileName || "Ambil / Pilih Foto"}
                </span>
              </button>
              
              {bukti && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewReceipt(bukti, fileName || "bukti_transaksi.png")}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border border-indigo-100 rounded-xl transition shadow-sm"
                    title="Lihat Bukti"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="p-2 bg-red-50 hover:bg-red-100/80 text-red-500 border border-red-100 rounded-xl transition shadow-sm"
                    title="Hapus Bukti"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          {editingTxId ? (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center justify-center space-x-1.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
              >
                <span>Batal Edit</span>
              </button>
              <button
                type="submit"
                className="flex items-center justify-center space-x-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all duration-150 transform active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all duration-150 transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Transaksi Kas</span>
            </button>
          )}
        </form>
      </div>

      {/* 2. Right: Daftar Transaksi Terdaftar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 font-heading flex items-center">
              <ListTodo className="w-5 h-5 text-indigo-600 mr-2" />
              Daftar Transaksi Terdaftar
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Daftar semua kas keluar dan penerimaan manual yang terekam.
            </p>
          </div>

          {/* Search bar & filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Cari keterangan/sub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/60 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={showAutoTx ? "all" : "manual"}
              onChange={(e) => setShowAutoTx(e.target.value === "all")}
              className="bg-slate-55 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Transaksi ({transaksi.length})</option>
              <option value="manual">Transaksi Manual ({transaksi.filter(t => !t.ref_id).length})</option>
            </select>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Tipe</th>
                <th className="py-3 px-3">Alokasi / Sumber</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-center">Bukti</th>
                <th className="py-3 px-3 text-right">Jumlah</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
              {filteredRecentTxs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada pencatatan transaksi yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredRecentTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-600">
                      {t.tanggal}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        t.tipe === "Pemasukan"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {t.tipe === "Pemasukan" ? "IN" : "OUT"}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-[150px]">
                      <p className="font-extrabold text-slate-700 truncate">{t.subKegiatan || "-"}</p>
                      <p className="text-[9px] text-slate-400 font-extrabold tracking-wider uppercase mt-0.5">
                        {t.sumberDana || "-"}
                      </p>
                      {t.ref_id && (
                        <div className="mt-1">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide uppercase ${
                            t.ref_id.toUpperCase().startsWith("TL")
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                          }`}>
                            ⚡ {t.ref_id}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[180px] break-words whitespace-normal font-medium">
                      {t.keterangan}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {t.bukti ? (
                        <button
                          onClick={() => setViewReceipt(t.bukti!, `bukti_transaksi_${t.id}.png`)}
                          className="p-1 px-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded transition inline-flex"
                          title="Lihat Bukti"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-700 whitespace-nowrap text-sm">
                      {formatIDR(t.jumlah)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-0.5">
                        {!t.ref_id ? (
                          <button
                            onClick={() => handleStartEdit(t)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition inline-flex cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="p-1.5 text-slate-300 inline-flex" title="Log otomatis (Kelola melalui menu Talangan/Hutang)">
                            <Edit className="w-3.5 h-3.5 opacity-40 cursor-not-allowed" />
                          </span>
                        )}
                        <button
                          onClick={() => onDeleteTransaksi(t.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition inline-flex cursor-pointer"
                          title={t.ref_id ? "Menghapus log otomatis ini akan mengganggu data talangan/hutang terkait" : "Hapus Transaksi"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
