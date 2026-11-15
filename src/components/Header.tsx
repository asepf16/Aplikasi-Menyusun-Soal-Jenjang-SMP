import React from 'react';
import { Printer } from 'lucide-react';
import type { ActiveNavSection } from '../types/assessment';

interface HeaderProps {
  activeSection: ActiveNavSection;
  onSelectSection: (section: ActiveNavSection) => void;
  onPrint: () => void;
  hasQuestions: boolean;
}

const NAV_ITEMS: Array<{ id: ActiveNavSection; label: string }> = [
  { id: 'penyusun', label: 'Penyusun Soal' },
  { id: 'kisi-kisi', label: 'Kisi-Kisi' },
  { id: 'arsip', label: 'Arsip Paket' },
  { id: 'panduan', label: 'Panduan Kurikulum' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onPrint,
  hasQuestions,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/90">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#penyusun"
          onClick={(e) => {
            e.preventDefault();
            onSelectSection('penyusun');
          }}
          className="font-display text-xl font-bold tracking-tight text-[#0F294A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F294A] rounded"
        >
          KarsaAsesmen · MKPS Garut
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F294A] rounded ${
                  isActive
                    ? 'text-[#0F294A] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[13px] h-0.5 bg-[#0F294A]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onPrint}
            disabled={!hasQuestions}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#0F294A] text-white hover:bg-[#173B6B] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A]"
          >
            <Printer className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Cetak Naskah</span>
          </button>
        </div>
      </div>

      {/* Mobile compact navigation */}
      <nav
        aria-label="Navigasi seluler"
        className="md:hidden flex items-center gap-4 px-6 pb-2.5 overflow-x-auto border-t border-slate-100"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`py-1.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isActive
                  ? 'border-[#0F294A] text-[#0F294A] font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
