import React from 'react';

interface StimulusRendererProps {
  content: string;
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function isTableSeparatorLine(line: string): boolean {
  const trimmed = line.trim();
  return /^\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?$/.test(trimmed);
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

export const StimulusRenderer: React.FC<StimulusRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  const blocks: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'table'; headers: string[]; rows: string[][] }
  > = [];

  let i = 0;
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    const joined = paragraphBuffer.join('\n').trim();
    if (joined) {
      blocks.push({ type: 'paragraph', text: joined });
    }
    paragraphBuffer = [];
  };

  while (i < lines.length) {
    const current = lines[i];
    const next = lines[i + 1];

    if (
      current.includes('|') &&
      next !== undefined &&
      isTableSeparatorLine(next)
    ) {
      flushParagraph();
      const headers = parseTableRow(current);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (current.trim() === '') {
      flushParagraph();
    } else {
      paragraphBuffer.push(current);
    }
    i++;
  }
  flushParagraph();

  return (
    <div className="space-y-3 text-[15px] leading-[1.65] text-slate-700">
      {blocks.map((block, index) => {
        if (block.type === 'table') {
          return (
            <div
              key={index}
              className="overflow-x-auto rounded-lg border border-slate-200 bg-white my-3"
            >
              <table className="w-full text-left border-collapse text-sm tabular-nums">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200">
                    {block.headers.map((header, hIdx) => (
                      <th
                        key={hIdx}
                        className="px-3.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap"
                      >
                        {renderInlineFormatting(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {block.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50/70">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2.5 text-slate-700">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={index} className="whitespace-pre-line">
            {renderInlineFormatting(block.text)}
          </p>
        );
      })}
    </div>
  );
};
