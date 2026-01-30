import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export function MarketTicker() {
  const tickers: TickerItem[] = [
    { symbol: "SOJ", name: "Soja CBOT", price: 65.5, change: 1.25, changePercent: 2.0 },
    { symbol: "MLH", name: "Milho CBOT", price: 54.3, change: -0.85, changePercent: -1.5 },
    { symbol: "BOI", name: "Boi Gordo CEPEA", price: 267.45, change: 3.2, changePercent: 1.2 },
    { symbol: "PTAX", name: "USD/BRL", price: 5.32, change: 0.08, changePercent: 1.5 },
    { symbol: "JBSS3", name: "JBS S3", price: 32.85, change: 0.45, changePercent: 1.4 },
    { symbol: "BRL", name: "Real Futures", price: 199.5, change: -1.2, changePercent: -0.6 },
  ];

  const marqueeItems = [...tickers, ...tickers];

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-900/50 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 min-h-16">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Live Market
          </span>
        </div>

        {/* Ticker Scroll */}
        <div className="flex-1 overflow-hidden relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 via-slate-950/80 to-transparent" />

          <motion.div
            className="flex gap-6 min-w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          >
            {marqueeItems.map((ticker, index) => {
              const isPositive = ticker.changePercent > 0;
              const isNegative = ticker.changePercent < 0;

              return (
                <div
                  key={`${ticker.symbol}-${index}`}
                  className="flex items-center gap-4 px-5 py-2 rounded-xl border border-emerald-500/20 bg-white/5 hover:bg-white/10 transition-colors min-w-fit shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {ticker.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {ticker.name}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {ticker.price.toFixed(2)}
                    </p>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-xs font-semibold",
                        isPositive ? "text-green-500" : isNegative ? "text-red-500" : "text-muted-foreground"
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : isNegative ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      <span>
                        {isPositive ? "+" : ""}
                        {ticker.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
