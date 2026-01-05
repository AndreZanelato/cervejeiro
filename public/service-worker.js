self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  self.clients.claim()
})

// Minimal cache-first strategy for visited recipe pages (placeholder)
self.addEventListener('fetch', event => {
  // keep simple: let network handle most requests in MVP
})
