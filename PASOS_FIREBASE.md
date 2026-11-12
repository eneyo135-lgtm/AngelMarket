# AngelMarket - conexión inicial Firebase

Este proyecto incluye `.env` con los datos de configuración web de Firebase proporcionados en la captura. Firebase se habilita automáticamente al iniciar Expo.

## En la terminal de VS Code

1. Abrir la carpeta `AngelMarket` (la que contiene `package.json`).
2. Ejecutar `npm install`.
3. Ejecutar `npx expo start --clear`.

No hace falta instalar `firebase` y `@react-native-async-storage/async-storage` por separado: ya están declarados en `package.json`.

## Pasos obligatorios en Firebase Console

1. Authentication > Sign-in method > habilitar **Email/Password**.
2. Firestore Database > Rules > copiar las reglas de `firestore.rules` y pulsar **Publish**.
3. Crear una cuenta desde AngelMarket. Comprueba Authentication > Users y Firestore > Data > `users`.
4. Publicar un local **sin foto** primero y confirmar la colección `stores`.

**Fotos:** subir fotos a la nube requiere configurar Firebase Storage y publicar `storage.rules`. En proyectos actuales el uso de Storage requiere el plan Blaze con facturación; no activarlo hasta decidirlo. Con Firestore conectado, la app deja de usar automáticamente la demostración local.

**Seguridad:** `.env` está excluido de Git por `.gitignore`. La configuración web del cliente no es una clave administrativa; proteger la base de datos depende de reglas y autenticación. No subas credenciales de cuentas de servicio.

**Validación:** un chequeo de TypeScript no verifica la conexión real con la cuenta de Firebase, que deberá probarse desde Expo.
