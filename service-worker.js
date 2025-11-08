// Service Worker per Irregular Verbs Master PWA
// Versione: 1.0.0

const CACHE_NAME = 'irregular-verbs-master-v1';
const urlsToCache = [
  '/il-mio-primo-progetto-su-GitHub/',
  '/il-mio-primo-progetto-su-GitHub/index.html',
  '/il-mio-primo-progetto-su-GitHub/styles.css',
  '/il-mio-primo-progetto-su-GitHub/app.js',
  '/il-mio-primo-progetto-su-GitHub/verbs-data.js',
  '/il-mio-primo-progetto-su-GitHub/manifest.json',
  '/il-mio-primo-progetto-su-GitHub/icon-192.svg',
  '/il-mio-primo-progetto-su-GitHub/icon-512.svg'
];

// Installazione del Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting(); // Attiva immediatamente
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Elimina cache vecchie
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim(); // Prendi controllo immediato
    })
  );
});

// Intercettazione delle richieste di rete
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - ritorna la risposta dalla cache
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }

        // Cache miss - prova a fare fetch dalla rete
        console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Verifica se abbiamo ricevuto una risposta valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta per salvarla in cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            // Errore di rete - se è una richiesta di navigazione, mostra pagina offline
            console.error('Service Worker: Fetch failed', error);

            // Se abbiamo l'index.html in cache, mostralo come fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/il-mio-primo-progetto-su-GitHub/index.html');
            }
          });
      })
  );
});

// Gestione degli aggiornamenti
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
