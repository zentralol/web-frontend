"use client";

import { memo, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface MarkdownMessageProps {
  content: string;
}

interface CodeProps extends ComponentPropsWithoutRef<"code"> {
  children?: ReactNode;
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  return "";
}

function CodeRenderer({ className, children, ...props }: CodeProps) {
  const languageMatch = /language-(\w+)/.exec(className ?? "");
  const text = extractText(children);
  const isBlock = Boolean(languageMatch) || text.includes("\n");

  if (!isBlock) {
    return (
      <code className="rounded bg-white/10 px-1 py-0.5 text-[0.85em] text-accent">
        {children}
      </code>
    );
  }

  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-white/10 bg-black/30">
      <SyntaxHighlighter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={oneDark as any}
        language={languageMatch?.[1] ?? "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: "transparent",
          fontSize: "0.75rem",
        }}
        codeTagProps={{ style: { background: "transparent", textShadow: "none" } }}
        {...props}
      >
        {text.replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  );
}

const COMPONENTS: Components = {
  h1: ({ children }) => (
    <h2 className="mt-3 mb-2 text-base font-medium text-white first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-2 text-base font-medium text-white first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-3 mb-1 text-sm font-medium text-white first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-white/15 pl-3 text-white/60 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-white/10" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-white/10 px-2 py-1 text-left font-medium text-white">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-white/10 px-2 py-1">{children}</td>
  ),
  code: CodeRenderer,
};

function MarkdownMessageComponent({ content }: MarkdownMessageProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}

export const MarkdownMessage = memo(MarkdownMessageComponent);
