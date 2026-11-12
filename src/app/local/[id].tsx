import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { ActionButton, Notice, Screen } from "@/components/marketplace-ui";
import { colors } from "@/constants/market";
import { getStoreById, type Store } from "@/lib/stores";

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStore() {
      setLoading(true);
      setErrorMessage("");
      try {
        const result = await getStoreById(id);
        if (active) {
          setStore(result);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "No se pudo cargar este local.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStore();
    return () => {
      active = false;
    };
  }, [id]);

  async function openDirections() {
    if (!store?.coordinates) {
      setErrorMessage("Este local todavia no tiene una ubicacion guardada.");
      return;
    }

    const { latitude, longitude } = store.coordinates;
    await Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    );
  }

  async function contactStore() {
    if (!store?.contactEmail) {
      setErrorMessage("El negocio no agrego un correo de contacto.");
      return;
    }

    await Linking.openURL(`mailto:${store.contactEmail}`);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Volver" onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Detalle del local</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.green} style={styles.loader} />
      ) : errorMessage && !store ? (
        <View style={styles.errorContainer}>
          <Notice message={errorMessage} variant="error" />
          <ActionButton label="Volver" onPress={() => router.back()} variant="secondary" />
        </View>
      ) : !store ? (
        <View style={styles.errorContainer}>
          <Text style={styles.notFound}>No encontramos este local.</Text>
          <ActionButton
            label="Volver a explorar"
            onPress={() => router.replace("/explore")}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScrollView
            contentContainerStyle={styles.gallery}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {store.imageUrls.length ? (
              store.imageUrls.map((imageUrl) => (
                <Image
                  contentFit="cover"
                  key={imageUrl}
                  source={{ uri: imageUrl }}
                  style={styles.heroImage}
                />
              ))
            ) : (
              <View style={[styles.heroImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderIcon}>✳</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.metaRow}>
            <Text style={styles.category}>{store.category}</Text>
            <Text style={styles.galleryCount}>
              {store.imageUrls.length ? `${store.imageUrls.length} ${store.imageUrls.length === 1 ? "foto" : "fotos"}` : "Local"}
            </Text>
          </View>
          <Text style={styles.title}>{store.name}</Text>
          <Text style={styles.address}>◎  {store.address || "Direccion por confirmar"}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre el local</Text>
            <Text style={styles.description}>
              {store.description || "Este negocio todavia no agrego una descripcion."}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Horario</Text>
            <Text style={styles.description}>
              {store.hours || "Consulta directamente con el negocio."}
            </Text>
          </View>

          {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
          <View style={styles.actions}>
            <ActionButton label="Como llegar" onPress={() => void openDirections()} />
            <ActionButton
              label="Contactar"
              onPress={() => void contactStore()}
              variant="secondary"
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  back: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  backText: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 31,
  },
  headerTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 15,
  },
  loader: {
    marginTop: 50,
  },
  errorContainer: {
    padding: 20,
    gap: 14,
  },
  notFound: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
  },
  gallery: {
    gap: 10,
  },
  heroImage: {
    width: 330,
    height: 250,
    borderRadius: 23,
    backgroundColor: colors.greenPale,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    color: colors.green,
    fontSize: 48,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  category: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: colors.greenPale,
  },
  galleryCount: {
    color: colors.muted,
    fontSize: 11,
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "800",
    marginTop: -7,
  },
  address: {
    color: colors.green,
    fontSize: 13,
  },
  section: {
    gap: 7,
    paddingTop: 7,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
});
