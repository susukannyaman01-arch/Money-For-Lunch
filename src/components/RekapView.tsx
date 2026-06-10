/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  FileSpreadsheet, 
  Search, 
  ChevronDown, 
  BookOpen, 
  X, 
  Info, 
  Camera, 
  ArrowUpRight, 
  ArrowDownLeft,
  Printer
} from "lucide-react";
import { 
  Bidang, 
  Kegiatan, 
  SubKegiatan, 
  SumberDana, 
  Anggaran, 
  Transaksi,
  Hutang,
  Talangan,
  formatTanggal,
  compareTanggal
} from "../types";

interface RekapViewProps {
  bidang: Bidang[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
  sumberDana: SumberDana[];
  anggaran: Anggaran[];
  transaksi: Transaksi[];
  hutang?: Hutang[];
  talangan?: Talangan[];
  setViewReceipt: (url: string, name: string) => void;
}

export default function RekapView({
  bidang,
  kegiatan,
  subKegiatan,
  sumberDana,
  anggaran,
  transaksi,
  hutang = [],
  talangan = [],
  setViewReceipt
}: RekapViewProps) {
  // Filter States
  const [filterBidang, setFilterBidang] = useState<string>("");
  const [filterSumber, setFilterSumber] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Ledger Modal State
  const [selectedAnggaranId, setSelectedAnggaranId] = useState<number | null>(null);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Compile detailed Rekap list dynamically from current data
  const rekapDataList = useMemo(() => {
    // 1. Group transaction spent/receives by id_anggaran
    const txSummary: Record<number, { pengeluaran: number; pemasukan: number }> = {};
    
    // Initialize
    anggaran.forEach((ang) => {
      txSummary[ang.id] = { pengeluaran: 0, pemasukan: 0 };
    });

    // Accumulate
    transaksi.forEach((t) => {
      if (!txSummary[t.id_anggaran]) {
        txSummary[t.id_anggaran] = { pengeluaran: 0, pemasukan: 0 };
      }
      if (t.tipe === "Pengeluaran") {
        txSummary[t.id_anggaran].pengeluaran += t.jumlah;
      } else if (t.tipe === "Pemasukan") {
        txSummary[t.id_anggaran].pemasukan += t.jumlah;
      }
    });

    // 2. Build full row details
    return anggaran.map((ang) => {
      const bObj = bidang.find((b) => b.id_bidang === ang.id_bidang);
      const kObj = kegiatan.find((k) => k.id_kegiatan === ang.id_kegiatan);
      const sObj = subKegiatan.find((s) => s.id_sub === ang.id_sub);
      const sdObj = sumberDana.find((sd) => sd.id_sumber === ang.id_sumber);

      const summary = txSummary[ang.id] || { pengeluaran: 0, pemasukan: 0 };
      const realisasi = summary.pengeluaran;
      const sisaPagu = ang.pagu - realisasi;
      const sisaKasRiil = summary.pemasukan - summary.pengeluaran;
      const persen = ang.pagu > 0 ? (realisasi / ang.pagu) * 100 : 0;

      return {
        id: ang.id,
        bidang: bObj ? bObj.nama_bidang : "-",
        kegiatan: kObj ? kObj.nama_kegiatan : "-",
        subKegiatan: sObj ? sObj.nama_sub : "-",
        sumberDana: sdObj ? sdObj.nama_sumber : "-",
        pagu: ang.pagu,
        realisasi,
        sisaPagu,
        sisaKasRiil,
        persen
      };
    });
  }, [anggaran, bidang, kegiatan, subKegiatan, sumberDana, transaksi]);

  // Apply filters on the list
  const filteredRekap = useMemo(() => {
    return rekapDataList.filter((row) => {
      if (filterBidang && row.bidang !== filterBidang) return false;
      if (filterSumber && row.sumberDana !== filterSumber) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const keg = row.kegiatan.toLowerCase();
        const sub = row.subKegiatan.toLowerCase();
        if (!keg.includes(q) && !sub.includes(q)) return false;
      }
      return true;
    });
  }, [rekapDataList, filterBidang, filterSumber, searchQuery]);

  // Selected Row details
  const selectedRowObj = useMemo(() => {
    if (selectedAnggaranId === null) return null;
    return rekapDataList.find((r) => r.id === selectedAnggaranId) || null;
  }, [rekapDataList, selectedAnggaranId]);

