import { useMemo, useState, useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { MarketTicker } from "@/components/MarketTicker";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Cloud,
  Cpu,
  Droplets,
  Leaf,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [exposure, setExposure] = useState(12_500_000);
  const [volatility, setVolatility] = useState(18.5);
  const [confidence, setConfidence] = useState<90 | 95 | 99>(95);

  const riskCalc = useMemo(() => {
    const z = confidence === 99 ? 2.33 : confidence === 95 ? 1.65 : 1.28;
    const dailyVol = volatility / 100 / Math.sqrt(252);
    const varValue = exposure * dailyVol * z;
    return {
      varValue,
      downside: (varValue / exposure) * 100,
      upside: (exposure * dailyVol * 1.2) / 1_000_000,
    };
  }, [exposure, volatility, confidence]);

  const bentoCards = [
    {
      title: "Preço Realtime",
      value: "R$ 267,40",
      change: "+0,82%",
      accent: "from-emerald-500/20 to-emerald-500/5",
      detail: "Boi Gordo • CEPEA",
      colSpan: "lg:col-span-5",
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: "Volatilidade 30d",
      value: "18,3%",
      change: "-0,6%",
      accent: "from-cyan-500/20 to-sky-500/5",
      detail: "Soja • Milho • Dólar",
      colSpan: "lg:col-span-3",
      icon: <BarChart3 className="w-4 h-4 text-cyan-300" />,
    },
    {
      title: "Mapa de Risco",
      value: "VaR 95%: R$ 420k",
      change: "lag chuva 60d",
      accent: "from-amber-500/20 to-orange-500/5",
      detail: "Cenários: +2σ / -2σ",
      colSpan: "lg:col-span-4",
      icon: <Shield className="w-4 h-4 text-amber-300" />,
    },
    {
      title: "Insights Climáticos",
      value: "96mm de chuva",
      change: "30 dias • +12%",
      accent: "from-cyan-500/15 to-blue-500/5",
      detail: "Previsão: seca moderada",
      colSpan: "lg:col-span-6",
      icon: <Droplets className="w-4 h-4 text-cyan-300" />,
    },
    {
      title: "Correlação Ativa",
      value: "0.847",
      change: "Dólar x JBS",
      accent: "from-purple-500/15 to-fuchsia-500/5",
      detail: "Forte • Positiva",
      colSpan: "lg:col-span-6",
      icon: <Sparkles className="w-4 h-4 text-purple-300" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 relative overflow-hidden">
      {/* Floating decorative elements - similar to portfolio */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-slate-950" />
        <div className="absolute inset-0 bg-grid-soft opacity-60" />

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-emerald-500/10 bg-slate-950/70 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <span className="hidden md:inline text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                AgroData Nexus
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>Entrar</Button>
              <Button
                className="relative overflow-hidden bg-emerald-500/80 hover:bg-emerald-500/90 text-black font-semibold px-5 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:-translate-y-0.5 transition-all"
                onClick={() => navigate("/auth")}
              >
                <span className="relative z-10">Explore o Nexus</span>
                <span className="absolute inset-0 bg-emerald-400/20 blur-xl" />
                <ArrowRight className="ml-2 h-4 w-4 relative z-10" />
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          {/* Live Market - Moved to top */}
          <section className="max-w-6xl mx-auto px-6 pt-6">
            <motion.div
              variants={fadeUp}
              initial="initial"
              animate="animate"
              className="glassmorphism border border-slate-700/30 shadow-2xl p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Market</p>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-xs">Dados em tempo real</span>
              </div>
              <MarketTicker />
            </motion.div>
          </section>

          {/* Hero */}
          <section className="max-w-6xl mx-auto px-6 pb-16">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
              <motion.div
                variants={fadeUp}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-500/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-emerald-100/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Inteligência Agrometeorológica • Fundos
                </div>

                <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
                  Onde o Clima encontra o Mercado
                  <span className="text-emerald-300 block">
                    os dados trazem a solução.
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-300 max-w-2xl">
                  Plataforma de inteligência agrometeorológica para fundos de investimento e gestão de alta performance. Clima, cotações e risco convergem em um único dashboard.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="relative overflow-hidden bg-emerald-500/90 hover:bg-emerald-500 text-black font-semibold px-8 py-6 text-base shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all"
                    onClick={() => navigate("/auth")}
                  >
                    Explore o Nexus
                    <ArrowUpRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-emerald-500/20 hover:border-emerald-500/40 text-slate-200 px-8 py-6 text-base hover:bg-emerald-500/5 transition-all"
                    onClick={() => navigate("/risk-terminal")}
                  >
                    Ver Gestão de Risco
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 text-sm text-slate-400">
                  <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-emerald-300" /> Lag de chuva 60d</span>
                  <span className="flex items-center gap-2"><Cloud className="w-4 h-4 text-cyan-300" /> Forecast climático</span>
                  <span className="flex items-center gap-2"><Leaf className="w-4 h-4 text-lime-300" /> VaR em tempo real</span>
                </div>
              </motion.div>

              {/* Feature Carousel - substituindo espaço vazio */}
              <motion.div
                variants={fadeUp}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.1 }}
                className="glassmorphism border border-slate-700/30 shadow-2xl p-8 space-y-6"
              >
                <h3 className="text-2xl font-semibold text-emerald-100 mb-4">Dados que Movem o Mercado</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: <Droplets className="w-8 h-8 text-cyan-400" />, title: "Lag Climático 60d", desc: "Impacto da chuva no preço do boi" },
                    { icon: <BarChart3 className="w-8 h-8 text-emerald-400" />, title: "Volatilidade Real", desc: "Análise de risco em tempo real" },
                    { icon: <Shield className="w-8 h-8 text-amber-400" />, title: "VaR 95%", desc: "Perda máxima esperada" },
                    { icon: <Zap className="w-8 h-8 text-lime-400" />, title: "Alertas Smart", desc: "Notificações automáticas" },
                  ].map((feat, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/5 border border-slate-700/20 hover:border-emerald-500/20 transition-all">
                      <div className="mb-3">{feat.icon}</div>
                      <h4 className="font-semibold text-slate-100 mb-1">{feat.title}</h4>
                      <p className="text-xs text-slate-400">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Bento Grid */}
          <section className="max-w-6xl mx-auto px-6 py-24 space-y-12">
            <motion.div {...fadeUp} className="space-y-3 text-left max-w-3xl">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">Dashboard Tático</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-slate-50">Bento Grid • Inteligência em blocos</h2>
              <p className="text-slate-300 text-base">Cards responsivos mostram preço realtime, volatilidade, mapa de risco e status operacional da stack Railway/Supabase.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
              {bentoCards.map((card, idx) => (
                <motion.div
                  key={card.title}
                  variants={fadeUp}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-2xl border border-slate-700/25 bg-gradient-to-br ${card.accent} backdrop-blur-xl p-5 flex flex-col justify-between ${card.colSpan}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-200/80">
                      {card.icon}
                      <span>{card.title}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold tracking-tight text-slate-50">{card.value}</p>
                    <p className="text-sm text-emerald-200/80">{card.change}</p>
                    <p className="text-xs text-slate-400">{card.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Interactive Risk Simulator */}
          <section className="max-w-6xl mx-auto px-6 py-24">
            <motion.div {...fadeUp} className="glassmorphism border border-slate-700/30 p-8 rounded-3xl space-y-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/80">Terminal de Risco</p>
                  <h3 className="text-3xl font-semibold">Interactive Risk Simulator (VaR)</h3>
                  <p className="text-slate-300 max-w-2xl">Simule perdas/ganhos com VaR baseado em volatilidade anualizada. Ideal para gestores que precisam de leitura rápida antes do pregão.</p>
                </div>
                <Button
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-200 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                  onClick={() => navigate("/risk-terminal")}
                >
                  Abrir Terminal Completo
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Exposição (R$)</label>
                  <input
                    type="range"
                    min={1_000_000}
                    max={25_000_000}
                    step={250_000}
                    value={exposure}
                    onChange={(e) => setExposure(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                  <p className="text-sm text-slate-400">{(exposure / 1_000_000).toFixed(1)} mi</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Volatilidade anual (%)</label>
                  <input
                    type="range"
                    min={8}
                    max={35}
                    step={0.1}
                    value={volatility}
                    onChange={(e) => setVolatility(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                  <p className="text-sm text-slate-400">{volatility.toFixed(1)}%</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Confiança</label>
                  <select
                    value={confidence}
                    onChange={(e) => setConfidence(Number(e.target.value) as 90 | 95 | 99)}
                    className="w-full rounded-lg border border-emerald-500/20 bg-[#0B0F1A]/60 px-3 py-2 text-slate-100"
                  >
                    <option value={90}>90%</option>
                    <option value={95}>95%</option>
                    <option value={99}>99%</option>
                  </select>
                  <p className="text-sm text-slate-400">VaR diário com Z-score</p>
                </div>

                <div className="space-y-2 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Resultado</p>
                  <p className="text-3xl font-bold text-emerald-200">R$ {(riskCalc.varValue / 1_000_000).toFixed(2)} mi</p>
                  <p className="text-sm text-slate-300">VaR {confidence}% • {(riskCalc.downside).toFixed(2)}% do portfólio</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[{
                  label: "Perda Máxima (1d)",
                  value: `-${(riskCalc.varValue / 1_000_000).toFixed(2)} mi`,
                  helper: "VaR diário com drift neutro",
                }, {
                  label: "Upside (σ)",
                  value: `+${riskCalc.upside.toFixed(2)} mi`,
                  helper: "Movimento esperado 1σ",
                }, {
                  label: "Sinal para hedge",
                  value: riskCalc.downside > 2 ? "Comprar proteção" : "Manter posição",
                  helper: "Critério <2% tolerável",
                }].map((item) => (
                  <div key={item.label} className="p-4 rounded-2xl border border-emerald-500/15 bg-white/5">
                    <p className="text-sm text-slate-300">{item.label}</p>
                    <p className="text-2xl font-semibold text-slate-50">{item.value}</p>
                    <p className="text-xs text-slate-400">{item.helper}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* CTA Section */}
          <section className="max-w-6xl mx-auto px-6 pb-24 space-y-8">

            <motion.div {...fadeUp} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-emerald-500/15 rounded-2xl p-6 bg-white/5">
              <div className="space-y-2">
                <p className="text-sm text-emerald-200/80">Convergência entre clima e mercado.</p>
                <h4 className="text-2xl font-semibold">Pronto para liderar o próximo ciclo?</h4>
              </div>
              <div className="flex gap-3">
                <Button className="bg-emerald-500 text-black hover:shadow-[0_0_40px_rgba(16,185,129,0.35)]" onClick={() => navigate("/auth")}>
                  Começar agora
                </Button>
                <Button variant="outline" className="border-emerald-500/30 text-emerald-100" onClick={() => navigate("/contact")}>
                  Falar com o time
                </Button>
              </div>
            </motion.div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-emerald-500/15 bg-[#0B0F1A]/90 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
            <div>
              <p>© 2026 AgroData Nexus. Inteligência Climática e de Mercado para Fundos.</p>
            </div>
            <div className="flex gap-4">
              <a href="/terms" className="hover:text-emerald-200">Termos</a>
              <a href="/privacy" className="hover:text-emerald-200">Privacidade</a>
              <a href="/contact" className="hover:text-emerald-200">Contato</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
