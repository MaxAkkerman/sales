import { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import markdown from "../content/strategy.md?raw";

type TocItem = { id: string; text: string; level: number };

function childText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childText).join("");
  if (typeof node === "object" && "props" in node) {
    return childText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function slugify(text: string, used: Map<string, number>) {
  const base =
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "") || "section";
  const n = (used.get(base) || 0) + 1;
  used.set(base, n);
  return n === 1 ? base : `${base}-${n}`;
}

function tocFrom(md: string): TocItem[] {
  const used = new Map<string, number>();
  return md
    .split("\n")
    .filter((line) => /^#{1,3} /.test(line))
    .map((line) => {
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s+/, "").replace(/\*\*/g, "").trim();
      return { id: slugify(text, used), text, level };
    });
}

export default function Analytics() {
  const toc = tocFrom(markdown);
  const used = new Map<string, number>();

  return (
    <main className="page analytics">
      <aside className="toc">
        <h2>Аналитика</h2>
        <p className="muted">Рынок и стратегия продаж</p>
        <nav>
          {toc.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={`l${item.level}`}>
              {item.text}
            </a>
          ))}
        </nav>
      </aside>
      <article className="md">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => {
              const id = slugify(childText(children), used);
              return <h1 id={id}>{children}</h1>;
            },
            h2: ({ children }) => {
              const id = slugify(childText(children), used);
              return <h2 id={id}>{children}</h2>;
            },
            h3: ({ children }) => {
              const id = slugify(childText(children), used);
              return <h3 id={id}>{children}</h3>;
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </main>
  );
}
