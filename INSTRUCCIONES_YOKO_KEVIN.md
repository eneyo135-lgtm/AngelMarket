# AngelMarket — versión de prueba local

Proyecto React Native / Expo basado en el documento «App bustamante.pdf».

## Cómo ejecutar

1. Abre esta carpeta en VS Code.
2. En la terminal ejecuta `npm install`.
3. Ejecuta `npx expo start --clear`.
4. Prueba en Expo Go o con `w` para abrir la versión web.

## Modo de demostración sin base de datos

- **No crees un archivo `.env` real** todavía: la aplicación detecta la ausencia de configuración Firebase y utiliza almacenamiento local (`AsyncStorage`).
- En Inicio, crea un perfil de prueba con nombre, correo y contraseña de ejemplo (la contraseña **no se comprueba ni se almacena** en modo local; no uses una contraseña real).
- Desde **Publicar**, añade un local, dirección, categoría, horario, descripción, correo, fotos y ubicación GPS.
- En **Explorar**, búscalo por texto o filtra por categoría.
- En **Mapa**, aparecerá un pin cuando el local tenga coordenadas y el dispositivo pueda mostrar mapas.
- En **Perfil**, abre el botón **Editar** de tu negocio y actualiza sus datos, o cambia el nombre de tu perfil.
- En el detalle, prueba fotos, correo y el botón para rutas de Google Maps.
- El modo local es **por dispositivo/navegador**: los locales no se comparten entre computadoras. Las fotos elegidas se guardan como URIs locales y algunas pueden dejar de funcionar tras borrar la caché o reinstalar la app. Para almacenamiento permanente de imágenes se requiere Firebase Storage u otra solución de archivos.

## Conexión futura a Firebase

1. Crea un proyecto en Firebase y activa **Authentication (Email/Password)**, **Firestore** y **Storage**.
2. Copia `.env.example` a `.env`, llena sus valores y reinicia Expo.
3. Revisa y publica `firestore.rules` y `storage.rules` en Firebase.
4. Al detectar una configuración completa, la app usa Firebase en vez del almacenamiento local para usuarios y locales.
5. Los datos locales de prueba **no se migran automáticamente**. No subas `.env` a GitHub.

## Qué incluye y qué falta verificar

Incluye pantallas de acceso/registro, búsqueda y categorías, mapa nativo, detalle y galería de local, publicar con cámara/galería/GPS, perfil y edición de negocios, modo local sin Firebase y código para conectar Firebase después.

No se pudo probar con un dispositivo físico ni validar una conexión real con Firebase desde este entorno. El mapa y GPS dependen de los permisos y capacidades del dispositivo; Google Maps externo requiere internet. La exportación web no pudo completarse en la prueba automática. La configuración avanzada del perfil (cambio de correo/contraseña, borrar cuenta, notificaciones reales, cambio de idioma y foto de perfil persistente), eliminación de negocios y la selección manual de coordenadas sobre el mapa quedan fuera de este prototipo; no se deben presentar como funciones terminadas.

## Pruebas recomendadas

1. Abrir Expo sin errores.
2. Crear perfil local, cerrar sesión y volver a entrar.
3. Publicar negocio con y sin fotos.
4. Comprobar filtros y búsqueda por nombre.
5. Fijar GPS y verificar el marcador en el mapa.
6. Abrir detalles, rutas y correo de contacto.
7. Editar un negocio desde Perfil, volver a buscarlo y comprobar los cambios.
8. Reiniciar Expo y comprobar qué datos locales persisten.
9. Repetir pruebas después de conectar Firebase.
