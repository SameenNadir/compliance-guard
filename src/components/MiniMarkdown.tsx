import type { ReactNode } from "react";
import { classNames } from "@/lib/utils";

// A minimal, dependency-free markdown renderer that supports:
// - fenced code blocks (```lang ... ```)
// - inline code `code`
// - bold **text**
// - headings #, ##, ###
// - unordered lists - / *
// - ordered lists 1.
// - paragraphs
// This is intentionally small to avoid pulling a markdown dep into the bundle.

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Split on inline code first
  const codeParts = text.split(/(`[^`]+`)/g);
  codeParts.forEach((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(
        <code key={`${keyPrefix}-c-${i}`} className="font-mono text-[0.85em] bg-slate-800 text-accent-300 px-1.5 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      // bold
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      boldParts.forEach((bp, j) => {
        if (bp.startsWith("**") && bp.endsWith("**")) {
          nodes.push(
            <strong key={`${keyPrefix}-b-${i}-${j}`} className="text-slate-100 font-semibold">
              {bp.slice(2, -2)}
            </strong>
          );
        } else {
          nodes.push(<span key={`${keyPrefix}-t-${i}-${j}`}>{bp}</span>);
        }
      });
    }
  });
  return nodes;
}

export function MiniMarkdown({ content, className }: { content: string; className?: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push(
        <pre key={key++} className="font-mono text-[0.85em] bg-slate-950 border border-slate-800 rounded-lg p-3 my-2 overflow-x-auto">
          <code className="bg-transparent text-slate-200 p-0">{codeLines.join("\n")}</code>
          {lang && <span className="sr-only">{lang}</span>}
        </pre>
      );
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const cls =
        level === 1 ? "text-base" : level === 2 ? "text-[0.95rem]" : "text-[0.9rem]";
      blocks.push(
        <p key={key++} className={classNames("font-semibold text-slate-100 mt-3 mb-1.5", cls)}>
          {renderInline(h[2], `h-${key}`)}
        </p>
      );
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="list-disc pl-5 my-1.5 space-y-1 text-slate-300">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ul-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="list-decimal pl-5 my-1.5 space-y-1 text-slate-300">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (consume consecutive non-empty, non-special lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="text-slate-300 leading-relaxed my-1.5">
        {renderInline(paraLines.join(" "), `p-${key}`)}
      </p>
    );
  }

  return <div className={classNames("remediation-prose", className)}>{blocks}</div>;
}
