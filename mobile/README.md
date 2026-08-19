# 📱 FitPro Suite Pro — Aplicación Móvil para Atletas (Android APK & iOS)

Aplicación móvil desarrollada con **React Native** y **Expo**, diseñada para que los clientes y atletas de los gimnasios y entrenadores gestionen sus rutinas, registren sus comidas y sigan su progreso en tiempo real con sincronización directa a **Supabase Cloud**.

---

## 🏗️ Estructura del Proyecto Móvil

```
mobile/
├── App.js                  # Entry point con navegación por pestañas y Auth Provider
├── app.json                # Configuración de Expo y paquete Android (com.fitprosuite.athlete)
├── eas.json                # Configuración de compilación para generar el APK directo
├── package.json            # Dependencias de React Native, Expo y Supabase JS
├── babel.config.js         # Configuración del compilador Babel
└── src/
    ├── services/
    │   └── supabase.js     # Cliente Supabase configurado con AsyncStorage
    └── screens/
        ├── LoginScreen.js  # Acceso con correo y contraseña asignados por el coach
        ├── HomeScreen.js   # Dashboard del atleta con rutina activa y métricas
        ├── WorkoutScreen.js# Ejecutor de entrenamientos con cronómetro de descansos
        ├── NutritionScreen.js # Pauta de comidas, macronutrientes e hidratación
        └── ProfileScreen.js# Expediente, medidas corporales y cierre de sesión
```

---

## 🚀 Cómo Ejecutar la Aplicación en Desarrollo

1. Abre una terminal dentro de la carpeta `mobile/`:
   ```bash
   cd mobile
   npm install
   ```

2. Inicia el servidor de desarrollo de Expo:
   ```bash
   npx expo start
   ```

3. Escanea el código QR desde tu teléfono con la aplicación **Expo Go** (disponible en Google Play Store y App Store) o presiona `a` para abrir en el emulador de Android.

---

## 📦 Cómo Compilar el Archivo APK de Android

Para generar el archivo instalable **`.apk`** directamente para tus atletas:

1. Instala el CLI oficial de EAS (si no lo tienes instalado globalmente):
   ```bash
   npm install -g eas-cli
   ```

2. Inicia sesión en tu cuenta de Expo:
   ```bash
   eas login
   ```

3. Ejecuta el comando de compilación de APK (perfil `preview` configurado en `eas.json`):
   ```bash
   eas build -p android --profile preview
   ```

4. Al finalizar la compilación en la nube de Expo, obtendrás un enlace directo para descargar el archivo `.apk` e instalarlo en cualquier dispositivo Android.

---

## 🔐 Conexión con el Panel del Entrenador
- Cuando el entrenador registra a un atleta en el panel web de **FitPro Suite Pro** e ingresa su **correo** y **contraseña**, el sistema crea automáticamente el usuario en **Supabase Auth** y lo vincula a la tabla `clients`.
- El atleta puede abrir la app móvil e iniciar sesión inmediatamente con esas credenciales exactas.
