import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function Spinner({
  size = "md",
  className,
  message,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

export function DataLoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border/50 rounded-xl p-8 shadow-xl space-y-4">
        <Spinner size="lg" message="Carregando dados do Railway..." />
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Processando até 92 registros...
          </p>
        </div>
      </div>
    </div>
  );
}

export function InlineSpinner({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
