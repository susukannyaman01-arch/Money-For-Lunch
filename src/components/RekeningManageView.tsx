import React, { useState, useMemo } from "react";
import { 
  FolderPlus, 
  Search, 
  Coins, 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  HelpCircle,
  Database,
  RotateCcw,
  CheckCircle,
  Info
} from "lucide-react";
import { Bidang, Kegiatan, SubKegiatan, SumberDana, Anggaran, Transaksi } from "../types";

interface RekeningManageViewProps {
  bidang: Bidang[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
  sumberDana: SumberDana[];
  anggaran: Anggaran[];
  transaksi: Transaksi[];
  onAddSubKegiatan: (namaSub: string, idKegiatan: number) => number; // returns new id_sub
  onAddAnggaran: (idBidang: number, idKegiatan: number, idSub: number, idSumber: number, pagu: number) => void;
  onUpdatePagu: (idAnggaran: number, newPagu: number) => void;
  onDeleteAnggaran: (idAnggaran: number) => boolean; // returns true if success
  onResetMaster: () => void;
  onAddKegiatan: (namaKegiatan: string, idBidang: number) => number;
}

export default function RekeningManageView({
  bidang,
  kegiatan,
  subKegiatan,
  sumberDana,
  anggaran,
  transaksi,
  onAddSubKegiatan,
  onAddAnggaran,
  onUpdatePagu,
  onDeleteAnggaran,
  onResetMaster,
  onAddKegiatan
}: RekeningManageViewProps) {
  // Navigation tabs inside Rekening Management
  const [activeTab, setActiveTab] = useState<"list" | "add">("list");

  // Form states for adding new Kode Rekening
  const [selectedBidangId, setSelectedBidangId] = useState<number | "">("");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | "">("");
  
  // Custom custom names
  const [isCustomKegiatan, setIsCustomKegiatan] = useState(false);
  const [customKegiatanName, setCustomKegiatanName] = useState("");
  const [newSubKegiatanName, setNewSubKegiatanName] = useState("");
  const [selectedSumberId, setSelectedSumberId] = useState<number | "">("");
  const [newPagu, setNewPagu] = useState<number | " text">("");

  // Search & Filters for List
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBidang, setFilterBidang] = useState<number | "">("");

  // Edit inline Pagu states
  const [editingAnggaranId, setEditingAnggaranId] = useState<number | null>(null);
  const [editingPaguValue, setEditingPaguValue] = useState<number | "">("");

  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Helper IDR formatting
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Filtered dropdown for Form
  const formFilteredKegiatan = useMemo(() => {
    if (selectedBidangId === "") return [];
    return kegiatan.filter((k) => k.id_bidang === selectedBidangId);
  }, [kegiatan, selectedBidangId]);

