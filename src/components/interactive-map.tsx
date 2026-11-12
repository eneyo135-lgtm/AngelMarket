import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";
import type { Store } from "@/lib/stores";

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type InteractiveMapProps = {
  region: MapRegion;
  stores: Store[];
  onSelect: (store: Store) => void;
  onRegionChange: (region: MapRegion) => void;
  showsUserLocation: boolean;
};

export default function InteractiveMap({
  region,
  stores,
  onSelect,
  onRegionChange,
  showsUserLocation,
}: InteractiveMapProps) {
  return (
    <MapView
      accessibilityLabel="Mapa de locales cercanos"
      onRegionChangeComplete={onRegionChange}
      region={region}
      showsCompass
      showsUserLocation={showsUserLocation}
      style={styles.map}
    >
      {stores.map((store) =>
        store.coordinates ? (
          <Marker
            coordinate={store.coordinates}
            key={store.id}
            onCalloutPress={() => onSelect(store)}
            onPress={() => onSelect(store)}
            pinColor="#1E6B4E"
            title={store.name}
            description={store.category}
          />
        ) : null,
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
