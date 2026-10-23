
/* =========================================================
   SMART NOTA DINAS | KANIM JAKARTA BARAT
   DATA ANGGARAN TA 2026 — PERIODE AGUSTUS 2026

   Format baris:
   kedalaman|kode|uraian|pagu revisi|realisasi|lock pagu

   Kedalaman:
   0 = program/kegiatan utama
   1 = turunan tingkat pertama
   2 = turunan tingkat kedua
   dan seterusnya.

   Catatan:
   - Pertahankan nama BIDANG karena dipakai oleh app.js.
   - Pertahankan format RAW agar parser app.js tetap berfungsi.
   - Kolom lock pagu bersifat opsional.
   ========================================================= */

const BIDANG = {
  INTELDAKIM: "Bidang Intelijen dan Penindakan Keimigrasian",
  INTALTUSKIM: "Bidang Izin Tinggal dan Status Keimigrasian",
  TIKKIM: "Bidang Teknologi Informasi dan Komunikasi Keimigrasian",
  TATAUSAHA: "Bagian Tata Usaha",
  YANVERDOKJAL: "Bidang Pelayanan dan Verifikasi Dokumen Perjalanan"
};

const RAW = `
@YANVERDOKJAL
0|BAA.001|Layanan Penerbitan Dokumen Perjalanan RI|1759208000|831916910
1|051|Penerbitan Dokumen Perjalanan RI di Kantor Imigrasi|1350369000|665316943
2|521211|Belanja Bahan|180508000|79313623
3|000017|Makan Rapat Biasa|3876000|0
3|000018|Kudapan Rapat Biasa|1632000|464000
3|000019|Penggandaan dan Penjilidan|1000000|0
3|000020|Spanduk|7000000|0
3|000021|Konsumsi Peningkatan Pelayanan Publik|132000000|78849623
3|000337|Barang Cetakan Dukungan Layanan|35000000|0
2|521219|Belanja Barang Non Operasional Lainnya|70000000|0
3|000338|Belanja Dukungan Layanan Pasporia|70000000|0
2|521811|Belanja Barang Persediaan Barang Konsumsi|830132000|522490320
3|000022|Supplies Komputer|131932000|0
3|000023|Kertas Cetak Hasil Wawancara|85000000|0
3|000024|ATK Pelayanan Keimigrasian|120000000|29783520
3|000025|Map Permohonan Keimigrasian WNI|493200000|492706800
2|522141|Belanja Sewa|238380000|60164000
3|000026|Sewa Tenda, Sewa Ruangan|129700000|2000000
3|000027|Perlengkapan Dukungan Layanan Keimigrasian|108680000|58164000
2|524111|Belanja Perjalanan Dinas Biasa|31349000|3349000
3|000028|Tiket Jakarta Medan|17349000|3349000
3|000029|Taksi Jakarta PP|2000000|0
3|000030|Taksi Sumatera Utara|2000000|0
3|000031|Uang Harian Sumatera Utara|4440000|0
3|000032|Uang Penginapan Sumatera Utara|5560000|0
1|052|Penerbitan Dokumen Perjalanan RI di Unit Layanan Keimigrasian|408839000|166599967
2|521211|Belanja Bahan|270000000|101302467
3|000033|Konsumsi Peningkatan Pelayanan Publik|270000000|101302467
2|522141|Belanja Sewa|100589000|46087500
3|000034|Perlengkapan Dukungan Layanan Keimigrasian|100589000|46087500
2|524113|Belanja Perjalanan Dinas Dalam Kota|38250000|19210000
3|000035|Uang Transport Kegiatan Dalam Kota|38250000|19210000

@INTALTUSKIM
0|BAA.002|Layanan Penerbitan Izin Tinggal dan Status Keimigrasian|283901000|140770556
1|051|Penerbitan Izin Tinggal dan Status Keimigrasian di Kantor Imigrasi|283901000|140770556
2|051.0A|Penerbitan Izin Tinggal|274641000|140770556
3|521211|Belanja Bahan|136160000|44914853
4|000001|Makan Rapat Biasa|3420000|1141800
4|000002|Kudapan Rapat Biasa|1440000|0
4|000003|Penggandaan dan Penjilidan|1000000|0
4|000004|Spanduk|1000000|0
4|000005|Konsumsi Peningkatan Pelayanan Publik|129300000|43773053
3|521811|Belanja Barang Persediaan Barang Konsumsi|67800000|67732200
4|000006|Map Permohonan Keimigrasian WNA|67800000|67732200
3|522151|Belanja Jasa Profesi|2700000|0
4|000342|Honorarium Narasumber (Pejabat Eselon III)|2700000|0
3|524111|Belanja Perjalanan Dinas Biasa|26331000|8907503
4|000007|Tiket Jakarta Denpasar PP|9451000|3129702
4|000008|Taksi Jakarta PP|2000000|0
4|000009|Taksi Bali|1600000|0
4|000010|Uang Harian Bali|5280000|1100000
4|000011|Uang Penginapan Bali|8000000|4677801
3|524113|Belanja Perjalanan Dinas Dalam Kota|41650000|19216000
4|000012|Uang Transport Kegiatan Dalam Kota|41650000|19216000
2|051.0B|Penerbitan Fasilitas Keimigrasian|9260000|0
3|521211|Belanja Bahan|5860000|0
4|000013|Makan Rapat Biasa|3420000|0
4|000014|Kudapan Rapat Biasa|1440000|0
4|000015|Penggandaan dan Penjilidan|1000000|0
3|524113|Belanja Perjalanan Dinas Dalam Kota|3400000|0
4|000016|Uang Transport Kegiatan Dalam Kota|3400000|0

@INTELDAKIM
0|BHB|Operasi Bidang Keamanan|476925000|252289300
1|BHB.U11|Operasi Intelijen Keimigrasian di Wilayah Barat|342210000|252289300
2|051|Pengumpulan Data dan Informasi|341649000|252289300
3|521219|Belanja Barang Non Operasional Lainnya|212686000|132389300
3|522141|Belanja Sewa|128963000|119900000
2|052|Penyajian Laporan|561000|0
3|521219|Belanja Barang Non Operasional Lainnya|561000|0
1|BHB.U14|Operasi Gabungan di Wilayah Barat|62891000|0
2|052|Pelaksanaan Pengawasan|62891000|0
3|521213|Belanja Honor Output Kegiatan|7250000|0
3|521219|Belanja Barang Non Operasional Lainnya|40641000|0
3|522141|Belanja Sewa|15000000|0
1|BHB.U17|Penyidikan Tindak Pidana Keimigrasian di Wilayah Barat|71824000|0
2|051|Prapenyidikan|71824000|0
3|521211|Belanja Bahan|2190000|0
3|521219|Belanja Barang Non Operasional Lainnya|65134000|0
3|522151|Belanja Jasa Profesi|4500000|0
0|BIB|Pengawasan dan Pengendalian Masyarakat|352235000|37410000
1|BIB.001|Tindakan Administratif Keimigrasian|352235000|37410000
2|051|Pendetensian|246990000|7518000
3|051.0A|Penanganan Deteni|149545000|0
4|521219|Belanja Barang Non Operasional Lainnya|35055000|0
4|524111|Belanja Perjalanan Dinas Biasa|84570000|0
4|524113|Belanja Perjalanan Dinas Dalam Kota|29920000|0
3|051.0B|Perawatan Deteni|97445000|7518000
4|521219|Belanja Barang Non Operasional Lainnya|40350000|7518000
4|521811|Belanja Barang Persediaan Barang Konsumsi|57095000|0
2|052|Pendeportasian|105245000|29892000
3|521211|Belanja Bahan|52165000|9690000
3|524111|Belanja Perjalanan Dinas Biasa|28600000|20202000
3|524113|Belanja Perjalanan Dinas Dalam Kota|24480000|0
0|BKA|Pemantauan Masyarakat dan Kelompok Masyarakat|296110000|98669265|5280000
1|BKA.001|Pengawasan Keimigrasian|185650000|70153915
2|051|Persiapan Tim PORA|22430000|11302000
3|521211|Belanja Bahan|22430000|11302000
2|052|Pelaksanaan Tim PORA|163220000|58851915
3|521213|Belanja Honor Output Kegiatan|39000000|3300000
3|522141|Belanja Sewa|11200000|0
3|524111|Belanja Perjalanan Dinas Biasa|24870000|13352915
3|524113|Belanja Perjalanan Dinas Dalam Kota|1360000|0
3|524114|Belanja Perjalanan Dinas Paket Meeting Dalam Kota|86790000|42199000
1|BKA.002|Pembentukan dan Pembinaan Desa Binaan Imigrasi|110460000|28515350|5280000
2|051|Persiapan|6839000|2629350
3|521211|Belanja Bahan|6839000|2629350
2|052|Pelaksanaan|33100000|4930000
3|521219|Belanja Barang Non Operasional Lainnya|19500000|0
3|524113|Belanja Perjalanan Dinas Dalam Kota|13600000|4930000
2|053|Sosialisasi|70521000|20956000|5280000
3|521211|Belanja Bahan|58200000|20956000
3|522141|Belanja Sewa|12321000|0|5280000
0|QHB|Operasi Bidang Keamanan|404810000|44094000
1|QHB.U02|Operasi Mandiri di Wilayah|404810000|44094000
2|051|Pelaksanaan Pengawasan|404310000|44094000
3|521219|Belanja Barang Non Operasional Lainnya|344310000|20694000
3|522141|Belanja Sewa|60000000|23400000
2|052|Penyusunan Laporan dan Evaluasi|500000|0
3|521219|Belanja Barang Non Operasional Lainnya|500000|0

@TIKKIM
0|EBA.962|Layanan Umum|529073000|321789554
1|051|Layanan Umum dan Rumah Tangga|529073000|321789554
2|051.0A|Layanan Umum dan Rumah Tangga UPT|529073000|321789554
3|521111|Belanja Keperluan Perkantoran|250326000|250196220
3|521211|Belanja Bahan|91166000|35280134
3|521219|Belanja Barang Non Operasional Lainnya|65861000|26523200
3|522141|Belanja Sewa|90000000|0
3|524111|Belanja Perjalanan Dinas Biasa|12680000|0
3|524113|Belanja Perjalanan Dinas Dalam Kota|19040000|9790000
0|EBA.963|Layanan Data dan Informasi|287040000|116654829
1|051|Pengelolaan Informasi dan Komunikasi Keimigrasian|190157000|80224829
2|051.0A|Penyebaran Informasi|190157000|80224829
3|521211|Belanja Bahan|29100000|14458500
3|521219|Belanja Barang Non Operasional Lainnya|101277000|43720329
3|522141|Belanja Sewa|40000000|20000000
3|524111|Belanja Perjalanan Dinas Biasa|14680000|0
3|524113|Belanja Perjalanan Dinas Dalam Kota|5100000|2046000
1|052|Pengelolaan Teknologi Informasi Keimigrasian|96883000|36430000
2|052.0A|Tanpa Sub Komponen|96883000|36430000
3|521211|Belanja Bahan|12745000|1420000
3|523121|Belanja Pemeliharaan Peralatan dan Mesin|66058000|34500000
3|524111|Belanja Perjalanan Dinas Biasa|14680000|0
3|524113|Belanja Perjalanan Dinas Dalam Kota|3400000|510000

@TATAUSAHA
0|EBA.994|Layanan Perkantoran|22352582000|17223367353|57300000
1|001|Gaji dan Tunjangan|15239103000|11390631269
2|001.0A|Pembayaran Gaji dan Tunjangan|6651293000|5909124054
3|511111|Belanja Gaji Pokok PNS|3812353000|4301533960
3|511119|Belanja Pembulatan Gaji PNS|89000|78965
3|511121|Belanja Tunj. Suami/Istri PNS|593987000|240835602
3|511122|Belanja Tunj. Anak PNS|113177000|73794792
3|511123|Belanja Tunj. Struktural PNS|171530000|119035000
3|511124|Belanja Tunj. Fungsional PNS|348600000|266280000
3|511125|Belanja Tunj. PPh PNS|35999000|34259155
3|511126|Belanja Tunj. Beras PNS|229847000|217187580
3|511129|Belanja Uang Makan PNS|1138896000|505564000
3|511151|Belanja Tunjangan Umum PNS|206815000|150555000
2|001.0B|Pembayaran Gaji dan Tunjangan PPPK|333407000|37614952
3|511611|Belanja Gaji Pokok PPPK|210000000|25967432
3|511619|Belanja Pembulatan Gaji PPPK|100000|822
3|511621|Belanja Tunjangan Suami/Istri PPPK|21000000|2596742
3|511622|Belanja Tunjangan Anak PPPK|12600000|1038696
3|511625|Belanja Tunjangan Beras PPPK|25347000|2631260
3|511628|Belanja Uang Makan PPPK|51060000|3745000
3|511633|Belanja Tunjangan Umum PPPK|13300000|1635000
2|001.0C|Pembayaran Lembur|242742000|87992000
3|512211|Belanja Uang Lembur|242742000|87992000
4|000175|Uang Lembur Pegawai|207000000|75346000
4|000176|Uang Makan Lembur|35742000|12646000
2|001.0D|Pembayaran Tunjangan Kinerja|8011661000|5355900263
3|512411|Belanja Pegawai (Tunjangan Khusus/Kegiatan/Kinerja)|7792264000|5328077703
3|512414|Belanja Pegawai Tunjangan Khusus/Kegiatan/Kinerja PPPK|219397000|27822560
1|002|Operasional dan Pemeliharaan Kantor|7113479000|5832736084|57300000
2|002.0A|Operasional Perkantoran|3634960000|3403113827
3|521111|Belanja Keperluan Perkantoran|3237012000|3010973999
4|000183|Langganan Internet|197442000|85269917
4|000184|Biaya Keperluan Sehari-hari Perkantoran|107250000|36866535
4|000318|Tenaga Alih Daya|2932320000|2888837547
3|521811|Belanja Barang Persediaan Barang Konsumsi|397948000|392139828
4|000185|Keperluan Sehari-hari Perkantoran (ATK)|62000000|61950348
4|000186|Materai|5400000|0
4|000187|Suplies Komputer|330548000|330189480
2|002.0B|Langganan Daya dan Jasa|560968000|444847869
3|521114|Belanja Pengiriman Surat Dinas Pos Pusat|1800000|15000
3|522111|Belanja Langganan Listrik|451008000|391223579
3|522112|Belanja Langganan Telepon|7560000|5936600
3|522113|Belanja Langganan Air|100600000|47672690
2|002.0D|Pemeliharaan Gedung dan Bangunan serta Halaman|794255000|645256772
3|523111|Belanja Pemeliharaan Gedung dan Bangunan|736295000|587423320
3|523112|Belanja Barang Persediaan Pemeliharaan Gedung dan Bangunan|57960000|57833452
2|002.0E|Pemeliharaan Perlengkapan dan Sarana Perkantoran|433637000|136684350|7300000
3|523121|Belanja Pemeliharaan Peralatan dan Mesin|433637000|136684350|7300000
2|002.0F|Pemeliharaan Kendaraan Dinas|436535000|279115300
3|521119|Belanja Barang Operasional Lainnya|32750000|13539300
3|523121|Belanja Pemeliharaan Peralatan dan Mesin|403785000|265576000
2|002.0G|Honorarium Pengelola Keuangan|122280000|57720000
3|521115|Belanja Honor Operasional Satuan Kerja|122280000|57720000
4|000220|Kuasa Pengguna Anggaran|21600000|9000000
4|000221|Pejabat Pembuat Komitmen|39120000|17400000
4|000222|Pejabat Penguji dan Penandatangan SPM|9000000|4500000
4|000223|Bendahara Pengeluaran|7920000|3960000
4|000224|Staf Pengelola Keuangan|22320000|14050000
4|000225|Bendahara Penerima PNBP|14040000|4560000
4|000226|Petugas Pengelola Administrasi Belanja Pegawai|4680000|2450000
4|000227|Honorarium Pengelola SAI dan SIMAK BMN|3600000|1800000
2|002.0I|Dukungan Operasional Unit Layanan Keimigrasian|1130844000|865997966|50000000
3|521111|Belanja Keperluan Perkantoran|174744000|54021534
3|521811|Belanja Barang Persediaan Barang Konsumsi|216000000|214984023
4|000233|Suplies Komputer|216000000|214984023
3|522111|Belanja Langganan Listrik|190500000|75551559|50000000
3|522113|Belanja Langganan Air|21600000|9819650
3|522141|Belanja Sewa|528000000|511621200
0|EBA.Z07|Layanan BMN|9848000|4352000
1|051|Layanan BMN Wilayah|9848000|4352000
2|051.0A|Tanpa Sub Komponen|9848000|4352000
3|521213|Belanja Honor Output Kegiatan|5088000|1632000
3|524113|Belanja Perjalanan Dinas Dalam Kota|4760000|2720000
0|EBB.951|Layanan Sarana Internal|537325000|234753900
1|051|Perangkat Pengolah Data dan Komunikasi|94309000|73759500
2|051.0A|Tanpa Sub Komponen|94309000|73759500
3|532111|Belanja Modal Peralatan dan Mesin|94309000|73759500
4|000270|Alat Sidik Jari|25809000|25308000
4|000271|Mesin Laminating Paspor|48500000|48451500
4|000340|Lap Top|20000000|0
1|053|Peralatan dan Fasilitas Perkantoran|443016000|160994400
2|053.0A|Tanpa Sub Komponen|443016000|160994400
3|532111|Belanja Modal Peralatan dan Mesin|443016000|160994400
4|000272|Standing AC|99016000|99012000
4|000273|Sound System|282000000|0
4|000274|Charging Box|62000000|61982400
0|EBC.954|Layanan Manajemen SDM|330642000|257395803
1|051|Pengelolaan SDM|330642000|257395803
2|051.0A|Pelantikan/Sumpah Jabatan|4050000|2600000
3|521211|Belanja Bahan|2280000|1800000
3|521213|Belanja Honor Output Kegiatan|1500000|800000
3|521219|Belanja Barang Non Operasional Lainnya|270000|0
2|051.0B|Pengelolaan Kepegawaian|326592000|254795803
3|521211|Belanja Bahan|42342000|24517650
3|521219|Belanja Barang Non Operasional Lainnya|213000000|212716000
3|522151|Belanja Jasa Profesi|2700000|1800000
3|522191|Belanja Jasa Lainnya|34000000|5180000
3|524111|Belanja Perjalanan Dinas Biasa|16700000|5822153
3|524113|Belanja Perjalanan Dinas Dalam Kota|17850000|4760000
0|EBD.001|Koordinasi dan Konsultasi Perencanaan dan Pelaksanaan Anggaran|89580000|20678268
1|051|Koordinasi Penyusunan Rencana Program dan Anggaran|44995000|3978500
2|051.0A|Tanpa Sub Komponen|44995000|3978500
3|521211|Belanja Bahan|815000|0
3|524111|Belanja Perjalanan Dinas Biasa|22760000|2788500
3|524113|Belanja Perjalanan Dinas Dalam Kota|21420000|1190000
1|052|Koordinasi Pelaksanaan Anggaran|44585000|16699768
2|052.0A|Tanpa Sub Komponen|44585000|16699768
3|521211|Belanja Bahan|405000|0
3|524111|Belanja Perjalanan Dinas Biasa|23780000|9389768
3|524113|Belanja Perjalanan Dinas Dalam Kota|20400000|7310000
0|EBD.Z27|Layanan Manajemen Keuangan|19000000|10540000
1|051|Pengelolaan Keuangan dan Perbendaharaan|19000000|10540000
2|051.0A|Tanpa Sub Komponen|19000000|10540000
3|521211|Belanja Bahan|2000000|0
3|524113|Belanja Perjalanan Dinas Dalam Kota|17000000|10540000
0|EBD.Z32|Layanan Reformasi Kinerja|5730000|0
1|051|Reformasi Birokrasi|5730000|0
2|051.0A|Tanpa Sub Komponen|5730000|0
3|521211|Belanja Bahan|3930000|0
3|522151|Belanja Jasa Profesi|1800000|0
`;
