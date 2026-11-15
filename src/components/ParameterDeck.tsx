import React, { useMemo } from 'react';
import { Loader2, Minus, Plus, Sparkles } from 'lucide-react';
import {
  ALL_QUESTION_FORMATS,
  SUBJECT_PRESETS,
  type AssessmentParams,
  type AssessmentType,
  type DifficultyLevel,
  type QuestionFormatMode,
  type SingleQuestionFormat,
  type StimulusContext,
} from '../types/assessment';
import {
  computeProportionalCounts,
  getTotalKomposisiCount,
  summarizeKomposisi,
} from '../utils/formatters';

interface ParameterDeckProps {
  params: AssessmentParams;
  onChange: (next: AssessmentParams) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const ASSESSMENT_TYPES: AssessmentType[] = [
  'AKM',
  'HOTS',
  'Kombinasi AKM & HOTS',
];

const FORMAT_DISPLAY_NAMES: Record<SingleQuestionFormat, string> = {
  'Pilihan Ganda': 'PG (Pilihan Ganda)',
  'Pilihan Ganda Kompleks': 'PG Kompleks (>1 Benar)',
  'Isian Singkat': 'Isian Singkat',
  Menjodohkan: 'Menjodohkan',
  'Benar-Salah': 'Benar-Salah',
  Uraian: 'Uraian',
};

const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  'Mudah',
  'Sedang',
  'Sukar',
  'Proporsional (Campuran)',
];

const STIMULUS_CONTEXTS: StimulusContext[] = [
  'Campuran Proporsional',
  'Personal',
  'Sosial Budaya',
  'Saintifik',
];

const QUICK_COUNTS = [5, 10, 25, 50, 100];

