import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookmarkCheck,
  BookOpen,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileText,
  GraduationCap,
  LayoutList,
  Square,
} from 'lucide-react';
import { motion } from 'motion/react';
import type {
  AssessmentParams,
  OutputViewFormat,
  QuestionItem,
} from '../types/assessment';
import {
  formatQuestionsAsJson,
  formatQuestionsAsStructuredText,
} from '../utils/formatters';
import { QuestionCard } from './QuestionCard';

export interface GenerationProgress {
  completed: number;
  total: number;
  currentBatchLabel: string;
}

interface AssessmentWorkspaceProps {
  params: AssessmentParams;
  questions: QuestionItem[];
  isGenerating: boolean;
  progress: GenerationProgress | null;
  errorMessage: string | null;
  regeneratingNomor: number | null;
  onUpdateQuestion: (updated: QuestionItem) => void;
  onRegenerateItem: (question: QuestionItem, note?: string) => Promise<void>;
  onCancelGeneration: () => void;
  onSavePackage: () => void;
  isPackageSaved: boolean;
  onQuickStart: () => void;
}

export const AssessmentWorkspace: React.FC<AssessmentWorkspaceProps> = ({
  params,
  questions,
  isGenerating,
  progress,
  errorMessage,
  regeneratingNomor,
  onUpdateQuestion,
  onRegenerateItem,
  onCancelGeneration,
  onSavePackage,
  isPackageSaved,
  onQuickStart,
}) => {
  const [viewFormat, setViewFormat] = useState<OutputViewFormat>('Kartu Soal');
  const [showAnswers, setShowAnswers] = useState<boolean>(true);
  const [tryOutMode, setTryOutMode] = useState<boolean>(false);
  const [copiedState, setCopiedState] = useState<boolean>(false);
  const [formatFilter, setFormatFilter] = useState<string>('Semua');
  const [heroImgError, setHeroImgError] = useState<boolean>(false);

  const availableFormats = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((q) => {
      counts.set(q.bentuk_soal, (counts.get(q.bentuk_soal) ?? 0) + 1);
    });
    return Array.from(counts.entries());
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    if (formatFilter === 'Semua') return questions;
    return questions.filter((q) => q.bentuk_soal === formatFilter);
  }, [questions, formatFilter]);

  const structuredText = useMemo(
    () => formatQuestionsAsStructuredText(questions, showAnswers),
    [questions, showAnswers]
  );

  const pureJsonText = useMemo(
    () => formatQuestionsAsJson(questions),
    [questions]
  );

  const summaryStats = useMemo(() => {
    const counts = { Mudah: 0, Sedang: 0, Sukar: 0 };
    questions.forEach((q) => {
      if (q.tingkat_kesukaran === 'Mudah') counts.Mudah++;
      else if (q.tingkat_kesukaran === 'Sukar') counts.Sukar++;
      else counts.Sedang++;
    });
    return counts;
  }, [questions]);

  const handleCopyOutput = async () => {
    const textToCopy =
      viewFormat === 'JSON' ? pureJsonText : structuredText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handleDownload = () => {
    const isJson = viewFormat === 'JSON';
    const content = isJson ? pureJsonText : structuredText;
    const blob = new Blob([content], {
      type: isJson ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeSubject = params.mataPelajaran
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `asesmen-${safeSubject}-kelas-${params.kelas}.${
      isJson ? 'json' : 'txt'
    }`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <section className="no-print flex-1 min-w-0 space-y-6">
      {/* Error State */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-700" aria-hidden="true" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">Penyusunan Asesmen Terhenti</p>
            <p className="text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Batch Generation Progress Bar */}
      {isGenerating && progress && (
        <div className="studio-card rounded-2xl p-5 space-y-3 border-sky-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[#0F294A]">
                {progress.currentBatchLabel}
              </p>
              <p className="text-xs text-slate-600 tabular-nums">
                Tersusun {progress.completed} dari {progress.total} soal ({progressPct}%)
              </p>
            </div>
            <button
              type="button"
              onClick={onCancelGeneration}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>Hentikan</span>
            </button>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F294A] transition-all duration-300"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>
        </div>
      )}

      {/* Workspace Toolbar */}
      <div className="studio-card rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Format tampilan output"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
        >
          {(
            [
              { id: 'Kartu Soal', icon: LayoutList },
              { id: 'Teks Terstruktur', icon: FileText },
              { id: 'JSON', icon: FileCode2 },
            ] as const
          ).map(({ id, icon: Icon }) => {
            const active = viewFormat === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setViewFormat(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#0F294A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{id}</span>
              </button>
            );
          })}
        </div>

        {questions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {viewFormat === 'Kartu Soal' && (
              <button
                type="button"
                onClick={() => {
                  const next = !tryOutMode;
                  setTryOutMode(next);
                  if (next) setShowAnswers(false);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tryOutMode
                    ? 'bg-[#0F294A] border-[#0F294A] text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tryOutMode ? 'Mode Simulasi Aktif' : 'Simulasi Siswa'}</span>
              </button>
            )}

            {viewFormat !== 'JSON' && (
              <button
                type="button"
                onClick={() => {
                  setShowAnswers((v) => !v);
                  if (tryOutMode) setTryOutMode(false);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {showAnswers ? (
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {showAnswers ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onSavePackage}
              disabled={isPackageSaved || isGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-emerald-800 disabled:border-emerald-300 disabled:bg-emerald-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isPackageSaved ? 'Tersimpan di Arsip' : 'Simpan Arsip'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyOutput}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedState ? (
                <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{copiedState ? 'Tersalin' : 'Salin Output'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F294A] text-white hover:bg-[#173B6B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{viewFormat === 'JSON' ? 'Unduh JSON' : 'Unduh Teks'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Initial Loading Skeleton */}
      {isGenerating && questions.length === 0 && (
        <div className="space-y-4">
          <div className="studio-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-56 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="p-4 bg-slate-50 rounded-lg space-y-2.5">
              <div className="h-3.5 w-full bg-slate-200 rounded animate-pulse" />
              <div className="h-3.5 w-11/12 bg-slate-200 rounded animate-pulse" />
              <div className="h-3.5 w-4/5 bg-slate-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
            <div className="space-y-2 pt-2">
              <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-10 w-full bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Editorial Hero Welcome State */}
      {!isGenerating && questions.length === 0 && (
        <div className="space-y-6">
          <div className="studio-card rounded-2xl overflow-hidden grid grid-cols-1 xl:grid-cols-12 items-stretch">
            <div className="xl:col-span-7 p-8 sm:p-10 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-sky-800">
                  Kurikulum Merdeka · Jenjang SMP (Fase D) · MKPS Garut
                </p>
                <h1 className="font-display text-3xl sm:text-[34px] font-bold leading-[1.18] text-[#0F294A] text-balance">
                  Studio Penyusun Asesmen Sumatif Berbasis AKM & HOTS
                </h1>
                <p className="text-[15px] leading-[1.65] text-slate-600 max-w-xl">
                  Rancang hingga 100 butir soal sumatif valid lintas enam bentuk
                  instrumen lengkap dengan stimulus kontekstual, kalibrasi tingkat
                  kesukaran, kisi-kisi otomatis, serta naskah cetak dan JSON murni.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onQuickStart}
                  className="px-5 py-3 text-sm font-semibold rounded-xl bg-[#0F294A] text-white hover:bg-[#173B6B] transition-colors cursor-pointer"
                >
                  Susun Paket Contoh (5 Soal Campuran)
                </button>
                <span className="text-xs text-slate-500 max-w-xs">
                  Atau sesuaikan parameter pada panel kiri lalu tekan Susun Soal
                  Asesmen.
                </span>
              </div>
            </div>

            <div className="xl:col-span-5 bg-slate-100 border-t xl:border-t-0 xl:border-l border-slate-200/80 min-h-[260px]">
              {!heroImgError ? (
                <img
                  src="/src/assets/images/hero_assessment_studio_1794756978328.jpg"
                  alt="Meja kerja penyusun naskah asesmen sumatif SMP dengan buku soal dan grafik analisis"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="w-full h-full lg:h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-sky-50 text-slate-600 gap-2">
                  <BookOpen className="w-9 h-9 text-[#0F294A]" aria-hidden="true" />
                  <span className="text-xs font-semibold">
                    Studio Asesmen Sumatif SMP
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4-Column Capability Strip below Hero Split */}
          <div className="studio-card rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#0F294A]">
                01. Standar AKM & HOTS
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Mengukur Knowing, Applying, Reasoning serta taksonomi C4–C6
                berbasis transfer konsep.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#0F294A]">
                02. 6 Bentuk Soal Spesifik
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Atur jumlah persis untuk PG, PG Kompleks, Isian Singkat,
                Menjodohkan, Benar-Salah, dan Uraian.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#0F294A]">
                03. Hingga 100 Butir Soal
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Penyusunan bertahap per batch menjaga variasi stimulus dan
                ketepatan pengecoh tiap nomor.
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#0F294A]">
                04. Cetak A4 & Ekspor JSON
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Siap dicetak lengkap dengan kop sekolah serta diekspor ke
                kisi-kisi CSV atau JSON LMS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Header Summary & Format Filter */}
      {questions.length > 0 && (
        <>
          <div className="studio-card rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-sky-800">
                  Naskah Terbentuk · {params.tipeAsesmen}
                </p>
                <h2 className="font-display text-xl font-bold text-[#0F294A]">
                  {params.mataPelajaran} — Kelas {params.kelas} (Fase D)
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl">
                  Materi: {params.materi}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80 tabular-nums">
              <div>
                <div className="text-xs text-slate-500">Total Butir</div>
                <div className="font-mono text-xl font-semibold text-[#0F294A]">
                  {questions.length}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tingkat Mudah</div>
                <div className="font-mono text-xl font-semibold text-emerald-700">
                  {summaryStats.Mudah}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tingkat Sedang</div>
                <div className="font-mono text-xl font-semibold text-sky-700">
                  {summaryStats.Sedang}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Tingkat Sukar</div>
                <div className="font-mono text-xl font-semibold text-amber-700">
                  {summaryStats.Sukar}
                </div>
              </div>
            </div>

            {viewFormat === 'Kartu Soal' && availableFormats.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setFormatFilter('Semua')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                    formatFilter === 'Semua'
                      ? 'bg-[#0F294A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semua ({questions.length})
                </button>
                {availableFormats.map(([fmt, count]) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormatFilter(fmt)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                      formatFilter === fmt
                        ? 'bg-sky-800 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {fmt} ({count})
                  </button>
                ))}
              </div>
            )}
          </div>

          {viewFormat === 'Kartu Soal' && (
            <div className="space-y-5">
              {filteredQuestions.map((q, index) => (
                <motion.div
                  key={`${q.nomor_soal}-${q.pertanyaan.slice(0, 20)}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.16,
                    delay: Math.min(index * 0.02, 0.12),
                  }}
                >
                  <QuestionCard
                    question={q}
                    showAnswers={showAnswers}
                    tryOutMode={tryOutMode}
                    onUpdateQuestion={onUpdateQuestion}
                    onRegenerateItem={onRegenerateItem}
                    isRegenerating={regeneratingNomor === q.nomor_soal}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {viewFormat === 'Teks Terstruktur' && (
            <div className="studio-card rounded-2xl p-6">
              <pre className="font-mono text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap break-words">
                {structuredText}
              </pre>
            </div>
          )}

          {viewFormat === 'JSON' && (
            <div className="bg-[#0B192C] border border-slate-800 rounded-2xl p-6 overflow-x-auto shadow-sm">
              <pre className="font-mono text-[13px] leading-relaxed text-slate-100 whitespace-pre">
                {pureJsonText}
              </pre>
            </div>
          )}
        </>
      )}
    </section>
  );
};