  // Master list of Budgets mapped beautifully
  const mappedAnggaran = useMemo(() => {
    return anggaran.map((a) => {
      const bObj = bidang.find((b) => b.id_bidang === a.id_bidang);
      const kObj = kegiatan.find((k) => k.id_kegiatan === a.id_kegiatan);
      const sObj = subKegiatan.find((s) => s.id_sub === a.id_sub);
      const sdObj = sumberDana.find((sd) => sd.id_sumber === a.id_sumber);

      // Calculate spent on this budget
      const terpakai = transaksi
        .filter((tx) => tx.id_anggaran === a.id)
        .reduce((sum, tx) => {
          if (tx.tipe === "Pengeluaran") return sum + tx.jumlah;
          if (tx.tipe === "Pemasukan" && tx.ref_id) return sum - tx.jumlah; // refund
          return sum;
        }, 0);

      return {
        id: a.id,
        id_bidang: a.id_bidang,
        nama_bidang: bObj?.nama_bidang || "Lainnya",
        id_kegiatan: a.id_kegiatan,
        nama_kegiatan: kObj?.nama_kegiatan || "Lainnya",
        id_sub: a.id_sub,
        nama_sub: sObj?.nama_sub || "Lainnya",
        id_sumber: a.id_sumber,
        nama_sumber: sdObj?.nama_sumber || "Lainnya",
        pagu: a.pagu,
        terpakai,
        sisa: a.pagu - terpakai
      };
    }).filter((item) => {
      // Apply search query filter
      const matchesSearch = 
        item.nama_sub.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nama_kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nama_sumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `rekening-${item.id_sub}-${item.id}`.includes(searchQuery.toLowerCase());

      // Apply Bidang filter
      const matchesBidang = filterBidang === "" || item.id_bidang === filterBidang;

      return matchesSearch && matchesBidang;
    });
  }, [anggaran, bidang, kegiatan, subKegiatan, sumberDana, transaksi, searchQuery, filterBidang]);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateRekening = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBidangId === "") {
      showNotification("Pilihlah Bidang terlebih dahulu!", "error");
      return;
    }

    let kegId: number;
    if (isCustomKegiatan) {
      if (!customKegiatanName.trim()) {
        showNotification("Ketikkan Nama kegiatan baru!", "error");
        return;
      }
      // Create new custom Kegiatan via parent state callback
      kegId = onAddKegiatan(customKegiatanName.trim(), selectedBidangId);
    } else {
      if (selectedKegiatanId === "") {
        showNotification("Pilihlah Kegiatan terlebih dahulu!", "error");
        return;
      }
      kegId = selectedKegiatanId;
    }

    if (!newSubKegiatanName.trim()) {
      showNotification("Masukkan Nama Sub Kegiatan (Buku Rekening)!", "error");
      return;
    }

    if (selectedSumberId === "") {
      showNotification("Pilihlah Sumber Dana!", "error");
      return;
    }

    const paguValue = Number(newPagu);
    if (isNaN(paguValue) || paguValue < 0) {
      showNotification("Masukkan nominal pagu anggaran yang valid!", "error");
      return;
    }

    // Step 1: Create SubKegiatan
    const newSubId = onAddSubKegiatan(newSubKegiatanName.trim(), kegId);

    // Step 2: Create Anggaran
    onAddAnggaran(
      selectedBidangId,
      kegId,
      newSubId,
      selectedSumberId,
      paguValue
    );

    showNotification(`Luar biasa! Rekening '${newSubKegiatanName.trim()}' berhasil ditambahkan ke APBDes.`);
    
    // Reset Form
    setNewSubKegiatanName("");
    setNewPagu("");
    setSelectedSumberId("");
    setIsCustomKegiatan(false);
    setCustomKegiatanName("");
    setActiveTab("list");
  };

  const handleStartEditPagu = (aId: number, currentPagu: number) => {
    setEditingAnggaranId(aId);
    setEditingPaguValue(currentPagu);
  };

  const handleSavePagu = (aId: number) => {
    const value = Number(editingPaguValue);
    if (isNaN(value) || value < 0) {
      showNotification("Nominal Pagu tidak valid!", "error");
      return;
    }

    onUpdatePagu(aId, value);
    setEditingAnggaranId(null);
    showNotification("Pagu alokasi anggaran berhasil diperbarui!");
  };

  const handleDelete = (aId: number, subName: string) => {
    const isSuccess = onDeleteAnggaran(aId);
    if (isSuccess) {
      showNotification(`Buku Rekening '${subName}' telah dihapus dari APBDes.`);
    } else {
      showNotification(`Gagal: Rekening '${subName}' tidak bisa dihapus karena sudah memiliki transaksi tercatat di kas!`, "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switchers */}
      <div className="flex space-x-1.5 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl w-full max-w-sm">
        <button
          onClick={() => setActiveTab("list")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "list"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Daftar Rekening &amp; Pagu
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "add"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ➕ Tambah Rekening Baru
        </button>
      </div>

      {/* Dynamic Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-extrabold shadow-sm animate-fade-in ${
          notification.type === "success"
            ? "bg-emerald-50/70 border-emerald-100 text-emerald-800"
            : "bg-red-50/70 border-red-100 text-red-800"
        }`}>
          <CheckCircle className={`w-4 h-4 ${notification.type === "success" ? "text-emerald-600" : "text-red-500"}`} />
          <span>{notification.text}</span>
        </div>
      )}

      {/* TAB 1: LISTING & MANAGE */}
      {activeTab === "list" && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          {/* Header & Filters */}
          <div className="p-6 border-b border-slate-50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base font-heading">
                  Struktur Rekening Alokasi APBDes
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                  Buku Pagu Anggaran Desa Aktif
                </p>
              </div>
              
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-red-500 hover:text-red-700 bg-red-50/20 border border-red-100 rounded-xl text-xs font-bold cursor-pointer transition active:scale-95"
                  title="Kembalikan semua alokasi anggaran dan transaksi ke bawaan awal"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default APBDes</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-red-50 p-2 border border-red-100 rounded-xl">
                  <span className="text-[10px] font-black text-red-600">Yakin reset master?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetMaster();
                      showNotification("Sukses! Database master direset.");
                      setShowResetConfirm(false);
                    }}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition active:scale-95"
                  >
                    Ya
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Searchbox */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Rekening, Kegiatan, atau Sumber Dana..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-205 rounded-xl pl-10 pr-4 py-3 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-505 transition"
                />
              </div>

              {/* Dropdown Bidang filter */}
              <select
                value={filterBidang}
                onChange={(e) => setFilterBidang(e.target.value === "" ? "" : Number(e.target.value))}
                className="text-xs bg-slate-50 border border-slate-205 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-505"
              >
                <option value="">Semua Bidang Pemerintah</option>
                {bidang.map((b) => (
                  <option key={b.id_bidang} value={b.id_bidang}>{b.nama_bidang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-50">
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px]">ID Rek</th>
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px]">Klasifikasi (Bidang &amp; Kegiatan)</th>
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px]">Nama Sub-Kegiatan / Rekening</th>
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px] text-center">Sumber</th>
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px] text-right">PAGU Alokasi</th>
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px] text-right">Realisasi / Sisa</th>
                  <th className="py-4 px-6 font-extrabold uppercase tracking-wider text-[10px] text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {mappedAnggaran.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-bold">
                      <Database className="w-10 h-10 mx-auto text-slate-300 mb-2 animate-bounce" />
                      Tidak ditemukan kode rekening dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  mappedAnggaran.map((item) => {
                    const isEditing = editingAnggaranId === item.id;
                    const hasTransactions = item.terpakai > 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/45 transition">
                        {/* ID */}
                        <td className="py-4 px-6 font-mono text-[10px] text-slate-400">
                          {item.id_sub}.{item.id}
                        </td>

                        {/* Bidang & Kegiatan */}
                        <td className="py-4 px-6 max-w-xs">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{item.nama_bidang}</p>
                          <p className="font-extrabold text-slate-800 line-clamp-1 mt-0.5">{item.nama_kegiatan}</p>
                        </td>

                        {/* Nama Sub */}
                        <td className="py-4 px-6 max-w-sm">
                          <p className="font-black text-slate-700 leading-snug">{item.nama_sub}</p>
                        </td>

                        {/* Sumber Dana Badge */}
                        <td className="py-4 px-6 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black">
                            {item.nama_sumber}
                          </span>
                        </td>

                        {/* Pagu Alokasi */}
                        <td className="py-4 px-6 text-right font-bold">
                          {isEditing ? (
                            <div className="flex items-center justify-end space-x-1">
                              <span className="text-[10px] text-slate-400">Rp</span>
                              <input
                                type="number"
                                value={editingPaguValue}
                                onChange={(e) => setEditingPaguValue(e.target.value === "" ? "" : Number(e.target.value))}
                                className="w-24 px-2 py-1 text-right text-xs border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <span className="font-mono text-slate-800 font-extrabold text-xs">
                              {formatIDR(item.pagu)}
                            </span>
                          )}
                        </td>

                        {/* Realisasi & Sisa */}
                        <td className="py-4 px-6 text-right">
                          <p className="font-mono text-slate-400 text-[10px] font-semibold">
                            Realisasi: {formatIDR(item.terpakai)}
                          </p>
                          <p className={`font-mono text-xs font-black mt-0.5 ${
                            item.sisa < 0 ? "text-red-500" : "text-emerald-600"
                          }`}>
                            Sisa: {formatIDR(item.sisa)}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSavePagu(item.id)}
                                  className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center space-x-0.5 cursor-pointer"
                                  title="Simpan Pagu"
                                >
                                  <Save className="w-3 h-3" />
                                  <span>Simpan</span>
                                </button>
                                <button
                                  onClick={() => setEditingAnggaranId(null)}
                                  className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEditPagu(item.id, item.pagu)}
                                  className="p-1.5 hover:bg-slate-100 text-indigo-500 hover:text-indigo-700 rounded-lg transition cursor-pointer"
                                  title="Ubah Nilai Pagu"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDelete(item.id, item.nama_sub)}
                                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                                    hasTransactions 
                                      ? "text-slate-300 cursor-not-allowed" 
                                      : "text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                  }`}
                                  disabled={hasTransactions}
                                  title={hasTransactions ? "Gabisa dihapus karena sudah dipakai transaksi" : "Hapus Rekening"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ADD NEW FORM */}
      {activeTab === "add" && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-50 pb-4">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm font-heading">
                Tambah Rekening &amp; Alokasi Pagu Baru
              </h4>
              <p className="text-slate-400 text-[11px] font-semibold">
                Form pembuatan nomor kode rekening sub-kegiatan fisik/non-fisik desa.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateRekening} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bidang Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  1. Pilih Bidang Klasifikasi
                </label>
                <select
                  required
                  value={selectedBidangId}
                  onChange={(e) => {
                    setSelectedBidangId(Number(e.target.value));
                    setSelectedKegiatanId("");
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-extrabold"
                >
                  <option value="">-- PILIH BIDANG --</option>
                  {bidang.map((b) => (
                    <option key={b.id_bidang} value={b.id_bidang}>{b.nama_bidang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Kegiatan Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    2. Pilih Kegiatan Desa
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomKegiatan(!isCustomKegiatan)}
                    className="text-[10px] font-black text-indigo-600 hover:underline"
                  >
                    {isCustomKegiatan ? "✓ Pilih Dari List" : "➕ Tulis Kegiatan Baru"}
                  </button>
                </div>

                {isCustomKegiatan ? (
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pembinaan Adat/Tradisi Ruwat Bumi"
                    value={customKegiatanName}
                    onChange={(e) => setCustomKegiatanName(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                ) : (
                  <select
                    required
                    disabled={selectedBidangId === ""}
                    value={selectedKegiatanId}
                    onChange={(e) => setSelectedKegiatanId(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold disabled:opacity-60"
                  >
                    <option value="">{selectedBidangId === "" ? "Silahkan pilih bidang dulu" : "-- PILIH KEGIATAN --"}</option>
                    {formFilteredKegiatan.map((k) => (
                      <option key={k.id_kegiatan} value={k.id_kegiatan}>{k.nama_kegiatan}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Sub Kegiatan Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  3. Nama Rekening / Sub Kegiatan Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Honor Tenaga Linmas Pengamanan Lebaran"
                  value={newSubKegiatanName}
                  onChange={(e) => setNewSubKegiatanName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-extrabold text-slate-800"
                />
              </div>

              {/* Sumber Dana & Pagu */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    4. Sumber Dana
                  </label>
                  <select
                    required
                    value={selectedSumberId}
                    onChange={(e) => setSelectedSumberId(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="">-- SUMBER --</option>
                    {sumberDana.map((sd) => (
                      <option key={sd.id_sumber} value={sd.id_sumber}>{sd.nama_sumber}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    5. Pagu Anggaran (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Nominal Rp"
                    value={newPagu}
                    onChange={(e) => setNewPagu(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-right"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-100 cursor-pointer transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan Rekening Pagu Baru</span>
              </button>
            </div>
          </form>

          {/* Tips Info box */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 flex items-start space-x-3">
            <Info className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed font-bold">
              Tip Rekening: Kode rekening yang Anda buat ini langsung otomatis terdaftar di modul pencatatan buku kas (Transaksi) dan visualisasi rekap. Anda dapat menggunakan filter pencarian untuk memonitor sisa pagu anggaran secara real-time.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
