/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { ArchiveView } from './components/ArchiveView';
import {
  AssessmentWorkspace,
  type GenerationProgress,
} from './components/AssessmentWorkspace';
import { BlueprintMatrixView } from './components/BlueprintMatrixView';
import { Header } from './components/Header';
import { ParameterDeck } from './components/ParameterDeck';
import { PedagogyGuideView } from './components/PedagogyGuideView';
import { PrintSheet } from './components/PrintSheet';
import type {
  ActiveNavSection,
  AssessmentParams,
  QuestionItem,
  SavedAssessmentPackage,
} from './types/assessment';
import { buildQuestionPlan } from './utils/formatters';

const ARCHIVE_STORAGE_KEY = 'karsaasesmen_archive_v1';
const BATCH_SIZE = 10;

const DEFAULT_PARAMS: AssessmentParams = {
  mataPelajaran: 'Matematika',
  kelas: '8',
  materi:
    'Sistem Persamaan Linear Dua Variabel (SPLDV) pada Pemecahan Masalah Kontekstual',
  tipeAsesmen: 'Kombinasi AKM & HOTS',
  bentukSoalMode: 'komposisi',
  bentukSoalTunggal: 'Pilihan Ganda',
  komposisiBentuk: {
    'Pilihan Ganda': 2,
    'Pilihan Ganda Kompleks': 1,
    'Isian Singkat': 1,
    Menjodohkan: 1,
    'Benar-Salah': 0,
    Uraian: 0,
  },
  bentukSoal: 'PG (2), PG Kompleks (1), Isian Singkat (1), Menjodohkan (1)',
  jumlahSoal: 5,
  tingkatKesukaran: 'Proporsional (Campuran)',
  distribusiMudah: 30,
  distribusiSedang: 50,
  distribusiSukar: 20,
  konteksFokus: 'Campuran Proporsional',
  namaSekolah: 'MKPS SMP Kabupaten Garut',
  alokasiWaktu: '60 Menit',
};

function normalizeLoadedParams(raw: Partial<AssessmentParams>): AssessmentParams {
  return {
    ...DEFAULT_PARAMS,
    ...raw,
    bentukSoalMode: raw.bentukSoalMode ?? 'tunggal',
    bentukSoalTunggal: raw.bentukSoalTunggal ?? 'Pilihan Ganda',
    komposisiBentuk: {
      ...DEFAULT_PARAMS.komposisiBentuk,
      ...(raw.komposisiBentuk ?? {}),
    },
  };
}

