import React from 'react';
import type { AssessmentParams, QuestionItem } from '../types/assessment';
import { StimulusRenderer } from './StimulusRenderer';

interface PrintSheetProps {
  params: AssessmentParams;
  questions: QuestionItem[];
}

export const PrintSheet: React.FC<PrintSheetProps> = ({ params, questions }) => {
  if (questions.length === 0) return null;

  return (
    <div className="hidden print-only text-black text-[11pt] leading-relaxed">
      {/* Kop Naskah Soal */}
      <div className="border-b-2 border-black pb-3 mb-5">
        <div className="text-center space-y-0.5">
          <div className="text-sm font-bold uppercase tracking-wide">
            {params.namaSekolah || 'MKPS SMP KABUPATEN GARUT'}
          </div>
          <div className="text-base font-bold uppercase">
            NASKAH ASESMEN SUMATIF — KURIKULUM MERDEKA
          </div>
          <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-700">
            KarsaAsesmen · MKPS Garut
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
          <div>
            <strong>Mata Pelajaran:</strong> {params.mataPelajaran}
          </div>
          <div>
            <strong>Kelas / Fase:</strong> SMP Kelas {params.kelas} (Fase D)
          </div>
          <div>
            <strong>Tipe Asesmen:</strong> {params.tipeAsesmen}
          </div>
          <div>
            <strong>Alokasi Waktu:</strong> {params.alokasiWaktu || '60 Menit'}
          </div>
          <div className="col-span-2">
            <strong>Lingkup Materi:</strong> {params.materi}
          </div>
        </div>
      </div>

      {/* Identitas Siswa */}
      <div className="grid grid-cols-2 gap-6 border border-black/40 p-2.5 mb-6 text-xs">
        <div>Nama Siswa: ..............................................................</div>
        <div>Kelas / No. Absen: ...................................................</div>
      </div>

      {/* Daftar Butir Soal */}
      <div className="space-y-6">
        {questions.map((q) => {
          const lower = q.bentuk_soal.toLowerCase();
          const isTrueFalse =
            lower.includes('benar-salah') || lower.includes('benar salah');
          const isMatching = lower.includes('menjodohkan');
          const isComplexPg = lower.includes('kompleks') && !isTrueFalse;

          const premises = isMatching
            ? q.opsi.filter((o) => /^premis\s*\d*\s*:/i.test(o.trim()))
            : [];
          const pairs = isMatching
            ? q.opsi.filter((o) => /^pasangan\s*[a-z0-9]*\s*:/i.test(o.trim()))
            : [];

          return (
            <div key={q.nomor_soal} className="print-break-inside-avoid space-y-2.5">
              <div className="font-bold text-xs">
                Soal No. {q.nomor_soal} ({q.bentuk_soal})
              </div>
              <div className="border border-slate-300 bg-slate-50 p-3 rounded">
                <StimulusRenderer content={q.stimulus} />
              </div>
              <div className="font-semibold">{q.pertanyaan}</div>

              {!isTrueFalse && !isMatching && q.opsi.length > 0 && (
                <div className="pl-4 space-y-1">
                  {q.opsi.map((opt, idx) => (
                    <div key={idx}>
                      {isComplexPg ? `[ ] ${opt}` : opt}
                    </div>
                  ))}
                </div>
              )}

              {isTrueFalse && q.opsi.length > 0 && (
                <table className="w-full border-collapse border border-black/50 text-xs mt-2">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-black/50 px-2.5 py-1.5 text-left">
                        Pernyataan
                      </th>
                      <th className="border border-black/50 px-2.5 py-1.5 text-center w-16">
                        Benar
                      </th>
                      <th className="border border-black/50 px-2.5 py-1.5 text-center w-16">
                        Salah
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.opsi.map((stmt, idx) => (
                      <tr key={idx}>
                        <td className="border border-black/50 px-2.5 py-1.5">
                          {stmt}
                        </td>
                        <td className="border border-black/50 px-2.5 py-1.5 text-center">
                          [ ]
                        </td>
                        <td className="border border-black/50 px-2.5 py-1.5 text-center">
                          [ ]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {isMatching && (
                <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                  <div className="border border-black/50 p-2 space-y-1">
                    <div className="font-bold border-b border-black/30 pb-1">
                      Premis / Pernyataan
                    </div>
                    {(premises.length > 0 ? premises : q.opsi).map((p, idx) => (
                      <div key={idx}>{p}</div>
                    ))}
                  </div>
                  {pairs.length > 0 && (
                    <div className="border border-black/50 p-2 space-y-1">
                      <div className="font-bold border-b border-black/30 pb-1">
                        Pilihan Pasangan
                      </div>
                      {pairs.map((pair, idx) => (
                        <div key={idx}>{pair}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {q.opsi.length === 0 && (
                <div className="border-b border-dashed border-black/50 h-14 mt-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Kunci Jawaban & Rubrik Penskoran pada Halaman Terpisah */}
      <div className="print-page-break pt-2 space-y-4">
        <div className="border-b-2 border-black pb-2">
          <div className="text-base font-bold uppercase">
            KUNCI JAWABAN & RUBRIK PENSKORAN (PEGANGAN GURU)
          </div>
          <div className="text-xs">
            {params.mataPelajaran} · Kelas {params.kelas} (Fase D) · {questions.length}{' '}
            Butir Soal
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.nomor_soal}
              className="print-break-inside-avoid border-b border-black/20 pb-3 text-xs space-y-1"
            >
              <div className="font-bold">
                No. {q.nomor_soal} ({q.bentuk_soal}) — {q.level_kognitif} ({q.tingkat_kesukaran} · Konteks{' '}
                {q.konteks})
              </div>
              <div>
                <strong>Kunci Jawaban:</strong> {q.kunci_jawaban}
              </div>
              <div>
                <strong>Pembahasan & Rubrik:</strong> {q.pembahasan_rubrik}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
