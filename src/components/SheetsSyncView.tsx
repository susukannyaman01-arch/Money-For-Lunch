import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  ArrowUpFromLine, 
  ArrowDownToLine, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Cloud,
  CloudOff,
  RefreshCw
} from "lucide-react";
import { Transaksi, Talangan, Hutang, Bidang, Kegiatan, SubKegiatan, SumberDana, Anggaran } from "../types";

interface SheetsSyncViewProps {
  transaksi: Transaksi[];
  talangan: Talangan[];
  hutang: Hutang[];
  bidang: Bidang[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
  sumberDana: SumberDana[];
  anggaran: Anggaran[];
  onImportData: (data: { 
    transaksi: Transaksi[]; 
    talangan: Talangan[]; 
    hutang: Hutang[];
    bidang?: Bidang[];
    kegiatan?: Kegiatan[];
    subKegiatan?: SubKegiatan[];
    sumberDana?: SumberDana[];
    anggaran?: Anggaran[];
  }) => void;
  scriptUrl: string;
  setScriptUrl: (url: string) => void;
  isAutoSync: boolean;
  setIsAutoSync: (sync: boolean) => void;
}

export default function SheetsSyncView({ 
  transaksi, 
  talangan, 
  hutang,
  bidang,
  kegiatan,
  subKegiatan,
  sumberDana,
  anggaran,
  onImportData,
  scriptUrl,
  setScriptUrl,
  isAutoSync,
  setIsAutoSync
}: SheetsSyncViewProps) {
  // Config
  const [copied, setCopied] = useState(false);
  const [syncingUp, setSyncingUp] = useState(false);
  const [syncingDown, setSyncingDown] = useState(false);
  const [logMessage, setLogMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const saveScriptUrl = (url: string) => {
    setScriptUrl(url);
    localStorage.setItem("google_apps_script_url", url);
    setLogMessage({ text: "URL Google Apps Script berhasil disimpan!", type: "success" });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. PUSH / EXPORT DATA -> POST request to Apps Script Web App
  const handleExportToSheets = async () => {
    if (!scriptUrl) {
      setLogMessage({ text: "Gagal: Harap masukkan URL Web App Google Apps Script terlebih dahulu.", type: "error" });
      return;
    }
    setSyncingUp(true);
    setLogMessage({ text: "Mengirim data anggaran & kas ke Google Sheet...", type: "info" });
    
    try {
      // payload structure matches Code.gs expectations
      const payload = {
        action: "export",
        transaksi: transaksi,
        talangan: talangan,
        hutang: hutang,
        bidang: bidang,
        kegiatan: kegiatan,
        subKegiatan: subKegiatan,
        sumberDana: sumberDana,
        anggaran: anggaran
      };

      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // bypass CORS issues on pre-flight with Apps Script
        },
        body: JSON.stringify(payload)
      });

      const resText = await response.text();
      let resJson;
      try {
        resJson = JSON.parse(resText);
      } catch (e) {
        resJson = { status: "success", message: resText };
      }

      if (response.ok && (resJson.status === "success" || resJson.success)) {
        setLogMessage({ 
          text: `Ekspor Sukses! Data Transaksi, Talangan, Hutang, dan Master Kode Rekening (Anggaran) telah diunggah ke Google Sheets.`, 
          type: "success" 
        });
      } else {
        throw new Error(resJson.message || "Gagal mengunggah data");
      }
    } catch (err: any) {
      console.error(err);
      setLogMessage({ 
        text: `Error saat Ekspor: ${err.message || "Pastikan deploy Web App sudah 'Anyone' dan URL benar."}`, 
        type: "error" 
      });
    } finally {
      setSyncingUp(false);
    }
  };

