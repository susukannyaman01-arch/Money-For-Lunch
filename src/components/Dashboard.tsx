/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  Coins, 
  Receipt, 
  Scale, 
  Handshake, 
  Lock, 
  Printer, 
  FileSpreadsheet, 
  Filter, 
  Undo2, 
  ChevronDown, 
  Search, 
  Wallet,
  Activity,
  CheckCircle2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { 
  Bidang, 
  Kegiatan, 
  SubKegiatan, 
  SumberDana, 
  Anggaran, 
  Transaksi, 
  Talangan, 
  Hutang,
  formatTanggal,
  compareTanggal
} from "../types";

interface DashboardProps {
  bidang: Bidang[];
  kegiatan: Kegiatan[];
  subKegiatan: SubKegiatan[];
  sumberDana: SumberDana[];
  anggaran: Anggaran[];
  transaksi: Transaksi[];
  talangan: Talangan[];
  hutang: Hutang[];
  setViewReceipt: (url: string, name: string) => void;
}

export default function Dashboard({
  bidang,
  kegiatan,
  subKegiatan,
  sumberDana,
  anggaran,
  transaksi,
  talangan,
  hutang,
  setViewReceipt
}: DashboardProps) {
  // Filters for Buku Kas Dinamis
  const [filterType, setFilterType] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterSub, setFilterSub] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // 1. Calculations for upper metric cards
  const totalPagu = useMemo(() => {
    return anggaran.reduce((acc, curr) => acc + curr.pagu, 0);
  }, [anggaran]);

  const totalRealisasi = useMemo(() => {
    return transaksi
      .filter((t) => t.tipe === "Pengeluaran")
      .reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [transaksi]);

  const totalPemasukan = useMemo(() => {
    return transaksi
      .filter((t) => t.tipe === "Pemasukan")
      .reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [transaksi]);

  const outstandingTalangan = useMemo(() => {
    return talangan
      .filter((t) => t.status === "Belum Lunas")
      .reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [talangan]);

  const outstandingHutang = useMemo(() => {
    return hutang
      .filter((h) => h.status === "Belum Lunas")
      .reduce((acc, curr) => acc + curr.jumlah, 0);
  }, [hutang]);

  const sisaSaldo = totalPagu - totalRealisasi;
  const sisaKasRiil = totalPemasukan - totalRealisasi;
  const realisasiPersen = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;
  const sisaPersen = totalPagu > 0 ? (sisaSaldo / totalPagu) * 100 : 0;

  // 2. Bar Chart Data: Realisasi vs Pagu per Bidang
  const chartBidangData = useMemo(() => {
    const dataMap: Record<string, { pagu: number; realisasi: number }> = {};
    
    bidang.forEach((b) => {
      dataMap[b.nama_bidang] = { pagu: 0, realisasi: 0 };
    });

    // Sum pagu
    anggaran.forEach((a) => {
      const bObj = bidang.find((b) => b.id_bidang === a.id_bidang);
      if (bObj) {
        dataMap[bObj.nama_bidang].pagu += a.pagu;
      }
    });

    // Sum realisasi spending
    transaksi.forEach((t) => {
      if (t.tipe === "Pengeluaran") {
        const angObj = anggaran.find((a) => a.id === t.id_anggaran);
        if (angObj) {
          const bObj = bidang.find((b) => b.id_bidang === angObj.id_bidang);
          if (bObj) {
            dataMap[bObj.nama_bidang].realisasi += t.jumlah;
          }
        }
      }
    });

    return Object.entries(dataMap).map(([name, val]) => ({
      name,
      pagu_currency: formatIDR(val.pagu),
      realisasi_currency: formatIDR(val.realisasi),
      Pagu: val.pagu,
      Realisasi: val.realisasi
    }));
  }, [bidang, anggaran, transaksi]);

  // 3. Doughnut Chart Data: Realisasi Belanja per Sumber Dana
  const chartSumberData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    sumberDana.forEach((s) => {
      dataMap[s.nama_sumber] = 0;
    });

    transaksi.forEach((t) => {
      if (t.tipe === "Pengeluaran") {
        const angObj = anggaran.find((a) => a.id === t.id_anggaran);
        if (angObj) {
          const sObj = sumberDana.find((s) => s.id_sumber === angObj.id_sumber);
          if (sObj) {
            dataMap[sObj.nama_sumber] += t.jumlah;
          }
        }
      }
    });

    const colors = [
      "#6366f1", // indigo
      "#0d9488", // teal
      "#10b981", // emerald
      "#f59e0b", // amber
      "#ef4444", // red
      "#6b7280", // gray
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#06b6d4"  // cyan
    ];

    return Object.entries(dataMap)
      .filter(([_, val]) => val > 0)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length],
        value_currency: formatIDR(value)
      }));
  }, [sumberDana, anggaran, transaksi]);

  // 4. Buku Kas Dinamis Ledger Filtered Rows
  const filteredBukuKas = useMemo(() => {
    const list = transaksi.filter((t) => {
      if (filterType && t.tipe !== filterType) return false;
      if (filterSource && t.sumberDana !== filterSource) return false;
      if (filterSub && t.subKegiatan !== filterSub) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const kegName = (t.kegiatan || "").toLowerCase();
        const subName = (t.subKegiatan || "").toLowerCase();
        const ketStr = (t.keterangan || "").toLowerCase();
        const srcName = (t.sumberDana || "").toLowerCase();
        if (!kegName.includes(q) && !subName.includes(q) && !ketStr.includes(q) && !srcName.includes(q)) {
          return false;
        }
      }
      return true;
    });
    return list.sort((a, b) => compareTanggal(a.tanggal, b.tanggal) || a.id.localeCompare(b.id));
  }, [transaksi, filterType, filterSource, filterSub, searchQuery]);

  // Sums for Buku Kas footer
  const filteredSums = useMemo(() => {
    let receipts = 0;
    let spendings = 0;
    filteredBukuKas.forEach((t) => {
      if (t.tipe === "Pemasukan") receipts += t.jumlah;
      else spendings += t.jumlah;
    });
    return {
      receipts,
      spendings,
      balance: receipts - spendings
    };
  }, [filteredBukuKas]);

  // Print Buku Kas handler
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let tableRows = filteredBukuKas.map(t => {
      return `
        <tr>
          <td>${formatTanggal(t.tanggal)}</td>
          <td>${t.tipe === "Pemasukan" ? "Penerimaan" : "Belanja"}</td>
          <td>${t.sumberDana}</td>
          <td>
            <strong>${t.kegiatan}</strong><br/>
            <small>${t.subKegiatan}</small>
          </td>
          <td>${t.keterangan}</td>
          <td style="text-align: right; font-weight: bold;">
            ${t.tipe === "Pemasukan" ? "+" : "-"}${formatIDR(t.jumlah)}
          </td>
        </tr>
      `;
    }).join("");

    if (filteredBukuKas.length === 0) {
      tableRows = `<tr><td colspan="6" style="text-align: center;">Tidak ada data yang cocok</td></tr>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Buku Kas Keuangan Desa</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; margin-bottom: 5px; }
            p { font-size: 11px; color: #64748b; margin-top: 0; }
            .filters-info { font-size: 11px; margin: 15px 0; background: #f1f5f9; padding: 10px; border-radius: 6px; display: flex; gap: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 10px; font-size: 11px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Laporan Buku Kas Desa</h1>
          <p>Tanggal Cetak: ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <div class="filters-info">
            <div><strong>Tipe:</strong> ${filterType || "Semua"}</div>
            <div><strong>Sumber Dana:</strong> ${filterSource || "Semua"}</div>
            <div><strong>Sub-Kegiatan:</strong> ${filterSub || "Semua"}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Tipe</th>
                <th>Sumber</th>
                <th>Kegiatan / Sub-Kegiatan</th>
                <th>Keterangan</th>
                <th style="text-align: right;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="5" style="text-align: left; padding-left: 15px;">Total Penerimaan (Filter)</td>
                <td style="text-align: right; color: #10b981;">+${formatIDR(filteredSums.receipts)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="5" style="text-align: left; padding-left: 15px;">Total Belanja (Filter)</td>
                <td style="text-align: right; color: #ef4444;">-${formatIDR(filteredSums.spendings)}</td>
              </tr>
              <tr class="total-row" style="background: #e0e7ff;">
                <td colspan="5" style="text-align: left; padding-left: 15px; color: #4f46e5;">Sisa Saldo Kas (Filter)</td>
                <td style="text-align: right; color: #4f46e5;">${formatIDR(filteredSums.balance)}</td>
              </tr>
            </tfoot>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export CSV handler
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM indicator for Excel IDR compatibility
    csvContent += "Tanggal,Tipe,Sumber Dana,Kegiatan,Sub-Kegiatan,Keterangan,Jumlah\r\n";

    filteredBukuKas.forEach((t) => {
      const row = [
        t.tanggal,
        t.tipe === "Pemasukan" ? "Penerimaan" : "Belanja (Belanja)",
        t.sumberDana || "-",
        `"${(t.kegiatan || "").replace(/"/g, '""')}"`,
        `"${(t.subKegiatan || "").replace(/"/g, '""')}"`,
        `"${(t.keterangan || "").replace(/"/g, '""')}"`,
        t.jumlah
      ];
      csvContent += row.join(",") + "\r\n";
    });

    csvContent += `\r\n`;
    csvContent += `,,,,,Total Penerimaan,${filteredSums.receipts}\r\n`;
    csvContent += `,,,,,Total Belanja,-${filteredSums.spendings}\r\n`;
    csvContent += `,,,,,Sisa Kas Saldo,${filteredSums.balance}\r\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `Buku_Kas_Desa_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pagu */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pagu Anggaran</span>
            <h3 className="text-2xl font-extrabold text-slate-800 font-heading tracking-tight">
              {formatIDR(totalPagu)}
            </h3>
            <span className="text-[10px] text-slate-400 font-medium block">Pagu APBDes terdaftar</span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3.5 rounded-2xl">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        {/* Realisasi Belanja */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Realisasi Belanja</span>
            <h3 className="text-2xl font-extrabold text-slate-800 font-heading tracking-tight">
              {formatIDR(totalRealisasi)}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(realisasiPersen, 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-teal-600">{realisasiPersen.toFixed(1)}%</span>
            </div>
          </div>
          <div className="bg-teal-50 text-teal-600 p-3.5 rounded-2xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Sisa Saldo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sisa Saldo Anggaran</span>
            <h3 className="text-2xl font-extrabold text-slate-800 font-heading tracking-tight">
              {formatIDR(sisaSaldo)}
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {sisaPersen.toFixed(1)}% sisa saldo anggaran
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Outstanding Talangan & Hutang */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center justify-between transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Talangan & Hutang Aktif</span>
            <h3 className="text-2xl font-extrabold text-slate-800 font-heading tracking-tight">
              {formatIDR(outstandingTalangan + outstandingHutang)}
            </h3>
            <span className="text-[10px] text-amber-500 font-semibold block uppercase tracking-tight">
              Talangan: {formatIDR(outstandingTalangan)} | Hutang: {formatIDR(outstandingHutang)}
            </span>
          </div>
          <div className="bg-amber-50 text-amber-500 p-3.5 rounded-2xl">
            <Handshake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Charts & Sisa Kas Riil Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Realisasi per Bidang (Bar Chart) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 font-heading flex items-center">
              <Activity className="w-4.5 h-4.5 text-indigo-500 mr-2" />
              Anggaran vs Realisasi per Bidang
            </h3>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartBidangData} 
                margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1e6)}jt`}
                />
                <ChartTooltip 
                  contentStyle={{ 
                    fontFamily: 'Inter', 
                    fontSize: '11px', 
                    borderRadius: '12px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                  }}
                  formatter={(value: any) => [formatIDR(Number(value))]}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} 
                />
                <Bar dataKey="Pagu" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Realisasi" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Realisasi per Sumber Dana (Pie Chart) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-800 font-heading flex items-center">
            <Coins className="w-4.5 h-4.5 text-teal-500 mr-2" />
            Spending per Sumber Dana
          </h3>
          <div className="h-56 relative flex items-center justify-center">
            {chartSumberData.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">
                <p>Belum ada pengeluaran terealisasi</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartSumberData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartSumberData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    contentStyle={{ 
                      fontFamily: 'Inter', 
                      fontSize: '11px',
                      borderRadius: '12px'
                    }}
                    formatter={(value: any, name: any) => [formatIDR(Number(value)), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Custom Legends */}
          <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold">
            {chartSumberData.map((entry, idx) => (
              <span key={idx} className="flex items-center space-x-1" style={{ color: entry.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Sisa Kas Riil di Bendahara */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between space-y-4 ring-1 ring-emerald-500/10 shadow-emerald-500/2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 font-heading flex items-center">
              <Wallet className="w-4.5 h-4.5 text-emerald-500 mr-2" />
              Sisa Kas Riil
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
              Tunai Riil
            </span>
          </div>
          <div className="py-5 flex flex-col items-center justify-center border-y border-slate-50 my-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
              Saldo Kas di Bendahara
            </p>
            <h3 className="text-3xl font-extrabold text-slate-800 font-heading tracking-tight mt-1 text-center">
              {formatIDR(sisaKasRiil)}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1 text-center">
              Total Penerimaan - Total Pengeluaran
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Status Sinkronisasi:</span>
            <span className="font-bold text-emerald-600 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sinkron
            </span>
          </div>
        </div>
      </div>

      {/* 3. Buku Kas Dinamis Widget */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 font-heading flex items-center">
              Buku Kas Dinamis
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Filter arus penerimaan, pengeluaran, sumber dana, dan aktivitas keuangan desa secara dinamis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tipe Filter */}
            <div className="relative">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl px-3.5 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">Semua Tipe</option>
                <option value="Pemasukan">Penerimaan (In)</option>
                <option value="Pengeluaran">Pengeluaran (Out)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sumber Dana Filter */}
            <div className="relative">
              <select 
                value={filterSource} 
                onChange={(e) => setFilterSource(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl px-3.5 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none"
              >
                <option value="">Semua Sumber Dana</option>
                {sumberDana.map((sd) => (
                  <option key={sd.id_sumber} value={sd.nama_sumber}>
                    {sd.nama_sumber}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Sub Kegiatan Filter */}
            <div className="relative">
              <select 
                value={filterSub} 
                onChange={(e) => setFilterSub(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl px-3.5 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none max-w-[210px] truncate"
              >
                <option value="">Semua Sub-Kegiatan</option>
                {subKegiatan.map((sk) => (
                  <option key={sk.id_sub} value={sk.nama_sub}>
                    {sk.nama_sub}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input */}
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Cari keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl pl-8 pr-3 py-2 text-xs font-semibold text-slate-600 focus:outline-none placeholder-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Action Buttons */}
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button 
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/40 text-xs font-bold text-emerald-700 rounded-xl transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Kegiatan / Sub-Kegiatan</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center">Bukti</th>
                <th className="py-3 px-4 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
              {filteredBukuKas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada barang transaksi yang cocok dengan filter yang ditentukan.
                  </td>
                </tr>
              ) : (
                filteredBukuKas.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="py-3 px-4 font-bold text-slate-600 whitespace-nowrap">
                      {formatTanggal(t.tanggal)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        t.tipe === "Pemasukan" 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                          : "bg-red-50 border-red-100 text-red-600"
                      }`}>
                        {t.tipe === "Pemasukan" ? "Penerimaan" : "Belanja"}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-400">
                      {t.sumberDana}
                    </td>
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="font-bold text-slate-700 truncate">{t.kegiatan}</p>
                      <p className="text-[10px] text-slate-400 hover:text-slate-500 font-semibold truncate mt-0.5">
                        {t.subKegiatan}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[250px] whitespace-normal break-words">
                      {t.keterangan}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.bukti ? (
                        <button 
                          onClick={() => setViewReceipt(t.bukti!, `bukti_transaksi_${t.id}.png`)}
                          className="inline-flex p-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition"
                          title="Lihat Bukti Foto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300 font-light">-</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 text-right font-extrabold whitespace-nowrap text-sm ${
                      t.tipe === "Pemasukan" ? "text-emerald-600" : "text-slate-700"
                    }`}>
                      {t.tipe === "Pemasukan" ? "+" : "-"}{formatIDR(t.jumlah)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredBukuKas.length > 0 && (
              <tfoot className="bg-slate-50/45 text-xs font-bold divide-y divide-slate-100/50 border-t border-slate-100 text-slate-600">
                <tr>
                  <td colSpan={6} className="py-2.5 px-4 text-left">
                    Total Penerimaan (Filter)
                  </td>
                  <td className="py-2.5 px-4 text-right text-emerald-600 font-extrabold">
                    +{formatIDR(filteredSums.receipts)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="py-2.5 px-4 text-left">
                    Total Belanja (Filter)
                  </td>
                  <td className="py-2.5 px-4 text-right text-red-600 font-extrabold">
                    -{formatIDR(filteredSums.spendings)}
                  </td>
                </tr>
                <tr className="bg-indigo-50/30 text-indigo-700 font-extrabold">
                  <td colSpan={6} className="py-2.5 px-4 text-left">
                    Sisa Kas Saldo (Filter)
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    {formatIDR(filteredSums.balance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
