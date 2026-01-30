/**
 * Service Worker Registration
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);

          // Verificar atualizações periodicamente
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // A cada hora

          // Escutar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Novo service worker disponível
                  console.log('🔄 Nova versão disponível');
                  // Você pode mostrar uma notificação ao usuário aqui
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
