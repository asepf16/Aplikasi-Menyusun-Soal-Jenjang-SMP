import React from 'react';
import { FolderOpen, Trash2 } from 'lucide-react';
import type { SavedAssessmentPackage } from '../types/assessment';

interface ArchiveViewProps {
  packages: SavedAssessmentPackage[];
  onLoadPackage: (pkg: SavedAssessmentPackage) => void;
  onDeletePackage: (id: string) => void;
  onBackToEditor: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  packages,
  onLoadPackage,
  onDeletePackage,
  onBackToEditor,
}) => {
  if (packages.length === 0) {
    return (
      <div className="studio-card rounded-2xl p-10 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-[#0F294A]">
          Arsip Paket Soal Masih Kosong
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Setelah menyusun asesmen, klik tombol Simpan Arsip pada lembar kerja
          untuk menyimpan paket soal di peramban Anda.
        </p>
        <button
          type="button"
          onClick={onBackToEditor}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#0F294A] text-white hover:bg-[#173B6B] cursor-pointer"
        >
          Buat Paket Soal Baru
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="studio-card rounded-2xl p-6">
        <h1 className="font-display text-2xl font-bold text-[#0F294A]">
          Arsip Paket Asesmen Tersimpan
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Paket soal tersimpan secara lokal di peramban Anda dan dapat dibuka kembali
          untuk disunting, disalin JSON-nya, atau dicetak ulang.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {packages.map((pkg) => {
          const formattedDate = new Date(pkg.createdAt).toLocaleDateString(
            'id-ID',
            {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }
          );

          return (
            <article
              key={pkg.id}
              className="studio-card rounded-2xl p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 tabular-nums">
                  <span className="font-semibold text-sky-800">
                    {pkg.params.mataPelajaran}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Kelas {pkg.params.kelas} (Fase D)</span>
                  <span aria-hidden="true">·</span>
                  <span>{pkg.questions.length} Soal</span>
                  <span aria-hidden="true">·</span>
                  <span>{formattedDate}</span>
                </div>
                <h2 className="font-display text-lg font-bold text-[#0F294A] line-clamp-2">
                  {pkg.params.materi}
                </h2>
                <p className="text-xs text-slate-600">
                  {pkg.params.tipeAsesmen} · {pkg.params.bentukSoal} ·{' '}
                  {pkg.params.tingkatKesukaran}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => onLoadPackage(pkg)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F294A] text-white hover:bg-[#173B6B] cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Buka Paket</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePackage(pkg.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Hapus</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