export const ParameterDeck: React.FC<ParameterDeckProps> = ({
  params,
  onChange,
  onGenerate,
  isGenerating,
}) => {
  const updateField = <K extends keyof AssessmentParams>(
    key: K,
    value: AssessmentParams[K]
  ) => {
    onChange({ ...params, [key]: value });
  };

  const suggestedTopics = useMemo(() => {
    const preset = SUBJECT_PRESETS.find(
      (s) => s.subject.toLowerCase() === params.mataPelajaran.trim().toLowerCase()
    );
    return preset?.topicsByGrade[params.kelas] ?? [];
  }, [params.mataPelajaran, params.kelas]);

  const totalKomposisi = useMemo(
    () => getTotalKomposisiCount(params.komposisiBentuk),
    [params.komposisiBentuk]
  );

  const effectiveTotal =
    params.bentukSoalMode === 'tunggal' ? params.jumlahSoal : totalKomposisi;

  const isTotalValid = effectiveTotal >= 1 && effectiveTotal <= 100;

  const proportionalSum =
    params.distribusiMudah + params.distribusiSedang + params.distribusiSukar;

  const proportionalCounts = useMemo(
    () =>
      computeProportionalCounts(
        Math.max(1, Math.min(100, effectiveTotal)),
        params.distribusiMudah,
        params.distribusiSedang,
        params.distribusiSukar
      ),
    [
      effectiveTotal,
      params.distribusiMudah,
      params.distribusiSedang,
      params.distribusiSukar,
    ]
  );

  const handleModeChange = (mode: QuestionFormatMode) => {
    if (mode === 'tunggal') {
      onChange({
        ...params,
        bentukSoalMode: 'tunggal',
        bentukSoal: params.bentukSoalTunggal,
      });
    } else {
      onChange({
        ...params,
        bentukSoalMode: 'komposisi',
        bentukSoal: summarizeKomposisi(params.komposisiBentuk),
      });
    }
  };

  const handleSingleFormatChange = (fmt: SingleQuestionFormat) => {
    onChange({
      ...params,
      bentukSoalTunggal: fmt,
      bentukSoal: fmt,
    });
  };

  const handleKomposisiChange = (fmt: SingleQuestionFormat, rawVal: number) => {
    const clamped = Math.max(0, Math.min(100, Math.floor(rawVal) || 0));
    const nextKomposisi = {
      ...params.komposisiBentuk,
      [fmt]: clamped,
    };
    const nextTotal = getTotalKomposisiCount(nextKomposisi);
    onChange({
      ...params,
      komposisiBentuk: nextKomposisi,
      jumlahSoal: Math.min(100, Math.max(1, nextTotal)),
      bentukSoal: summarizeKomposisi(nextKomposisi),
    });
  };

  const handleSingleCountChange = (rawVal: number) => {
    const clamped = Math.max(1, Math.min(100, Math.floor(rawVal) || 1));
    updateField('jumlahSoal', clamped);
  };

  const handleNormalizeDistribution = () => {
    const sum = proportionalSum || 100;
    const mudah = Math.round((params.distribusiMudah / sum) * 100);
    const sedang = Math.round((params.distribusiSedang / sum) * 100);
    const sukar = Math.max(0, 100 - mudah - sedang);
    onChange({
      ...params,
      distribusiMudah: mudah,
      distribusiSedang: sedang,
      distribusiSukar: sukar,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTotalValid) return;
    onGenerate();
  };

  const safeSum = proportionalSum || 100;
  const mudahBarPct =
    params.tingkatKesukaran === 'Proporsional (Campuran)'
      ? (params.distribusiMudah / safeSum) * 100
      : params.tingkatKesukaran === 'Mudah'
        ? 100
        : 0;
  const sedangBarPct =
    params.tingkatKesukaran === 'Proporsional (Campuran)'
      ? (params.distribusiSedang / safeSum) * 100
      : params.tingkatKesukaran === 'Sedang'
        ? 100
        : 0;
  const sukarBarPct =
    params.tingkatKesukaran === 'Proporsional (Campuran)'
      ? (params.distribusiSukar / safeSum) * 100
      : params.tingkatKesukaran === 'Sukar'
        ? 100
        : 0;

  return (
    <aside className="no-print w-full lg:w-[408px] shrink-0">
      <form
        onSubmit={handleSubmit}
        className="studio-card rounded-2xl p-6 space-y-6"
      >
        <div className="border-b border-slate-200/80 pb-4">
          <p className="text-xs font-semibold text-sky-800">
            Konfigurasi Instrumen
          </p>
          <h2 className="font-display text-xl font-bold text-[#0F294A] mt-0.5">
            Parameter Asesmen Fase D
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Atur spesifikasi Kurikulum Merdeka SMP hingga 100 butir soal.
          </p>
        </div>

        {/* 01. Identitas & Materi */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500">
            01. Identitas & Capaian Materi
          </div>

          <div>
            <label
              htmlFor="mata-pelajaran"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Mata Pelajaran
            </label>
            <input
              id="mata-pelajaran"
              type="text"
              list="subject-presets"
              value={params.mataPelajaran}
              onChange={(e) => updateField('mataPelajaran', e.target.value)}
              placeholder="Misal: Matematika, IPA, Bahasa Indonesia"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10"
            />
            <datalist id="subject-presets">
              {SUBJECT_PRESETS.map((s) => (
                <option key={s.subject} value={s.subject} />
              ))}
              <option value="Pendidikan Pancasila" />
              <option value="Bahasa Inggris" />
              <option value="PJOK" />
              <option value="Seni Budaya" />
            </datalist>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUBJECT_PRESETS.map((s) => {
                const active =
                  params.mataPelajaran.trim().toLowerCase() ===
                  s.subject.toLowerCase();
                return (
                  <button
                    key={s.subject}
                    type="button"
                    onClick={() => updateField('mataPelajaran', s.subject)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#0F294A] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {s.subject}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-1.5">
              Kelas / Fase
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {(['7', '8', '9'] as const).map((k) => {
                const active = params.kelas === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => updateField('kelas', k)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-[#0F294A] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kelas {k}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="lingkup-materi"
                className="text-sm font-semibold text-slate-800"
              >
                Lingkup Materi / CP / TP
              </label>
              <span className="text-xs text-slate-500">Fase D</span>
            </div>
            <textarea
              id="lingkup-materi"
              rows={3}
              value={params.materi}
              onChange={(e) => updateField('materi', e.target.value)}
              placeholder="Tuliskan topik materi, Capaian Pembelajaran, atau Tujuan Pembelajaran yang diuji..."
              required
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10 resize-y"
            />
            {suggestedTopics.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs font-medium text-slate-500">
                  Inspirasi CP/TP {params.mataPelajaran} Kelas {params.kelas}:
                </p>
                <div className="flex flex-col gap-1">
                  {suggestedTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => updateField('materi', topic)}
                      className="text-left px-2.5 py-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-sky-50 hover:text-[#0F294A] border border-slate-200 rounded-md transition-colors cursor-pointer line-clamp-2"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 02. Tipe, Bentuk & Jumlah */}
        <div className="space-y-4 pt-5 border-t border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">
            02. Tipe Asesmen & Bentuk Soal
          </div>

          <div>
            <span className="block text-sm font-semibold text-slate-800 mb-1.5">
              Tipe Asesmen
            </span>
            <div className="grid grid-cols-1 gap-1.5 p-1 bg-slate-100 rounded-lg">
              {ASSESSMENT_TYPES.map((type) => {
                const active = params.tipeAsesmen === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('tipeAsesmen', type)}
                    className={`py-2 px-3 text-xs font-semibold rounded-md text-left transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-[#0F294A] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <span className="block text-sm font-semibold text-slate-800">
              Bentuk Soal & Jumlah (Maks. 100)
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleModeChange('tunggal')}
                className={`py-1.5 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  params.bentukSoalMode === 'tunggal'
                    ? 'bg-white text-[#0F294A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satu Bentuk
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('komposisi')}
                className={`py-1.5 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  params.bentukSoalMode === 'komposisi'
                    ? 'bg-white text-[#0F294A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Atur Per Bentuk
              </button>
            </div>

            {params.bentukSoalMode === 'tunggal' ? (
              <div className="space-y-3">
                <select
                  aria-label="Pilih bentuk soal"
                  value={params.bentukSoalTunggal}
                  onChange={(e) =>
                    handleSingleFormatChange(
                      e.target.value as SingleQuestionFormat
                    )
                  }
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10"
                >
                  {ALL_QUESTION_FORMATS.map((fmt) => (
                    <option key={fmt} value={fmt}>
                      {FORMAT_DISPLAY_NAMES[fmt]}
                    </option>
                  ))}
                </select>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="jumlah-soal"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Jumlah Soal
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="jumlah-soal-num"
                        type="number"
                        min={1}
                        max={100}
                        value={params.jumlahSoal}
                        onChange={(e) =>
                          handleSingleCountChange(Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 text-right font-mono text-xs font-semibold border border-slate-300 rounded-md text-slate-900 tabular-nums focus:outline-none focus:border-[#0F294A]"
                      />
                      <span className="text-xs text-slate-500">butir</span>
                    </div>
                  </div>
                  <input
                    id="jumlah-soal"
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={params.jumlahSoal}
                    onChange={(e) =>
                      handleSingleCountChange(Number(e.target.value))
                    }
                    className="w-full accent-[#0F294A] cursor-pointer"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    {QUICK_COUNTS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleSingleCountChange(n)}
                        className={`px-2 py-1 font-mono text-[11px] font-medium rounded border transition-colors tabular-nums cursor-pointer ${
                          params.jumlahSoal === n
                            ? 'bg-[#0F294A] border-[#0F294A] text-white'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-800">
                    Jumlah per Bentuk Soal
                  </span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      isTotalValid ? 'text-[#0F294A]' : 'text-rose-700'
                    }`}
                  >
                    Total: {totalKomposisi} / 100
                  </span>
                </div>

                {ALL_QUESTION_FORMATS.map((fmt) => {
                  const val = params.komposisiBentuk[fmt] ?? 0;
                  return (
                    <div
                      key={fmt}
                      className="flex items-center justify-between gap-2"
                    >
                      <label
                        htmlFor={`fmt-${fmt}`}
                        className="text-xs font-medium text-slate-700 truncate"
                      >
                        {FORMAT_DISPLAY_NAMES[fmt]}
                      </label>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label={`Kurangi ${fmt}`}
                          onClick={() => handleKomposisiChange(fmt, val - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" aria-hidden="true" />
                        </button>
                        <input
                          id={`fmt-${fmt}`}
                          type="number"
                          min={0}
                          max={100}
                          value={val}
                          onChange={(e) =>
                            handleKomposisiChange(fmt, Number(e.target.value))
                          }
                          className="w-14 h-7 px-1.5 text-center font-mono text-xs font-semibold bg-white border border-slate-300 rounded-md text-slate-900 tabular-nums focus:outline-none focus:border-[#0F294A]"
                        />
                        <button
                          type="button"
                          aria-label={`Tambah ${fmt}`}
                          onClick={() => handleKomposisiChange(fmt, val + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {!isTotalValid && (
                  <p className="text-[11px] font-medium text-rose-700 pt-1">
                    {totalKomposisi === 0
                      ? 'Pilih minimal 1 butir soal.'
                      : 'Total soal maksimal 100 butir.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 03. Kalibrasi Kesukaran & Konteks */}
        <div className="space-y-4 pt-5 border-t border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">
            03. Kalibrasi Kesukaran & Konteks
          </div>

          <div>
            <label
              htmlFor="tingkat-kesukaran"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Tingkat Kesukaran Utama
            </label>
            <select
              id="tingkat-kesukaran"
              value={params.tingkatKesukaran}
              onChange={(e) =>
                updateField(
                  'tingkatKesukaran',
                  e.target.value as DifficultyLevel
                )
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10"
            >
              {DIFFICULTY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {params.tingkatKesukaran === 'Proporsional (Campuran)' && (
            <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  Distribusi Kesukaran
                </span>
                <span
                  className={`font-mono text-xs font-semibold tabular-nums ${
                    proportionalSum === 100
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  Total: {proportionalSum}%
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Mudah</span>
                  <span className="font-mono tabular-nums">
                    {params.distribusiMudah}% ({proportionalCounts.mudah} soal)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Persentase soal mudah"
                  value={params.distribusiMudah}
                  onChange={(e) =>
                    updateField('distribusiMudah', Number(e.target.value))
                  }
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Sedang</span>
                  <span className="font-mono tabular-nums">
                    {params.distribusiSedang}% ({proportionalCounts.sedang} soal)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Persentase soal sedang"
                  value={params.distribusiSedang}
                  onChange={(e) =>
                    updateField('distribusiSedang', Number(e.target.value))
                  }
                  className="w-full accent-sky-700 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-700 mb-1">
                  <span>Sukar</span>
                  <span className="font-mono tabular-nums">
                    {params.distribusiSukar}% ({proportionalCounts.sukar} soal)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  aria-label="Persentase soal sukar"
                  value={params.distribusiSukar}
                  onChange={(e) =>
                    updateField('distribusiSukar', Number(e.target.value))
                  }
                  className="w-full accent-amber-700 cursor-pointer"
                />
              </div>

              {proportionalSum !== 100 && (
                <button
                  type="button"
                  onClick={handleNormalizeDistribution}
                  className="w-full py-1.5 px-3 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors cursor-pointer"
                >
                  Sesuaikan Otomatis ke 100%
                </button>
              )}
            </div>
          )}

          {/* Live Difficulty Balance Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Proporsi Kalibrasi Soal</span>
              <span className="font-mono tabular-nums">
                {effectiveTotal} butir
              </span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden bg-slate-100 flex">
              {mudahBarPct > 0 && (
                <div
                  className="bg-emerald-600 transition-all duration-200"
                  style={{ width: `${mudahBarPct}%` }}
                  title="Mudah"
                />
              )}
              {sedangBarPct > 0 && (
                <div
                  className="bg-sky-600 transition-all duration-200"
                  style={{ width: `${sedangBarPct}%` }}
                  title="Sedang"
                />
              )}
              {sukarBarPct > 0 && (
                <div
                  className="bg-amber-600 transition-all duration-200"
                  style={{ width: `${sukarBarPct}%` }}
                  title="Sukar"
                />
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="konteks-stimulus"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Fokus Konteks Stimulus
            </label>
            <select
              id="konteks-stimulus"
              value={params.konteksFokus}
              onChange={(e) =>
                updateField('konteksFokus', e.target.value as StimulusContext)
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0F294A] focus:ring-2 focus:ring-[#0F294A]/10"
            >
              {STIMULUS_CONTEXTS.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 04. Identitas Naskah (Cetak) */}
        <div className="space-y-3 pt-5 border-t border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500">
            04. Kop Naskah Cetak (Opsional)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="nama-sekolah"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nama Sekolah
              </label>
              <input
                id="nama-sekolah"
                type="text"
                value={params.namaSekolah}
                onChange={(e) => updateField('namaSekolah', e.target.value)}
                placeholder="SMP Negeri 1 Nusantara"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0F294A]"
              />
            </div>
            <div>
              <label
                htmlFor="alokasi-waktu"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Alokasi Waktu
              </label>
              <input
                id="alokasi-waktu"
                type="text"
                value={params.alokasiWaktu}
                onChange={(e) => updateField('alokasiWaktu', e.target.value)}
                placeholder="90 Menit"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0F294A]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={
            isGenerating ||
            !isTotalValid ||
            !params.mataPelajaran.trim() ||
            !params.materi.trim()
          }
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl bg-[#0F294A] text-white hover:bg-[#173B6B] disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Menyusun {effectiveTotal} Soal...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Susun {effectiveTotal} Soal Asesmen</span>
            </>
          )}
        </button>
      </form>
    </aside>
  );
};
