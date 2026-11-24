const CACHE_STATIC_NAME = 'static-camara-pwa-v1'

const STATIC_FILES = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
]

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando y precacheando App Shell...')
    self.skipWaiting()

    event.waitUntil(
        caches.open(CACHE_STATIC_NAME).then((cache) => {
            return Promise.all(
                STATIC_FILES.map((url) => {
                    return cache.add(url).catch((err) => {
                        console.warn('[SW] No se pudo cachear', url, err)
                    })
                })
            )
        })
    )
})

self.addEventListener('activate', (event) => {
    console.log('[SW] Activando y limpiando caches antiguos...')

    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys.filter((k) => k !== CACHE_STATIC_NAME).map((k) => caches.delete(k))
                )
            })
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return

    event.respondWith(
        caches.match(event.request).then((respuestaCacheada) => {
            return respuestaCacheada || fetch(event.request).catch(() => respuestaCacheada)
        })
    )
})
