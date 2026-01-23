import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { PeriodFilter, DateRange } from '@/lib/types';

interface PeriodSelectorProps {
  value: PeriodFilter;
  onChange: (period: PeriodFilter) => void;
  customRange?: DateRange;
  onCustomRangeChange?: (range: DateRange) => void;
}

const periods: { value: PeriodFilter; label: string }[] = [
  { value: '3m', label: '3 Meses' },
  { value: '6m', label: '6 Meses' },
  { value: '1y', label: '1 Ano' },
  { value: 'custom', label: 'Personalizado' },
];

export function PeriodSelector({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(customRange);
  
  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      const newRange = { startDate: range.from, endDate: range.to };
      setDateRange(newRange);
      onCustomRangeChange?.(newRange);
    }
  };
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground mr-2">Período:</span>
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
          className={value === period.value ? 'bg-primary text-primary-foreground' : ''}
        >
          {period.label}
        </Button>
      ))}
      
      {value === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.startDate && dateRange?.endDate ? (
                <>
                  {format(dateRange.startDate, 'dd/MM/yy', { locale: ptBR })} -{' '}
                  {format(dateRange.endDate, 'dd/MM/yy', { locale: ptBR })}
                </>
              ) : (
                'Selecionar datas'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRange?.startDate,
                to: dateRange?.endDate,
              }}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
