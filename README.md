# Inspección Visual PWA

Práctica del Tema 6.1 y 6.2 — **Instalabilidad Nativa (`manifest.json`) y Acceso Ético a Cámara**.

Aplicación web progresiva que:

1. Se declara **instalable** en la pantalla de inicio del teléfono (`manifest.json` + Service Worker + HTTPS).
2. Solicita acceso a la cámara con un **flujo de Pre-Permiso UX**: antes de disparar el diálogo nativo del navegador, muestra un aviso explicativo.
3. Permite **alternar entre cámara trasera (`environment`) y frontal (`user`)** liberando el sensor en cada cambio con `track.stop()`.
4. Incluye el **fallback para iPhone / iPad** (iOS no dispara `beforeinstallprompt`): detecta iOS + `navigator.standalone` y muestra instrucciones manuales.

## Estructura

```
pwa-camara-instalable/
├── index.html
├── styles.css
├── app.js
├── sw.js
├── manifest.json
└── icons/
    ├── icon-192.png     (192x192 exactos)
    └── icon-512.png     (512x512 exactos)
```

## Restricciones técnicas respetadas

- **100% JavaScript Vanilla**, sin librerías externas.
- **Sin `async/await`**: toda la asincronía usa `.then()` / `.catch()`.
- **Rutas relativas (`./`)** en `manifest.json`, `start_url`, `scope`, iconos, `<link>`s y registro del Service Worker — necesario para funcionar bajo un subdirectorio en GitHub Pages.

## Ejecución local

`getUserMedia` solo funciona en contextos seguros (HTTPS) o en `http://localhost`. Un servidor estático básico es suficiente, por ejemplo:

```bash
npx serve .
# o
python3 -m http.server 8000
```

Luego abre `http://localhost:<puerto>/` desde Chrome/Edge.

## Despliegue en GitHub Pages

1. Sube la carpeta como repositorio `pwa-camara-instalable`.
2. En **Settings → Pages**, selecciona la rama `main` (carpeta `/root`).
3. Abre la URL `https://<usuario>.github.io/pwa-camara-instalable/` en el teléfono.

## Verificación en el móvil

### Android / Chrome

1. Abre la URL de GitHub Pages en Chrome.
2. Pulsa **Instalar App** en el encabezado (aparece cuando se cumplen los criterios).
3. La aplicación se abre en modo `standalone`, sin barra de navegación.
4. Pulsa **Solicitar Acceso a Cámara** → aparece el aviso de Pre-Permiso.
5. Pulsa **Aceptar y Encender Cámara** → el navegador muestra su diálogo nativo.
6. Verifica la alternancia entre lentes y el apagado del sensor.

### iPhone / iPad (Safari)

1. El botón **Instalar App** **no** aparece (Safari no implementa `beforeinstallprompt`).
2. La app detecta iOS + no instalado y muestra la tarjeta **Instalar en iPhone / iPad** con los pasos:
   **Compartir → Agregar a inicio**.
3. Ya instalada, el video se mantiene en línea gracias a `<video playsinline muted autoplay>`.
4. Nota: en iOS, Safari y la PWA instalada **no comparten** el permiso de cámara — se vuelve a solicitar, lo cual justifica mantener el aviso de Pre-Permiso.

## Auditoría en DevTools

En escritorio: `F12` → **Application** → **Manifest**. Debe reportar iconos 192 y 512 correctos, sin advertencias de instalabilidad. En **Application → Service Workers** debe aparecer `sw.js` activo.