  // Selected Ledger Transactions (including automated matching Code.gs)
  const selectedLedgerTxs = useMemo(() => {
    if (selectedAnggaranId === null) return [];
    return transaksi
      .filter((t) => t.id_anggaran === selectedAnggaranId)
      .slice()
      .sort((a, b) => compareTanggal(a.tanggal, b.tanggal) || a.id.localeCompare(b.id));
  }, [transaksi, selectedAnggaranId]);

  // Selected Ledger exact totals
  const ledgerTotals = useMemo(() => {
    if (selectedAnggaranId === null) return { pemasukan: 0, pengeluaran: 0 };
    let pemasukan = 0;
    let pengeluaran = 0;
    transaksi.forEach((t) => {
      if (t.id_anggaran === selectedAnggaranId) {
        if (t.tipe === "Pemasukan") pemasukan += t.jumlah;
        else if (t.tipe === "Pengeluaran") pengeluaran += t.jumlah;
      }
    });
    return { pemasukan, pengeluaran };
  }, [transaksi, selectedAnggaranId]);

  // Handle Print Ledger Details directly
  const handlePrint = () => {
    if (selectedAnggaranId === null || selectedRowObj === null) return;

    const win = window.open("", "_blank");
    if (!win) {
      alert("⚠️ Popup dibebankan atau diblokir oleh browser. Harap ijinkan popup untuk web aplikasi ini agar bisa mencetak langsung!");
      return;
    }

    // Prepare ledger records html
    const tableRowsHtml = selectedLedgerTxs.length === 0 
      ? `<tr><td colspan="5" style="text-align: center; padding: 25px; font-style: italic; color: #666;">Belum ada riwayat log transaksi untuk alokasi bidang ini.</td></tr>`
      : selectedLedgerTxs.map((t) => {
          const matchingHut = t.ref_id ? hutang.find((h) => h.id === t.ref_id) : null;
          const labelPeminjam = matchingHut ? ` [Peminjam: ${matchingHut.peminjam}]` : "";
          const labelRef = t.ref_id ? ` (REF: ${t.ref_id})` : "";
          const dateStr = t.tanggal;
          const rowType = t.tipe === "Pemasukan" ? "IN / DEBET" : "OUT / KREDIT";
          const rowDesc = `${t.keterangan}${labelPeminjam}${labelRef}`;
          const inVal = t.tipe === "Pemasukan" ? formatIDR(t.jumlah) : "-";
          const outVal = t.tipe === "Pengeluaran" ? formatIDR(t.jumlah) : "-";
          return `
            <tr>
              <td style="text-align: center; white-space: nowrap;">${dateStr}</td>
              <td style="text-align: center; font-weight: bold; font-size: 10px;">${rowType}</td>
              <td>${rowDesc}</td>
              <td class="text-right" style="font-weight: bold; color: #047857;">${inVal}</td>
              <td class="text-right" style="font-weight: bold; color: #b91c1c;">${outVal}</td>
            </tr>
          `;
        }).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Buku Pembantu Kas Umum - Alokasi #${selectedRowObj.id}</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 1.5cm;
              }
              body {
                padding: 0;
                background-color: #fff;
              }
              .no-print {
                display: none;
              }
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1e293b;
              padding: 15px;
              line-height: 1.5;
              font-size: 12px;
            }
            .header-info {
              border-bottom: 3px double #0f172a;
              padding-bottom: 12px;
              margin-bottom: 20px;
              text-align: center;
            }
            .header-info h1 {
              font-size: 16px;
              text-transform: uppercase;
              margin: 0;
              font-weight: 800;
              letter-spacing: 0.5px;
              color: #0f172a;
            }
            .header-info h2 {
              font-size: 11px;
              margin: 4px 0 0 0;
              font-weight: 500;
              color: #64748b;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
              font-size: 11px;
              background-color: #f8fafc;
              padding: 12px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .meta-left p, .meta-right p {
              margin: 4px 0;
            }
            .meta-label {
              font-weight: 700;
              color: #475569;
              display: inline-block;
              width: 130px;
            }
            .meta-value {
              color: #0f172a;
              font-weight: 600;
            }
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 25px;
            }
            .card {
              border: 1px solid #e2e8f0;
              padding: 10px;
              border-radius: 8px;
              background-color: #f8fafc;
              text-align: center;
            }
            .card-title {
              font-size: 9px;
              text-transform: uppercase;
              color: #64748b;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            .card-amount {
              font-size: 13px;
              font-weight: bold;
              margin-top: 4px;
              font-family: 'Courier New', Courier, monospace;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 11px;
            }
            .data-table th {
              background-color: #f1f5f9;
              color: #1e293b;
              font-weight: 700;
              text-transform: uppercase;
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              font-size: 9px;
              letter-spacing: 0.5px;
            }
            .data-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              color: #334155;
            }
            .text-right {
              text-align: right;
            }
            .tabular-nums {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
            }
            .signature-section {
              margin-top: 45px;
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              page-break-inside: avoid;
            }
            .sig-box {
              text-align: center;
              width: 220px;
            }
            .sig-title {
              font-weight: 600;
              color: #475569;
              margin-bottom: 60px;
            }
            .sig-name {
              font-weight: 700;
              text-decoration: underline;
              color: #0f172a;
            }
            .btn-print-trigger {
              background-color: #4f46e5;
              color: white;
              padding: 8px 16px;
              border: none;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="display: flex; justify-content: flex-end;">
            <button class="btn-print-trigger" onclick="window.print()">Cetak Halaman Ini</button>
          </div>

          <div class="header-info">
            <h1>BUKU PEMBANTU KAS UMUM</h1>
            <h2>Alokasi Anggaran Pendapatan dan Belanja Desa (APBDes)</h2>
          </div>

          <div class="meta-grid">
            <div class="meta-left">
              <p><span class="meta-label">Kode Alokasi:</span> <span class="meta-value">#${selectedRowObj.id}</span></p>
              <p><span class="meta-label">Bidang:</span> <span class="meta-value">${selectedRowObj.bidang}</span></p>
              <p><span class="meta-label">Kegiatan:</span> <span class="meta-value">${selectedRowObj.kegiatan}</span></p>
            </div>
            <div class="meta-right">
              <p><span class="meta-label">Sub-Kegiatan:</span> <span class="meta-value">${selectedRowObj.subKegiatan}</span></p>
              <p><span class="meta-label">Sumber Dana:</span> <span class="meta-value">${selectedRowObj.sumberDana}</span></p>
              <p><span class="meta-label">Tanggal Cetak:</span> <span class="meta-value">${new Date().toISOString().substring(0, 10)}</span></p>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card">
              <div class="card-title">Pagu Alokasi</div>
              <div class="card-amount" style="color: #0f172a;">${formatIDR(selectedRowObj.pagu)}</div>
            </div>
            <div class="card" style="border-color: #fecaca; background-color: #fef2f2;">
              <div class="card-title" style="color: #b91c1c;">Total Belanja (OUT)</div>
              <div class="card-amount" style="color: #b91c1c;">${formatIDR(ledgerTotals.pengeluaran)}</div>
            </div>
            <div class="card" style="border-color: #a7f3d0; background-color: #f0fdf4;">
              <div class="card-title" style="color: #047857;">Refund/Debit (IN)</div>
              <div class="card-amount" style="color: #047857;">${formatIDR(ledgerTotals.pemasukan)}</div>
            </div>
            <div class="card" style="border-color: #c7d2fe; background-color: #f5f3ff;">
              <div class="card-title" style="color: #4338ca;">Saldo Kas Riil</div>
              <div class="card-amount" style="color: #4338ca;">${formatIDR(selectedRowObj.sisaKasRiil)}</div>
            </div>
          </div>

          <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 20px 0 10px 0;">Riwayat Log Mutasi Kas</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 85px; text-align: center;">Tanggal</th>
                <th style="width: 85px; text-align: center;">Tipe</th>
                <th>Keterangan / Referensi Deskripsi</th>
                <th style="width: 120px;" class="text-right">Debet / Masuk (IN)</th>
                <th style="width: 120px;" class="text-right">Kredit / Keluar (OUT)</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="sig-box">
              <div class="sig-title">Mengetahui,<br>Kepala Desa</div>
              <div class="sig-name">( __________________________ )</div>
            </div>
            <div class="sig-box">
              <div class="sig-title">Dibuat Oleh,<br>Bendahara Desa</div>
              <div class="sig-name">( __________________________ )</div>
            </div>
          </div>

          <script>
            // Automatically prompt print dialog and auto close popup after print completed or cancelled
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM indicator for Excel IDR compatibility
    csvContent += "ID,Bidang,Kegiatan,Sub-Kegiatan,Sumber Dana,Pagu,Realisasi,Sisa Pagu,Sisa Kas Riil,Persentase\r\n";

    filteredRekap.forEach((row) => {
      const line = [
        row.id,
        `"${row.bidang.replace(/"/g, '""')}"`,
        `"${row.kegiatan.replace(/"/g, '""')}"`,
        `"${row.subKegiatan.replace(/"/g, '""')}"`,
        row.sumberDana,
        row.pagu,
        row.realisasi,
        row.sisaPagu,
        row.sisaKasRiil,
        `${row.persen.toFixed(1)}%`
      ];
      csvContent += line.join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Rekap_Anggaran_Desa_${new Date().getFullYear()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Filters & Export Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Bidang filter */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
              Filter Bidang
            </label>
            <div className="relative">
              <select
                value={filterBidang}
                onChange={(e) => setFilterBidang(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl px-3.5 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">Semua Bidang</option>
                {bidang.map((b) => (
                  <option key={b.id_bidang} value={b.nama_bidang}>
                    {b.nama_bidang}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sumber Dana filter */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
              Filter Sumber Dana
            </label>
            <div className="relative">
              <select
                value={filterSumber}
                onChange={(e) => setFilterSumber(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl px-3.5 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">Semua Sumber</option>
                {sumberDana.map((s) => (
                  <option key={s.id_sumber} value={s.nama_sumber}>
                    {s.nama_sumber}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search bar */}
          <div>
            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
              Cari Sub-Kegiatan
            </label>
            <div className="relative w-48">
              <input
                type="text"
                placeholder="Cari kegiatan/sub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Export action */}
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition self-end md:self-auto cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor ke CSV</span>
        </button>
      </div>

      {/* Realisasi Pagu Master Report Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="overflow-x-auto rounded-xl border border-slate-50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4 pl-2">ID</th>
                <th className="py-3 px-4">Bidang</th>
                <th className="py-3 px-4">Sub-Kegiatan Desa</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4 text-right">Pagu</th>
                <th className="py-3 px-4 text-right">Realisasi</th>
                <th className="py-3 px-4 text-right">Sisa Pagu</th>
                <th className="py-3 px-4 text-right">Sisa Kas Riil</th>
                <th className="py-3 px-4 text-center">Realisasi (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
              {filteredRekap.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    Tidak ada data alokasi anggaran yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRekap.map((row) => {
                  // Determine dynamic color based on usage percentage
                  let barColor = "bg-indigo-600";
                  let textColor = "text-indigo-600";
                  if (row.persen >= 90) {
                    barColor = "bg-red-500";
                    textColor = "text-red-600";
                  } else if (row.persen >= 75) {
                    barColor = "bg-amber-500";
                    textColor = "text-amber-500";
                  } else if (row.persen > 0) {
                    barColor = "bg-emerald-500";
                    textColor = "text-emerald-600";
                  }

                  return (
                    <tr 
                      key={row.id} 
                      onClick={() => setSelectedAnggaranId(row.id)}
                      className="hover:bg-indigo-50/50 group cursor-pointer transition duration-150"
                      title="Klik untuk melihat Buku Kas Umum Alokasi"
                    >
                      <td className="py-3 px-4 font-bold text-slate-400 group-hover:text-indigo-600 transition">
                        #{row.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold whitespace-nowrap">
                        {row.bidang}
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="font-extrabold text-slate-700 truncate">{row.kegiatan}</p>
                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                          {row.subKegiatan}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-extrabold uppercase">
                          {row.sumberDana}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700 whitespace-nowrap">
                        {formatIDR(row.pagu)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600 whitespace-nowrap">
                        {formatIDR(row.realisasi)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {formatIDR(row.sisaPagu)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-500 whitespace-nowrap">
                        {formatIDR(row.sisaKasRiil)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${barColor}`} 
                              style={{ width: `${Math.min(row.persen, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-extrabold ${textColor}`}>
                            {row.persen.toFixed(0)}%
                          </span>
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

      {/* Buku Kas Detail Modal */}
      {selectedAnggaranId !== null && selectedRowObj !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/55 rounded-t-2xl">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 font-heading">
                    Buku Pembantu Kas Umum Alokasi #{selectedRowObj.id}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {selectedRowObj.subKegiatan} ({selectedRowObj.sumberDana})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnggaranId(null)}
                className="p-1.5 hover:bg-slate-100 border border-slate-200/50 rounded-xl transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Account details info card */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/80">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pagu Alokasi</p>
                  <p className="text-xs font-extrabold text-slate-700 mt-0.5">{formatIDR(selectedRowObj.pagu)}</p>
                </div>
                <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                  <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Total Belanja (OUT)</p>
                  <p className="text-xs font-extrabold text-red-650 mt-0.5">{formatIDR(ledgerTotals.pengeluaran)}</p>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Kas Masuk / Refund (IN)</p>
                  <p className="text-xs font-extrabold text-emerald-600 mt-0.5">{formatIDR(ledgerTotals.pemasukan)}</p>
                </div>
                <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/35">
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Sisa Saldo Kas Riil</p>
                  <p className="text-xs font-extrabold text-indigo-700 mt-0.5">{formatIDR(selectedRowObj.sisaKasRiil)}</p>
                </div>
              </div>

              {/* Ledger metadata summary */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 text-xs text-slate-650">
                <div className="flex">
                  <span className="w-24 font-bold text-slate-400">Bidang:</span>
                  <span className="font-semibold text-slate-700">{selectedRowObj.bidang}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-bold text-slate-400">Kegiatan:</span>
                  <span className="font-semibold text-slate-700">{selectedRowObj.kegiatan}</span>
                </div>
              </div>

              {/* Transaction history list */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Riwayat Log Transaksi Buku Kas</h4>
                
                <div className="border border-slate-100 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <th className="py-2.5 px-3">Tanggal</th>
                        <th className="py-2.5 px-3">Tipe</th>
                        <th className="py-2.5 px-3">Keterangan</th>
                        <th className="py-2.5 px-3 text-center">Bukti</th>
                        <th className="py-2.5 px-3 text-right">Debet (IN)</th>
                        <th className="py-2.5 px-3 text-right">Kredit (OUT)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                      {selectedLedgerTxs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic bg-white">
                            Belum ada riwayat transaksi keuangan pada alokasi ini.
                          </td>
                        </tr>
                      ) : (
                        selectedLedgerTxs.map((t) => {
                          const matchingHutang = t.ref_id ? hutang.find((h) => h.id === t.ref_id) : null;
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-500">{formatTanggal(t.tanggal)}</td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                                  t.tipe === "Pemasukan"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : "bg-red-50 text-red-600 border border-red-100"
                                }`}>
                                  {t.tipe === "Pemasukan" ? "IN / DEBET" : "OUT / KREDIT"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 max-w-[250px] break-words whitespace-normal">
                                <p className="text-slate-700">
                                  {t.keterangan}
                                  {matchingHutang && (
                                    <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] rounded font-extrabold uppercase">
                                      Peminjam: {matchingHutang.peminjam}
                                    </span>
                                  )}
                                </p>
                                {t.ref_id && (
                                  <div className="mt-0.5">
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-[8px] rounded font-extrabold text-slate-400">
                                      REF: {t.ref_id}
                                    </span>
                                  </div>
                                )}
                              </td>
                            <td className="py-2.5 px-3 text-center">
                              {t.bukti ? (
                                <button
                                  type="button"
                                  onClick={() => setViewReceipt(t.bukti!, `bukti_kas_${t.id}.png`)}
                                  className="p-1 text-indigo-600 hover:bg-slate-100 border border-slate-200 rounded inline-flex shadow-sm cursor-pointer"
                                  title="Lihat Bukti Foto"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 font-bold tabular-nums">
                              {t.tipe === "Pemasukan" ? formatIDR(t.jumlah) : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right text-red-500 font-bold tabular-nums">
                              {t.tipe === "Pengeluaran" ? formatIDR(t.jumlah) : "-"}
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20 rounded-b-2xl">
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95 cursor-pointer flex items-center space-x-1.5"
                title="Cetak Buku Pembantu ini dalam format laporan formal"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Buku Kas</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAnggaranId(null)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95 cursor-pointer"
              >
                Tutup Buku Kas alokasi
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
