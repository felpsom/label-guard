// Fallback for offline functionality
if ('serviceWorker' in navigator && 'indexedDB' in window) {
  // Check if we're already offline
  if (!navigator.onLine) {
    console.log('App started in offline mode');
    
    // Show offline indicator
    const showOfflineMessage = () => {
      const offlineDiv = document.createElement('div');
      offlineDiv.id = 'offline-banner';
      offlineDiv.innerHTML = `
        <div style="
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          background: #f59e0b; 
          color: white; 
          padding: 8px; 
          text-align: center; 
          z-index: 9999;
          font-family: system-ui;
        ">
          📱 Modo Offline - Todos os dados são salvos localmente
        </div>
      `;
      document.body.appendChild(offlineDiv);
    };

    // Only show if not already shown
    if (!document.getElementById('offline-banner')) {
      showOfflineMessage();
    }
  }

  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('Back online');
    const banner = document.getElementById('offline-banner');
    if (banner) banner.remove();
  });

  window.addEventListener('offline', () => {
    console.log('Gone offline');
    // Code to handle offline state
  });
}