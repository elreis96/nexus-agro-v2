import { ReactNode } from 'react';
import { formatBRL, formatDate } from '@/lib/calculations';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ExecutiveCardProps {
  title: string;
  value: number;
  unit?: string;
  date?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  variant?: 'default' | 'gold';
  format?: 'currency' | 'number' | 'mm';
}

export function ExecutiveCard({
  title,
  value,
  unit,
  date,
  trend,
  icon,
  variant = 'default',
  format = 'currency',
}: ExecutiveCardProps) {
  const cardClass = variant === 'gold' ? 'executive-card-gold' : 'executive-card';
  
  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatBRL(value);
      case 'mm':
        return `${value.toFixed(1)} mm`;
      case 'number':
      default:
        return value.toFixed(2);
    }
  };
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-chart-green' : trend === 'down' ? 'text-chart-red' : 'text-muted-foreground';
  
  return (
    <div className={`${cardClass} p-5 pulse-live`}>
      <div className="flex items-start justify-between mb-3">
        <span className="stat-label">{title}</span>
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="stat-value text-foreground tabular-nums">
          {formatValue()}
        </span>
        {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
        {date && (
          <span className="text-xs text-muted-foreground">
            Última atualização: {formatDate(date)}
          </span>
        )}
        {trend && (
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        )}
      </div>
    </div>
  );
}
