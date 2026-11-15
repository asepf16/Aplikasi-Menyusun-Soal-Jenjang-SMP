import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import type { AssessmentParams, QuestionItem } from '../types/assessment';
import { formatKisiKisiAsCsv } from '../utils/formatters';

interface BlueprintMatrixViewProps {
  params: AssessmentParams;
  questions: QuestionItem[];
  onBackToEditor: () => void;
}

export const BlueprintMatrixView: React.FC<BlueprintMatrixViewProps> = ({
  params,
  questions,
  onBackToEditor,
}) => {
  const [copiedCsv, setCopiedCsv] = useState(false);

  const handleDownloadCsv = () => {
    const csv = formatKisiKisiAsCsv(questions, params);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kisi-kisi-${params.mataPelajaran.toLowerCase().replace(/\s+/g, '-')}-kelas-${params.kelas}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCsv = async () => {
    const csv = formatKisiKisiAsCsv(questions, params);
    try {
      await navigator.clipboard.writeText(csv);
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
    } catch {
      // Ignore if clipboard unavailable
    }
  };

  if (questions.length === 0) {
    return (
      <div className="studio-card rounded-2xl p-10 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-[#0F294A]">
          Kisi-Kisi Asesmen Belum Tersedia
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Susun paket soal terlebih dahulu pada menu Penyusun Soal untuk melihat
          matriks kisi-kisi otomatis beserta sebaran level kognitif dan indikatornya.
        </p>
        <button
          type="button"
          onClick={onBackToEditor}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#0F294A] text-white hover:bg-[#173B6B] cursor-pointer"
        >
          Ke Penyusun Soal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="studio-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-[#0F294A]">
            Kisi-Kisi Asesmen Sumatif — {params.mataPelajaran} Kelas {params.kelas}
          </h1>
          <p className="text-sm text-slate-600">
            Lingkup Materi: {params.materi}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {copiedCsv ? (
              <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>{copiedCsv ? 'CSV Tersalin' : 'Salin CSV'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F294A] text-white hover:bg-[#173B6B] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Unduh Kisi-Kisi (.csv)</span>
          </button>
        </div>
      </div>

      <div className="studio-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200">
                <th className="px-4 py-3 font-semibold text-slate-800 w-16 tabular-nums">
                  No.
                </th>
                <th className="px-4 py-3 font-semibold text-slate-800">
                  Indikator Soal
                </th>
                <th className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  Tipe & Level Kognitif
                </th>
                <th className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  Konteks
                </th>
                <th className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  Bentuk Soal
                </th>
                <th className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  Kesukaran
                </th>
                <th className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  Kunci
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {questions.map((q) => (
                <tr key={q.nomor_soal} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-mono font-semibold text-[#0F294A] tabular-nums align-top">
                    {String(q.nomor_soal).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 leading-relaxed align-top min-w-[260px]">
                    {q.indikator_soal}
                  </td>
                  <td className="px-4 py-3.5 text-slate-800 align-top">
                    <div className="font-medium">{q.level_kognitif}</div>
                    <div className="text-xs text-slate-500">{q.tipe_soal}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap align-top">
                    {q.konteks}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap align-top">
                    {q.bentuk_soal}
                  </td>
                  <td className="px-4 py-3.5 font-semibold whitespace-nowrap align-top">
                    <span
                      className={
                        q.tingkat_kesukaran === 'Sukar'
                          ? 'text-amber-800'
                          : q.tingkat_kesukaran === 'Sedang'
                            ? 'text-sky-800'
                            : 'text-emerald-800'
                      }
                    >
                      {q.tingkat_kesukaran}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-800 align-top max-w-[160px]">
                    {q.kunci_jawaban}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
