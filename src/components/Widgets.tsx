import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQuotes, type Quote } from "@/lib/stocks.functions";

function Widget({
  title, question, following, children, empty,
}: { title: string; question: string; following: string[]; children: ReactNode; empty?: string }) {
  return (
    <section className="neu flex h-[440px] w-[86vw] max-w-[380px] shrink-0 snap-center flex-col overflow-hidden sm:w-[360px]">
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold tracking-tight">{title}</h3>
          <span className="text-xs text-muted-foreground">{question}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="font-mono text-[10px] uppercase text-muted-foreground">Following</span>
          {following.length ? following.map((f) => (
            <span key={f} className="neu-inset rounded-full px-2.5 py-0.5 font-mono text-[11px]">{f}</span>
          )) : <span className="text-[11px] italic text-muted-foreground">nothing yet</span>}
        </div>
      </header>
      <div className="no-scrollbar mx-3 mb-3 min-h-0 flex-1 overflow-auto neu-inset">
        {following.length === 0 ? <p className="p-4 text-sm text-muted-foreground">{empty}</p> : children}
      </div>
    </section>
  );
}

function State({ q }: { q: { isLoading: boolean; isError: boolean } }) {
  if (q.isLoading) return <p className="p-4 font-mono text-xs text-muted-foreground animate-pulse">Fetching…</p>;
  if (q.isError) return <p className="p-4 text-sm text-destructive">Couldn't load this source right now.</p>;
  return null;
}

const ago = (d: string) => {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

function Row({ href, title, meta, sub }: { href: string; title: string; meta: ReactNode; sub?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block mx-1 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary">
      <div className="text-sm font-medium leading-snug">{title}</div>
      {sub && <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{sub}</div>}
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">{meta}</div>
    </a>
  );
}

export function GitHubWidget({ keywords }: { keywords: string[] }) {
  const q = useQuery({
    queryKey: ["gh", keywords],
    enabled: keywords.length > 0,
    staleTime: 10 * 60e3,
    queryFn: async () => {
      const query = keywords.map((k) => `"${k}"`).join(" OR ");
      const r = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=8`);
      if (!r.ok) throw new Error();
      return (await r.json()).items as any[];
    },
  });
  return (
    <Widget title="GitHub" question="What already exists?" following={keywords} empty="Add keywords to find related projects.">
      <State q={q} />
      {q.data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No repositories found — open territory, or try broader keywords.</p>}
      {q.data?.map((r) => (
        <Row key={r.id} href={r.html_url} title={r.full_name} sub={r.description}
          meta={<>★ {r.stargazers_count.toLocaleString()} · {r.language ?? "—"} · pushed {ago(r.pushed_at)}</>} />
      ))}
    </Widget>
  );
}

export function ResearchWidget({ keywords }: { keywords: string[] }) {
  const fetchWorks = async (sort: string) => {
    const search = keywords.join(" ");
    const r = await fetch(`https://api.openalex.org/works?search=${encodeURIComponent(search)}&sort=${sort}&per_page=5&select=id,display_name,publication_year,cited_by_count,doi,publication_date`);
    if (!r.ok) throw new Error();
    return (await r.json()).results as any[];
  };
  const cited = useQuery({ queryKey: ["oa-c", keywords], enabled: keywords.length > 0, staleTime: 30 * 60e3, queryFn: () => fetchWorks("cited_by_count:desc") });
  const recent = useQuery({ queryKey: ["oa-r", keywords], enabled: keywords.length > 0, staleTime: 30 * 60e3, queryFn: () => fetchWorks("publication_date:desc") });
  const list = (items?: any[]) => items?.map((w) => (
    <Row key={w.id} href={w.doi || w.id} title={w.display_name}
      meta={<>{w.publication_year} · {w.cited_by_count.toLocaleString()} citations</>} />
  ));
  return (
    <Widget title="Research" question="What's the state of the art?" following={keywords} empty="Add keywords to find papers.">
      <div className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Most cited</div>
      <State q={cited} />{list(cited.data)}
      <div className="px-4 pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Newest</div>
      <State q={recent} />{list(recent.data)}
    </Widget>
  );
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className={`h-8 w-24 ${up ? "text-up" : "text-down"}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StocksWidget({ tickers }: { tickers: string[] }) {
  const q = useQuery({
    queryKey: ["stocks", tickers],
    enabled: tickers.length > 0,
    staleTime: 5 * 60e3,
    queryFn: () => getQuotes({ data: { symbols: tickers } }),
  });
  return (
    <Widget title="Stocks" question="How is the market moving?" following={tickers} empty="Add tickers for related public companies.">
      <State q={q} />
      {q.data?.map((s: Quote) => {
        const up = (s.changePct ?? 0) >= 0;
        return (
          <a key={s.symbol} href={`https://finance.yahoo.com/quote/${s.symbol}`} target="_blank" rel="noreferrer"
            className="flex items-center justify-between gap-3 mx-1 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary">
            <div className="min-w-0">
              <div className="font-mono text-sm font-semibold">{s.symbol}</div>
              <div className="truncate text-xs text-muted-foreground">{s.error ?? s.name}</div>
            </div>
            <Spark data={s.closes} up={up} />
            {s.price != null && (
              <div className="text-right font-mono">
                <div className="text-sm">{s.price.toFixed(2)}</div>
                <div className={`text-[11px] ${up ? "text-up" : "text-down"}`}>{up ? "+" : ""}{s.changePct?.toFixed(1) ?? "—"}% 1mo</div>
              </div>
            )}
          </a>
        );
      })}
    </Widget>
  );
}

export function NewsWidget({ keywords }: { keywords: string[] }) {
  const q = useQuery({
    queryKey: ["hn", keywords],
    enabled: keywords.length > 0,
    staleTime: 10 * 60e3,
    queryFn: async () => {
      const results = await Promise.all(keywords.map(async (k) => {
        const r = await fetch(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(k)}&tags=story&hitsPerPage=6`);
        if (!r.ok) throw new Error();
        return (await r.json()).hits as any[];
      }));
      const seen = new Set();
      return results.flat().filter((h) => h.title && !seen.has(h.objectID) && seen.add(h.objectID))
        .sort((a, b) => b.created_at_i - a.created_at_i).slice(0, 10);
    },
  });
  return (
    <Widget title="News" question="Is anyone talking about it?" following={keywords} empty="Add keywords to track coverage.">
      <State q={q} />
      {q.data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">Quiet — no recent discussion found.</p>}
      {q.data?.map((h) => (
        <Row key={h.objectID} href={h.url || `https://news.ycombinator.com/item?id=${h.objectID}`} title={h.title}
          meta={<>{h.url ? new URL(h.url).hostname.replace("www.", "") : "news.ycombinator.com"} · {h.points ?? 0} pts · {h.num_comments ?? 0} comments · {ago(h.created_at)}</>} />
      ))}
    </Widget>
  );
}
