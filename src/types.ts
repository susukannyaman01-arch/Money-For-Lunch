/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Bidang {
  id_bidang: number;
  nama_bidang: string;
}

export interface Kegiatan {
  id_kegiatan: number;
  id_bidang: number;
  nama_kegiatan: string;
}

export interface SubKegiatan {
  id_sub: number;
  id_kegiatan: number;
  nama_sub: string;
}

export interface SumberDana {
  id_sumber: number;
  nama_sumber: string;
}

export interface Anggaran {
  id: number;
  id_bidang: number;
  id_kegiatan: number;
  id_sub: number;
  id_sumber: number;
  pagu: number;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  tipe: "Pemasukan" | "Pengeluaran";
  id_anggaran: number;
  jumlah: number;
  keterangan: string;
  ref_id?: string;
  bukti?: string; // base64 string or file url
  timestamp?: string;
  
  // Flattened for easy UI access
  sumberDana?: string;
  kegiatan?: string;
  subKegiatan?: string;
}

export interface Talangan {
  id: string;
  tanggal: string;
  id_anggaran_pemberi: number;
  id_anggaran_penerima: number;
  jumlah: number;
  keterangan: string;
  status: "Lunas" | "Belum Lunas";
  tanggal_lunas?: string;
  bukti?: string;
  timestamp?: string;

  // Resolved names for UI
  subGiver?: string;
  subReceiver?: string;
}

export interface Hutang {
  id: string;
  tanggal: string;
  id_anggaran_pemberi: number;
  peminjam: string;
  jumlah: number;
  keterangan: string;
  status: "Lunas" | "Belum Lunas";
  tanggal_lunas?: string;
  bukti?: string;
  timestamp?: string;

  // Resolved names for UI
  subGiver?: string;
}

// Master Data Definitions exactly matching the original Google Sheets
export const MASTER_BIDANG: Bidang[] = [
  { id_bidang: 1, nama_bidang: "Pemerintahan" },
  { id_bidang: 2, nama_bidang: "Pembangunan" },
  { id_bidang: 3, nama_bidang: "Pembinaan" },
  { id_bidang: 4, nama_bidang: "Pemberdayaan" },
  { id_bidang: 5, nama_bidang: "Mendesak" },
  { id_bidang: 6, nama_bidang: "Tidak Terduga" },
  { id_bidang: 7, nama_bidang: "Pribadi" }
];

