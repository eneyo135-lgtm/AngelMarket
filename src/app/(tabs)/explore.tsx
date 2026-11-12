import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import * as Location from "expo-location";
import { ActionButton, Notice, Screen } from "@/components/marketplace-ui";
import { categories, colors } from "@/constants/market";
import { isFirebaseConfigured } from "@/lib/firebase";
import { getStores, type Store } from "@/lib/stores";

function distanceBetween(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(first.latitude)) *
      Math.cos(radians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export default function DiscoverScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todo");
  const [loading, setLoading] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setStores(await getStores());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudieron cargar los locales.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStores();
    }, [loadStores]),
  );

  const visibleStores = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchingStores = stores.filter((store) => {
      const matchesCategory =
        selectedCategory === "Todo" || store.category === selectedCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${store.name} ${store.category} ${store.description} ${store.address}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    if (!location) {
      return matchingStores;
    }

    return matchingStores.sort((first, second) => {
      if (!first.coordinates) return 1;
      if (!second.coordinates) return -1;
      return (
        distanceBetween(location, first.coordinates) -
        distanceBetween(location, second.coordinates)
      );
    });
  }, [location, query, selectedCategory, stores]);

  async function findNearby() {
    setErrorMessage("");
    setLoadingLocation(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setErrorMessage("Permite el acceso a tu ubicacion para ordenar los locales cercanos.");
        return;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentPosition.coords);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo obtener tu ubicacion.",
      );
    } finally {
      setLoadingLocation(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>ANGELMARKET</Text>
            <Text style={styles.greeting}>Explora tu barrio</Text>
          </View>
          <Pressable
            accessibilityLabel="Abrir perfil"
            onPress={() => router.push("/profile")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>A</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>
          Encuentra algo{"\n"}
          <Text style={styles.titleAccent}>especial cerca de ti.</Text>
        </Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Buscar locales y productos"
            onChangeText={setQuery}
            placeholder="Busca locales, productos..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
          />
          <Pressable
            accessibilityLabel="Ordenar por cercania"
            disabled={loadingLocation}
            onPress={() => void findNearby()}
            style={styles.locationButton}
          >
            {loadingLocation ? (
              <ActivityIndicator color={colors.green} size="small" />
            ) : (
              <Text style={styles.locationIcon}>◎</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <Text style={styles.sectionCaption}>Toca para filtrar</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.categoryRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.activeCategoryChip,
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.activeCategoryText,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Locales cerca</Text>
            <Text style={styles.sectionCaption}>
              {location ? "Ordenados por distancia" : "Negocios de tu comunidad"}
            </Text>
          </View>
          <Pressable onPress={() => router.push("/map")}>
            <Text style={styles.mapLink}>Ver mapa  →</Text>
          </Pressable>
        </View>

        {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
        {!isFirebaseConfigured && (
          <Notice message="Configura Firebase para cargar y publicar los locales de tu zona." />
        )}

        {loading ? (
          <ActivityIndicator color={colors.green} style={styles.loader} />
        ) : visibleStores.length > 0 ? (
          <View style={styles.storeList}>
            {visibleStores.map((store) => (
              <Pressable
                accessibilityRole="button"
                key={store.id}
                onPress={() =>
                  router.push({ pathname: "/local/[id]", params: { id: store.id } })
                }
                style={({ pressed }) => [styles.storeCard, pressed && styles.pressedCard]}
              >
                {store.imageUrls[0] ? (
                  <Image
                    contentFit="cover"
                    source={{ uri: store.imageUrls[0] }}
                    style={styles.storeImage}
                    transition={150}
                  />
                ) : (
                  <View style={[styles.storeImage, styles.imagePlaceholder]}>
                    <Text style={styles.placeholderIcon}>✳</Text>
                  </View>
                )}
                <View style={styles.storeDetails}>
                  <View style={styles.storeMeta}>
                    <Text style={styles.storeCategory}>{store.category}</Text>
                    <Text style={styles.openBadge}>LOCAL</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.storeName}>
                    {store.name}
                  </Text>
                  <Text numberOfLines={2} style={styles.storeDescription}>
                    {store.description || store.address || "Conoce este negocio local."}
                  </Text>
                  <Text numberOfLines={1} style={styles.storeAddress}>
                    {store.address || "Ubicacion por confirmar"}
                  </Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>⌕</Text>
            </View>
            <Text style={styles.emptyTitle}>
              {stores.length === 0 ? "Tu barrio esta por descubrirse" : "No encontramos resultados"}
            </Text>
            <Text style={styles.emptyDescription}>
              {stores.length === 0
                ? "Cuando un negocio publique su local, aparecera aqui."
                : "Prueba con otra busqueda o categoria."}
            </Text>
            {stores.length === 0 ? (
              <ActionButton
                label="Publicar un local"
                onPress={() => router.push("/add")}
                variant="secondary"
              />
            ) : null}
          </View>
        )}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteText}>Hecho con cariño para el comercio local</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  greeting: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenPale,
  },
  avatarText: {
    color: colors.green,
    fontSize: 16,
    fontWeight: "800",
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 33,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  titleAccent: {
    color: colors.green,
  },
  searchBox: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  searchIcon: {
    color: colors.green,
    fontSize: 25,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 12,
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenPale,
  },
  locationIcon: {
    color: colors.green,
    fontSize: 22,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: -8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "800",
  },
  sectionCaption: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  categoryRow: {
    gap: 9,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  activeCategoryChip: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  categoryText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  activeCategoryText: {
    color: colors.white,
  },
  mapLink: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "700",
  },
  loader: {
    marginTop: 36,
  },
  storeList: {
    gap: 12,
  },
  storeCard: {
    minHeight: 128,
    flexDirection: "row",
    alignItems: "center",
    padding: 11,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressedCard: {
    opacity: 0.8,
  },
  storeImage: {
    width: 92,
    height: 104,
    borderRadius: 15,
    backgroundColor: colors.greenPale,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    color: colors.green,
    fontSize: 32,
  },
  storeDetails: {
    flex: 1,
    paddingHorizontal: 12,
    gap: 5,
  },
  storeMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeCategory: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "700",
  },
  openBadge: {
    color: "#93602E",
    backgroundColor: "#FFF1D8",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 8,
    fontWeight: "800",
  },
  storeName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
  },
  storeDescription: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  storeAddress: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "600",
  },
  cardArrow: {
    color: colors.muted,
    fontSize: 24,
    paddingHorizontal: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 25,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    gap: 12,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenPale,
  },
  emptyIconText: {
    color: colors.green,
    fontSize: 30,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  bottomNote: {
    alignItems: "center",
    paddingTop: 4,
  },
  bottomNoteText: {
    color: colors.muted,
    fontSize: 11,
  },
});
