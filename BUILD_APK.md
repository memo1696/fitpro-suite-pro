# 📦 Compilación y Generación del APK de Android (TWA / Bubblewrap)

Este repositorio incluye toda la configuración necesaria para compilar y empaquetar **FitPro Suite Pro** como un archivo instalable **APK firmado de Android (`android-app-release.apk`)**.

---

## 🛠️ Opción 1: Compilación Automatizada en GitHub Actions (Recomendada)

El repositorio cuenta con el flujo de trabajo CI/CD configurado en `.github/workflows/build-apk.yml`.

1. Haz un **Push** a la rama `main` o ejecuta el flujo manualmente desde la pestaña **Actions** en GitHub (*"Build Android APK (TWA Bubblewrap)"* -> *"Run workflow"*).
2. El runner de GitHub configurará automáticamente JDK 17, Node.js y Android SDK, compilará el APK firmado con Bubblewrap y lo subirá como un artefacto descargable: **`android-app-release`**.
3. Descarga el archivo `.apk` y colócalo en la raíz del hosting para habilitar la descarga directa desde el botón de la app.

---

## 💻 Opción 2: Compilación Local en tu Computadora (CLI)

Si deseas generar el APK localmente en tu equipo:

### Requisitos Previos:
- **Node.js** (v18+)
- **Java Development Kit (JDK 17+)**
- **Android SDK / Command Line Tools**

### Pasos:

1. **Instala Bubblewrap CLI globalmente**:
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Inicializa el proyecto TWA desde el manifest**:
   ```bash
   bubblewrap init --manifest=./manifest.json
   ```

3. **Compila el APK firmado para producción**:
   ```bash
   bubblewrap build
   ```

4. Se generará el archivo `app-release-signed.apk`. Renómbralo como **`android-app-release.apk`** y distribúyelo a tus atletas o entrenadores.

---

## 📱 Opción 3: Compilación de la App Nativa React Native (Expo)

También cuentas con el módulo móvil nativo en la carpeta `mobile/` configurado con EAS Build:

```bash
cd mobile
npm install
eas build -p android --profile preview
```
Al finalizar la compilación en la nube de Expo, obtendrás el enlace directo de descarga del archivo APK.
