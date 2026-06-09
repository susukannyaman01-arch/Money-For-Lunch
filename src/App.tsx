/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Wallet, 
  LayoutDashboard, 
  Coins, 
  Handshake, 
  FileSpreadsheet, 
  History, 
  Menu, 
  X, 
  Database,
  Calendar,
  Image as ImageIcon,
  Download,
  AlertCircle,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck
} from "lucide-react";
import { 
  MASTER_BIDANG, 
  MASTER_KEGIATAN, 
  MASTER_SUB_KEGIATAN, 
  MASTER_SUMBER_DANA, 
  MASTER_ANGGARAN,
  Transaksi, 
  Talangan, 
  Hutang 
} from "./types";
import Dashboard from "./components/Dashboard";
import TransaksiView from "./components/TransaksiView";
import TalanganHutangView from "./components/TalanganHutangView";
import RekapView from "./components/RekapView";
import RiwayatView from "./components/RiwayatView";
import SheetsSyncView from "./components/SheetsSyncView";
import RekeningManageView from "./components/RekeningManageView";
import PinSetupModal from "./components/PinSetupModal";
import {
  INITIAL_TRANSAKSI,
  INITIAL_TALANGAN,
  INITIAL_HUTANG
} from "./initialDatabase";

export default function App() {
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "transaksi" | "talangan" | "rekap" | "riwayat" | "sheets" | "rekening">("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Stateful Master Structure lists (Persisted in LocalStorage)
  const [bidangList, setBidangList] = useState<any[]>(() => {
    const saved = localStorage.getItem("desa_master_bidang");
    return saved ? JSON.parse(saved) : MASTER_BIDANG;
  });

  const [kegiatanList, setKegiatanList] = useState<any[]>(() => {
    const saved = localStorage.getItem("desa_master_kegiatan");
    return saved ? JSON.parse(saved) : MASTER_KEGIATAN;
  });

  const [subKegiatanList, setSubKegiatanList] = useState<any[]>(() => {
    const saved = localStorage.getItem("desa_master_sub_kegiatan");
    return saved ? JSON.parse(saved) : MASTER_SUB_KEGIATAN;
  });

  const [sumberDanaList, setSumberDanaList] = useState<any[]>(() => {
    const saved = localStorage.getItem("desa_master_sumber_dana");
    return saved ? JSON.parse(saved) : MASTER_SUMBER_DANA;
  });

  const [anggaranList, setAnggaranList] = useState<any[]>(() => {
    const saved = localStorage.getItem("desa_master_anggaran");
    return saved ? JSON.parse(saved) : MASTER_ANGGARAN;
  });

  // Core Ledger Database States (Persisted in LocalStorage)
  const [transaksi, setTransaksi] = useState<Transaksi[]>(() => {
    const saved = localStorage.getItem("desa_transaksi");
    if (!saved) return INITIAL_TRANSAKSI;
    try {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : INITIAL_TRANSAKSI;
    } catch {
      return INITIAL_TRANSAKSI;
    }
  });

  const [talangan, setTalangan] = useState<Talangan[]>(() => {
    const saved = localStorage.getItem("desa_talangan");
    if (!saved) return INITIAL_TALANGAN;
    try {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : INITIAL_TALANGAN;
    } catch {
      return INITIAL_TALANGAN;
    }
  });

  const [hutang, setHutang] = useState<Hutang[]>(() => {
    const saved = localStorage.getItem("desa_hutang");
    if (!saved) return INITIAL_HUTANG;
    try {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed : INITIAL_HUTANG;
    } catch {
      return INITIAL_HUTANG;
    }
  });

  // Modal Views States
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [receiptName, setReceiptName] = useState<string>("");

  // Custom non-blocking modal confirmation dialog (instead of window.confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  // Theme Mode State (Persisted in LocalStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme_mode");
    return saved === "dark";
  });

  // Security PIN Lock State
  const [appPin, setAppPin] = useState<string>(() => {
    return localStorage.getItem("desa_app_pin") || "";
  });
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    return !!localStorage.getItem("desa_app_pin");
  });
  const [showPinSetupModal, setShowPinSetupModal] = useState<boolean>(false);

  // Lifted Google Spreadsheet Integration States
  const [scriptUrl, setScriptUrl] = useState<string>(() => {
    return localStorage.getItem("google_apps_script_url") || "";
  });

  const [isAutoSync, setIsAutoSync] = useState<boolean>(() => {
    return localStorage.getItem("google_sheets_auto_sync") === "true";
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error" | null>(null);
  const isImporting = useRef<boolean>(false);

  // Background Auto-Sync effect triggered by core state mutations
  useEffect(() => {
    if (isImporting.current) {
      return;
    }

    if (!isAutoSync || !scriptUrl) {
      return;
    }

    const handler = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const payload = {
          action: "export",
          transaksi: transaksi,
          talangan: talangan,
          hutang: hutang
        };

        const response = await fetch(scriptUrl, {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        });

        const resText = await response.text();
        let resJson;
        try {
          resJson = JSON.parse(resText);
        } catch {
          resJson = { status: "success" };
        }

        if (response.ok && (resJson.status === "success" || resJson.success)) {
          setSyncStatus("success");
          // Clear status after 3 seconds
          setTimeout(() => setSyncStatus(null), 3000);
        } else {
          setSyncStatus("error");
        }
      } catch (err) {
        console.error("Auto-sync background error: ", err);
        setSyncStatus("error");
      }
    }, 1200); // 1.2 second debounce to prevent rapid fire

    return () => clearTimeout(handler);
  }, [transaksi, talangan, hutang, isAutoSync, scriptUrl]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("desa_master_bidang", JSON.stringify(bidangList));
  }, [bidangList]);

  useEffect(() => {
    localStorage.setItem("desa_master_kegiatan", JSON.stringify(kegiatanList));
  }, [kegiatanList]);

  useEffect(() => {
    localStorage.setItem("desa_master_sub_kegiatan", JSON.stringify(subKegiatanList));
  }, [subKegiatanList]);

  useEffect(() => {
    localStorage.setItem("desa_master_sumber_dana", JSON.stringify(sumberDanaList));
  }, [sumberDanaList]);

  useEffect(() => {
    localStorage.setItem("desa_master_anggaran", JSON.stringify(anggaranList));
  }, [anggaranList]);

  useEffect(() => {
    localStorage.setItem("desa_transaksi", JSON.stringify(transaksi));
  }, [transaksi]);

  useEffect(() => {
    localStorage.setItem("desa_talangan", JSON.stringify(talangan));
  }, [talangan]);

  useEffect(() => {
    localStorage.setItem("desa_hutang", JSON.stringify(hutang));
  }, [hutang]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme_mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme_mode", "light");
    }
  }, [isDarkMode]);

  // Dynamic helper: resolves reference labels to display names beautifully
  const resolvedTransaksi = useMemo(() => {
    return transaksi.map((t) => {
      const ang = anggaranList.find((a) => a.id === t.id_anggaran);
      const sub = ang ? subKegiatanList.find((s) => s.id_sub === ang.id_sub) : undefined;
      const sd = ang ? sumberDanaList.find((s) => s.id_sumber === ang.id_sumber) : undefined;
      const keg = ang ? kegiatanList.find((k) => k.id_kegiatan === ang.id_kegiatan) : undefined;

      return {
        ...t,
        kegiatan: keg?.nama_kegiatan || "Lain-lain",
        subKegiatan: sub?.nama_sub || "Lain-lain",
        sumberDana: sd?.nama_sumber || "Lain-lain"
      };
    });
  }, [transaksi, anggaranList, subKegiatanList, sumberDanaList, kegiatanList]);

  const resolvedTalangan = useMemo(() => {
    return talangan.map((t) => {
      const giverAng = anggaranList.find((a) => a.id === t.id_anggaran_pemberi);
      const receiverAng = anggaranList.find((a) => a.id === t.id_anggaran_penerima);
      
      const giverSub = giverAng ? subKegiatanList.find((s) => s.id_sub === giverAng.id_sub) : undefined;
      const receiverSub = receiverAng ? subKegiatanList.find((s) => s.id_sub === receiverAng.id_sub) : undefined;

      const giverSd = giverAng ? sumberDanaList.find((sd) => sd.id_sumber === giverAng.id_sumber) : undefined;
      const receiverSd = receiverAng ? sumberDanaList.find((sd) => sd.id_sumber === receiverAng.id_sumber) : undefined;

      return {
        ...t,
        subGiver: `${giverSub?.nama_sub || "-"} (${giverSd?.nama_sumber || "-"})`,
        subReceiver: `${receiverSub?.nama_sub || "-"} (${receiverSd?.nama_sumber || "-"})`
      };
    });
  }, [talangan, anggaranList, subKegiatanList, sumberDanaList]);

  const resolvedHutang = useMemo(() => {
    return hutang.map((h) => {
      const giverAng = anggaranList.find((a) => a.id === h.id_anggaran_pemberi);
      const giverSub = giverAng ? subKegiatanList.find((s) => s.id_sub === giverAng.id_sub) : undefined;
      const giverSd = giverAng ? sumberDanaList.find((sd) => sd.id_sumber === giverAng.id_sumber) : undefined;

      return {
        ...h,
        subGiver: `${giverSub?.nama_sub || "-"} (${giverSd?.nama_sumber || "-"})`
      };
    });
  }, [hutang, anggaranList, subKegiatanList, sumberDanaList]);

  const getAnggaranLabel = (angId: number) => {
    const ang = anggaranList.find((a) => a.id === angId);
    if (!ang) return "ID " + angId;
    const sub = subKegiatanList.find((s) => s.id_sub === ang.id_sub);
    const sum = sumberDanaList.find((sd) => sd.id_sumber === ang.id_sumber);
    return `${sub ? sub.nama_sub : "-"} (${sum ? sum.nama_sumber : "-"})`;
  };

  // Actions: Add Transaction manually (Transaksi Menu Form submit)
  const handleAddTransaksi = (newTx: Omit<Transaksi, "id" | "timestamp">) => {
    const id = "TX-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = new Date().toISOString();
    
    setTransaksi((prev) => [
      ...prev,
      {
        ...newTx,
        id,
        timestamp
      }
    ]);
  };

  // Actions: Update transaction manually
  const handleUpdateTransaksi = (id: string, updatedTx: Omit<Transaksi, "id" | "timestamp">) => {
    setTransaksi((prev) => 
      prev.map((t) => (t.id === id ? { ...t, ...updatedTx } : t))
    );
  };

  // Actions: Delete transaction manually
  const handleDeleteTransaksi = (id: string) => {
    requestConfirm(
      "Konfirmasi Hapus Transaksi",
      "Apakah Anda yakin ingin menghapus transaksi ini dari rekap buku kas? Tindakan ini tidak dapat dibatalkan.",
      () => {
        setTransaksi((prev) => prev.filter((t) => t.id !== id));
      }
    );
  };

  // Actions for dynamic master data lists
  const handleAddSubKegiatan = (namaSub: string, idKegiatan: number) => {
    const nextId = Math.max(...subKegiatanList.map((s) => s.id_sub), 0) + 1;
    const newSubObj = {
      id_sub: nextId,
      id_kegiatan: idKegiatan,
      nama_sub: namaSub
    };
    setSubKegiatanList((prev) => [...prev, newSubObj]);
    return nextId;
  };

  const handleAddAnggaran = (idBidang: number, idKegiatan: number, idSub: number, idSumber: number, pagu: number) => {
    const nextId = Math.max(...anggaranList.map((a) => a.id), 0) + 1;
    const newAngObj = {
      id: nextId,
      id_bidang: idBidang,
      id_kegiatan: idKegiatan,
      id_sub: idSub,
      id_sumber: idSumber,
      pagu: pagu
    };
    setAnggaranList((prev) => [...prev, newAngObj]);
  };

  const handleUpdatePagu = (idAnggaran: number, newPagu: number) => {
    setAnggaranList((prev) =>
      prev.map((a) => (a.id === idAnggaran ? { ...a, pagu: newPagu } : a))
    );
  };

  const handleDeleteAnggaran = (idAnggaran: number) => {
    const isUsed = transaksi.some((tx) => tx.id_anggaran === idAnggaran);
    if (isUsed) return false;
    setAnggaranList((prev) => prev.filter((a) => a.id !== idAnggaran));
    return true;
  };

  const handleResetMaster = () => {
    localStorage.removeItem("desa_master_bidang");
    localStorage.removeItem("desa_master_kegiatan");
    localStorage.removeItem("desa_master_sub_kegiatan");
    localStorage.removeItem("desa_master_sumber_dana");
    localStorage.removeItem("desa_master_anggaran");
    localStorage.removeItem("desa_transaksi");
    localStorage.removeItem("desa_talangan");
    localStorage.removeItem("desa_hutang");

    setBidangList(MASTER_BIDANG);
    setKegiatanList(MASTER_KEGIATAN);
    setSubKegiatanList(MASTER_SUB_KEGIATAN);
    setSumberDanaList(MASTER_SUMBER_DANA);
    setAnggaranList(MASTER_ANGGARAN);
    setTransaksi(INITIAL_TRANSAKSI);
    setTalangan(INITIAL_TALANGAN);
    setHutang(INITIAL_HUTANG);
  };

  // Actions: Create a brand new bailout (Talangan)
  const handleAddTalangan = (newTal: Omit<Talangan, "id" | "status" | "tanggal_lunas" | "timestamp">) => {
    const id = "TL-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = new Date().toISOString();

    const createdTalangan: Talangan = {
      ...newTal,
      id,
      status: "Belum Lunas",
      timestamp
    };

    setTalangan((prev) => [...prev, createdTalangan]);

    // Automatically register corresponding cascading automated journal entries matching Code.gs
    const giverLabel = getAnggaranLabel(newTal.id_anggaran_pemberi);
    const receiverLabel = getAnggaranLabel(newTal.id_anggaran_penerima);

    const companionRecTrans: Transaksi = {
      id: "TX-AT-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: newTal.tanggal,
      tipe: "Pemasukan",
      id_anggaran: newTal.id_anggaran_penerima,
      jumlah: newTal.jumlah,
      keterangan: `Penerimaan Talangan dari Anggaran ${giverLabel}: ${newTal.keterangan}`,
      ref_id: id,
      bukti: newTal.bukti,
      timestamp
    };

    const companionExpTrans: Transaksi = {
      id: "TX-AT-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: newTal.tanggal,
      tipe: "Pengeluaran",
      id_anggaran: newTal.id_anggaran_penerima,
      jumlah: newTal.jumlah,
      keterangan: `Penggunaan Dana Talangan dari Anggaran ${giverLabel}: ${newTal.keterangan}`,
      ref_id: id,
      bukti: newTal.bukti,
      timestamp
    };

    const companionGiverTrans: Transaksi = {
      id: "TX-AT-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: newTal.tanggal,
      tipe: "Pengeluaran",
      id_anggaran: newTal.id_anggaran_pemberi,
      jumlah: newTal.jumlah,
      keterangan: `Pemberian Talangan ke Anggaran ${receiverLabel}: ${newTal.keterangan}`,
      ref_id: id,
      bukti: newTal.bukti,
      timestamp
    };

    setTransaksi((prev) => [...prev, companionRecTrans, companionExpTrans, companionGiverTrans]);
  };

  // Actions: Payback Talangan
  const handlePayTalangan = (id: string, tanggal_lunas: string) => {
    const talItem = talangan.find((t) => t.id === id);
    if (!talItem) return;

    setTalangan((prev) => 
      prev.map((t) => (t.id === id ? { ...t, status: "Lunas", tanggal_lunas } : t))
    );

    const timestamp = new Date().toISOString();
    const giverLabel = getAnggaranLabel(talItem.id_anggaran_pemberi);
    const receiverLabel = getAnggaranLabel(talItem.id_anggaran_penerima);

    // Register reimbursing automated journal entries matching Code.gs
    const paybackSenderTrans: Transaksi = {
      id: "TX-PAY-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: tanggal_lunas,
      tipe: "Pengeluaran",
      id_anggaran: talItem.id_anggaran_penerima,
      jumlah: talItem.jumlah,
      keterangan: `Pelunasan Pengembalian Talangan ke Anggaran ${giverLabel}`,
      ref_id: id,
      timestamp
    };

    const paybackReceiverTrans: Transaksi = {
      id: "TX-PAY-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: tanggal_lunas,
      tipe: "Pemasukan",
      id_anggaran: talItem.id_anggaran_pemberi,
      jumlah: talItem.jumlah,
      keterangan: `Pelunasan Penerimaan Pengembalian Talangan dari Anggaran ${receiverLabel}`,
      ref_id: id,
      timestamp
    };

    setTransaksi((prev) => [...prev, paybackSenderTrans, paybackReceiverTrans]);
  };

  // Actions: Delete Talangan and cascade delete all related auto transactions
  const handleDeleteTalangan = (id: string) => {
    requestConfirm(
      "Konfirmasi Hapus Talangan",
      "Apakah Anda yakin ingin menghapus data talangan ini? Semua transaksi terkait dalam rekap buku kas akan ikut terhapus.",
      () => {
        setTalangan((prev) => prev.filter((t) => t.id !== id));
        setTransaksi((prev) => prev.filter((tx) => tx.ref_id !== id));
      }
    );
  };

  // Actions: Create a brand new loan to personal (Hutang)
  const handleAddHutang = (newHut: Omit<Hutang, "id" | "status" | "tanggal_lunas" | "timestamp">) => {
    const id = "HT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    const timestamp = new Date().toISOString();

    const createdHutang: Hutang = {
      ...newHut,
      id,
      status: "Belum Lunas",
      timestamp
    };

    setHutang((prev) => [...prev, createdHutang]);

    // Automatically register corresponding expenditure transaction inside Code.gs
    const companionHutTrans: Transaksi = {
      id: "TX-AT-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: newHut.tanggal,
      tipe: "Pengeluaran",
      id_anggaran: newHut.id_anggaran_pemberi,
      jumlah: newHut.jumlah,
      keterangan: `Pemberian Pinjaman Hutang ke ${newHut.peminjam}: ${newHut.keterangan}`,
      ref_id: id,
      bukti: newHut.bukti,
      timestamp
    };

    setTransaksi((prev) => [...prev, companionHutTrans]);
  };

  // Actions: Payback Hutang
  const handlePayHutang = (id: string, tanggal_lunas: string) => {
    const hutItem = hutang.find((h) => h.id === id);
    if (!hutItem) return;

    setHutang((prev) => 
      prev.map((h) => (h.id === id ? { ...h, status: "Lunas", tanggal_lunas } : h))
    );

    const timestamp = new Date().toISOString();
    const giverLabel = getAnggaranLabel(hutItem.id_anggaran_pemberi);

    // Register income automated journal entries matching Code.gs
    const paybackHutTrans: Transaksi = {
      id: "TX-PAY-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      tanggal: tanggal_lunas,
      tipe: "Pemasukan",
      id_anggaran: hutItem.id_anggaran_pemberi,
      jumlah: hutItem.jumlah,
      keterangan: `Pelunasan Pengembalian Pinjaman Hutang dari ${hutItem.peminjam} (Anggaran: ${giverLabel})`,
      ref_id: id,
      timestamp
    };

    setTransaksi((prev) => [...prev, paybackHutTrans]);
  };

  // Actions: Delete Hutang and cascade delete all related auto transactions
  const handleDeleteHutang = (id: string) => {
    requestConfirm(
      "Konfirmasi Hapus Hutang",
      "Apakah Anda yakin ingin menghapus data hutang ini? Semua transaksi terkait dalam rekap buku kas akan ikut terhapus.",
      () => {
        setHutang((prev) => prev.filter((h) => h.id !== id));
        setTransaksi((prev) => prev.filter((tx) => tx.ref_id !== id));
      }
    );
  };

  // Reset Database (Sheets Inisialisasi)
  const handleResetDatabase = () => {
    requestConfirm(
      "Inisialisasi Spreadsheet Database",
      "Apakah Anda yakin ingin menginisialisasi spreadsheet database? Seluruh data operasional akan dikembalikan ke pengaturan awal.",
      () => {
        setTransaksi(INITIAL_TRANSAKSI);
        setTalangan(INITIAL_TALANGAN);
        setHutang(INITIAL_HUTANG);
        alert("Inisialisasi Sukses! Database Keuangan Desa berhasil dikembalikan ke data awal.");
      }
    );
  };

  // Dynamic Header Titles
  const pageTitle = useMemo(() => {
    if (activeMenu === "dashboard") return "Dashboard Ringkasan";
    if (activeMenu === "transaksi") return "Pencatatan Transaksi";
    if (activeMenu === "talangan") return "Talangan & Hutang";
    if (activeMenu === "rekap") return "Rekap Realisasi Anggaran";
    if (activeMenu === "sheets") return "Google Sheets Sync";
    if (activeMenu === "rekening") return "Kelola Kode Rekening & Pagu";
    return "Riwayat Aktivitas Log";
  }, [activeMenu]);

  const pageSubtitle = useMemo(() => {
    if (activeMenu === "dashboard") return "Gambaran umum serta rekapitulasi statistik pembagian kas desa.";
    if (activeMenu === "transaksi") return "Pengukuran real-time nominal pengeluaran dan penerimaan belanja desa.";
    if (activeMenu === "talangan") return "Manajemen penanganan talangan internal dan pinjaman luar kas desa.";
    if (activeMenu === "rekap") return "Review pembagian persentase pagu APBDes dibanding realisasi aktual belanja.";
    if (activeMenu === "sheets") return "Sinkronisasi dua arah menuju cloud database Google Sheets via Google Apps Script.";
    if (activeMenu === "rekening") return "Lihat, tambah, ubah struktur kode rekening sub-kegiatan dan limit Pagu APBDes.";
    return "Audit trail lengkap atas seluruh detail historis log kas masuk/keluar desa.";
  }, [activeMenu]);

  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");

  const handlePinNumPress = (num: string) => {
    setPinError("");
    const nextInput = pinInput + num;
    if (nextInput.length <= appPin.length) {
      setPinInput(nextInput);
      if (nextInput === appPin) {
        setIsAppLocked(false);
        setPinInput("");
      } else if (nextInput.length === appPin.length) {
        setPinError("PIN salah! Silakan coba lagi.");
        setPinInput("");
      }
    }
  };

  if (isAppLocked && appPin) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-between text-center shadow-2xl relative overflow-hidden min-h-[580px] text-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Header */}
          <div className="space-y-4 w-full z-10 pt-4">
            <div className="mx-auto w-14 h-14 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-black text-white font-heading tracking-tight">
                Aplikasi Terkunci
              </h1>
              <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                Sistem KasDesa ini diproteksi secara privat. Silakan masukkan PIN Pengaman untuk mengakses data keuangan.
              </p>
            </div>
          </div>

          {/* Indicators */}
          <div className="w-full z-10 py-6 space-y-4">
            <div className="flex items-center justify-center space-x-3.5">
              {Array.from({ length: appPin.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    i < pinInput.length
                      ? "bg-indigo-500 border-indigo-500 shadow-md scale-110"
                      : "border-slate-600 bg-slate-700/50"
                  }`}
                />
              ))}
            </div>

            {pinError ? (
              <p className="text-xs font-bold text-red-400 animate-bounce">{pinError}</p>
            ) : (
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Masukkan {appPin.length} Digit PIN Anda
              </p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] z-10 pb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinNumPress(num)}
                className="w-16 h-16 rounded-2xl bg-slate-705/30 hover:bg-slate-700/60 border border-slate-700 text-white font-black text-xl flex items-center justify-center cursor-pointer transition active:scale-90"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPinInput("");
                setPinError("");
              }}
              className="w-16 h-16 rounded-2xl text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              CLEAR
            </button>
            <button
              type="button"
              onClick={() => handlePinNumPress("0")}
              className="w-16 h-16 rounded-2xl bg-slate-705/30 hover:bg-slate-700/60 border border-slate-700 text-white font-black text-xl flex items-center justify-center cursor-pointer transition active:scale-90"
              id="num-0"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => {
                setPinInput((prev) => prev.slice(0, -1));
                setPinError("");
              }}
              className="w-16 h-16 rounded-2xl text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center cursor-pointer transition active:scale-95"
            >
              BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#f8fafc] text-slate-800 min-h-screen">
      
      {/* Sidebar Navigation - Desktop wrapper */}
      <aside 
        className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-100 z-50 flex flex-col justify-between py-6 w-64 transition-transform duration-300 xl:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="px-6 flex items-center justify-between border-b border-slate-50 pb-5">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-100">
                <Wallet className="w-5  h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-800 font-heading tracking-tight leading-none">KasDesa</h2>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Sistem Keuangan</p>
              </div>
            </div>

            {/* Mobile Sidebar Close */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="xl:hidden p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links list */}
          <nav className="mt-5 space-y-1">
            <button
              onClick={() => { setActiveMenu("dashboard"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "dashboard"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Ringkasan</span>
            </button>

            <button
              onClick={() => { setActiveMenu("transaksi"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "transaksi"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>

            <button
              onClick={() => { setActiveMenu("talangan"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "talangan"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Handshake className="w-4 h-4" />
              <span>Talangan &amp; Hutang</span>
            </button>

            <button
              onClick={() => { setActiveMenu("rekap"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "rekap"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Rekap Anggaran</span>
            </button>

            <button
              onClick={() => { setActiveMenu("riwayat"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "riwayat"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Riwayat Aktivitas Log</span>
            </button>

            <button
              onClick={() => { setActiveMenu("sheets"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "sheets"
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Integrasi Sheets</span>
            </button>

            <button
              onClick={() => { setActiveMenu("rekening"); setMobileSidebarOpen(false); }}
              className={`w-[calc(100%-24px)] mx-3 flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeMenu === "rekening"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-100/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Kelola Rekening (APBDes)</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Database Reset */}
        <div className="px-4 space-y-2">
          <button
            type="button"
            onClick={() => setShowPinSetupModal(true)}
            className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl font-bold text-xs transition duration-200 shadow-sm cursor-pointer border ${
              appPin 
                ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100 animate-pulse" 
                : "border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {appPin ? (
              <>
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pengaman PIN Aktif</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span>Aktifkan PIN Akses</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetDatabase}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-xl border border-slate-200 hover:border-indigo-100 hover:text-indigo-600 hover:bg-indigo-50 text-slate-500 font-bold text-xs transition duration-200 shadow-sm cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Reset Database</span>
          </button>
          <p className="text-[10px] text-slate-400 text-center font-bold tracking-tight">
            v1.1.2 &bull; Desa Digital Makmur
          </p>
        </div>
      </aside>

      {/* Main Panel Content Box */}
      <div className="flex-1 xl:pl-64 min-h-screen flex flex-col">
        
        {/* Top Floating Mobile Navbar Toggle Header */}
        <header className="xl:hidden bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Wallet className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-base text-slate-800 font-heading tracking-tight">KasDesa</span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 p-6 sm:p-8 space-y-6">
          {/* Header titles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200/60 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 font-heading tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {pageSubtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              {/* Google Sheets Live Sync Status Indicator */}
              {scriptUrl && (
                <div 
                  onClick={() => setActiveMenu("sheets")}
                  className={`flex items-center space-x-2 bg-white px-3.5 py-2 border rounded-2xl shadow-sm text-xs font-bold transition-all cursor-pointer hover:bg-slate-50 active:scale-95 border-slate-100 ${
                    !isAutoSync 
                      ? "text-slate-400" 
                      : syncStatus === "syncing" 
                      ? "text-indigo-650" 
                      : syncStatus === "error" 
                      ? "text-red-600 bg-red-50/20 border-red-100" 
                      : "text-emerald-600 bg-emerald-50/20 border-emerald-100"
                  }`}
                  title={
                    !isAutoSync 
                      ? "Auto-Sync Google Sheets tidak aktif. Klik untuk mengaktifkan." 
                      : syncStatus === "syncing" 
                      ? "Sedang menyinkronkan data ke Google Sheets di latar belakang..." 
                      : syncStatus === "error" 
                      ? "Sinkronisasi otomatis gagal. Klik untuk mengecek konfigurasi." 
                      : "Semua perubahan otomatis tersinkronisasi ke Google Sheets!"
                  }
                >
                  {!isAutoSync ? (
                    <>
                      <CloudOff className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">Autosync Off</span>
                    </>
                  ) : syncStatus === "syncing" ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-indigo-650 animate-spin" />
                      <span>Sedang Sinkron...</span>
                    </>
                  ) : syncStatus === "error" ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500 animate-bounce" />
                      <span>Gagal Sinkron</span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span className="hidden sm:inline">Sheets Sinkron</span>
                      <span className="sm:hidden">Selesai</span>
                    </>
                  )}
                </div>
              )}

              {/* Theme Selector Toggle */}
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center space-x-2 bg-white px-3.5 py-2 hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm text-slate-705 font-bold text-xs transition-all cursor-pointer active:scale-95"
                title={isDarkMode ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    <span>Mode Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/10" />
                    <span>Mode Gelap</span>
                  </>
                )}
              </button>

              {/* Tahun Anggaran */}
              <div className="flex items-center space-x-2.5 bg-white px-3.5 py-2 border border-slate-100 rounded-2xl shadow-sm">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                <div className="text-left leading-none">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Tahun Anggaran
                  </p>
                  <p className="text-xs font-black text-slate-700 leading-none">
                    2026/2027
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Sub-View Mounting */}
          {activeMenu === "dashboard" && (
            <Dashboard
              bidang={bidangList}
              kegiatan={kegiatanList}
              subKegiatan={subKegiatanList}
              sumberDana={sumberDanaList}
              anggaran={anggaranList}
              transaksi={resolvedTransaksi}
              talangan={resolvedTalangan}
              hutang={resolvedHutang}
              setViewReceipt={(url, name) => {
                setReceiptUrl(url);
                setReceiptName(name);
              }}
            />
          )}

          {activeMenu === "transaksi" && (
            <TransaksiView
              bidang={bidangList}
              kegiatan={kegiatanList}
              subKegiatan={subKegiatanList}
              sumberDana={sumberDanaList}
              anggaran={anggaranList}
              transaksi={resolvedTransaksi}
              onAddTransaksi={handleAddTransaksi}
              onUpdateTransaksi={handleUpdateTransaksi}
              onDeleteTransaksi={handleDeleteTransaksi}
              setViewReceipt={(url, name) => {
                setReceiptUrl(url);
                setReceiptName(name);
              }}
            />
          )}

          {activeMenu === "talangan" && (
            <TalanganHutangView
              bidang={bidangList}
              kegiatan={kegiatanList}
              subKegiatan={subKegiatanList}
              sumberDana={sumberDanaList}
              anggaran={anggaranList}
              transaksi={resolvedTransaksi}
              talangan={resolvedTalangan}
              hutang={resolvedHutang}
              onAddTalangan={handleAddTalangan}
              onPayTalangan={handlePayTalangan}
              onDeleteTalangan={handleDeleteTalangan}
              onAddHutang={handleAddHutang}
              onPayHutang={handlePayHutang}
              onDeleteHutang={handleDeleteHutang}
              setViewReceipt={(url, name) => {
                setReceiptUrl(url);
                setReceiptName(name);
              }}
            />
          )}

          {activeMenu === "rekap" && (
            <RekapView
              bidang={bidangList}
              kegiatan={kegiatanList}
              subKegiatan={subKegiatanList}
              sumberDana={sumberDanaList}
              anggaran={anggaranList}
              transaksi={resolvedTransaksi}
              hutang={resolvedHutang}
              talangan={resolvedTalangan}
              setViewReceipt={(url, name) => {
                setReceiptUrl(url);
                setReceiptName(name);
              }}
            />
          )}

          {activeMenu === "riwayat" && (
            <RiwayatView
              transaksi={resolvedTransaksi}
              talangan={resolvedTalangan}
              hutang={resolvedHutang}
              setViewReceipt={(url, name) => {
                setReceiptUrl(url);
                setReceiptName(name);
              }}
            />
          )}

          {activeMenu === "sheets" && (
            <SheetsSyncView
              transaksi={transaksi}
              talangan={talangan}
              hutang={hutang}
              onImportData={(data: any) => {
                isImporting.current = true;
                setTransaksi(data.transaksi);
                setTalangan(data.talangan);
                setHutang(data.hutang);
                // Also parse list data from sheets if sheets contains custom accounts
                if (data.bidang) setBidangList(data.bidang);
                if (data.kegiatan) setKegiatanList(data.kegiatan);
                if (data.subKegiatan) setSubKegiatanList(data.subKegiatan);
                if (data.sumberDana) setSumberDanaList(data.sumberDana);
                if (data.anggaran) setAnggaranList(data.anggaran);
                
                setTimeout(() => {
                  isImporting.current = false;
                }, 150);
              }}
              scriptUrl={scriptUrl}
              setScriptUrl={setScriptUrl}
              isAutoSync={isAutoSync}
              setIsAutoSync={setIsAutoSync}
            />
          )}

          {activeMenu === "rekening" && (
            <RekeningManageView
              bidang={bidangList}
              kegiatan={kegiatanList}
              subKegiatan={subKegiatanList}
              sumberDana={sumberDanaList}
              anggaran={anggaranList}
              transaksi={transaksi}
              onAddSubKegiatan={handleAddSubKegiatan}
              onAddAnggaran={handleAddAnggaran}
              onUpdatePagu={handleUpdatePagu}
              onDeleteAnggaran={handleDeleteAnggaran}
              onResetMaster={handleResetMaster}
            />
          )}
        </main>
      </div>

      {/* 4. Global Receipt Preview Modal Backdrop */}
      {receiptUrl && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 overflow-hidden flex flex-col justify-between">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-[#111827] text-sm sm:text-base font-heading flex items-center">
                <ImageIcon className="w-4.5 h-4.5 text-indigo-600 mr-2" />
                Bukti Dokumen Transaksi
              </h3>
              <button 
                onClick={() => { setReceiptUrl(""); setReceiptName(""); }}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Image viewport */}
            <div className="p-6 flex items-center justify-center bg-slate-100 max-h-[450px] overflow-auto">
              <img 
                src={receiptUrl} 
                alt="Receipt placeholder"
                className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
              />
            </div>
            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px] sm:max-w-[300px]">
                {receiptName}
              </span>
              <div className="flex space-x-2">
                <a 
                  href={receiptUrl} 
                  download={receiptName}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button 
                  onClick={() => { setReceiptUrl(""); setReceiptName(""); }}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Safe Modal Confirmation Dialog */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center space-y-4">
            <div className="mx-auto bg-amber-50 rounded-2xl w-12 h-12 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 font-heading">
                {confirmModal.title}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed px-2">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition active:scale-95"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Custom PIN Setup and Security Management Modal */}
      {showPinSetupModal && (
        <PinSetupModal
          appPin={appPin}
          setAppPin={(p) => {
            setAppPin(p);
            if (p) {
              localStorage.setItem("desa_app_pin", p);
            } else {
              localStorage.removeItem("desa_app_pin");
            }
          }}
          onClose={() => setShowPinSetupModal(false)}
        />
      )}

    </div>
  );
}