  // 2. PULL / IMPORT DATA -> GET request from Apps Script Web App
  const handleImportFromSheets = async () => {
    if (!scriptUrl) {
      setLogMessage({ text: "Gagal: Harap masukkan URL Web App Google Apps Script terlebih dahulu.", type: "error" });
      return;
    }
    setSyncingDown(true);
    setLogMessage({ text: "Mengunduh data terbaru dari Google Sheet...", type: "info" });

    try {
      const targetUrl = scriptUrl + (scriptUrl.includes("?") ? "&" : "?") + "action=import";
      const response = await fetch(targetUrl, {
        method: "GET",
        mode: "cors",
      });

      const data = await response.json();
      if (data && (data.transaksi || data.talangan || data.hutang)) {
        onImportData({
          transaksi: data.transaksi || [],
          talangan: data.talangan || [],
          hutang: data.hutang || [],
          bidang: data.bidang,
          kegiatan: data.kegiatan,
          subKegiatan: data.subKegiatan,
          sumberDana: data.sumberDana,
          anggaran: data.anggaran
        });
        setLogMessage({
          text: `Impor Berhasil! Berhasil menyinkronkan seluruh Transaksi, Talangan, Hutang, serta Master Kode Rekening dari Google Sheets ke browser lokal Anda.`,
          type: "success"
        });
      } else {
        throw new Error(data.message || "Struktur data tidak valid. Pastikan Sheet Anda berisi tabel data.");
      }
    } catch (err: any) {
      console.error(err);
      setLogMessage({
        text: `Error saat Impor: ${err.message || "Pastikan deploy Web App sudah 'Anyone', URL benar, dan Sheet memiliki data."}`,
        type: "error"
      });
    } finally {
      setSyncingDown(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards: Status Connection */}
      <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-5 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 font-heading">
                Sinkronisasi Google Sheets &amp; Apps Script
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                Integrasi Cloud Spreadsheet Dua Arah
              </p>
            </div>
          </div>
          <span className="bg-indigo-50 text-indigo-600 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center">
            {scriptUrl ? "✓ Terhubung" : "⚠ Belum Terhubung"}
          </span>
        </div>

        {/* Input URL */}
        <div className="space-y-2">
          <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest block">
            URL Web App Google Apps Script
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={scriptUrl}
              onChange={(e) => saveScriptUrl(e.target.value)}
              className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
            <button
              onClick={() => saveScriptUrl(scriptUrl)}
              className="px-6 py-3 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition cursor-pointer"
            >
              Simpan URL
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Masukkan URL deployment Web App Apps Script Anda yang di-publish dengan akses <strong>&apos;Anyone&apos;</strong>.
          </p>
        </div>

        {/* Auto Sync Toggle Options */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-xl mt-0.5 ${isAutoSync ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"}`}>
              {isAutoSync ? <Cloud className="w-4 h-4 text-indigo-600" /> : <CloudOff className="w-4 h-4 text-slate-500" />}
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-700">Sinkronisasi Otomatis (Auto-Sync)</h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Kirim perubahan data (tambah, edit, hapus) langsung ke Google Sheets secara real-time di latar belakang.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const newValue = !isAutoSync;
              setIsAutoSync(newValue);
              localStorage.setItem("google_sheets_auto_sync", String(newValue));
              setLogMessage({
                text: newValue 
                  ? "Sinkronisasi otomatis diaktifkan! Data akan otomatis dikirim ke Google Sheets di latar belakang setelah Anda melakukan perubahan." 
                  : "Sinkronisasi otomatis dinonaktifkan.",
                type: newValue ? "success" : "info"
              });
            }}
            className={`w-14 h-7 p-1 rounded-full relative transition-colors duration-200 focus:outline-none flex outline-none ${
              isAutoSync ? "bg-indigo-600 justify-end" : "bg-slate-300 justify-start"
            }`}
          >
            <span className="w-5 h-5 bg-white rounded-full shadow-md transform duration-200 inline-block"></span>
          </button>
        </div>

        {/* Sync Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Export button */}
          <button
            onClick={handleExportToSheets}
            disabled={syncingUp || syncingDown}
            className={`flex items-center justify-center space-x-3 px-5 py-4 border rounded-2xl font-extrabold text-xs transition cursor-pointer ${
              syncingUp
                ? "bg-slate-50 border-slate-200 text-slate-400"
                : "bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-md shadow-indigo-100"
            }`}
          >
            <ArrowUpFromLine className={`w-4 h-4 ${syncingUp ? "animate-bounce" : ""}`} />
            <div>
              <p className="font-extrabold text-left">Ekspor ke Google Sheets</p>
              <p className="text-[10px] opacity-85 font-semibold text-left">Unggah data input saat ini ke online sheet</p>
            </div>
          </button>

          {/* Import button */}
          <button
            onClick={handleImportFromSheets}
            disabled={syncingUp || syncingDown}
            className={`flex items-center justify-center space-x-3 px-5 py-4 border rounded-2xl font-extrabold text-xs transition cursor-pointer ${
              syncingDown
                ? "bg-slate-50 border-slate-200 text-slate-400"
                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-705 shadow-sm"
            }`}
          >
            <ArrowDownToLine className={`w-4 h-4 ${syncingDown ? "animate-bounce" : ""}`} />
            <div>
              <p className="font-extrabold text-left text-slate-800">Impor dari Google Sheets</p>
              <p className="text-[10px] text-slate-400 font-semibold text-left">Gantikan data browser dengan data dari Google Sheet</p>
            </div>
          </button>
        </div>

        {/* Sync Status Logger Box */}
        {logMessage && (
          <div className={`p-4 rounded-xl border flex items-start space-x-3 text-xs font-bold leading-normal ${
            logMessage.type === "success" 
              ? "bg-emerald-50/50 border-emerald-100 text-emerald-800" 
              : logMessage.type === "error"
              ? "bg-red-50/55 border-red-100 text-red-700"
              : "bg-indigo-50/50 border-indigo-100 text-indigo-705"
          }`}>
            <div className="mt-0.5">
              {logMessage.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-600" />}
              {logMessage.type === "error" && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {logMessage.type === "info" && <Info className="w-4 h-4 text-indigo-500 animate-spin" />}
            </div>
            <div>
              {logMessage.text}
            </div>
          </div>
        )}
      </div>

      {/* Manual & Guide */}
      <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
        <h3 className="font-extrabold text-base text-slate-800 font-heading border-b border-slate-50 pb-4 flex items-center">
          <Info className="w-5 h-5 text-indigo-600 mr-2" />
          Panduan Cara Menghubungkan Google Sheet (Google Apps Script)
        </h3>

        <div className="space-y-4 text-xs font-medium text-slate-705 leading-relaxed">
          <p>
            Anda dapat memindahkan atau menyinkronkan seluruh database pencatatan KasDesa ini ke akun 
            <strong> Google Spreadsheet pribadi Anda</strong> secara waktu nyata (real-time). Ikuti 4 langkah mudah berikut:
          </p>

          <ol className="list-decimal pl-5 space-y-3.5 text-slate-705">
            <li>
              <strong>Buat Google Spreadsheet Baru:</strong>
              <div className="mt-1 text-slate-500">
                Buka Google Drive Anda, buat file spreadsheet baru bernama misalnya <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">Buku Kas Desa 2026</code>.
              </div>
            </li>
            <li>
              <strong>Buka Google Apps Script Editor:</strong>
              <div className="mt-1 text-slate-500">
                Pilih tab <strong>Ekstensi (Extensions)</strong> &gt; <strong>Apps Script</strong>. Hapus semua baris teks kode yang ada di layar editor default tersebut.
              </div>
            </li>
            <li>
              <strong>Salin &amp; Tempel Kode Script dibawah ini:</strong>
              <div className="mt-1 text-slate-500">
                Salin seluruh block kode program JavaScript/Apps Script dibawah lalu tempelkan (paste) ke jendela Google Apps Script. Jangan lupa klik tombol ikon disket untuk Simpan.
              </div>
            </li>
            <li>
              <strong>Lakukan Deployment sebagai Web App:</strong>
              <div className="mt-1 text-slate-500">
                Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong>.<br />
                - Pilih jenis: <strong>Aplikasi Web (Web App)</strong>.<br />
                - Berikan judul deskripsi bebas.<br />
                - Jalankan sebagai (Execute as): <strong>Saya (pribadi email Anda)</strong>.<br />
                - Siapa yang memiliki akses (Who has access): <strong>Siapa saja (Anyone)</strong> (<i>Sangat Penting agar browser dapat mengirim data</i>).<br />
                - Klik <strong>Terapkan</strong>, berikan izin akses akun Google Anda jika diminta (pilih Advanced &gt; Go to Untitled Project), lalu salin URL Web App yang dihasilkan.
              </div>
            </li>
          </ol>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong>Catatan Penting Keamanan:</strong> Pengaturan akses web app ke &quot;Anyone&quot; diperlukan agar browser web aplikasi client-side KasDesa ini bisa berkomunikasi langsung dengan sheet Google Anda tanpa login pop-up yang mengganggu. URL ini bersifat privat, simpan atau rahasiakan demi mencegah orang luar menulis data acak ke spreadsheet Anda.
            </div>
          </div>
        </div>

        {/* Copy App Script block */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center">
              Kode Google Apps Script (Code.gs)
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Berhasil Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Seluruh Kode</span>
                </>
              )}
            </button>
          </div>

          <div className="relative font-mono text-[10px] sm:text-xs text-slate-200 bg-slate-900 rounded-2xl p-5 overflow-x-auto max-h-[300px] leading-relaxed shadow-inner border border-slate-800">
            <pre>{APPS_SCRIPT_CODE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// Complete fully functional Google Apps Script Code template
const APPS_SCRIPT_CODE = `/**
 * Google Apps Script - Sinkronisasi KasDesa Premium 
 * Salin dan tempel kode ini di Extensions > Apps Script milik Google Sheet anda.
 * Deploy sebagai "Web App", Execute as "Me", Access: "Anyone".
 */

// Menangani permintaan POST untuk Menerima / Menyimpan Data dari KasDesa ke Sheets
function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    var action = data.action;
    
    if (action === "export") {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // 1. Sinkronisasi Pekerjaan Transaksi
      if (data.transaksi) {
        var sheetTx = getOrCreateSheet(ss, "Transaksi");
        sheetTx.clearContents();
        // Set Header
        sheetTx.getRange(1, 1, 1, 9).setValues([[
          "ID_Transaksi", "Tanggal", "Tipe", "ID_Anggaran", "Jumlah_Nominal", "Keterangan", "Ref_ID", "Lampiran_Bukti", "Waktu_Input_Sistem"
        ]]);
        sheetTx.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#e2e8f0");
        
        if (data.transaksi.length > 0) {
          var rowsTx = data.transaksi.map(function(t) {
            return [
              t.id || "",
              t.tanggal || "",
              t.tipe || "",
              t.id_anggaran || 0,
              t.jumlah || 0,
              t.keterangan || "",
              t.ref_id || "",
              t.bukti || "",
              t.timestamp || ""
            ];
          });
          sheetTx.getRange(2, 1, rowsTx.length, 9).setValues(rowsTx);
        }
      }
      
      // 2. Sinkronisasi Data Talangan
      if (data.talangan) {
        var sheetTal = getOrCreateSheet(ss, "Talangan");
        sheetTal.clearContents();
        // Set Header
        sheetTal.getRange(1, 1, 1, 8).setValues([[
          "ID_Talangan", "Tanggal", "ID_Anggaran_Pemberi", "ID_Anggaran_Penerima", "Jumlah_Nominal", "Keterangan", "Status", "Waktu_Pelunasan"
        ]]);
        sheetTal.getRange(1, 1, 1, 8).setFontWeight("bold").setBackground("#fef3c7");
        
        if (data.talangan.length > 0) {
          var rowsTal = data.talangan.map(function(t) {
            return [
              t.id || "",
              t.tanggal || "",
              t.id_anggaran_pemberi || 0,
              t.id_anggaran_penerima || 0,
              t.jumlah || 0,
              t.keterangan || "",
              t.status || "Belum Lunas",
              t.tanggal_lunas || ""
            ];
          });
          sheetTal.getRange(2, 1, rowsTal.length, 8).setValues(rowsTal);
        }
      }
      
      // 3. Sinkronisasi Data Hutang
      if (data.hutang) {
        var sheetHut = getOrCreateSheet(ss, "Hutang");
        sheetHut.clearContents();
        // Set Header
        sheetHut.getRange(1, 1, 1, 7).setValues([[
          "ID_Hutang", "Tanggal", "ID_Anggaran_Pemberi", "Nama_Peminjam", "Jumlah_Nominal", "Keterangan", "Status"
        ]]);
        sheetHut.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e0e7ff");
        
        if (data.hutang.length > 0) {
          var rowsHut = data.hutang.map(function(h) {
            return [
              h.id || "",
              h.tanggal || "",
              h.id_anggaran_pemberi || 0,
              h.peminjam || "",
              h.jumlah || 0,
              h.keterangan || "",
              h.status || "Belum Lunas"
            ];
          });
          sheetHut.getRange(2, 1, rowsHut.length, 7).setValues(rowsHut);
        }
      }

      // 4. Sinkronisasi Master Bidang
      if (data.bidang) {
        var sheetBid = getOrCreateSheet(ss, "Master_Bidang");
        sheetBid.clearContents();
        sheetBid.getRange(1, 1, 1, 2).setValues([["ID_Bidang", "Nama_Bidang"]]);
        sheetBid.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#cbd5e1");
        
        if (data.bidang.length > 0) {
          var rowsBid = data.bidang.map(function(b) {
            return [b.id_bidang || 0, b.nama_bidang || ""];
          });
          sheetBid.getRange(2, 1, rowsBid.length, 2).setValues(rowsBid);
        }
      }

      // 5. Sinkronisasi Master Kegiatan
      if (data.kegiatan) {
        var sheetKeg = getOrCreateSheet(ss, "Master_Kegiatan");
        sheetKeg.clearContents();
        sheetKeg.getRange(1, 1, 1, 3).setValues([["ID_Kegiatan", "ID_Bidang", "Nama_Kegiatan"]]);
        sheetKeg.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#cbd5e1");
        
        if (data.kegiatan.length > 0) {
          var rowsKeg = data.kegiatan.map(function(k) {
            return [k.id_kegiatan || 0, k.id_bidang || 0, k.nama_kegiatan || ""];
          });
          sheetKeg.getRange(2, 1, rowsKeg.length, 3).setValues(rowsKeg);
        }
      }

      // 6. Sinkronisasi Master Sub Kegiatan
      if (data.subKegiatan) {
        var sheetSub = getOrCreateSheet(ss, "Master_Sub_Kegiatan");
        sheetSub.clearContents();
        sheetSub.getRange(1, 1, 1, 3).setValues([["ID_Sub", "ID_Kegiatan", "Nama_Sub_Kegiatan"]]);
        sheetSub.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#cbd5e1");
        
        if (data.subKegiatan.length > 0) {
          var rowsSub = data.subKegiatan.map(function(s) {
            return [s.id_sub || 0, s.id_kegiatan || 0, s.nama_sub || ""];
          });
          sheetSub.getRange(2, 1, rowsSub.length, 3).setValues(rowsSub);
        }
      }

      // 7. Sinkronisasi Master Sumber Dana
      if (data.sumberDana) {
        var sheetSD = getOrCreateSheet(ss, "Master_Sumber_Dana");
        sheetSD.clearContents();
        sheetSD.getRange(1, 1, 1, 2).setValues([["ID_Sumber", "Nama_Sumber_Dana"]]);
        sheetSD.getRange(1, 1, 1, 2).setFontWeight("bold").setBackground("#cbd5e1");
        
        if (data.sumberDana.length > 0) {
          var rowsSD = data.sumberDana.map(function(sd) {
            return [sd.id_sumber || 0, sd.nama_sumber || ""];
          });
          sheetSD.getRange(2, 1, rowsSD.length, 2).setValues(rowsSD);
        }
      }

      // 8. Sinkronisasi Master Anggaran
      if (data.anggaran) {
        var sheetAng = getOrCreateSheet(ss, "Master_Anggaran");
        sheetAng.clearContents();
        sheetAng.getRange(1, 1, 1, 6).setValues([["ID_Anggaran", "ID_Bidang", "ID_Kegiatan", "ID_Sub", "ID_Sumber", "Pagu_Nominal"]]);
        sheetAng.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#cbd5e1");
        
        if (data.anggaran.length > 0) {
          var rowsAng = data.anggaran.map(function(a) {
            return [
              a.id || 0,
              a.id_bidang || 0,
              a.id_kegiatan || 0,
              a.id_sub || 0,
              a.id_sumber || 0,
              a.pagu || 0
            ];
          });
          sheetAng.getRange(2, 1, rowsAng.length, 6).setValues(rowsAng);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Sinkronisasi Berhasil ke Google Sheet!" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: "Instruksi Aksi tidak dikenal" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Menangani permintaan GET untuk Mengirimkan Data Spreadsheet Kembali ke Aplikasi React
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Default load payload
    var response = {
      transaksi: [],
      talangan: [],
      hutang: []
    };
    
    // Read Transaksi Worksheet
    var sheetTx = ss.getSheetByName("Transaksi");
    if (sheetTx) {
      var valuesTx = sheetTx.getDataRange().getValues();
      if (valuesTx.length > 1) { // has headers and data
        for (var i = 1; i < valuesTx.length; i++) {
          response.transaksi.push({
            id: String(valuesTx[i][0]),
            tanggal: formatDateString(valuesTx[i][1]),
            tipe: String(valuesTx[i][2]),
            id_anggaran: Number(valuesTx[i][3]),
            jumlah: Number(valuesTx[i][4]),
            keterangan: String(valuesTx[i][5]),
            ref_id: String(valuesTx[i][6] || ""),
            bukti: String(valuesTx[i][7] || ""),
            timestamp: String(valuesTx[i][8] || "")
          });
        }
      }
    }
    
    // Read Talangan Worksheet
    var sheetTal = ss.getSheetByName("Talangan");
    if (sheetTal) {
      var valuesTal = sheetTal.getDataRange().getValues();
      if (valuesTal.length > 1) {
        for (var i = 1; i < valuesTal.length; i++) {
          response.talangan.push({
            id: String(valuesTal[i][0]),
            tanggal: formatDateString(valuesTal[i][1]),
            id_anggaran_pemberi: Number(valuesTal[i][2]),
            id_anggaran_penerima: Number(valuesTal[i][3]),
            jumlah: Number(valuesTal[i][4]),
            keterangan: String(valuesTal[i][5]),
            status: String(valuesTal[i][6]),
            tanggal_lunas: formatDateString(valuesTal[i][7] || "")
          });
        }
      }
    }
    
    // Read Hutang Worksheet
    var sheetHut = ss.getSheetByName("Hutang");
    if (sheetHut) {
      var valuesHut = sheetHut.getDataRange().getValues();
      if (valuesHut.length > 1) {
        for (var i = 1; i < valuesHut.length; i++) {
          response.hutang.push({
            id: String(valuesHut[i][0]),
            tanggal: formatDateString(valuesHut[i][1]),
            id_anggaran_pemberi: Number(valuesHut[i][2]),
            peminjam: String(valuesHut[i][3]),
            jumlah: Number(valuesHut[i][4]),
            keterangan: String(valuesHut[i][5]),
            status: String(valuesHut[i][6])
          });
        }
      }
    }

    // Read Master_Bidang
    var sheetBid = ss.getSheetByName("Master_Bidang");
    if (sheetBid) {
      var valuesBid = sheetBid.getDataRange().getValues();
      if (valuesBid.length > 1) {
        response.bidang = [];
        for (var i = 1; i < valuesBid.length; i++) {
          response.bidang.push({
            id_bidang: Number(valuesBid[i][0]),
            nama_bidang: String(valuesBid[i][1])
          });
        }
      }
    }
    
    // Read Master_Kegiatan
    var sheetKeg = ss.getSheetByName("Master_Kegiatan");
    if (sheetKeg) {
      var valuesKeg = sheetKeg.getDataRange().getValues();
      if (valuesKeg.length > 1) {
        response.kegiatan = [];
        for (var i = 1; i < valuesKeg.length; i++) {
          response.kegiatan.push({
            id_kegiatan: Number(valuesKeg[i][0]),
            id_bidang: Number(valuesKeg[i][1]),
            nama_kegiatan: String(valuesKeg[i][2])
          });
        }
      }
    }
    
    // Read Master_Sub_Kegiatan
    var sheetSub = ss.getSheetByName("Master_Sub_Kegiatan");
    if (sheetSub) {
      var valuesSub = sheetSub.getDataRange().getValues();
      if (valuesSub.length > 1) {
        response.subKegiatan = [];
        for (var i = 1; i < valuesSub.length; i++) {
          response.subKegiatan.push({
            id_sub: Number(valuesSub[i][0]),
            id_kegiatan: Number(valuesSub[i][1]),
            nama_sub: String(valuesSub[i][2])
          });
        }
      }
    }
    
    // Read Master_Sumber_Dana
    var sheetSD = ss.getSheetByName("Master_Sumber_Dana");
    if (sheetSD) {
      var valuesSD = sheetSD.getDataRange().getValues();
      if (valuesSD.length > 1) {
        response.sumberDana = [];
        for (var i = 1; i < valuesSD.length; i++) {
          response.sumberDana.push({
            id_sumber: Number(valuesSD[i][0]),
            nama_sumber: String(valuesSD[i][1])
          });
        }
      }
    }
    
    // Read Master_Anggaran
    var sheetAng = ss.getSheetByName("Master_Anggaran");
    if (sheetAng) {
      var valuesAng = sheetAng.getDataRange().getValues();
      if (valuesAng.length > 1) {
        response.anggaran = [];
        for (var i = 1; i < valuesAng.length; i++) {
          response.anggaran.push({
            id: Number(valuesAng[i][0]),
            id_bidang: Number(valuesAng[i][1]),
            id_kegiatan: Number(valuesAng[i][2]),
            id_sub: Number(valuesAng[i][3]),
            id_sumber: Number(valuesAng[i][4]),
            pagu: Number(valuesAng[i][5])
          });
        }
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Fungsi pembantu mengecek & membuat Worksheet jika belum terbentuk
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// Fungsi penanganan konversi objek Tanggal Apps Script ke representasi String YYYY-MM-DD
function formatDateString(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var year = val.getFullYear();
    var month = ("0" + (val.getMonth() + 1)).slice(-2);
    var day = ("0" + val.getDate()).slice(-2);
    return year + "-" + month + "-" + day;
  }
  return String(val);
}
`;
