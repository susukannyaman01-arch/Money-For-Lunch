/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Camera, ListTodo, ArrowUpDown, Handshake, Check, AlertCircle } from "lucide-react";
import { Transaksi, Talangan, Hutang, formatTanggal, compareTanggal, formatKeterangan } from "../types";

interface RiwayatViewProps {
  transaksi: Transaksi[];
  talangan: Talangan[];
  hutang: Hutang[];
  setViewReceipt: (url: string, name: string) => void;
}

export default function RiwayatView({
  transaksi,
  talangan,
  hutang,
  setViewReceipt
}: RiwayatViewProps) {
  // Sub-tabs navigation
  const [activeSubTab, setActiveSubTab] = useState<"transaksi" | "talangan" | "hutang">("transaksi");

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 bg-white p-1 rounded-xl shadow-sm max-w-md">
        <button
          onClick={() => setActiveSubTab("transaksi")}
          className={`flex-1 py-2 px-4 font-bold text-xs rounded-lg transition duration-200 cursor-pointer ${
            activeSubTab === "transaksi"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center justify-center">
            <ListTodo className="w-3.5 h-3.5 mr-1" />
            Log Transaksi
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab("talangan")}
          className={`flex-1 py-2 px-4 font-bold text-xs rounded-lg transition duration-200 cursor-pointer ${
            activeSubTab === "talangan"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center justify-center">
            <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            Log Talangan
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab("hutang")}
          className={`flex-1 py-2 px-4 font-bold text-xs rounded-lg transition duration-200 cursor-pointer ${
            activeSubTab === "hutang"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="flex items-center justify-center">
            <Handshake className="w-3.5 h-3.5 mr-1" />
            Log Hutang
          </span>
        </button>
      </div>

      {/* Tables View Box */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        
        {/* Sub-tab 1: Transactions log */}
        {activeSubTab === "transaksi" && (
          <div className="overflow-x-auto rounded-xl border border-slate-50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Sub-Kegiatan &amp; Sumber</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4 text-center">Bukti</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
                {transaksi.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada log transaksi terekam.
                    </td>
                  </tr>
                ) : (
                  // Sort oldest date first (terlama ke terbaru)
                  transaksi.slice().sort((a, b) => compareTanggal(a.tanggal, b.tanggal) || a.id.localeCompare(b.id)).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-400">
                        #{t.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold whitespace-nowrap">
                        {formatTanggal(t.tanggal)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-extrabold ${
                          t.tipe === "Pemasukan"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                          {t.tipe === "Pemasukan" ? "PENERIMAAN" : "BELANJA"}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-[150px]">
                        <p className="font-extrabold text-slate-700 truncate">{t.subKegiatan || "-"}</p>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                          {t.sumberDana || "-"}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] whitespace-normal break-words">
                        {formatKeterangan(t.keterangan)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {t.bukti ? (
                          <button
                            onClick={() => setViewReceipt(t.bukti!, `bukti_transaksi_${t.id}.png`)}
                            className="p-1 px-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded inline-flex"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-700 whitespace-nowrap text-sm">
                        {formatIDR(t.jumlah)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab 2: Talangan log */}
        {activeSubTab === "talangan" && (
          <div className="overflow-x-auto rounded-xl border border-slate-50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Transfer Rekening</th>
                  <th className="py-3 px-4">Alasan / Keterangan</th>
                  <th className="py-3 px-4 text-center">Bukti</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Tanggal Lunas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
                {talangan.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tidak ada log talangan terekam.
                    </td>
                  </tr>
                ) : (
                  // Sort oldest date first (terlama ke terbaru)
                  talangan.slice().sort((a, b) => compareTanggal(a.tanggal, b.tanggal) || a.id.localeCompare(b.id)).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-400">
                        #{t.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold whitespace-nowrap">
                        {formatTanggal(t.tanggal)}
                      </td>
                      <td className="py-3 px-4 max-w-[150px]">
                        <p className="font-extrabold text-red-500 text-[9px] uppercase">Dari: {t.subGiver}</p>
                        <p className="font-extrabold text-emerald-600 text-[9px] uppercase mt-0.5">Ke: {t.subReceiver}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[200px] whitespace-normal break-words">
                        {formatKeterangan(t.keterangan)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {t.bukti ? (
                          <button
                            onClick={() => setViewReceipt(t.bukti!, `bukti_talangan_${t.id}.png`)}
                            className="p-1 px-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded inline-flex"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-700 whitespace-nowrap text-sm">
                        {formatIDR(t.jumlah)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                          t.status === "Lunas"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {t.status === "Lunas" ? (
                            <>
                              <Check className="w-2.5 h-2.5 mr-0.5" /> LUNAS
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> BELUM REIMBURSE
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-500 whitespace-nowrap">
                        {t.tanggal_lunas ? formatTanggal(t.tanggal_lunas) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Sub-tab 3: Hutang log */}
        {activeSubTab === "hutang" && (
          <div className="overflow-x-auto rounded-xl border border-slate-50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Pihak Peminjam</th>
                  <th className="py-3 px-4">Sumber Kas &amp; Keterangan</th>
                  <th className="py-3 px-4 text-center">Bukti</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Tanggal Lunas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-600 font-medium">
                {hutang.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada log pinjaman hutang terekam.
                    </td>
                  </tr>
                ) : (
                  // Sort oldest date first (terlama ke terbaru)
                  hutang.slice().sort((a, b) => compareTanggal(a.tanggal, b.tanggal) || a.id.localeCompare(b.id)).map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-400">
                        #{h.id}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-bold whitespace-nowrap">
                        {formatTanggal(h.tanggal)}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-700 whitespace-nowrap">
                        {h.peminjam}
                      </td>
                      <td className="py-3 px-4 max-w-[180px]">
                        <p className="font-extrabold text-slate-700 truncate">{h.subGiver}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {formatKeterangan(h.keterangan || "-")}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {h.bukti ? (
                          <button
                            onClick={() => setViewReceipt(h.bukti!, `bukti_hutang_${h.id}.png`)}
                            className="p-1 px-1.5 text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded inline-flex"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-700 whitespace-nowrap text-sm">
                        {formatIDR(h.jumlah)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-extrabold border ${
                          h.status === "Lunas"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-100"
                        }`}>
                          {h.status === "Lunas" ? (
                            <>
                              <Check className="w-2.5 h-2.5 mr-0.5" /> LUNAS
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> BELUM LUNAS
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-500 whitespace-nowrap">
                        {h.tanggal_lunas ? formatTanggal(h.tanggal_lunas) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
