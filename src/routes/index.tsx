import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { STAGES, loadIdeas, saveIdeas, parseList, type Idea, type Stage } from "@/lib/ideas";
import { GitHubWidget, NewsWidget, ResearchWidget, StocksWidget } from "@/components/Widgets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Idea Desk — evidence for every idea" },
      { name: "description", content: "Capture ideas on a board and see live GitHub, research, stock and news evidence for each one." },
      { property: "og:title", content: "Idea Desk — evidence for every idea" },
      { property: "og:description", content: "Decide whether an idea is worth building with live real-world evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Desk,
});

const stageDot: Record<Stage, string> = {
  spark: "bg-stage-spark", exploring: "bg-stage-exploring", building: "bg-stage-building", parked: "bg-stage-parked",
};

function Desk() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const l = loadIdeas();
    setIdeas(l);
    setSelectedId(l[0]?.id ?? null);
  }, []);
  useEffect(() => { if (ideas) saveIdeas(ideas); }, [ideas]);

  const selected = useMemo(() => ideas?.find((i) => i.id === selectedId) ?? null, [ideas, selectedId]);
  const update = (id: string, patch: Partial<Idea>) =>
    setIdeas((xs) => xs!.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const add = (stage: Stage) => {
    const idea: Idea = { id: crypto.randomUUID(), title: "Untitled idea", notes: "", stage, keywords: [], tickers: [], createdAt: Date.now() };
    setIdeas((xs) => [idea, ...xs!]);
    setSelectedId(idea.id);
  };
  const remove = (id: string) => {
    setIdeas((xs) => xs!.filter((i) => i.id !== id));
    setSelectedId(null);
  };

  if (!ideas) return <div className="min-h-screen" />;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-bold tracking-tight">Idea<span className="text-accent">/</span>Desk</h1>
        <span className="neu-inset rounded-full px-3 py-1 font-mono text-xs text-muted-foreground">{ideas.length} ideas</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="max-h-[45vh] shrink-0 no-scrollbar overflow-auto px-3 lg:max-h-none lg:w-80">
          {STAGES.map((s) => {
            const items = ideas.filter((i) => i.stage === s.id);
            return (
              <div key={s.id} className="mb-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stageDot[s.id]}`} />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">{s.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
                  </div>
                  <button onClick={() => add(s.id)} aria-label={`Add idea to ${s.label}`} className="neu-sm rounded-full p-1.5 text-muted-foreground hover:text-accent active:shadow-none">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-3 px-2 pb-3">
                  {items.map((i) => (
                    <button key={i.id} onClick={() => setSelectedId(i.id)}
                      className={`block w-full px-4 py-3 text-left ${i.id === selectedId ? "neu-inset" : "neu-sm"}`}>
                      <div className="line-clamp-2 text-sm font-medium leading-snug">{i.title}</div>
                      {(i.keywords.length > 0 || i.tickers.length > 0) && (
                        <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                          {[...i.keywords, ...i.tickers.map((t) => `$${t}`)].join(" · ")}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>
        <main className="min-h-0 flex-1 overflow-auto">
          {selected ? (
            <Dashboard key={selected.id} idea={selected} onChange={(p) => update(selected.id, p)} onDelete={() => remove(selected.id)} />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-muted-foreground">
              <p>Select an idea, or press <span className="font-mono">+</span> on a stage to capture one.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Dashboard({ idea, onChange, onDelete }: { idea: Idea; onChange: (p: Partial<Idea>) => void; onDelete: () => void }) {
  const [kw, setKw] = useState(idea.keywords.join(", "));
  const [tk, setTk] = useState(idea.tickers.join(", "));
  const input = "neu-inset w-full px-3 py-2 font-mono text-xs focus:border-ring focus:outline-none";

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="neu grid gap-3 p-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-2">
          <input value={idea.title} onChange={(e) => onChange({ title: e.target.value })}
            className="w-full bg-transparent text-2xl font-bold tracking-tight focus:outline-none" aria-label="Idea title" />
          <textarea value={idea.notes} onChange={(e) => onChange({ notes: e.target.value })} rows={2} placeholder="Notes…"
            className="w-full resize-none bg-transparent text-sm text-muted-foreground focus:outline-none" aria-label="Notes" />
        </div>
        <div className="space-y-2">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Keywords (comma separated)</span>
            <input className={input} value={kw} onChange={(e) => setKw(e.target.value)}
              onBlur={() => onChange({ keywords: parseList(kw) })} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tickers</span>
            <input className={input} value={tk} onChange={(e) => setTk(e.target.value)}
              onBlur={() => { const t = parseList(tk, true); setTk(t.join(", ")); onChange({ tickers: t }); }}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} />
          </label>
          <div className="flex items-center gap-2">
            <select value={idea.stage} onChange={(e) => onChange({ stage: e.target.value as Stage })} className={input} aria-label="Stage">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <button onClick={onDelete} aria-label="Delete idea" className="neu-sm rounded-full p-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-7 overflow-x-auto scroll-smooth px-5 pt-2 pb-8">
        <GitHubWidget keywords={idea.keywords} />
        <ResearchWidget keywords={idea.keywords} />
        <StocksWidget tickers={idea.tickers} />
        <NewsWidget keywords={idea.keywords} />
      </div>
    </div>
  );
}
