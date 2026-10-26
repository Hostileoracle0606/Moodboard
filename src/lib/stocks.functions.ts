import { createServerFn } from "@tanstack/react-start";

export type Quote = {
  symbol: string;
  name: string | null;
  price: number | null;
  changePct: number | null;
  closes: number[];
  error: string | null;
};

export const getQuotes = createServerFn({ method: "GET" })
  .inputValidator((d: { symbols: string[] }) => ({
    symbols: (d.symbols || []).slice(0, 8).map((s) => String(s).replace(/[^A-Z0-9.\-^]/gi, "")),
  }))
  .handler(async ({ data }): Promise<Quote[]> => {
    return Promise.all(
      data.symbols.map(async (symbol) => {
        try {
          const r = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`,
            { headers: { "User-Agent": "Mozilla/5.0" } },
          );
          if (!r.ok) return { symbol, name: null, price: null, changePct: null, closes: [], error: `HTTP ${r.status}` };
          const j: any = await r.json();
          const res = j?.chart?.result?.[0];
          if (!res) return { symbol, name: null, price: null, changePct: null, closes: [], error: "Not found" };
          const closes: number[] = (res.indicators?.quote?.[0]?.close || []).filter(
            (x: number | null) => typeof x === "number",
          );
          const price = res.meta?.regularMarketPrice ?? closes[closes.length - 1];
          const first = closes[0];
          return {
            symbol,
            name: res.meta?.shortName || res.meta?.longName || null,
            price: price ?? null,
            changePct: first && price ? ((price - first) / first) * 100 : null,
            closes,
            error: null,
          };
        } catch (e) {
          return { symbol, name: null, price: null, changePct: null, closes: [], error: "Unavailable" };
        }
      }),
    );
  });