export const MASTER_KEGIATAN: Kegiatan[] = [
  { id_kegiatan: 1, id_bidang: 1, nama_kegiatan: "Penghasilan Tetap Kuwu" },
  { id_kegiatan: 2, id_bidang: 1, nama_kegiatan: "Penghasilan Tetap Perangkat" },
  { id_kegiatan: 3, id_bidang: 1, nama_kegiatan: "BPJS" },
  { id_kegiatan: 4, id_bidang: 1, nama_kegiatan: "Operasional Pemerintah Desa" },
  { id_kegiatan: 5, id_bidang: 1, nama_kegiatan: "Tunjangan BPD" },
  { id_kegiatan: 6, id_bidang: 1, nama_kegiatan: "Op BPD" },
  { id_kegiatan: 7, id_bidang: 1, nama_kegiatan: "Insentif RT/RW" },
  { id_kegiatan: 8, id_bidang: 1, nama_kegiatan: "Op Desa dari DDS" },
  { id_kegiatan: 9, id_bidang: 1, nama_kegiatan: "Lain-lain sub Bidang Siltap dan Operasional Pemerintah Desa" },
  { id_kegiatan: 10, id_bidang: 1, nama_kegiatan: "Penyediaan Sarana (Aset Tetap) Perkantoran/Pemerintahan" },
  { id_kegiatan: 11, id_bidang: 1, nama_kegiatan: "Pusat Kesejahteraan Sosial (Puskesos)" },
  { id_kegiatan: 12, id_bidang: 1, nama_kegiatan: "Penyusunan Dokumen Perencanaan Desa (RPJMDesa/RKPDesa dll)" },
  { id_kegiatan: 13, id_bidang: 1, nama_kegiatan: "Pengembangan Sistem Informasi Desa" },
  { id_kegiatan: 14, id_bidang: 1, nama_kegiatan: "Sertifikasi Tanah Kas Desa" },
  { id_kegiatan: 15, id_bidang: 1, nama_kegiatan: "Adminstrasi Pajak Bumi dan Bangunan (PBB)" },
  { id_kegiatan: 16, id_bidang: 2, nama_kegiatan: "Penyelenggaran PAUD/TK/TPA/TKA/TPQ/Madrasah NonFormal Milik Desa (Honor, Pakaian dll)" },
  { id_kegiatan: 17, id_bidang: 2, nama_kegiatan: "Penyelenggaraan Posyandu (Mkn Tambahan, Kls Bumil, Lamsia, Insentif)" },
  { id_kegiatan: 18, id_bidang: 2, nama_kegiatan: "Pembangunan/Rehabilitas/Peningkatan/Pengerasan Jalan Desa" },
  { id_kegiatan: 19, id_bidang: 2, nama_kegiatan: "Pembangunan/Rehabilitasi/Peningkatan/Pengerasan Jalan Lingkungan Permukiman (Dipilih)" },
  { id_kegiatan: 20, id_bidang: 2, nama_kegiatan: "Pemeliharaan Fasilitas Pengelolaan Sampah Desa (Penampungan, Bank Sampah, dll)" },
  { id_kegiatan: 21, id_bidang: 3, nama_kegiatan: "Koordinasi Pembinaan Keamanan, Ketertiban & Perlindungan Masy. Skala Lokal Desa" },
  { id_kegiatan: 22, id_bidang: 3, nama_kegiatan: "Penyelenggaran Festival Kesenian, Adat/Kebudayaan, dan Kegamaan (HUT RI, Raya Keagamaan dll)" },
  { id_kegiatan: 23, id_bidang: 3, nama_kegiatan: "Pembangunan/Rehabilitasi Sarana Prasarana Kebudayaan/Rumah Adat/Kegamaan Milik Desa (Dipilih)" },
  { id_kegiatan: 24, id_bidang: 3, nama_kegiatan: "Kegiatan safari ramadhan" },
  { id_kegiatan: 25, id_bidang: 3, nama_kegiatan: "Pembinaan Karangtaruna/Klub Kepemudaan/Olahraga Tingkat Desa" },
  { id_kegiatan: 26, id_bidang: 3, nama_kegiatan: "Pembinaan LKMD/LPM/LPMD" },
  { id_kegiatan: 27, id_bidang: 3, nama_kegiatan: "Pembinaan PKK" },
  { id_kegiatan: 28, id_bidang: 3, nama_kegiatan: "Pembinaan MUIDesa" },
  { id_kegiatan: 29, id_bidang: 4, nama_kegiatan: "Pemeliharaan Saluran Irigasi Tersier/Sederhana" },
  { id_kegiatan: 30, id_bidang: 4, nama_kegiatan: "Lain-lain Sub Bidang Koperasi, Usaha Micro Kecil dan Menengah (UMKM)" },
  { id_kegiatan: 31, id_bidang: 5, nama_kegiatan: "Bantuan langsung tunai (BLT)" },
  { id_kegiatan: 32, id_bidang: 6, nama_kegiatan: "Tidak terduga" },
  { id_kegiatan: 33, id_bidang: 7, nama_kegiatan: "Pribadi" }
];

