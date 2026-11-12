# Corrección de subida de fotos en Expo

El error `Unsupported FormDataPart implementation` ocurría porque el código intentaba enviar `{ uri, type, name }` como si fuera un Blob. Expo SDK 58 espera un archivo compatible con FormData.

## Pasos para Yoko y Kevin
1. Descomprime este ZIP en una **carpeta nueva** y abre `AngelMarket` en VS Code.
2. Ejecuta `npm install` en CMD.
3. Ejecuta `npx expo start --clear`.
4. Entra a AngelMarket y prueba publicar un negocio nuevo con **una foto pequeña**.
5. Comprueba en Cloudinary > Assets que aparece la foto y en Firebase > Firestore > `stores` que `imageUrls` contiene una URL HTTPS.

Configura las variables de Firebase y Cloudinary en un archivo `.env` local. No subas `.env` a GitHub. **No se debe incluir API Secret de Cloudinary en el proyecto.**

Si aparece un error diferente, comparte una captura del mensaje y de la terminal. El cambio de código pasó revisión estática, pero la subida real debe probarse en el teléfono.

**Nota de seguridad:** los presets unsigned son aptos para prototipos, pero para una app pública conviene poner límites de subida y autenticar/autorizar cargas mediante backend.
