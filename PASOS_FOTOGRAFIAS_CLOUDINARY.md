# Configurar fotografias en AngelMarket (Yoko y Kevin)

Firebase Authentication y Firestore siguen funcionando como antes. Las imagenes se suben a Cloudinary y sus URLs se guardan en Firestore, campo `stores.imageUrls`.

1. Crea una cuenta gratuita en https://cloudinary.com/ (sin introducir tarjeta).
2. En la consola de Cloudinary, busca el **Cloud name** y copialo.
3. En **Settings > Upload > Upload presets**, crea un preset y elige **Unsigned**. Nombre sugerido: `angelmarket_unsigned`.
4. Restringe formatos a jpg/jpeg/png/webp en el preset; usa una carpeta separada para el proyecto, sin permitir sobrescribir imagenes. Recuerda que un preset unsigned no es privado y es apropiado para una demo, no para produccion publica sin controles adicionales.
5. Abre `.env` y rellena estas DOS lineas:

```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_preset_unsigned
```

6. Desde CMD en la carpeta del proyecto:

```
npm install
npx expo start --clear
```

7. Prueba crear un nuevo local con una foto. Revisa en Firebase > Firestore > stores > documento > imageUrls que aparezca una direccion https://res.cloudinary.com/...
8. Edita un local para agregar fotos adicionales (maximo 5 por local).

**Importante:** no incluyas API Secret de Cloudinary ni claves privadas de administrador en la app. El preset unsigned se puede encontrar dentro de la app: restringe los formatos y monitorea el uso. Este flujo es para la demo escolar. Para publicar a usuarios reales, recomendamos una funcion backend autenticada con subidas firmadas y validacion por usuario, o un servicio con reglas de subida autenticadas. Si falla la subida, la app muestra error tras un maximo de unos 30 segundos. Las fotos subidas a Cloudinary antes de un fallo posterior de Firestore pueden requerir limpieza manual.
