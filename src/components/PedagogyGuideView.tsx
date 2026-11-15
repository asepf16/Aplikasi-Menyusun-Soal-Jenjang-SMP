import React, { useState } from 'react';
import { BookOpenCheck } from 'lucide-react';

export const PedagogyGuideView: React.FC = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="space-y-6">
      <div className="studio-card rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-3">
          <p className="text-xs font-semibold text-sky-800">
            Referensi Pedagogis · Kurikulum Merdeka SMP (Fase D)
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F294A] text-balance">
            Standar Penyusunan Asesmen Sumatif AKM & HOTS
          </h1>
          <p className="text-sm sm:text-[15px] leading-relaxed text-slate-600 max-w-2xl">
            Pedoman baku yang diterapkan sistem saat merancang stimulus kontekstual,
            level kognitif, kalibrasi tingkat kesukaran, serta pengecoh butir soal
            untuk jenjang SMP Kelas 7, 8, dan 9.
          </p>
        </div>

        <div className="lg:col-span-5 bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200/80 min-h-[200px]">
          {!imgError ? (
            <img
              src="/src/assets/images/guide_kurikulum_blueprint_1794756978880.jpg"
              alt="Ilustrasi arsitektur cetak biru asesmen Kurikulum Merdeka"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-100 to-sky-50 text-slate-600 gap-2">
              <BookOpenCheck className="w-8 h-8 text-[#0F294A]" aria-hidden="true" />
              <span className="text-xs font-semibold">
                Cetak Biru Asesmen Fase D
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="studio-card rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0F294A]">
            01. Asesmen Kompetensi Minimum (AKM)
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed list-disc pl-4">
            <li>
              <strong>Stimulus Kontekstual:</strong> Narasi, tabel data, atau
              skenario nyata pada konteks <em>Personal</em>,{' '}
              <em>Sosial Budaya</em>, atau <em>Saintifik</em>.
            </li>
            <li>
              <strong>Level Kognitif:</strong> Mengukur <em>Knowing</em>{' '}
              (Pemahaman), <em>Applying</em> (Penerapan), dan{' '}
              <em>Reasoning</em> (Penalaran).
            </li>
            <li>
              <strong>Fokus Literasi & Numerasi:</strong> Menilai kemampuan
              memproses data, pemodelan situasi, dan menarik simpulan sahih.
            </li>
          </ul>
        </section>

        <section className="studio-card rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0F294A]">
            02. Higher Order Thinking Skills (HOTS)
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed list-disc pl-4">
            <li>
              <strong>Taksonomi Tinggi:</strong> Berfokus pada level{' '}
              <strong>C4</strong> (Menganalisis), <strong>C5</strong>{' '}
              (Mengevaluasi), dan <strong>C6</strong> (Mengkreasi).
            </li>
            <li>
              <strong>Transfer Konsep:</strong> Menuntut pemecahan masalah dan
              pengambilan keputusan berdasarkan kriteria—bukan sekadar hafalan.
            </li>
            <li>
              <strong>Tidak Tersurat:</strong> Jawaban benar tidak tercantum
              secara eksplisit di dalam teks stimulus.
            </li>
          </ul>
        </section>

        <section className="studio-card rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0F294A]">
            03. Kombinasi AKM & HOTS
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-700 leading-relaxed list-disc pl-4">
            <li>
              <strong>Integrasi Stimulus:</strong> Memadukan kekayaan data/tabel
              AKM dengan tuntutan penalaran kritis HOTS.
            </li>
            <li>
              <strong>Evaluasi Keputusan:</strong> Siswa diminta menelaah
              keterkaitan antarvariabel pada stimulus untuk menentukan solusi
              paling logis.
            </li>
            <li>
              <strong>Bebas Bias & SARA:</strong> Bahasa komunikatif sesuai
              kaidah EYD V dan netral terhadap latar belakang sosial maupun
              komersial.
            </li>
          </ul>
        </section>
      </div>

      <div className="studio-card rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-xl font-bold text-[#0F294A]">
          Matriks Kalibrasi Tingkat Kesukaran
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-slate-900 w-32">
                  Tingkat
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900">
                  Karakteristik Stimulus
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900">
                  Langkah Penyelesaian
                </th>
                <th className="px-4 py-3 font-semibold text-slate-900">
                  Desain Pengecoh (Distractor)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3.5 font-semibold text-emerald-800 align-top">
                  Mudah
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Singkat, langsung, dan memakai situasi keseharian yang sangat
                  familier.
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  1–2 langkah penalaran atau perhitungan sederhana dengan kalimat
                  lugas.
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Perbedaan jelas dari kunci jawaban sehingga mudah dieliminasi
                  siswa.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3.5 font-semibold text-sky-800 align-top">
                  Sedang
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Menyajikan data atau tabel tunggal yang menuntut pembacaan
                  cermat.
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  2–3 langkah analisis dengan menghubungkan 2 informasi berbeda
                  dari stimulus.
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Homogen dan realistis, namun tetap terbedakan jika memahami
                  konsep dasar.
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="px-4 py-3.5 font-semibold text-amber-800 align-top">
                  Sukar
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Multi-data, tabel pembanding, atau skenario kompleks berisi
                  informasi tersirat.
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Penalaran multi-tahap, masalah non-rutin, evaluasi strategi,
                  atau keputusan berdasar kriteria.
                </td>
                <td className="px-4 py-3.5 text-slate-700 align-top">
                  Sangat halus dan dirancang berdasarkan miskonsepsi umum siswa
                  SMP.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
