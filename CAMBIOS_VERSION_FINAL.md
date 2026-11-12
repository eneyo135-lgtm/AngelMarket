# AngelMarket — Versión ampliada para Yoko y Kevin

Esta versión parte del proyecto que ya probaron con Firebase Authentication, Firestore, Cloudinary y Expo. Mantiene el archivo `.env` que ya utilizaron. No compartan el ZIP públicamente ni suban `.env` a GitHub.

## Funciones incorporadas
- Pantalla de configuración accesible desde **Perfil → Configuración de cuenta**.
- Foto de perfil: se sube a Cloudinary y se guarda en el perfil de Firebase Authentication (en modo local solo se guarda como referencia en el dispositivo).
- Cambio de nombre de usuario.
- Solicitud de cambio de correo electrónico con verificación y contraseña actual.
- Cambio de contraseña con verificación de la contraseña actual.
- Preferencias locales para avisos y ubicación, e indicación de idioma.
- Edición de fotografías existentes de cada local: quitar imágenes de la galería del local y agregar otras, hasta 5 en total.
- Corrección de “1 fotos” a “1 foto”.

## Qué NO debe confundirse con terminado
- El control de preferencias de notificaciones no implementa notificaciones push reales.
- La preferencia de ubicación no altera el permiso del sistema ni deshabilita por sí sola el GPS; es una preferencia local. Los permisos del dispositivo se gestionan en Android/iOS.
- Quitar una fotografía de la galería desvincula su URL de Firestore, **no elimina** el archivo físico de Cloudinary. Esa eliminación requiere una operación de servidor autenticada, que se hará en la fase de seguridad.
- Eliminar cuenta no está habilitado desde la app: requiere diseñar el borrado seguro de locales y archivos asociados.
- Todavía falta revisar/publicar reglas de Firestore y seguridad de subidas Unsigned de Cloudinary, tal como acordamos para la siguiente fase.

## Cómo probar
1. Abrir la carpeta `AngelMarket` del ZIP en VS Code.
2. En CMD: `npm install` y luego `npx expo start --clear`.
3. Revisar Perfil → Configuración: cambiar nombre y foto; comprobar la foto de perfil al regresar.
4. Con una cuenta de prueba, verificar el cambio de contraseña y volver a iniciar sesión. Para probar cambio de correo se debe confirmar el enlace recibido en el nuevo correo.
5. Perfil → Mis locales → Editar: quitar una foto de la galería y añadir otra. Guardar y verificar el campo `imageUrls` en Firestore.
6. Probar filtros, mapa, publicaciones, edición y cierre de sesión con dos cuentas distintas.

## Validación aquí
Se verificó la sintaxis de los archivos TypeScript/TSX modificados mediante el compilador de TypeScript. No se logró instalar todas las dependencias de Expo en el entorno de comprobación por una restricción de descarga, por lo que **no está verificado el tipado completo ni la ejecución en un celular**. Es importante probar esta versión antes de entregarla como definitiva.
