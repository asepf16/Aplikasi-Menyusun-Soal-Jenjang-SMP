import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import type { QuestionItem } from '../types/assessment';
import { StimulusRenderer } from './StimulusRenderer';

interface QuestionCardProps {
  question: QuestionItem;
  showAnswers: boolean;
  tryOutMode: boolean;
  onUpdateQuestion: (updated: QuestionItem) => void;
  onRegenerateItem: (question: QuestionItem, note?: string) => Promise<void>;
  isRegenerating: boolean;
}

function parseMatchingItems(opsi: string[]) {
  const premises: string[] = [];
  const pairs: string[] = [];
  const others: string[] = [];

  for (const item of opsi) {
    const trimmed = item.trim();
    if (/^premis\s*\d*\s*:/i.test(trimmed)) {
      premises.push(trimmed);
    } else if (/^pasangan\s*[a-z0-9]*\s*:/i.test(trimmed)) {
      pairs.push(trimmed);
    } else {
      others.push(trimmed);
    }
  }

  return { premises, pairs, others };
}

function splitOptionLetter(opt: string): { letter: string; body: string } {
  const match = opt.trim().match(/^([A-E])\.\s*(.*)$/i);
  if (match) {
    return { letter: match[1].toUpperCase(), body: match[2] };
  }
  return { letter: opt.trim().charAt(0).toUpperCase(), body: opt };
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  showAnswers,
  tryOutMode,
  onUpdateQuestion,
  onRegenerateItem,
  isRegenerating,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<QuestionItem>(question);
  const [showRegenBox, setShowRegenBox] = useState(false);
  const [regenNote, setRegenNote] = useState('');
  const [localAnswerOpen, setLocalAnswerOpen] = useState(false);

  const [selectedPg, setSelectedPg] = useState<string | null>(null);
  const [selectedMultiPg, setSelectedMultiPg] = useState<string[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<
    Record<number, 'Benar' | 'Salah'>
  >({});
  const [selectedMatches, setSelectedMatches] = useState<Record<number, string>>(
    {}
  );
  const [userTextAnswer, setUserTextAnswer] = useState('');
  const [checkedTryOut, setCheckedTryOut] = useState(false);

  const lowerFormat = question.bentuk_soal.toLowerCase();
  const isTrueFalse =
    lowerFormat.includes('benar-salah') || lowerFormat.includes('benar salah');
  const isMatching = lowerFormat.includes('menjodohkan');
  const isComplexPg = lowerFormat.includes('kompleks') && !isTrueFalse;
  const isSinglePg =
    !isTrueFalse &&
    !isMatching &&
    !isComplexPg &&
    lowerFormat.includes('pilihan ganda') &&
    question.opsi.length > 0;

  const isAnswerVisible = showAnswers || localAnswerOpen || checkedTryOut;

  const matchingData = useMemo(
    () => (isMatching ? parseMatchingItems(question.opsi) : null),
    [isMatching, question.opsi]
  );

  const correctLetters = useMemo(() => {
    const matches = question.kunci_jawaban.toUpperCase().match(/\b[A-E]\b/g);
    if (matches && matches.length > 0) {
      return new Set(matches);
    }
    const first = question.kunci_jawaban.trim().charAt(0).toUpperCase();
    return first ? new Set([first]) : new Set<string>();
  }, [question.kunci_jawaban]);

  const handleOpenEdit = () => {
    setDraft({ ...question, opsi: [...question.opsi] });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onUpdateQuestion(draft);
    setIsEditing(false);
  };

  const handleRegenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRegenerateItem(question, regenNote.trim() || undefined);
    setShowRegenBox(false);
    setRegenNote('');
    setSelectedPg(null);
    setSelectedMultiPg([]);
    setSelectedComplex({});
    setSelectedMatches({});
    setCheckedTryOut(false);
  };

  const toggleMultiPg = (letter: string) => {
    setSelectedMultiPg((prev) =>
      prev.includes(letter)
        ? prev.filter((item) => item !== letter)
        : [...prev, letter]
    );
    setCheckedTryOut(false);
  };

  return (
    <article className="studio-card rounded-2xl p-6 sm:p-7 space-y-5">
      {/* Metadata Header — Zero-Pill Typography */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
          <span className="font-mono text-sm font-semibold text-[#0F294A] tabular-nums">
            Soal {String(question.nomor_soal).padStart(2, '0')}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-semibold text-sky-800">{question.tipe_soal}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-medium text-slate-800">
            {question.bentuk_soal}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>{question.level_kognitif}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>Konteks {question.konteks}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span
            className={`font-semibold ${
              question.tingkat_kesukaran === 'Sukar'
                ? 'text-amber-800'
                : question.tingkat_kesukaran === 'Sedang'
                  ? 'text-sky-800'
                  : 'text-emerald-800'
            }`}
          >
            Kesukaran: {question.tingkat_kesukaran}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isEditing && (
            <>
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sunting</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRegenBox((v) => !v)}
                disabled={isRegenerating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-[#0F294A] hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>{isRegenerating ? 'Menyusun...' : 'Susun Ulang'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Regenerate Revision Prompt */}
      {showRegenBox && (
        <form
          onSubmit={handleRegenSubmit}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
        >
          <label
            htmlFor={`regen-${question.nomor_soal}`}
            className="block text-xs font-semibold text-slate-800"
          >
            Catatan revisi untuk menyusun ulang Soal {question.nomor_soal}{' '}
            (opsional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id={`regen-${question.nomor_soal}`}
              type="text"
              value={regenNote}
              onChange={(e) => setRegenNote(e.target.value)}
              placeholder="Misal: Ganti konteks ke lingkungan sekolah atau tambahkan tabel perbandingan"
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#0F294A]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isRegenerating}
                className="px-3 py-2 text-xs font-semibold bg-[#0F294A] text-white rounded-lg hover:bg-[#173B6B] whitespace-nowrap cursor-pointer"
              >
                Proses Ulang
              </button>
              <button
                type="button"
                onClick={() => setShowRegenBox(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </form>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Stimulus
            </label>
            <textarea
              rows={4}
              value={draft.stimulus}
              onChange={(e) => setDraft({ ...draft, stimulus: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pertanyaan
            </label>
            <textarea
              rows={2}
              value={draft.pertanyaan}
              onChange={(e) =>
                setDraft({ ...draft, pertanyaan: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
            />
          </div>
          {draft.opsi.length > 0 && (
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700">
                Opsi / Pernyataan / Pasangan
              </span>
              {draft.opsi.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const nextOpsi = [...draft.opsi];
                    nextOpsi[idx] = e.target.value;
                    setDraft({ ...draft, opsi: nextOpsi });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
                />
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kunci Jawaban
              </label>
              <input
                type="text"
                value={draft.kunci_jawaban}
                onChange={(e) =>
                  setDraft({ ...draft, kunci_jawaban: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Indikator Soal
              </label>
              <input
                type="text"
                value={draft.indikator_soal}
                onChange={(e) =>
                  setDraft({ ...draft, indikator_soal: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pembahasan & Rubrik Penskoran
            </label>
            <textarea
              rows={3}
              value={draft.pembahasan_rubrik}
              onChange={(e) =>
                setDraft({ ...draft, pembahasan_rubrik: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0F294A]"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Batal</span>
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#173B6B] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Stimulus Block */}
          <div className="p-4 sm:p-5 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-slate-500">
              Stimulus Kontekstual
            </div>
            <StimulusRenderer content={question.stimulus} />
          </div>

          {/* Stem / Pertanyaan */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-[16px] font-semibold leading-relaxed text-slate-900">
              {question.pertanyaan}
            </h3>
          </div>

          {/* 1. Pilihan Ganda (Single Select) */}
          {isSinglePg && (
            <div className="space-y-2.5">
              {question.opsi.map((opt, idx) => {
                const { letter, body } = splitOptionLetter(opt);
                const isCorrect = correctLetters.has(letter);
                const isSelected = selectedPg === letter;

                let containerStyle =
                  'border-slate-200 bg-white text-slate-800 hover:bg-slate-50/80';
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isAnswerVisible && isCorrect) {
                  containerStyle =
                    'border-emerald-300 bg-emerald-50/60 text-slate-900';
                  badgeStyle =
                    'bg-emerald-700 text-white border-emerald-700';
                } else if (
                  tryOutMode &&
                  isSelected &&
                  checkedTryOut &&
                  !isCorrect
                ) {
                  containerStyle =
                    'border-rose-300 bg-rose-50/60 text-slate-900';
                  badgeStyle = 'bg-rose-700 text-white border-rose-700';
                } else if (tryOutMode && isSelected) {
                  containerStyle =
                    'border-[#0F294A] bg-sky-50/60 text-slate-900';
                  badgeStyle = 'bg-[#0F294A] text-white border-[#0F294A]';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!tryOutMode}
                    onClick={() => {
                      if (tryOutMode) {
                        setSelectedPg(letter);
                        setCheckedTryOut(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 text-[15px] rounded-xl border transition-colors flex items-center justify-between gap-3 ${containerStyle} ${
                      tryOutMode ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`w-6 h-6 rounded-md border font-mono text-xs font-semibold inline-flex items-center justify-center shrink-0 mt-0.5 ${badgeStyle}`}
                      >
                        {letter}
                      </span>
                      <span className="leading-relaxed">{body}</span>
                    </span>
                    {isAnswerVisible && isCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Kunci</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Pilihan Ganda Kompleks (>1 Jawaban Benar) */}
          {isComplexPg && question.opsi.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-500">
                Pilih lebih dari satu jawaban yang benar:
              </p>
              {question.opsi.map((opt, idx) => {
                const { letter, body } = splitOptionLetter(opt);
                const isCorrect = correctLetters.has(letter);
                const isSelected = selectedMultiPg.includes(letter);

                let containerStyle =
                  'border-slate-200 bg-white text-slate-800 hover:bg-slate-50/80';
                if (isAnswerVisible && isCorrect) {
                  containerStyle =
                    'border-emerald-300 bg-emerald-50/60 text-slate-900';
                } else if (
                  tryOutMode &&
                  isSelected &&
                  checkedTryOut &&
                  !isCorrect
                ) {
                  containerStyle =
                    'border-rose-300 bg-rose-50/60 text-slate-900';
                } else if (tryOutMode && isSelected) {
                  containerStyle =
                    'border-[#0F294A] bg-sky-50/60 text-slate-900';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!tryOutMode}
                    onClick={() => {
                      if (tryOutMode) toggleMultiPg(letter);
                    }}
                    className={`w-full text-left px-4 py-3 text-[15px] rounded-xl border transition-colors flex items-center justify-between gap-3 ${containerStyle} ${
                      tryOutMode ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`w-5 h-5 rounded border inline-flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected || (isAnswerVisible && isCorrect)
                            ? 'bg-[#0F294A] border-[#0F294A] text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {(isSelected || (isAnswerVisible && isCorrect)) && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span className="leading-relaxed">
                        <span className="font-mono text-xs font-semibold text-slate-500 mr-2">
                          {letter}.
                        </span>
                        {body}
                      </span>
                    </span>
                    {isAnswerVisible && isCorrect && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>Kunci</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Benar-Salah */}
          {isTrueFalse && question.opsi.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200">
                    <th className="px-4 py-2.5 font-semibold text-slate-800">
                      Pernyataan
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-800 text-center w-24">
                      Benar
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-slate-800 text-center w-24">
                      Salah
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {question.opsi.map((stmt, idx) => {
                    const picked = selectedComplex[idx];
                    return (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-slate-800 leading-relaxed">
                          {stmt}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tryOutMode ? (
                            <button
                              type="button"
                              aria-label={`Pernyataan ${idx + 1} Benar`}
                              onClick={() =>
                                setSelectedComplex((prev) => ({
                                  ...prev,
                                  [idx]: 'Benar',
                                }))
                              }
                              className={`w-7 h-7 rounded-md border inline-flex items-center justify-center cursor-pointer ${
                                picked === 'Benar'
                                  ? 'bg-[#0F294A] border-[#0F294A] text-white'
                                  : 'border-slate-300 bg-white text-transparent hover:border-[#0F294A]'
                              }`}
                            >
                              <Check className="w-4 h-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <span
                              className="inline-block w-5 h-5 rounded border border-slate-300"
                              aria-hidden="true"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tryOutMode ? (
                            <button
                              type="button"
                              aria-label={`Pernyataan ${idx + 1} Salah`}
                              onClick={() =>
                                setSelectedComplex((prev) => ({
                                  ...prev,
                                  [idx]: 'Salah',
                                }))
                              }
                              className={`w-7 h-7 rounded-md border inline-flex items-center justify-center cursor-pointer ${
                                picked === 'Salah'
                                  ? 'bg-[#0F294A] border-[#0F294A] text-white'
                                  : 'border-slate-300 bg-white text-transparent hover:border-[#0F294A]'
                              }`}
                            >
                              <Check className="w-4 h-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <span
                              className="inline-block w-5 h-5 rounded border border-slate-300"
                              aria-hidden="true"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Menjodohkan */}
          {isMatching && matchingData && question.opsi.length > 0 && (
            <div className="space-y-3">
              {matchingData.premises.length > 0 &&
              matchingData.pairs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100/90 px-4 py-2.5 text-xs font-semibold text-slate-800 border-b border-slate-200">
                      Kolom Premis / Pernyataan
                    </div>
                    <div className="divide-y divide-slate-200 bg-white">
                      {matchingData.premises.map((premis, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-3 text-sm text-slate-800 flex items-center justify-between gap-3"
                        >
                          <span>{premis}</span>
                          {tryOutMode && (
                            <select
                              aria-label={`Pasangan untuk Premis ${idx + 1}`}
                              value={selectedMatches[idx] ?? ''}
                              onChange={(e) =>
                                setSelectedMatches((prev) => ({
                                  ...prev,
                                  [idx]: e.target.value,
                                }))
                              }
                              className="px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 shrink-0"
                            >
                              <option value="">Pilih...</option>
                              {matchingData.pairs.map((_, pIdx) => {
                                const code = String.fromCharCode(65 + pIdx);
                                return (
                                  <option key={code} value={code}>
                                    Pasangan {code}
                                  </option>
                                );
                              })}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100/90 px-4 py-2.5 text-xs font-semibold text-slate-800 border-b border-slate-200">
                      Kolom Pilihan Pasangan
                    </div>
                    <div className="divide-y divide-slate-200 bg-white">
                      {matchingData.pairs.map((pair, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-3 text-sm text-slate-800"
                        >
                          {pair}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-800">
                  {question.opsi.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Isian Singkat / Uraian Try-Out */}
          {!isSinglePg &&
            !isComplexPg &&
            !isTrueFalse &&
            !isMatching &&
            tryOutMode && (
              <div>
                <label
                  htmlFor={`ans-${question.nomor_soal}`}
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Jawaban Uji Coba
                </label>
                <textarea
                  id={`ans-${question.nomor_soal}`}
                  rows={lowerFormat.includes('isian') ? 1 : 3}
                  value={userTextAnswer}
                  onChange={(e) => setUserTextAnswer(e.target.value)}
                  placeholder="Ketikkan simulasi jawaban siswa untuk dibandingkan dengan rubrik..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-[#0F294A]"
                />
              </div>
            )}

          {/* Action bar under question */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {tryOutMode ? (
              <button
                type="button"
                onClick={() => setCheckedTryOut((v) => !v)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#0F294A] text-white hover:bg-[#173B6B] transition-colors cursor-pointer"
              >
                {checkedTryOut ? 'Sembunyikan Pembahasan' : 'Periksa Jawaban'}
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                Indikator: {question.indikator_soal}
              </span>
            )}

            {!showAnswers && !tryOutMode && (
              <button
                type="button"
                onClick={() => setLocalAnswerOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F294A] hover:text-sky-800 cursor-pointer"
              >
                <span>
                  {localAnswerOpen
                    ? 'Tutup Kunci & Pembahasan'
                    : 'Lihat Kunci & Pembahasan'}
                </span>
                {localAnswerOpen ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {/* Kunci & Pembahasan/Rubrik */}
          {isAnswerVisible && (
            <div className="p-4 sm:p-5 bg-emerald-50/60 border border-emerald-200/90 rounded-xl space-y-2.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xs font-semibold text-emerald-900">
                  Kunci Jawaban:
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {question.kunci_jawaban}
                </span>
              </div>
              <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                <span className="font-semibold text-slate-900">
                  Pembahasan & Rubrik:{' '}
                </span>
                {question.pembahasan_rubrik}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
};
