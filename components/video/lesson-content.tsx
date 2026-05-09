"use client";

import { BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface LessonContentProps {
  description?: string | null;
  label?: string;
}

export function LessonContent({
  description,
  label = "Sobre esta lección",
}: LessonContentProps) {
  const hasDescription =
    typeof description === "string" && description.trim().length > 0;

  if (!hasDescription) return null;

  return (
    <section
      aria-label={label}
      className="mt-4 rounded-2xl border border-gray-700/80 bg-gray-800/60 p-5 md:p-6"
    >
      <header className="mb-3 flex items-center gap-2 text-primary-accent">
        <BookOpen className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wider">
          {label}
        </h2>
      </header>

      <div
        className="prose prose-invert max-w-none text-[15px] leading-relaxed text-gray-300 prose-headings:text-gray-100 prose-headings:font-semibold prose-strong:text-gray-100 prose-a:text-primary-accent hover:prose-a:underline prose-code:text-gray-100 prose-code:bg-gray-900/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-blockquote:text-gray-300 prose-blockquote:border-l-primary-accent prose-hr:border-gray-700 prose-li:marker:text-gray-500"
      >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              a: ({ href, children, ...props }) => {
                const isExternal = !!href && /^https?:\/\//i.test(href);
                return (
                  <a
                    href={href}
                    {...(isExternal && {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    })}
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              img: ({ alt, ...props }) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={alt ?? ""} loading="lazy" decoding="async" {...props} />
              ),
            }}
          >
            {description as string}
          </ReactMarkdown>
      </div>
    </section>
  );
}

export default LessonContent;
