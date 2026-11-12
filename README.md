# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## AngelMarket

AngelMarket is a mobile directory for discovering neighborhood shops, searching by
category, viewing locations on a map, and publishing a business profile with photos.
The app uses Firebase Authentication, Cloud Firestore, and Cloud Storage.

### Connect Firebase

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. In **Project settings**, add a **Web app** (`</>`) and copy its Firebase config.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Create a **Cloud Firestore** database.
5. Create a **Cloud Storage** bucket. Firebase may require the project to use the
   Blaze billing plan for Cloud Storage.
6. Copy `.env.example` to `.env` and fill in the six values from the Firebase web
   app config. Keep the `EXPO_PUBLIC_FIREBASE_` prefixes unchanged.
7. In the Firebase Console, open **Firestore → Rules** and publish the contents
   of [`firestore.rules`](./firestore.rules). Then open **Storage → Rules** and
   publish [`storage.rules`](./storage.rules).
8. Restart Expo so it reads the new environment variables:

   ```sh
   npx expo start -c
   ```

The Firebase web config is included in the app bundle; it is not a server
credential. Never put a Firebase service-account key in this app. Access is
controlled by Authentication and the Firestore/Storage rules above.

The app reads public documents from the `stores` collection. Each store has
`ownerId`, `name`, `category`, `description`, `address`, `coordinates`,
`imageUrls`, `contactEmail`, and `hours` fields. User profiles are stored in the
`users` collection. Store photos are uploaded to `stores/{userId}/` in Cloud
Storage. A store's `contactEmail` is optional and is only shared when the owner
chooses to provide a public contact address.

### Main screens

- **Explore:** search and filter stores; optionally sort them by device location.
- **Map:** show store pins and open turn-by-turn directions in Google Maps.
- **Publish:** create a store listing, add photos from the camera/gallery, and
  save its current location.
- **Profile:** view the signed-in account and its published stores.

The native map runs in Expo Go on iOS and Android. A production Android build
needs a Google Maps API key restricted to the app; see the
[Expo maps deployment guide](https://docs.expo.dev/versions/v58.0.0/sdk/map-view.md#deploy-app-with-google-maps).
The web build shows a mobile-map notice instead of loading the native map view.
