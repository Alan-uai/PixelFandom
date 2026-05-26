const CACHE_NAME = "psycho-cache-v1"
const ASSETS_TO_CACHE = ["/"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  )
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow("/"))
})

self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "Psycho", body: "" }
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
  })
})
