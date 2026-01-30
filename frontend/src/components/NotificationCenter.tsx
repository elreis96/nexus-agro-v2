import { useEffect } from "react";
import { Bell, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: number) => void;
}

function NotificationItem({ notification, onDelete }: NotificationItemProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        "bg-primary/5 border-primary/20",
      )}
    >
      <div className="mt-0.5">
        <Info className="h-4 w-4 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">
            {notification.title}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.body}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(notification.id)}
          title="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isLoading,
    deleteNotification,
    requestPermission,
  } = useNotifications();

  // Request permission on first interaction
  useEffect(() => {
    const handleInteraction = () => {
      requestPermission();
      document.removeEventListener("click", handleInteraction);
    };
    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, [requestPermission]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhuma notificação</p>
              <p className="text-xs">Você receberá alertas aqui</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-4 py-2 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Alertas em tempo real ativados
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
