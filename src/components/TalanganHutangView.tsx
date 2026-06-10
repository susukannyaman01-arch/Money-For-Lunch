/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  ArrowUpDown, 
  Camera, 
  Eye, 
  Trash2, 
  Check, 
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  X
} from "lucide-react";
import { 
  Bidang, 
  Kegiatan, 
  SubKegiatan, 
  SumberDana, 
  Anggaran, 
  Transaksi, 
  Talangan, 
  Hutang,
  formatTanggal
} from "../types";

interface TalanganHutangViewProps {
  bidang: Bidang[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
  sumberDana: SumberDana[];
  anggaran: Anggaran[];
  transaksi: Transaksi[];
  talangan: Talangan[];
  hutang: Hutang[];
  onAddTalangan: (newTal: Omit<Talangan, "id" | "status" | "tanggal_lunas" | "timestamp">) => void;
  onPayTalangan: (id: string, tanggal: string) => void;
  onDeleteTalangan: (id: string) => void;
  onAddHutang: (newHut: Omit<Hutang, "id" | "status" | "tanggal_lunas" | "timestamp">) => void;
  onPayHutang: (id: string, tanggal: string) => void;
  onDeleteHutang: (id: string) => void;
  setViewReceipt: (url: string, name: string) => void;
}

export default function TalanganHutangView({
  bidang,
  kegiatan,
  subKegiatan,
  sumberDana,
  anggaran,
  transaksi,
  talangan,
  hutang,
  onAddTalangan,
  onPayTalangan,
  onDeleteTalangan,
  onAddHutang,
  onPayHutang,
  onDeleteHutang,
  setViewReceipt
}: TalanganHutangViewProps) {
  // 1. Talangan Form state
  const [talGiverId, setTalGiverId] = useState<number | "">("");
  const [talReceiverId, setTalReceiverId] = useState<number | "">("");
  const [talJumlah, setTalJumlah] = useState<number | " text-slate-800">("");
  const [talTanggal, setTalTanggal] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [talKeterangan, setTalKeterangan] = useState<string>("");
  const [talBukti, setTalBukti] = useState<string>("");
  const [talFileName, setTalFileName] = useState<string>("");

  // 2. Hutang Form state
  const [hutGiverId, setHutGiverId] = useState<number | " font-bold">("");
  const [hutPeminjam, setHutPeminjam] = useState<string>("Pribadi");
  const [hutJumlah, setHutJumlah] = useState<number | " px-3">("");
  const [hutTanggal, setHutTanggal] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [hutKeterangan, setHutKeterangan] = useState<string>("");
  const [hutBukti, setHutBukti] = useState<string>("");
  const [hutFileName, setHutFileName] = useState<string>("");

  // Outstanding list filters
  const [talSearch, setTalSearch] = useState<string>("");
  const [talGiverFilter, setTalGiverFilter] = useState<string>("");
  const [talReceiverFilter, setTalReceiverFilter] = useState<string>("");

  const [hutSearch, setHutSearch] = useState<string>("");
  const [hutBorrowerFilter, setHutBorrowerFilter] = useState<string>("");
  const [hutGiverFilter, setHutGiverFilter] = useState<string>("");

  // Print Preview state
  const [printData, setPrintData] = useState<{
    judul: string;
    tipe: "talangan" | "hutang";
    rows: any[];
  } | null>(null);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Budget choices formatted with descriptions
  const anggaranChoices = useMemo(() => {
    return anggaran.map((ang) => {
      const b = bidang.find((x) => x.id_bidang === ang.id_bidang);
      const k = kegiatan.find((x) => x.id_kegiatan === ang.id_kegiatan);
      const s = subKegiatan.find((x) => x.id_sub === ang.id_sub);
      const sd = sumberDana.find((x) => x.id_sumber === ang.id_sumber);

      return {
        id: ang.id,
        subName: s ? s.nama_sub : "Lain-lain",
        sumberDana: sd ? sd.nama_sumber : "Lain-lain",
        pagu: ang.pagu,
        displayText: `[${sd ? sd.nama_sumber : "Lain-lain"}] ${s ? s.nama_sub : "Lain-lain"} (${formatIDR(ang.pagu)})`
      };
    });
  }, [anggaran, bidang, kegiatan, subKegiatan, sumberDana]);

  // File picker upload converter
  const handleFileChange = (prefix: "tal" | "hut", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (prefix === "tal") {
      setTalFileName(file.name);
    } else {
      setHutFileName(file.name);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (prefix === "tal") {
          setTalBukti(reader.result);
        } else {
          setHutBukti(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const clearFile = (prefix: "tal" | "hut") => {
    if (prefix === "tal") {
      setTalBukti("");
      setTalFileName("");
      const fileInput = document.getElementById("tal-bukti-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } else {
      setHutBukti("");
      setHutFileName("");
      const fileInput = document.getElementById("hut-bukti-file") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  // Submit Talangan
  const handleSubmitTalangan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!talGiverId || !talReceiverId) {
      alert("Mohon pilih anggaran pemberi dan penerima talangan!");
      return;
    }
    if (talGiverId === talReceiverId) {
      alert("Anggaran pemberi dan penerima talangan tidak boleh sama!");
      return;
    }

    const amount = Number(talJumlah);
    if (!amount || amount <= 0) {
      alert("Nominal talangan harus lebih dari Rp 0!");
      return;
    }

    // Check Giver balance
    let giverTerpakai = 0;
    transaksi.forEach((tx) => {
      if (tx.id_anggaran === Number(talGiverId)) {
        if (tx.tipe === "Pengeluaran") giverTerpakai += tx.jumlah;
        else if (tx.tipe === "Pemasukan") giverTerpakai -= tx.jumlah;
      }
    });

    const giverChoice = anggaranChoices.find((c) => c.id === Number(talGiverId));
    const giverPagu = giverChoice ? giverChoice.pagu : 0;
    const giverSisa = giverPagu - giverTerpakai;

    if (amount > giverSisa) {
      alert(
        `Saldo kas pemberi (${formatIDR(giverSisa)}) tidak mencukupi untuk ditalangi sebesar ${formatIDR(amount)}!`
      );
      return;
    }

    onAddTalangan({
      id_anggaran_pemberi: Number(talGiverId),
      id_anggaran_penerima: Number(talReceiverId),
      jumlah: amount,
      tanggal: talTanggal,
      keterangan: talKeterangan,
      bukti: talBukti || undefined
    });

    // Reset Form
    setTalGiverId("");
    setTalReceiverId("");
    setTalJumlah("");
    setTalKeterangan("");
    clearFile("tal");
  };

  // Submit Hutang
  const handleSubmitHutang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hutGiverId) {
      alert("Mohon pilih anggaran pemberi pinjaman kas!");
      return;
    }

    const amount = Number(hutJumlah);
    if (!amount || amount <= 0) {
      alert("Nominal pinjaman harus lebih dari Rp 0!");
      return;
    }

    // Check Giver balance
    let giverTerpakai = 0;
    transaksi.forEach((tx) => {
      if (tx.id_anggaran === Number(hutGiverId)) {
        if (tx.tipe === "Pengeluaran") giverTerpakai += tx.jumlah;
        else if (tx.tipe === "Pemasukan") giverTerpakai -= tx.jumlah;
      }
    });

    const giverChoice = anggaranChoices.find((c) => c.id === Number(hutGiverId));
    const giverPagu = giverChoice ? giverChoice.pagu : 0;
    const giverSisa = giverPagu - giverTerpakai;

    if (amount > giverSisa) {
      alert(
        `Saldo kas pemberi (${formatIDR(giverSisa)}) tidak mencukupi untuk dipinjamkan sebesar ${formatIDR(amount)}!`
      );
      return;
    }

    onAddHutang({
      id_anggaran_pemberi: Number(hutGiverId),
      peminjam: hutPeminjam,
      jumlah: amount,
      tanggal: hutTanggal,
      keterangan: hutKeterangan,
      bukti: hutBukti || undefined
    });

    // Reset Form
    setHutGiverId("");
    setHutPeminjam("Pribadi");
    setHutJumlah("");
    setHutKeterangan("");
    clearFile("hut");
  };

  // Outstanding filter calculations
  const activeOutstandingTalangan = useMemo(() => {
    const list = talangan.filter((t) => {
      if (t.status !== "Belum Lunas") return false;
      if (talGiverFilter && t.subGiver !== talGiverFilter) return false;
      if (talReceiverFilter && t.subReceiver !== talReceiverFilter) return false;
      if (talSearch) {
        const q = talSearch.toLowerCase();
        const desc = (t.keterangan || "").toLowerCase();
        const giver = (t.subGiver || "").toLowerCase();
        const rec = (t.subReceiver || "").toLowerCase();
        if (!desc.includes(q) && !giver.includes(q) && !rec.includes(q)) return false;
      }
      return true;
    });
    // Sort oldest date first
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id.localeCompare(b.id));
  }, [talangan, talGiverFilter, talReceiverFilter, talSearch]);

  const activeOutstandingHutang = useMemo(() => {
    const list = hutang.filter((h) => {
      if (h.status !== "Belum Lunas") return false;
      if (hutBorrowerFilter && h.peminjam !== hutBorrowerFilter) return false;
      if (hutGiverFilter && h.subGiver !== hutGiverFilter) return false;
      if (hutSearch) {
        const q = hutSearch.toLowerCase();
        const desc = (h.keterangan || "").toLowerCase();
        const borrower = (h.peminjam || "").toLowerCase();
        const giver = (h.subGiver || "").toLowerCase();
        if (!desc.includes(q) && !borrower.includes(q) && !giver.includes(q)) return false;
      }
      return true;
    });
    // Sort oldest date first
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.id.localeCompare(b.id));
  }, [hutang, hutBorrowerFilter, hutGiverFilter, hutSearch]);

  // Unique lists for dropdown filters inside Outstanding
  const outstandingFiltersList = useMemo(() => {
    const unliquidatedTals = talangan.filter((t) => t.status === "Belum Lunas");
    const unliquidatedHuts = hutang.filter((h) => h.status === "Belum Lunas");

    return {
      talGivers: Array.from(new Set(unliquidatedTals.map((t) => t.subGiver).filter(Boolean))),
      talReceivers: Array.from(new Set(unliquidatedTals.map((t) => t.subReceiver).filter(Boolean))),
      hutBorrowers: Array.from(new Set(unliquidatedHuts.map((h) => h.peminjam).filter(Boolean))),
      hutGivers: Array.from(new Set(unliquidatedHuts.map((h) => h.subGiver).filter(Boolean)))
    };
  }, [talangan, hutang]);

  // Handle Payback buttons
  const handlePaybackTalangan = (id: string) => {
    const today = new Date().toISOString().substring(0, 10);
    const dateInput = prompt("Masukkan tanggal pelunasan talangan (YYYY-MM-DD):", today);
    if (dateInput === null) return; // Cancelled
    if (!dateInput) {
      alert("Tanggal pelunasan tidak boleh kosong!");
      return;
    }
    onPayTalangan(id, dateInput);
  };

  const handlePaybackHutang = (id: string) => {
    const today = new Date().toISOString().substring(0, 10);
    const dateInput = prompt("Masukkan tanggal pelunasan pinjaman hutang (YYYY-MM-DD):", today);
    if (dateInput === null) return; // Cancelled
    if (!dateInput) {
      alert("Tanggal pelunasan tidak boleh kosong!");
      return;
    }
    onPayHutang(id, dateInput);
  };

  const handlePrintTalangan = () => {
    setPrintData({
      judul: "LAPORAN DETAIL REKAPITULASI DANA TALANGAN AKTIF",
      tipe: "talangan",
      rows: activeOutstandingTalangan
    });
  };

  const handlePrintHutang = () => {
    setPrintData({
      judul: "LAPORAN DETAIL REKAPITULASI PINJAMAN HUTANG KAS DESA",
      tipe: "hutang",
      rows: activeOutstandingHutang
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Form Talangan Baru (Bailout Internal) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-50 pb-2">
            <h3 className="text-base font-extrabold text-slate-800 font-heading flex items-center">
              <ArrowUpDown className="w-5 h-5 text-amber-500 mr-2" />
              Buat Talangan Baru (Bailout Internal)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Gunakan sisa kas satu budget desa untuk membiayai sementara kegiatan mendesak sub-kegiatan lain.
            </p>
          </div>

          <form onSubmit={handleSubmitTalangan} className="space-y-4">
            {/* Giver sub (Pemberi) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Anggaran Rekening Pemberi (Yang Dipinjam)
              </label>
              <select
                value={talGiverId}
                onChange={(e) => setTalGiverId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none transition"
              >
                <option value="">Pilih Anggaran Pemberi</option>
                {anggaranChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayText}
                  </option>
                ))}
              </select>
            </div>

            {/* Receiver sub (Penerima) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Anggaran Rekening Penerima (Mendesak)
              </label>
              <select
                value={talReceiverId}
                onChange={(e) => setTalReceiverId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none transition"
              >
                <option value="">Pilih Anggaran Penerima</option>
                {anggaranChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayText}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Talangan (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="Misal: 1000000"
                  value={talJumlah}
                  onChange={(e) => setTalJumlah(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tanggal Pemrosesan
                </label>
                <input
                  type="date"
                  required
                  value={talTanggal}
                  onChange={(e) => setTalTanggal(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Alasan / Keterangan Talangan
              </label>
              <textarea
                required
                rows={2}
                placeholder="Alasan detail peminjaman dana antar kegiatan..."
                value={talKeterangan}
                onChange={(e) => setTalKeterangan(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none transition"
              />
            </div>

            {/* Bukti File */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bukti Talangan (Kamera / File)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="tal-bukti-file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("tal", e)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("tal-bukti-file")?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-xs font-bold text-slate-600 shadow-sm"
                >
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span className="truncate max-w-[150px]">{talFileName || "Foto Bukti"}</span>
                </button>
                {talBukti && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewReceipt(talBukti, talFileName || "bukti_talangan.png")}
                      className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl transition shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => clearFile("tal")}
                      className="p-2 bg-red-50 text-red-550 border border-red-100 rounded-xl transition shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Proses Transfer Talangan</span>
            </button>
          </form>
        </div>

        {/* Form Hutang Baru (Pinjaman Kas ke Pribadi/External) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-50 pb-2">
            <h3 className="text-base font-extrabold text-slate-800 font-heading flex items-center">
              <ArrowUpDown className="w-5 h-5 text-indigo-600 mr-2" />
              Catat Hutang Baru (Pinjaman Kas ke Pribadi)
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Pinjamkan kas resmi desa dari anggaran kegiatan kas tertentu kepada Pribadi secara sementara (misal Kuwu/staf).
            </p>
          </div>

          <form onSubmit={handleSubmitHutang} className="space-y-4">
            {/* Giver sub (Sumber Kas) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Anggaran Sumber Kas (Pemberi Pinjaman)
              </label>
              <select
                value={hutGiverId}
                onChange={(e) => setHutGiverId(e.target.value === "" ? "" : Number(e.target.value))}
                required
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none transition"
              >
                <option value="">Pilih Anggaran Sumber Kas</option>
                {anggaranChoices.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayText}
                  </option>
                ))}
              </select>
            </div>

            {/* Borrower name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Pihak Peminjam (Nama Staf / Kuwu)
              </label>
              <input
                type="text"
                required
                value={hutPeminjam}
                onChange={(e) => setHutPeminjam(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition"
              />
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Pinjaman (Rp)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="Misal: 5000000"
                  value={hutJumlah}
                  onChange={(e) => setHutJumlah(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tanggal Pinjaman
                </label>
                <input
                  type="date"
                  required
                  value={hutTanggal}
                  onChange={(e) => setHutTanggal(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none transition"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Keterangan / Alasan Pinjaman
              </label>
              <textarea
                required
                rows={2}
                placeholder="Alasan pinjaman dana kas desa untuk penandatanganan jaminan..."
                value={hutKeterangan}
                onChange={(e) => setHutKeterangan(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/85 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-700 focus:outline-none transition"
              />
            </div>

            {/* Bukti File */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Bukti Hutang (Kamera / File)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="hut-bukti-file"
                  accept="image/*"
                  onChange={(e) => handleFileChange("hut", e)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("hut-bukti-file")?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-xs font-bold text-slate-600 shadow-sm"
                >
                  <Camera className="w-4 h-4 text-indigo-500" />
                  <span className="truncate max-w-[150px]">{hutFileName || "Foto Bukti"}</span>
                </button>
                {hutBukti && (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewReceipt(hutBukti, hutFileName || "bukti_hutang.png")}
                      className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl transition shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => clearFile("hut")}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-550 border border-red-100 rounded-xl transition shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>Simpan Pinjaman Hutang</span>
            </button>
          </form>
        </div>

      </div>

      {/* Outstanding Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Talangan Aktif Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 font-heading flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                Talangan Aktif (Belum Lunas)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Pembiayaan bailout sementara antar budget desa yang belum direimburse.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintTalangan}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm transform active:scale-95 cursor-pointer flex-shrink-0"
              title="Cetak Laporan Talangan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
          </div>

          {/* Filters mini row */}
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Cari..."
              value={talSearch}
              onChange={(e) => setTalSearch(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none"
            />
            <select
              value={talGiverFilter}
              onChange={(e) => setTalGiverFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none max-w-full truncate"
            >
              <option value="">Pemberi</option>
              {outstandingFiltersList.talGivers.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <select
              value={talReceiverFilter}
              onChange={(e) => setTalReceiverFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none max-w-full truncate"
            >
              <option value="">Penerima</option>
              {outstandingFiltersList.talReceivers.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pb-3 px-1">Tanggal</th>
                  <th className="py-2 pb-3 px-1">Alokasi Kas</th>
                  <th className="py-2 pb-3 px-1">Keterangan</th>
                  <th className="py-2 pb-3 px-1 text-center">Bukti</th>
                  <th className="py-2 pb-3 px-1 text-right">Jumlah</th>
                  <th className="py-2 pb-3 px-1 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600 font-medium">
                {activeOutstandingTalangan.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada outstanding talangan aktif.
                    </td>
                  </tr>
                ) : (
                  activeOutstandingTalangan.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-1 whitespace-nowrap font-bold text-slate-500">
                        {formatTanggal(t.tanggal)}
                      </td>
                      <td className="py-2.5 px-1">
                        <p className="font-extrabold text-red-500 text-[9px] uppercase">Dari: {t.subGiver}</p>
                        <p className="font-extrabold text-emerald-600 text-[9px] uppercase mt-0.5">Ke: {t.subReceiver}</p>
                      </td>
                      <td className="py-2.5 px-1 max-w-[120px] break-words whitespace-normal text-slate-500">
                        {t.keterangan || "-"}
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        {t.bukti ? (
                          <button
                            onClick={() => setViewReceipt(t.bukti!, `bukti_talangan_${t.id}.png`)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded inline-flex"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-300 font-light">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-1 text-right font-extrabold text-slate-800 whitespace-nowrap text-xs">
                        {formatIDR(t.jumlah)}
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handlePaybackTalangan(t.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-extrabold uppercase tracking-tight transition cursor-pointer"
                          >
                            LUNASI
                          </button>
                          <button
                            onClick={() => onDeleteTalangan(t.id)}
                            className="p-1 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition cursor-pointer"
                            title="Hapus talangan & transaksinya"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeOutstandingTalangan.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-100 font-extrabold text-slate-700 bg-slate-50/40">
                    <td colSpan={4} className="py-2 px-1 text-left pl-2 text-[10px]">
                      Total Outstanding Talangan
                    </td>
                    <td className="py-2 px-1 text-right text-amber-600 text-xs font-black">
                      {formatIDR(
                        activeOutstandingTalangan.reduce((sum, curr) => sum + curr.jumlah, 0)
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Hutang Aktif Outstanding */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 font-heading flex items-center">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 mr-2" />
                Hutang Aktif (Belum Lunas)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Daftar pinjaman kas desa kepada Pribadi (Kuwu/staf) yang belum dikembalikan ke kas.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrintHutang}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm transform active:scale-95 cursor-pointer flex-shrink-0"
              title="Cetak Laporan Hutang"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
          </div>

          {/* Filters mini row */}
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Cari..."
              value={hutSearch}
              onChange={(e) => setHutSearch(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none"
            />
            <select
              value={hutBorrowerFilter}
              onChange={(e) => setHutBorrowerFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none max-w-full truncate"
            >
              <option value="">Peminjam</option>
              {outstandingFiltersList.hutBorrowers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <select
              value={hutGiverFilter}
              onChange={(e) => setHutGiverFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl px-2 py-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none max-w-full truncate"
            >
              <option value="">Sumber Kas</option>
              {outstandingFiltersList.hutGivers.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pb-3 px-1">Tanggal</th>
                  <th className="py-2 pb-3 px-1">Peminjam</th>
                  <th className="py-2 pb-3 px-1">Sumber &amp; Ket</th>
                  <th className="py-2 pb-3 px-1 text-center">Bukti</th>
                  <th className="py-2 pb-3 px-1 text-right">Jumlah</th>
                  <th className="py-2 pb-3 px-1 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600 font-medium">
                {activeOutstandingHutang.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Tidak ada outstanding pinjaman hutang aktif.
                    </td>
                  </tr>
                ) : (
                  activeOutstandingHutang.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-2.5 px-1 whitespace-nowrap font-bold text-slate-500">
                        {formatTanggal(h.tanggal)}
                      </td>
                      <td className="py-2.5 px-1 font-bold text-slate-700 font-sans">
                        {h.peminjam}
                      </td>
                      <td className="py-2.5 px-1 max-w-[130px]">
                        <p className="font-extrabold text-slate-700 truncate">{h.subGiver}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{h.keterangan || "-"}</p>
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        {h.bukti ? (
                          <button
                            onClick={() => setViewReceipt(h.bukti!, `bukti_hutang_${h.id}.png`)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded inline-flex"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-300 font-light">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-1 text-right font-extrabold text-slate-800 whitespace-nowrap text-xs">
                        {formatIDR(h.jumlah)}
                      </td>
                      <td className="py-2.5 px-1 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handlePaybackHutang(h.id)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-extrabold uppercase tracking-tight transition cursor-pointer"
                          >
                            LUNASI
                          </button>
                          <button
                            onClick={() => onDeleteHutang(h.id)}
                            className="p-1 text-red-500 hover:bg-red-50 border border-red-100 rounded-lg transition cursor-pointer"
                            title="Hapus hutang & transaksinya"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {activeOutstandingHutang.length > 0 && (
                <tfoot>
                  <tr className="border-t border-slate-100 font-extrabold text-slate-700 bg-slate-50/40">
                    <td colSpan={4} className="py-2 px-1 text-left pl-2 text-[10px]">
                      Total Outstanding Hutang
                    </td>
                    <td className="py-2 px-1 text-right text-amber-600 text-xs font-black">
                      {formatIDR(
                        activeOutstandingHutang.reduce((sum, curr) => sum + curr.jumlah, 0)
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>

      {/* Formal Indonesian Village Document Print Preview Modal */}
      {printData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Injecting CSS specifically isolated to block everything except this print modal layout when window.print() is called */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #isolated-print-layout, #isolated-print-layout * {
                visibility: visible !important;
              }
              #isolated-print-layout {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                background-color: white !important;
                color: black !important;
              }
              .no-print-btn {
                display: none !important;
              }
            }
          `}</style>

          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Non-Printable Header Control Panel */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Pratinjau Cetak Formal (Kop Surat Desa)</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Laporan resmi berformat Siskeudes Pemerintah Desa</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintData(null)}
                  className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-400 rounded-xl transition cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body & Printable Paper */}
            <div className="p-6 overflow-y-auto bg-slate-100/70 flex-1 flex justify-center">
              {/* Paper Canvas */}
              <div 
                id="isolated-print-layout" 
                className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 border border-slate-200/50 shadow-sm text-black font-sans relative"
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                {/* Government Kop Surat Header */}
                <div className="text-center space-y-1 pb-4 border-b-4 border-black relative">
                  <h3 className="text-lg font-bold tracking-wide leading-tight">PEMERINTAH KABUPATEN CIREBON</h3>
                  <h3 className="text-md font-bold tracking-wide leading-tight">KECAMATAN GEMPOL</h3>
                  <h2 className="text-xl font-black tracking-wider leading-normal">PEMERINTAH DESA KEDUNGWUNI</h2>
                  <p className="text-xs font-semibold italic">Sekretariat: Jl. Raya Kedungwuni No. 01 Cirebon, Jawa Barat Kode Pos 45161</p>
                </div>
                
                {/* Double Border Line Style Divider */}
                <div className="border-t border-black mt-0.5 mb-6"></div>

                {/* Report Title */}
                <div className="text-center space-y-1 mb-6">
                  <h4 className="text-sm font-bold tracking-widest uppercase decoration-solid underline">
                    {printData.judul}
                  </h4>
                  <p className="text-xs italic text-slate-700">Tanggal Rekapitulasi: {new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                {/* Printable Table */}
                <table className="w-full border-collapse border border-black text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black py-2 px-1 text-center w-8">No</th>
                      <th className="border border-black py-2 px-2 text-left">Tanggal</th>
                      {printData.tipe === "talangan" ? (
                        <>
                          <th className="border border-black py-2 px-2 text-left">Rekening Pemberi (Giver)</th>
                          <th className="border border-black py-2 px-2 text-left">Rekening Penerima (Receiver)</th>
                        </>
                      ) : (
                        <>
                          <th className="border border-black py-2 px-2 text-left">Pihak Peminjam</th>
                          <th className="border border-black py-2 px-2 text-left">Anggaran Sumber Kas</th>
                        </>
                      )}
                      <th className="border border-black py-2 px-2 text-left">Keterangan</th>
                      <th className="border border-black py-2 px-2 text-right w-36">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.rows.length === 0 ? (
                      <tr>
                        <td colSpan={printData.tipe === "talangan" ? 6 : 5} className="border border-black py-4 text-center italic text-slate-500">
                          Tidak ada data outstanding aktif yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      printData.rows.map((row, idx) => (
                        <tr key={row.id}>
                          <td className="border border-black py-2 px-1 text-center">{idx + 1}</td>
                          <td className="border border-black py-2 px-2 whitespace-nowrap">{formatTanggal(row.tanggal)}</td>
                          {printData.tipe === "talangan" ? (
                            <>
                              <td className="border border-black py-2 px-2 font-medium">{row.subGiver}</td>
                              <td className="border border-black py-2 px-2 font-medium">{row.subReceiver}</td>
                            </>
                          ) : (
                            <>
                              <td className="border border-black py-2 px-2 font-bold">{row.peminjam}</td>
                              <td className="border border-black py-2 px-2 font-medium">{row.subGiver}</td>
                            </>
                          )}
                          <td className="border border-black py-2 px-2 max-w-[150px] break-words whitespace-normal">{row.keterangan || "-"}</td>
                          <td className="border border-black py-2 px-2 text-right font-bold tabular-nums">
                            {formatIDR(row.jumlah).replace("Rp", "Rp ")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={printData.tipe === "talangan" ? 5 : 4} className="border border-black py-2.5 px-2 text-right uppercase">
                        TOTAL OUTSTANDING AKTIF
                      </td>
                      <td className="border border-black py-2.5 px-2 text-right text-sm tabular-nums">
                        {formatIDR(printData.rows.reduce((sum, r) => sum + r.jumlah, 0)).replace("Rp", "Rp ")}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures block at the bottom */}
                <div className="grid grid-cols-2 gap-8 mt-12 text-xs text-center" style={{ pageBreakInside: 'avoid' }}>
                  <div className="space-y-16">
                    <div className="space-y-1">
                      <p className="font-semibold">Mengetahui &amp; Menyetujui,</p>
                      <p className="font-bold uppercase underline">Kuwu Desa Kedungwuni</p>
                    </div>
                    <div>
                      <p className="font-bold underline">( SUWANDA )</p>
                      <p className="text-[10px] text-slate-500 mt-1">NIP. 19740502 200906 1 003</p>
                    </div>
                  </div>

                  <div className="space-y-16">
                    <div className="space-y-1">
                      <p className="font-semibold">Kedungwuni, {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold uppercase underline">Bendahara Keuangan Desa</p>
                    </div>
                    <div>
                      <p className="font-bold underline">( SUSI SUSANTI, A.Md )</p>
                      <p className="text-[10px] text-slate-500 mt-1">NIP. 19881112 201103 2 004</p>
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="text-[8px] italic text-slate-400 text-center mt-12 absolute bottom-6 left-10 right-10 leading-normal border-t border-slate-100 pt-2">
                  Dokumen ini dihasilkan secara elektronik oleh Sistem Informasi Desa Digital Kedungwuni, Kecamatan Gempol, Kabupaten Cirebon.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
