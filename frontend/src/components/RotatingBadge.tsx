import { useEffect, useState } from "react";

const badges = [
  "🌾 Commodities Agrícolas",
  "📊 Mercado Financeiro",
  "🌡️ Análise Climática",
  "📈 Inteligência de Dados",
  "🛰️ Monitoramento em Tempo Real",
  "💹 Gestão de Portfólio",
];

export function RotatingBadge() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % badges.length);
    }, 3000); // Muda a cada 3 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 min-w-[300px]">
      <span className="text-sm font-medium text-primary transition-all duration-500 block text-center">
        {badges[currentIndex]}
      </span>
    </div>
  );
}
