import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Store } from "@/lib/stores";
import type { MapRegion } from "./interactive-map";
import { colors } from "@/constants/market";

type InteractiveMapProps = {
  region: MapRegion;
  stores: Store[];
  onSelect: (store: Store) => void;
  onRegionChange: (region: MapRegion) => void;
  showsUserLocation: boolean;
};

export default function InteractiveMap({ stores, onSelect }: InteractiveMapProps) {
  return (
    <View style={styles.webMap}>
      <View style={styles.grid} />
      <View style={styles.mapMessage}>
        <Text style={styles.mapIcon}>◎</Text>
        <Text style={styles.mapTitle}>Abre AngelMarket en tu celular</Text>
        <Text style={styles.mapDescription}>
          El mapa interactivo y tu ubicacion estan disponibles en iOS y Android.
        </Text>
      </View>
      {stores.length > 0 && (
        <View style={styles.list}>
          {stores.map((store) => (
            <Pressable
              key={store.id}
              onPress={() => onSelect(store)}
              style={styles.storeButton}
            >
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeCategory}>{store.category}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    minHeight: 420,
    overflow: "hidden",
    justifyContent: "center",
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#E8EEE5",
  },
  grid: {
    ...StyleSheet.absoluteFill,
    opacity: 0.38,
    borderTopWidth: 48,
    borderBottomWidth: 74,
    borderLeftWidth: 108,
    borderRightWidth: 84,
    borderColor: "#FFFFFF",
  },
  mapMessage: {
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  mapIcon: {
    color: colors.green,
    fontSize: 32,
  },
  mapTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
  },
  mapDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },
  list: {
    gap: 7,
    marginTop: 10,
  },
  storeButton: {
    padding: 12,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  storeName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  storeCategory: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
});
