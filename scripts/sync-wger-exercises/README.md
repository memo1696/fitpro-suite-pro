# Sincronización de ejercicios wger → Supabase Storage

Este script reemplaza la fuente de imágenes de la biblioteca de ejercicios de
**Nuevo APP**: en vez de usar el dataset de GitHub `hasaneyldrm/exercises-dataset`
(cuyos GIFs son en realidad contenido de pago de Gym visual, redistribuido sin
licencia clara), trae el catálogo de **wger.de** — un proyecto FLOSS cuyos
datos e imágenes están bajo licencia **Creative Commons (CC-BY-SA)**, de uso
gratuito y comercial, solo pidiendo atribución.

wger no tiene GIFs animados (solo imágenes estáticas JPEG/PNG/WebP, y video
real para algunos ejercicios). El script guarda la imagen principal + una
miniatura de cada ejercicio en tu propio Supabase Storage, y enlaza el video
directo a wger.de cuando existe (no se re-hospeda, para no gastar tu storage).

## Por qué corre en tu máquina y no en la nube

Este script no se pudo ejecutar ni probar desde el entorno donde se escribió:
no tiene salida a internet hacia `wger.de` ni hacia tu proyecto de Supabase
(solo un puñado de dominios permitidos como GitHub/npm). Por eso está listo
para que lo corras tú, con tu propia conexión y tu `service_role key`, que
nunca debe compartirse fuera de tu máquina.

## Requisitos

- Node.js 18 o superior (trae `fetch` nativo).
- Tu `service_role key` de Supabase: Dashboard del proyecto → **Project
  Settings → API → service_role** (la secreta, no la `anon`/`publishable`
  que ya está en `.env.example` de la raíz del proyecto).

## Pasos

```bash
cd scripts/sync-wger-exercises
npm install
cp .env.example .env
# edita .env y pega tu SUPABASE_SERVICE_ROLE_KEY
```

### 1. Modo inspección (recomendado primero)

No sube nada, solo imprime cómo luce realmente la respuesta de la API de
wger, para confirmar que coincide con lo que el script espera:

```bash
npm run inspect
```

Si algo se ve raro o distinto a lo esperado (por ejemplo la forma de
`/exerciseimage/{id}/thumbnails/`), copia la salida y compártela para
ajustar el script antes de la corrida completa.

### 2. Sincronización completa

```bash
npm run sync
```

Esto:

1. Crea el bucket público `exercise-media` en tu Supabase Storage si no
   existe (o usa el que definas en `SUPABASE_BUCKET`).
2. Recorre todo el catálogo de wger (puedes limitarlo con `WGER_LIMIT=50`
   en `.env` para probar con pocos ejercicios primero).
3. Sube imagen principal + miniatura de cada ejercicio a Supabase Storage.
4. Genera `manifest.json` (aquí en esta carpeta, y también subido al
   bucket) con el catálogo completo: nombre, categoría, músculos, equipo,
   URLs de imagen/miniatura/video, y la atribución exacta que exige la
   licencia de cada imagen.

El script es seguro de re-ejecutar: usa `upsert`, así que correrlo de nuevo
no duplica archivos, solo actualiza lo que cambió.

### 3. Revisar antes de integrar

Antes de tocar `ejercicios_repo.js`, revisa `manifest.json`: cuántos
ejercicios trajo, cómo se ven los nombres en español, y si el tamaño total
subido (se imprime al final, en MB) deja margen cómodo dentro del 1 GB
gratuito de Supabase Storage.

## Siguiente paso (no incluido en este script)

Una vez que tengas `manifest.json` generado, el siguiente paso es adaptar
`ExercisesAdapter` en `ejercicios_repo.js` para que la app lea desde este
manifest en vez del dataset anterior, y opcionalmente agregar un efecto de
cross-fade entre imagen inicial/final (cuando existan dos) para simular
movimiento sin necesidad de un GIF real.

## Atribución obligatoria

La licencia CC-BY-SA de wger exige mostrar la atribución de cada imagen
(ya viene armada en el campo `attribution.text` de cada ejercicio del
manifest). Hay que mostrarla junto a la imagen en la biblioteca visual —
puede ser un texto pequeño, no necesita ser prominente, pero debe estar
visible.
