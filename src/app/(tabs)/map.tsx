import { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import InteractiveMap, { type MapRegion } from "@/components/interactive-map";
import { Notice, Screen } from "@/components/marketplace-ui";
import { colors } from "@/constants/market";
import { getStores, type Store } from "@/lib/stores";

const defaultRegion: MapRegion = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.035,
  longitudeDelta: 0.035,
};

export default function MapScreen() {
  const [region, setRegion] = useState(defaultRegion);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status === "granted") {
        setLocationGranted(true);
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        });
      } else {
        setLocationGranted(false);
        setErrorMessage("Activa la ubicacion para centrar el mapa en tu zona.");
      }

      setStores(await getStores());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudieron cargar los datos del mapa.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const activeSelectedStore = stores.find((store) => store.id === selectedStore?.id) ?? null;

  async function openDirections(store: Store) {
    if (!store.coordinates) {
      setErrorMessage("Este local todavia no tiene una ubicacion guardada.");
      return;
    }

    const { latitude, longitude } = store.coordinates;
    await Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    );
  }

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DESCUBRE TU ZONA</Text>
            <Text style={styles.title}>Mapa de locales</Text>
          </View>
          <Text style={styles.count}>{stores.length} locales</Text>
        </View>

        {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
        <View style={styles.mapFrame}>
          <InteractiveMap
            onSelect={(store) => setSelectedStore(store)}
            onRegionChange={setRegion}
            region={region}
            showsUserLocation={locationGranted}
            stores={stores}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={colors.green} />
            </View>
          )}
          {activeSelectedStore ? (
            <View style={styles.selectedCard}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/local/[id]",
                    params: { id: activeSelectedStore.id },
                  })
                }
                style={styles.selectedDetails}
              >
                <Text numberOfLines={1} style={styles.selectedName}>
                  {activeSelectedStore.name}
                </Text>
                <Text numberOfLines={1} style={styles.selectedCategory}>
                  {activeSelectedStore.category} ·{" "}
                  {activeSelectedStore.address || "Direccion por confirmar"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Como llegar"
                onPress={() => void openDirections(activeSelectedStore)}
                style={styles.directionsButton}
              >
                <Text style={styles.directionsText}>Ir</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.mapHint}>
          <Text style={styles.hintIcon}>◎</Text>
          <Text style={styles.hintText}>
            Toca un marcador para ver los detalles del negocio y como llegar.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  count: {
    color: colors.green,
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.greenPale,
  },
  mapFrame: {
    flex: 1,
    minHeight: 300,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: "#E8EEE5",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247, 246, 240, 0.55)",
  },
  selectedCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    elevation: 3,
  },
  selectedDetails: {
    flex: 1,
    gap: 4,
  },
  selectedName: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  selectedCategory: {
    color: colors.muted,
    fontSize: 11,
  },
  directionsButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.green,
  },
  directionsText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  mapHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.greenPale,
  },
  hintIcon: {
    color: colors.green,
    fontSize: 20,
    fontWeight: "700",
  },
  hintText: {
    flex: 1,
    color: colors.greenDark,
    fontSize: 12,
    lineHeight: 17,
  },
});
