import React, { useState } from 'react';

// Copy button for code blocks
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-gray-800 bg-[#0d1117] text-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800 text-xs font-mono text-gray-400">
        <span className="uppercase tracking-wider font-semibold text-[11px] text-gray-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Inline markdown formatter: bold, italic, inline code, links
const formatInlineText = (text) => {
  if (!text) return text;

  // Split by inline code first
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[0.88em] border border-blue-200/60 font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold, italics, links
    return formatBoldAndLinks(part, i);
  });
};

const formatBoldAndLinks = (str, keyPrefix) => {
  // Regex for [link text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      elements.push(formatBoldItalic(str.substring(lastIndex, match.index), `${keyPrefix}-${lastIndex}`));
    }
    const [_, text, href] = match;
    elements.push(
      <a
        key={`${keyPrefix}-link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 underline font-medium hover:underline-offset-2 transition"
      >
        {text}
      </a>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < str.length) {
    elements.push(formatBoldItalic(str.substring(lastIndex), `${keyPrefix}-${lastIndex}`));
  }

  return elements.length > 0 ? elements : str;
};

const formatBoldItalic = (text, key) => {
  // Check for **bold**
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
      return (
        <strong key={`${key}-b-${bIdx}`} className="font-bold text-gray-900">
          {bPart.slice(2, -2)}
        </strong>
      );
    }
    // Check for *italic*
    const italicParts = bPart.split(/(\*[^*]+\*)/g);
    return italicParts.map((iPart, iIdx) => {
      if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length >= 2) {
        return (
          <em key={`${key}-i-${bIdx}-${iIdx}`} className="italic text-gray-800">
            {iPart.slice(1, -1)}
          </em>
        );
      }
      return iPart;
    });
  });
};

export const MarkdownRenderer = ({ content = '' }) => {
  if (!content) {
    return <p className="text-gray-400 italic text-sm">No content provided.</p>;
  }

  const lines = content.split('\n');
  const rendered = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listItems = [];
  let isNumberedList = false;

  const flushCodeBlock = (key) => {
    if (codeBlockLines.length > 0) {
      rendered.push(
        <CodeBlock
          key={`code-${key}`}
          language={codeBlockLang}
          code={codeBlockLines.join('\n')}
        />
      );
      codeBlockLines = [];
    }
    inCodeBlock = false;
    codeBlockLang = '';
  };

  const flushTable = (key) => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(1).filter(r => !r.every(cell => /^:?-+:?$/.test(cell.trim())));

      rendered.push(
        <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-gray-200 shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50/80 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {headerRow.map((cell, cIdx) => (
                  <th key={cIdx} className="px-4 py-2.5">
                    {formatInlineText(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50/50 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 text-gray-700">
                      {formatInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
    inTable = false;
  };

  const flushList = (key) => {
    if (listItems.length > 0) {
      if (isNumberedList) {
        rendered.push(
          <ol key={`ol-${key}`} className="list-decimal list-inside my-3 space-y-1.5 text-sm text-gray-700 pl-1 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-1">
                {formatInlineText(item)}
              </li>
            ))}
          </ol>
        );
      } else {
        rendered.push(
          <ul key={`ul-${key}`} className="list-disc list-inside my-3 space-y-1.5 text-sm text-gray-700 pl-1 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx} className="pl-1">
                {formatInlineText(item)}
              </li>
            ))}
          </ul>
        );
      }
      listItems = [];
    }
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block check
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(i);
      } else {
        if (inList) flushList(i);
        if (inTable) flushTable(i);
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Table check (| col 1 | col 2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) flushList(i);
      inTable = true;
      const cells = line.split('|').slice(1, -1);
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // List item check
    const isBullet = /^[-*+]\s+(.+)/.test(line.trim());
    const isOrdered = /^\d+\.\s+(.+)/.test(line.trim());

    if (isBullet || isOrdered) {
      if (!inList) {
        inList = true;
        isNumberedList = isOrdered;
      }
      const text = isBullet
        ? line.trim().replace(/^[-*+]\s+/, '')
        : line.trim().replace(/^\d+\.\s+/, '');
      listItems.push(text);
      continue;
    } else if (inList) {
      flushList(i);
    }

    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      continue;
    }

    // Horizontal rule
    if (/^---$|^\*\*\*$|^___$/.test(trimmed)) {
      rendered.push(<hr key={i} className="my-6 border-gray-200" />);
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      rendered.push(
        <h1 key={i} className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-6 mb-3 tracking-tight">
          {formatInlineText(trimmed.slice(2))}
        </h1>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      rendered.push(
        <h2 key={i} className="text-xl sm:text-2xl font-bold text-gray-900 mt-5 mb-2.5 tracking-tight border-b border-gray-100 pb-1.5">
          {formatInlineText(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      rendered.push(
        <h3 key={i} className="text-base sm:text-lg font-bold text-gray-900 mt-4 mb-2">
          {formatInlineText(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      rendered.push(
        <h4 key={i} className="text-sm sm:text-base font-bold text-gray-800 mt-3 mb-1.5">
          {formatInlineText(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      rendered.push(
        <blockquote key={i} className="my-3 pl-4 border-l-4 border-blue-500 bg-blue-50/40 py-2 pr-3 rounded-r-lg text-sm text-gray-700 italic">
          {formatInlineText(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Standard Paragraph
    rendered.push(
      <p key={i} className="my-2.5 text-sm sm:text-[15px] leading-relaxed text-gray-700">
        {formatInlineText(line)}
      </p>
    );
  }

  // Final flushes
  if (inCodeBlock) flushCodeBlock('end');
  if (inTable) flushTable('end');
  if (inList) flushList('end');

  return <div className="space-y-1 text-gray-800">{rendered}</div>;
};

export default MarkdownRenderer;
