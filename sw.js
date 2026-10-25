// ── SERVICE WORKER — PokéDex Offline Cache ──
const CACHE_NAME = 'pokedex-v1';

// URLs to pre-cache on install (the popular 8 Pokémon so they work immediately offline)
const PRECACHE_URLS = [
  'https://pokeapi.co/api/v2/pokemon/charizard',
  'https://pokeapi.co/api/v2/pokemon/pikachu',
  'https://pokeapi.co/api/v2/pokemon/mewtwo',
  'https://pokeapi.co/api/v2/pokemon/bulbasaur',
  'https://pokeapi.co/api/v2/pokemon/squirtle',
  'https://pokeapi.co/api/v2/pokemon/greninja',
  'https://pokeapi.co/api/v2/pokemon/typhlosion',
  'https://pokeapi.co/api/v2/pokemon/eevee',
];

// ── INSTALL: pre-cache popular Pokémon ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching popular Pokémon...');
      // Use individual adds so one failure doesn't block the rest
      return Promise.allSettled(
        PRECACHE_URLS.map(url => cache.add(url).catch(err =>
          console.warn('[SW] Pre-cache miss:', url, err)
        ))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-first for PokéAPI, Network-first for sprites/cries ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only intercept PokéAPI and its CDN assets
  const isPokeAPI  = url.hostname === 'pokeapi.co';
  const isRawAsset = url.hostname === 'raw.githubusercontent.com'; // sprites & cries

  if (!isPokeAPI && !isRawAsset) return; // let everything else pass through normally

  if (isPokeAPI) {
    // ── Cache-first for JSON data ──
    // Serve instantly from cache; update cache in background if online
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) {
          // Kick off a background refresh so cache stays fresh
          event.waitUntil(
            fetch(event.request)
              .then(fresh => cache.put(event.request, fresh.clone()))
              .catch(() => {}) // ignore if offline
          );
          return cached;
        }
        // Not in cache — try network, then store
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response(
            JSON.stringify({ error: 'Offline and not cached yet. Search this Pokémon once while online first.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
      })
    );

  } else if (isRawAsset) {
    // ── Cache-first for sprites & cry audio ──
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return new Response('Asset not available offline', { status: 503 });
        }
      })
    );
  }
});