export default function App() {
  const [activeSection, setActiveSection] =
    useState<ActiveNavSection>('penyusun');
  const [params, setParams] = useState<AssessmentParams>(DEFAULT_PARAMS);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [regeneratingNomor, setRegeneratingNomor] = useState<number | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPackageSaved, setIsPackageSaved] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [archive, setArchive] = useState<SavedAssessmentPackage[]>(() => {
    try {
      const raw = localStorage.getItem(ARCHIVE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedAssessmentPackage[];
      return parsed.map((pkg) => ({
        ...pkg,
        params: normalizeLoadedParams(pkg.params),
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archive));
    } catch {
      // Ignore storage quota errors
    }
  }, [archive]);

  const handleGenerate = async (overrideParams?: AssessmentParams) => {
    const targetParams = overrideParams ?? params;
    const plan = buildQuestionPlan(targetParams);
    if (plan.length === 0) {
      setErrorMessage('Pilih minimal 1 butir soal sebelum menyusun asesmen.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setActiveSection('penyusun');
    setIsGenerating(true);
    setErrorMessage(null);
    setIsPackageSaved(false);
    setQuestions([]);
    setProgress({
      completed: 0,
      total: plan.length,
      currentBatchLabel: `Menyiapkan penyusunan ${plan.length} soal...`,
    });

    const accumulated: QuestionItem[] = [];
    const topicHints: string[] = [];

    try {
      for (let start = 0; start < plan.length; start += BATCH_SIZE) {
        if (controller.signal.aborted) break;

        const batchPlan = plan.slice(start, start + BATCH_SIZE);
        const batchStart = batchPlan[0].nomor_soal;
        const batchEnd = batchPlan[batchPlan.length - 1].nomor_soal;

        setProgress({
          completed: accumulated.length,
          total: plan.length,
          currentBatchLabel:
            plan.length > BATCH_SIZE
              ? `Menyusun soal nomor ${batchStart}–${batchEnd} dari ${plan.length} butir...`
              : `Menyusun ${plan.length} butir soal asesmen...`,
        });

        const response = await fetch('/api/assessments/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            ...targetParams,
            jumlahSoal: batchPlan.length,
            itemsPlan: batchPlan,
            previousTopicsSummary: topicHints,
          }),
        });

        const data = (await response.json()) as {
          questions?: QuestionItem[];
          error?: string;
        };

        if (!response.ok || !data.questions) {
          throw new Error(
            data.error || 'Gagal menyusun soal asesmen dari server.'
          );
        }

        for (const q of data.questions) {
          accumulated.push(q);
          topicHints.push(
            `${q.bentuk_soal}: ${q.pertanyaan.slice(0, 75)}`
          );
        }

        setQuestions([...accumulated]);
        setProgress({
          completed: accumulated.length,
          total: plan.length,
          currentBatchLabel:
            accumulated.length >= plan.length
              ? 'Penyusunan selesai'
              : `Berhasil menyusun ${accumulated.length} dari ${plan.length} soal...`,
        });
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') {
        setErrorMessage(
          accumulated.length > 0
            ? `Penyusunan dihentikan pada soal ke-${accumulated.length}. Soal yang sudah tersusun tetap dapat disunting atau diekspor.`
            : 'Penyusunan soal dibatalkan.'
        );
      } else {
        const message =
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat menghubungi layanan penyusun soal.';
        setErrorMessage(message);
      }
    } finally {
      setIsGenerating(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    abortControllerRef.current?.abort();
  };

  const handleQuickStart = () => {
    setParams(DEFAULT_PARAMS);
    void handleGenerate(DEFAULT_PARAMS);
  };

  const handleUpdateQuestion = (updated: QuestionItem) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.nomor_soal === updated.nomor_soal ? updated : item
      )
    );
    setIsPackageSaved(false);
  };

  const handleRegenerateItem = async (
    targetQuestion: QuestionItem,
    note?: string
  ) => {
    setRegeneratingNomor(targetQuestion.nomor_soal);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/assessments/regenerate-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params,
          existingQuestion: {
            nomor_soal: targetQuestion.nomor_soal,
            tingkat_kesukaran: targetQuestion.tingkat_kesukaran,
            bentuk_soal: targetQuestion.bentuk_soal,
            pertanyaan: targetQuestion.pertanyaan,
          },
          catatanRevisi: note,
        }),
      });

      const data = (await response.json()) as {
        question?: QuestionItem;
        error?: string;
      };

      if (!response.ok || !data.question) {
        throw new Error(data.error || 'Gagal menyusun ulang butir soal.');
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.nomor_soal === targetQuestion.nomor_soal ? data.question! : q
        )
      );
      setIsPackageSaved(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Gagal menyusun ulang butir soal.';
      setErrorMessage(message);
    } finally {
      setRegeneratingNomor(null);
    }
  };

  const handleSavePackage = () => {
    if (questions.length === 0) return;
    const newEntry: SavedAssessmentPackage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      params: { ...params },
      questions: [...questions],
    };
    setArchive((prev) => [newEntry, ...prev]);
    setIsPackageSaved(true);
  };

  const handleLoadPackage = (pkg: SavedAssessmentPackage) => {
    setParams(normalizeLoadedParams(pkg.params));
    setQuestions(pkg.questions);
    setErrorMessage(null);
    setIsPackageSaved(true);
    setActiveSection('penyusun');
  };

  const handleDeletePackage = (id: string) => {
    setArchive((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col studio-canvas-bg text-slate-900">
      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onPrint={handlePrint}
        hasQuestions={questions.length > 0}
      />

      <main className="no-print flex-1 w-full max-w-[1440px] mx-auto px-6 py-8">
        {activeSection === 'penyusun' && (
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <ParameterDeck
              params={params}
              onChange={setParams}
              onGenerate={() => void handleGenerate()}
              isGenerating={isGenerating}
            />
            <AssessmentWorkspace
              params={params}
              questions={questions}
              isGenerating={isGenerating}
              progress={progress}
              errorMessage={errorMessage}
              regeneratingNomor={regeneratingNomor}
              onUpdateQuestion={handleUpdateQuestion}
              onRegenerateItem={handleRegenerateItem}
              onCancelGeneration={handleCancelGeneration}
              onSavePackage={handleSavePackage}
              isPackageSaved={isPackageSaved}
              onQuickStart={handleQuickStart}
            />
          </div>
        )}

        {activeSection === 'kisi-kisi' && (
          <BlueprintMatrixView
            params={params}
            questions={questions}
            onBackToEditor={() => setActiveSection('penyusun')}
          />
        )}

        {activeSection === 'arsip' && (
          <ArchiveView
            packages={archive}
            onLoadPackage={handleLoadPackage}
            onDeletePackage={handleDeletePackage}
            onBackToEditor={() => setActiveSection('penyusun')}
          />
        )}

        {activeSection === 'panduan' && <PedagogyGuideView />}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            KarsaAsesmen · MKPS Garut — Perangkat Penyusun Asesmen Sumatif SMP Kurikulum Merdeka (Fase D)
          </span>
          <span>
            Format AKM · HOTS (C4–C6) · Kisi-Kisi & Rubrik Penskoran
          </span>
        </div>
      </footer>

      <PrintSheet params={params} questions={questions} />
    </div>
  );
}