export const MASTER_SUB_KEGIATAN: SubKegiatan[] = [
  { id_sub: 1, id_kegiatan: 1, nama_sub: "Siltap Kuwu" },
  { id_sub: 2, id_kegiatan: 1, nama_sub: "Tunjangan Kuwu" },
  { id_sub: 3, id_kegiatan: 2, nama_sub: "Siltap Perangkat ADD" },
  { id_sub: 4, id_kegiatan: 2, nama_sub: "Siltap Perangkat PAD" },
  { id_sub: 5, id_kegiatan: 2, nama_sub: "Tunjangan Perangkat PAD" },
  { id_sub: 6, id_kegiatan: 3, nama_sub: "BPJS Kuwu dan Perangkat" },
  { id_sub: 7, id_kegiatan: 4, nama_sub: "ATK" },
  { id_sub: 8, id_kegiatan: 4, nama_sub: "Alat Listrik" },
  { id_sub: 9, id_kegiatan: 4, nama_sub: "Alat Rumah Tangga" },
  { id_sub: 10, id_kegiatan: 4, nama_sub: "Honor Juru Kunci" },
  { id_sub: 11, id_kegiatan: 4, nama_sub: "Honor Kemit" },
  { id_sub: 12, id_kegiatan: 4, nama_sub: "Honor Tenaga Pendukung" },
  { id_sub: 13, id_kegiatan: 4, nama_sub: "Langganan Listrik" },
  { id_sub: 14, id_kegiatan: 4, nama_sub: "Langganan Koran" },
  { id_sub: 15, id_kegiatan: 4, nama_sub: "Langganan Internet" },
  { id_sub: 16, id_kegiatan: 4, nama_sub: "Administrasi Bank" },
  { id_sub: 17, id_kegiatan: 4, nama_sub: "Pemeliharaan Kendaraan Bermotor" },
  { id_sub: 18, id_kegiatan: 4, nama_sub: "Pemeliharaan Kantor Desa" },
  { id_sub: 19, id_kegiatan: 5, nama_sub: "Tunjangan BPD ADD" },
  { id_sub: 20, id_kegiatan: 6, nama_sub: "Op BPD ADD" },
  { id_sub: 21, id_kegiatan: 6, nama_sub: "Op BPD PBP" },
  { id_sub: 22, id_kegiatan: 7, nama_sub: "Insentif RT/RW" },
  { id_sub: 23, id_kegiatan: 8, nama_sub: "Dukungan Penyelenggaraan pencegahan dan penanggulangan kerawanan sosial" },
  { id_sub: 24, id_kegiatan: 9, nama_sub: "TPAPD Kuwu" },
  { id_sub: 25, id_kegiatan: 9, nama_sub: "TPAPD Perangkat" },
  { id_sub: 26, id_kegiatan: 9, nama_sub: "Ketenagakerjaan Lembaga" },
  { id_sub: 27, id_kegiatan: 9, nama_sub: "Tunjangan Kedudukan BPD PAD" },
  { id_sub: 28, id_kegiatan: 10, nama_sub: "Sarpras Desa" },
  { id_sub: 29, id_kegiatan: 11, nama_sub: "Bahan Bakar Minyak" },
  { id_sub: 30, id_kegiatan: 11, nama_sub: "Honor Tim" },
  { id_sub: 31, id_kegiatan: 11, nama_sub: "Insentif Pelayanan Desa" },
  { id_sub: 32, id_kegiatan: 12, nama_sub: "Penyusunan Dokumen Perencanaan Desa (RPJMDesa/RKPDesa dll)" },
  { id_sub: 33, id_kegiatan: 13, nama_sub: "Operator Web Desa" },
  { id_sub: 34, id_kegiatan: 13, nama_sub: "Sarana dan Prasarana Informasi Desa" },
  { id_sub: 35, id_kegiatan: 14, nama_sub: "Sertifikasi Tanah Kas Desa" },
  { id_sub: 36, id_kegiatan: 15, nama_sub: "Insentif PBB Kuwu Perangkat BPD" },
  { id_sub: 37, id_kegiatan: 15, nama_sub: "Insentif Kolektor PBB" },
  { id_sub: 38, id_kegiatan: 16, nama_sub: "TK Al-Ikhwan" },
  { id_sub: 39, id_kegiatan: 17, nama_sub: "Posyandu" },
  { id_sub: 40, id_kegiatan: 18, nama_sub: "Rabat Beton Jl Gotrok (910 x 3 x 0,15 m)" },
  { id_sub: 41, id_kegiatan: 19, nama_sub: "Pengaspalan Gang H.Madamin (100 x 1 x 0,02 m)" },
  { id_sub: 42, id_kegiatan: 19, nama_sub: "Pengaspalan Gang Rumah Faridah (73 x 1 x 0,02 m)" },
  { id_sub: 43, id_kegiatan: 19, nama_sub: "Betonisasi Gang Ex Koramil (50 x 1 x 0,1 m)" },
  { id_sub: 44, id_kegiatan: 19, nama_sub: "Pengaspalan Gang Kayen ( 75 x 2 x 0,02 m)" },
  { id_sub: 45, id_kegiatan: 19, nama_sub: "Pengurugan Jalan Cacing" },
  { id_sub: 46, id_kegiatan: 20, nama_sub: "Honorarium Petugas TPS" },
  { id_sub: 47, id_kegiatan: 20, nama_sub: "Pemeliharaan TPS" },
  { id_sub: 48, id_kegiatan: 21, nama_sub: "Babinsa dan babinkamtibmas" },
  { id_sub: 49, id_kegiatan: 22, nama_sub: "Sewa wayang" },
  { id_sub: 50, id_kegiatan: 22, nama_sub: "Konsumsi Wayang" },
  { id_sub: 51, id_kegiatan: 22, nama_sub: "Unjungan Makam" },
  { id_sub: 52, id_kegiatan: 22, nama_sub: "THR" },
  { id_sub: 53, id_kegiatan: 22, nama_sub: "Fatayat" },
  { id_sub: 54, id_kegiatan: 22, nama_sub: "Muludan Kayen" },
  { id_sub: 55, id_kegiatan: 22, nama_sub: "PHBI Lain" },
  { id_sub: 56, id_kegiatan: 22, nama_sub: "HUT RI tiap RT" },
  { id_sub: 57, id_kegiatan: 22, nama_sub: "Badminton" },
  { id_sub: 58, id_kegiatan: 22, nama_sub: "Senam" },
  { id_sub: 59, id_kegiatan: 23, nama_sub: "Masjid Nurul Huda" },
  { id_sub: 60, id_kegiatan: 23, nama_sub: "Mushola Tahsinul Ahlaq 2" },
  { id_sub: 61, id_kegiatan: 24, nama_sub: "Guru Ngaji" },
  { id_sub: 62, id_kegiatan: 24, nama_sub: "Safari Ramadhan" },
  { id_sub: 63, id_kegiatan: 24, nama_sub: "Imam Masjid dan Guru Ngaji" },
  { id_sub: 64, id_kegiatan: 25, nama_sub: "Karang Taruna" },
  { id_sub: 65, id_kegiatan: 26, nama_sub: "LPMD" },
  { id_sub: 66, id_kegiatan: 27, nama_sub: "PKK" },
  { id_sub: 67, id_kegiatan: 28, nama_sub: "MUI" },
  { id_sub: 68, id_kegiatan: 29, nama_sub: "Obat-obatan Pertanian" },
  { id_sub: 69, id_kegiatan: 29, nama_sub: "Petugas Pengurasan" },
  { id_sub: 70, id_kegiatan: 30, nama_sub: "Kopdes Merah Putih" },
  { id_sub: 71, id_kegiatan: 31, nama_sub: "BLT DD" },
  { id_sub: 72, id_kegiatan: 32, nama_sub: "Tidak terduga" },
  { id_sub: 73, id_kegiatan: 33, nama_sub: "Pribadi" }
];

