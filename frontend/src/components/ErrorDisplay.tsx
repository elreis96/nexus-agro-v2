import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ErrorLevel = 'error' | 'warning' | 'info';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  level?: ErrorLevel;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorDisplay({
  title,
  message,
  level = 'error',
  onDismiss,
  action,
  className,
}: ErrorDisplayProps) {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    error: 'border-destructive/50 bg-destructive/10 text-destructive',
    warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-500',
  };

  const Icon = icons[level];

  return (
    <Card className={cn('border', styles[level], className)}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            {title && (
              <p className="font-medium mb-1">{title}</p>
            )}
            <p className="text-sm">{message}</p>
            {action && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
