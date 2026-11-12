import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { ActionButton, Notice, Screen } from "@/components/marketplace-ui";
import { colors } from "@/constants/market";
import {
  auth,
  isFirebaseConfigured,
  observeAuthState,
  signOutUser,
} from "@/lib/firebase";
import { deleteStore, getStores, type Store } from "@/lib/stores";

import { exitDemo, getDemoUser, updateDemoUser, type DemoUser } from "@/lib/demo";
import { TextInput } from "react-native";
import { updateProfile } from "firebase/auth";

export default function ProfileScreen() {
  const [user, setUser] = useState(auth?.currentUser ?? null);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [newName, setNewName] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!auth) { void getDemoUser().then(setDemoUser); return; }

    return observeAuthState(
      setUser,
      (error) => setErrorMessage(error.message),
    );
  }, []);

  const loadStores = useCallback(async () => {
    const userId = auth?.currentUser?.uid ?? (!isFirebaseConfigured ? (await getDemoUser())?.uid : null);
    if (!isFirebaseConfigured) setDemoUser(await getDemoUser());
    if (!userId) {
      setStores([]);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const allStores = await getStores();
      setStores(allStores.filter((store) => store.ownerId === userId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudieron cargar tus locales.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (auth?.currentUser) setUser({ ...auth.currentUser });
      void loadStores();
    }, [loadStores]),
  );

  async function logOut() {
    setErrorMessage("");
    try {
      if (isFirebaseConfigured) await signOutUser(); else { await exitDemo(); setDemoUser(null); }
      router.replace("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo cerrar la sesion.",
      );
    }
  }

  async function removeMyStore(store: Store) {
    if (deletingId) return;
    const userId = auth?.currentUser?.uid ?? (!isFirebaseConfigured ? demoUser?.uid : null);
    if (!userId || store.ownerId !== userId) {
      setErrorMessage("Solo puedes eliminar tus propias publicaciones.");
      return;
    }
    setDeletingId(store.id);
    setErrorMessage("");
    try {
      await deleteStore(store.id, userId);
      setStores((current) => current.filter((item) => item.id !== store.id));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo eliminar el local.");
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(store: Store) {
    const message = `¿Eliminar definitivamente «${store.name}» de AngelMarket? Se quitará de la base de datos, pero las fotos ya subidas a Cloudinary permanecerán allí.`;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(message)) void removeMyStore(store);
      return;
    }
    Alert.alert("Eliminar publicación", message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => void removeMyStore(store) },
    ]);
  }

  const activeUser = user ?? demoUser;
  async function saveName() {
    if (!newName.trim()) { setErrorMessage("Escribe un nombre."); return; }
    try {
      if (isFirebaseConfigured && auth?.currentUser) {
        await updateProfile(auth.currentUser, {displayName: newName.trim()});
        setUser({...auth.currentUser});
      } else { setDemoUser(await updateDemoUser(newName)); }
      setNewName(""); setErrorMessage("");
    } catch (e) {setErrorMessage(e instanceof Error ? e.message : "No se pudo guardar.");}
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>TU ESPACIO</Text>
        <Text style={styles.title}>Perfil</Text>

        {activeUser ? (
          <>
            <View style={styles.profileCard}>
              {user?.photoURL ? <Image style={styles.avatar} contentFit="cover" source={{uri:user.photoURL}} /> : <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(activeUser.displayName || activeUser.email || "A").slice(0, 1).toUpperCase()}
                </Text>
              </View>}
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{activeUser.displayName || "AngelMarket"}</Text>
                <Text style={styles.userEmail}>{activeUser.email}</Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>Mis locales</Text>
                <Text style={styles.sectionCaption}>
                  Administra los negocios que publicaste.
                </Text>
              </View>
              <Pressable onPress={() => router.push("/add")}>
                <Text style={styles.addLink}>+ Publicar</Text>
              </Pressable>
            </View>

            {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
            {loading ? (
              <ActivityIndicator color={colors.green} style={styles.loader} />
            ) : stores.length ? (
              <View style={styles.storeList}>
                {stores.map((store) => (
                  <Pressable
                    key={store.id}
                    onPress={() =>
                      router.push({ pathname: "/local/[id]", params: { id: store.id } })
                    }
                    style={styles.storeCard}
                  >
                    {store.imageUrls[0] ? (
                      <Image
                        contentFit="cover"
                        source={{ uri: store.imageUrls[0] }}
                        style={styles.storeImage}
                      />
                    ) : (
                      <View style={[styles.storeImage, styles.imagePlaceholder]}>
                        <Text style={styles.placeholderText}>✳</Text>
                      </View>
                    )}
                    <View style={styles.storeDetails}>
                      <Text numberOfLines={1} style={styles.storeName}>
                        {store.name}
                      </Text>
                      <Text style={styles.storeCategory}>{store.category}</Text>
                    </View>
                    <Pressable onPress={(event) => {
                      event.stopPropagation();
                      router.push({pathname: "/add", params: {edit: store.id}});
                    }} style={{padding: 9, backgroundColor: colors.greenPale, borderRadius: 10}}>
                      <Text style={{color: colors.green, fontWeight: '700'}}>Editar</Text>
                    </Pressable>
                    <Pressable
                      disabled={deletingId !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${store.name}`}
                      onPress={(event) => {
                        event.stopPropagation();
                        confirmDelete(store);
                      }}
                      style={{ padding: 9, borderRadius: 10, backgroundColor: "#FCE8E8", opacity: deletingId ? 0.5 : 1 }}
                    >
                      {deletingId === store.id
                        ? <ActivityIndicator size="small" color="#B42318" />
                        : <Text style={{ color: "#B42318", fontWeight: "700" }}>Eliminar</Text>}
                    </Pressable>
                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Todavia no tienes un local publicado.</Text>
                <ActionButton
                  label="Publicar mi primer local"
                  onPress={() => router.push("/add")}
                  variant="secondary"
                />
              </View>
            )}

            <View style={styles.accountCard}>
              <Text style={styles.sectionTitle}>Cuenta</Text>
              <Text style={styles.sectionCaption}>
                {isFirebaseConfigured ? "Tu cuenta se administra con Firebase." : "Modo demostracion: perfil y locales solo en este dispositivo."}
              </Text>
              <TextInput placeholder="Cambiar nombre de perfil" value={newName} onChangeText={setNewName} style={{backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12}} />
              <ActionButton label="Guardar nombre" onPress={() => void saveName()} variant="secondary" />
              <ActionButton label="Configuración de cuenta" onPress={() => router.push("/settings")} variant="secondary" />
              <ActionButton label="Cerrar sesion" onPress={() => void logOut()} variant="secondary" />
            </View>
          </>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <Text style={styles.guestIconText}>A</Text>
            </View>
            <Text style={styles.guestTitle}>Inicia sesion para tu perfil</Text>
            <Text style={styles.guestDescription}>
              Guarda tus datos y administra los locales de tu negocio desde aqui.
            </Text>
            {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
            <ActionButton label="Iniciar sesion" onPress={() => router.push("/")} />
            {!isFirebaseConfigured ? (
              <Notice message="Puedes crear una cuenta local de demostracion desde la pantalla de inicio." />
            ) : null}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "800",
    marginTop: -13,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.greenPale,
  },
  avatarText: {
    color: colors.green,
    fontSize: 24,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
    gap: 5,
  },
  userName: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  userEmail: {
    color: colors.muted,
    fontSize: 12,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionCaption: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  addLink: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
  },
  loader: {
    marginTop: 12,
  },
  storeList: {
    gap: 10,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 11,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  storeImage: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.greenPale,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.green,
    fontSize: 26,
  },
  storeDetails: {
    flex: 1,
    gap: 4,
  },
  storeName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  storeCategory: {
    color: colors.green,
    fontSize: 11,
  },
  arrow: {
    color: colors.muted,
    fontSize: 25,
    paddingHorizontal: 5,
  },
  emptyCard: {
    gap: 12,
    padding: 16,
    borderRadius: 17,
    backgroundColor: colors.white,
  },
  emptyTitle: {
    color: colors.muted,
    fontSize: 13,
  },
  accountCard: {
    gap: 11,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  guestCard: {
    gap: 14,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  guestIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.greenPale,
  },
  guestIconText: {
    color: colors.green,
    fontSize: 24,
    fontWeight: "800",
  },
  guestTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  guestDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