export const MASTER_SUMBER_DANA: SumberDana[] = [
  { id_sumber: 1, nama_sumber: "PAD" },
  { id_sumber: 2, nama_sumber: "DDS" },
  { id_sumber: 3, nama_sumber: "PBP" },
  { id_sumber: 4, nama_sumber: "PBH" },
  { id_sumber: 5, nama_sumber: "ADD" },
  { id_sumber: 6, nama_sumber: "PBK" },
  { id_sumber: 7, nama_sumber: "DLL" },
  { id_sumber: 8, nama_sumber: "PTSL" },
  { id_sumber: 9, nama_sumber: "Pribadi" }
];

export const MASTER_ANGGARAN: Anggaran[] = [
  { id: 1, id_bidang: 1, id_kegiatan: 1, id_sub: 1, id_sumber: 5, pagu: 54970200 },
  { id: 2, id_bidang: 1, id_kegiatan: 1, id_sub: 2, id_sumber: 1, pagu: 72996000 },
  { id: 3, id_bidang: 1, id_kegiatan: 2, id_sub: 3, id_sumber: 5, pagu: 340815240 },
  { id: 4, id_bidang: 1, id_kegiatan: 2, id_sub: 4, id_sumber: 1, pagu: 52200000 },
  { id: 5, id_bidang: 1, id_kegiatan: 2, id_sub: 5, id_sumber: 1, pagu: 492636000 },
  { id: 6, id_bidang: 1, id_kegiatan: 3, id_sub: 6, id_sumber: 6, pagu: 18760224 },
  { id: 7, id_bidang: 1, id_kegiatan: 4, id_sub: 7, id_sumber: 5, pagu: 4442560 },
  { id: 8, id_bidang: 1, id_kegiatan: 4, id_sub: 8, id_sumber: 4, pagu: 10612181 },
  { id: 9, id_bidang: 1, id_kegiatan: 4, id_sub: 9, id_sumber: 4, pagu: 3600000 },
  { id: 10, id_bidang: 1, id_kegiatan: 4, id_sub: 10, id_sumber: 1, pagu: 19000000 },
  { id: 11, id_bidang: 1, id_kegiatan: 4, id_sub: 11, id_sumber: 1, pagu: 24000000 },
  { id: 12, id_bidang: 1, id_kegiatan: 4, id_sub: 12, id_sumber: 1, pagu: 44280000 },
  { id: 13, id_bidang: 1, id_kegiatan: 4, id_sub: 13, id_sumber: 5, pagu: 15600000 },
  { id: 14, id_bidang: 1, id_kegiatan: 4, id_sub: 14, id_sumber: 6, pagu: 5097000 },
  { id: 15, id_bidang: 1, id_kegiatan: 4, id_sub: 15, id_sumber: 5, pagu: 4692000 },
  { id: 16, id_bidang: 1, id_kegiatan: 4, id_sub: 16, id_sumber: 7, pagu: 141 },
  { id: 17, id_bidang: 1, id_kegiatan: 4, id_sub: 17, id_sumber: 4, pagu: 8000000 },
  { id: 18, id_bidang: 1, id_kegiatan: 4, id_sub: 18, id_sumber: 4, pagu: 8000000 },
  { id: 19, id_bidang: 1, id_kegiatan: 5, id_sub: 19, id_sumber: 5, pagu: 37200000 },
  { id: 20, id_bidang: 1, id_kegiatan: 6, id_sub: 20, id_sumber: 5, pagu: 5000000 },
  { id: 21, id_bidang: 1, id_kegiatan: 6, id_sub: 21, id_sumber: 3, pagu: 4500000 },
  { id: 22, id_bidang: 1, id_kegiatan: 7, id_sub: 22, id_sumber: 1, pagu: 26900000 },
  { id: 23, id_bidang: 1, id_kegiatan: 8, id_sub: 23, id_sumber: 2, pagu: 11200000 },
  { id: 24, id_bidang: 1, id_kegiatan: 9, id_sub: 24, id_sumber: 3, pagu: 22000000 },
  { id: 25, id_bidang: 1, id_kegiatan: 9, id_sub: 25, id_sumber: 3, pagu: 13500000 },
  { id: 26, id_bidang: 1, id_kegiatan: 9, id_sub: 26, id_sumber: 4, pagu: 6091200 },
  { id: 27, id_bidang: 1, id_kegiatan: 9, id_sub: 27, id_sumber: 1, pagu: 36990000 },
  { id: 28, id_bidang: 1, id_kegiatan: 10, id_sub: 28, id_sumber: 1, pagu: 171 },
  { id: 29, id_bidang: 1, id_kegiatan: 11, id_sub: 29, id_sumber: 2, pagu: 2400000 },
  { id: 30, id_bidang: 1, id_kegiatan: 11, id_sub: 30, id_sumber: 2, pagu: 13200000 },
  { id: 31, id_bidang: 1, id_kegiatan: 11, id_sub: 31, id_sumber: 2, pagu: 37920000 },
  { id: 32, id_bidang: 1, id_kegiatan: 12, id_sub: 32, id_sumber: 7, pagu: 2000000 },
  { id: 33, id_bidang: 1, id_kegiatan: 13, id_sub: 33, id_sumber: 7, pagu: 2760000 },
  { id: 34, id_bidang: 1, id_kegiatan: 13, id_sub: 34, id_sumber: 2, pagu: 15000000 },
  { id: 35, id_bidang: 1, id_kegiatan: 14, id_sub: 35, id_sumber: 4, pagu: 10000000 },
  { id: 36, id_bidang: 1, id_kegiatan: 15, id_sub: 36, id_sumber: 4, pagu: 18766000 },
  { id: 37, id_bidang: 1, id_kegiatan: 15, id_sub: 37, id_sumber: 4, pagu: 25000000 },
  { id: 38, id_bidang: 2, id_kegiatan: 16, id_sub: 38, id_sumber: 2, pagu: 28800000 },
  { id: 39, id_bidang: 2, id_kegiatan: 17, id_sub: 39, id_sumber: 2, pagu: 81960000 },
  { id: 40, id_bidang: 2, id_kegiatan: 18, id_sub: 40, id_sumber: 1, pagu: 502000000 },
  { id: 41, id_bidang: 2, id_kegiatan: 19, id_sub: 41, id_sumber: 2, pagu: 13170300 },
  { id: 42, id_bidang: 2, id_kegiatan: 19, id_sub: 42, id_sumber: 2, pagu: 10228500 },
  { id: 43, id_bidang: 2, id_kegiatan: 19, id_sub: 43, id_sumber: 2, pagu: 12647300 },
  { id: 44, id_bidang: 2, id_kegiatan: 19, id_sub: 44, id_sumber: 2, pagu: 20000000 },
  { id: 45, id_bidang: 2, id_kegiatan: 19, id_sub: 45, id_sumber: 2, pagu: 8129900 },
  { id: 46, id_bidang: 2, id_kegiatan: 20, id_sub: 46, id_sumber: 2, pagu: 18000000 },
  { id: 47, id_bidang: 2, id_kegiatan: 20, id_sub: 47, id_sumber: 2, pagu: 10000000 },
  { id: 48, id_bidang: 3, id_kegiatan: 21, id_sub: 48, id_sumber: 2, pagu: 3600000 },
  { id: 49, id_bidang: 3, id_kegiatan: 22, id_sub: 49, id_sumber: 2, pagu: 20000000 },
  { id: 50, id_bidang: 3, id_kegiatan: 22, id_sub: 50, id_sumber: 2, pagu: 5000000 },
  { id: 51, id_bidang: 3, id_kegiatan: 22, id_sub: 51, id_sumber: 4, pagu: 15000000 },
  { id: 52, id_bidang: 3, id_kegiatan: 22, id_sub: 52, id_sumber: 1, pagu: 10500000 },
  { id: 53, id_bidang: 3, id_kegiatan: 22, id_sub: 53, id_sumber: 4, pagu: 5000000 },
  { id: 54, id_bidang: 3, id_kegiatan: 22, id_sub: 54, id_sumber: 4, pagu: 5000000 },
  { id: 55, id_bidang: 3, id_kegiatan: 22, id_sub: 55, id_sumber: 4, pagu: 10000000 },
  { id: 56, id_bidang: 3, id_kegiatan: 22, id_sub: 56, id_sumber: 4, pagu: 6400000 },
  { id: 57, id_bidang: 3, id_kegiatan: 22, id_sub: 57, id_sumber: 4, pagu: 3000000 },
  { id: 58, id_bidang: 3, id_kegiatan: 22, id_sub: 58, id_sumber: 4, pagu: 2600000 },
  { id: 59, id_bidang: 3, id_kegiatan: 23, id_sub: 59, id_sumber: 6, pagu: 4000000 },
  { id: 60, id_bidang: 3, id_kegiatan: 23, id_sub: 60, id_sumber: 6, pagu: 2000000 },
  { id: 61, id_bidang: 3, id_kegiatan: 24, id_sub: 61, id_sumber: 6, pagu: 1500000 },
  { id: 62, id_bidang: 3, id_kegiatan: 24, id_sub: 62, id_sumber: 4, pagu: 8500000 },
  { id: 63, id_bidang: 3, id_kegiatan: 24, id_sub: 63, id_sumber: 1, pagu: 20100000 },
  { id: 64, id_bidang: 3, id_kegiatan: 25, id_sub: 64, id_sumber: 1, pagu: 2500000 },
  { id: 65, id_bidang: 3, id_kegiatan: 26, id_sub: 65, id_sumber: 1, pagu: 6500000 },
  { id: 66, id_bidang: 3, id_kegiatan: 27, id_sub: 66, id_sumber: 2, pagu: 10000000 },
  { id: 67, id_bidang: 3, id_kegiatan: 28, id_sub: 67, id_sumber: 1, pagu: 3700000 },
  { id: 68, id_bidang: 4, id_kegiatan: 29, id_sub: 68, id_sumber: 2, pagu: 5000000 },
  { id: 69, id_bidang: 4, id_kegiatan: 29, id_sub: 69, id_sumber: 2, pagu: 10000000 },
  { id: 70, id_bidang: 4, id_kegiatan: 30, id_sub: 70, id_sumber: 2, pagu: 10000000 },
  { id: 71, id_bidang: 5, id_kegiatan: 31, id_sub: 71, id_sumber: 2, pagu: 7200000 },
  { id: 72, id_bidang: 6, id_kegiatan: 32, id_sub: 72, id_sumber: 8, pagu: 21450000 },
  { id: 73, id_bidang: 7, id_kegiatan: 33, id_sub: 73, id_sumber: 9, pagu: 200000000 }
];

export function formatTanggal(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  // If it's a date object inside string dynamic or standard YYYY-MM-DD
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch {
    // ignore
  }
  return dateStr;
}
