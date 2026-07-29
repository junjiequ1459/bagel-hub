import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const appsDirectory = resolve(import.meta.dirname, 'apps');
const appEntries: Record<string, string> = Object.fromEntries(
  readdirSync(appsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => [
      `app-${entry.name}`,
      resolve(appsDirectory, entry.name, 'index.html')
    ])
    .filter(([, entryFile]) => existsSync(entryFile))
);

function bagelServiceWorker(): Plugin {
  return {
    name: 'bagel-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const generatedFiles = Object.keys(bundle).filter((fileName) =>
        /\.(?:html|js|css|png|webmanifest)$/.test(fileName)
      );
      const precacheFiles = [
        '/',
        '/index.html',
        ...Object.values(appEntries).map(
          (entryFile) => `/${relative(import.meta.dirname, entryFile).replaceAll('\\', '/')}`
        ),
        ...generatedFiles.map((fileName) => `/${fileName}`),
        '/manifest.webmanifest',
        '/icons/icon-192.png',
        '/icons/icon-512.png',
        '/icons/icon-512-maskable.png'
      ];
      const uniqueFiles = [...new Set(precacheFiles)];
      const versionHash = createHash('sha256');
      for (const [fileName, output] of Object.entries(bundle)) {
        versionHash.update(fileName);
        versionHash.update(
          output.type === 'chunk'
            ? output.code
            : typeof output.source === 'string'
              ? output.source
              : output.source
        );
      }
      for (const publicFile of [
        'manifest.webmanifest',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-512-maskable.png'
      ]) {
        versionHash.update(readFileSync(resolve(import.meta.dirname, 'public', publicFile)));
      }
      const version = versionHash.digest('hex').slice(0, 12);

      const source = `
const CACHE_NAME = 'bagel-${version}';
const PRECACHE_FILES = ${JSON.stringify(uniqueFiles, null, 2)};
const WEATHER_HOSTS = new Set(['api.open-meteo.com', 'geocoding-api.open-meteo.com']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith('bagel-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      return (await caches.match('/index.html')) || Response.error();
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (WEATHER_HOSTS.has(url.hostname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(event.request));
  }
});
`.trimStart();

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source
      });
    }
  };
}

export default defineConfig({
  plugins: [bagelServiceWorker()],
  build: {
    rollupOptions: {
      input: {
        hub: resolve(import.meta.dirname, 'index.html'),
        ...appEntries
      }
    }
  }
});
