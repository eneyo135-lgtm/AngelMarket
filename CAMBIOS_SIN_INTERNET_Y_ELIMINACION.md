# AngelMarket — Corrección de conexión y eliminación de publicaciones

## Cambios
- En **Perfil → Mis locales** aparece **Eliminar** junto a cada local propio. Solicita confirmación antes de borrarlo, verifica la sesión y el propietario y elimina el documento de Firestore. Las reglas `firestore.rules` existentes también impiden eliminar documentos ajenos. En modo demostración, elimina el local del almacenamiento del dispositivo.
- **Explorar, Mapa, Perfil y Detalles** presentan un error cuando falla la conexión en lugar de esperar indefinidamente. Se comprueba acceso a Internet antes de consultar Firestore y se limita la espera de las consultas a 12 segundos.
- La **publicación, edición y eliminación** comprueban Internet antes de enviar los cambios y muestran un aviso si no hay conexión.
- La subida de fotos de Cloudinary ya tenía un límite de espera de 30 segundos; se conserva.
- Se maneja un fallo al cargar un negocio en el formulario de edición.

## Importante
- Eliminar una publicación **no elimina los archivos de Cloudinary**: el negocio y sus enlaces desaparecen de Firestore, pero las imágenes almacenadas pueden quedar en Cloudinary.
- La aplicación **no funciona sin conexión**: mostrará un mensaje y permitirá reintentar al regresar Internet. No se implementa caché ni sincronización automática.
- Si Internet se pierde exactamente después de iniciar una escritura de Firestore, el límite de espera evita la carga infinita, pero es posible que una escritura pendiente se confirme más tarde cuando vuelva la conexión. Comprueba el documento antes de repetir una publicación para evitar duplicados.
- No se han modificado las reglas publicadas ni las credenciales de Firebase o Cloudinary.
- Prueba en Expo Go con dos cuentas distintas para verificar los permisos de eliminación y la detección de conexión.

## Ejecución
En la carpeta `AngelMarket`:

```cmd
npm install
npx expo start --clear
```

## Pruebas recomendadas
1. Con Internet, entra con el propietario. En Perfil → Mis locales, pulsa Eliminar, cancela y confirma que sigue el negocio.
2. Pulsa de nuevo Eliminar y confirma. Verifica que desaparece de Explorar, Mapa y de la colección `stores` en Firestore.
3. Entra con otra cuenta y comprueba que únicamente aparecen sus propios locales como administrables.
4. Desactiva Wi-Fi y datos móviles, abre Explorar o Perfil y comprueba que sale un mensaje de conexión en lugar de quedar girando.
5. Prueba a publicar sin Internet y verifica que no se publica; vuelve a activar Internet y prueba normalmente.
