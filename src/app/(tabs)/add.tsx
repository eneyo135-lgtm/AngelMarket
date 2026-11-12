import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ActionButton, Notice, Screen, TextField } from "@/components/marketplace-ui";
import { categories, colors } from "@/constants/market";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { createStore, getStoreById, updateStore } from "@/lib/stores";
import { getDemoUser } from "@/lib/demo";

const localCategories = categories.filter((category) => category !== "Todo");

export default function AddStoreScreen() {
  const { edit } = useLocalSearchParams<{edit?: string}>();
  const [demoOwnerId, setDemoOwnerId] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    void getDemoUser().then(u => { if(active) setDemoOwnerId(u?.uid ?? null); });
    if (edit) void getStoreById(edit).then(store => {
      if (!active || !store) return;
      setName(store.name); setCategory(store.category); setDescription(store.description);
      setAddress(store.address); setContactEmail(store.contactEmail);
      setHours(store.hours); setCoordinates(store.coordinates); setExistingPhotos(store.imageUrls);
    }).catch(error => {
      if (active) setErrorMessage(error instanceof Error ? error.message : "No se pudo cargar el local.");
    });
    return () => {active = false;};
  }, [edit]));
  const [name, setName] = useState("");
  const [category, setCategory] = useState(localCategories[0]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [hours, setHours] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function addPhotos(source: "camera" | "gallery") {
    setErrorMessage("");
    try {
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setErrorMessage("Permite el acceso a la camara para tomar fotos del local.");
          return;
        }

        if (photos.length + existingPhotos.length >= 5) { setErrorMessage("Solo puedes guardar hasta 5 fotografias."); return; }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.75,
        });
        if (!result.canceled && result.assets[0]) {
          setPhotos((current) => [...current, result.assets[0]].slice(0, Math.max(0, 5 - existingPhotos.length)));
        }
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Permite el acceso a tus fotos para agregarlas al local.");
        return;
      }

      if (photos.length + existingPhotos.length >= 5) { setErrorMessage("Solo puedes guardar hasta 5 fotografias."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 5 - photos.length - existingPhotos.length,
        quality: 0.75,
      });
      if (!result.canceled) {
        setPhotos((current) => [...current, ...result.assets].slice(0, Math.max(0, 5 - existingPhotos.length)));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudieron seleccionar las fotos.",
      );
    }
  }

  async function setCurrentLocation() {
    setErrorMessage("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Permite el acceso a la ubicacion para fijar el local en el mapa.");
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo obtener la ubicacion del local.",
      );
    }
  }

  async function submit() {
    setErrorMessage("");
    setSuccessMessage("");
    const user = auth?.currentUser;
    const ownerId = user?.uid ?? (!isFirebaseConfigured ? (await getDemoUser())?.uid : null);

    if (!ownerId) {
      setErrorMessage("Inicia sesion para registrar un local.");
      return;
    }
    if (!name.trim() || !description.trim() || !address.trim()) {
      setErrorMessage("Completa el nombre, la descripcion y la direccion del local.");
      return;
    }

    setLoading(true);
    try {
      const draft = {
          ownerId,
          name: name.trim(),
          category,
          description: description.trim(),
          address: address.trim(),
          coordinates,
          contactEmail: contactEmail.trim(),
          hours: hours.trim(),
        };
      const attachments = photos.map(({ uri, mimeType }) => ({ uri, mimeType }));
      if (edit) {
        const { ownerId: _owner, ...fields } = draft;
        await updateStore(edit, ownerId, fields, attachments, existingPhotos);
      } else {
        await createStore(draft, attachments);
      }
      setSuccessMessage(edit ? "Tu local se actualizo." : "Tu local se publico correctamente.");
      setName("");
      setDescription("");
      setAddress("");
      setHours("");
      setCoordinates(null);
      setPhotos([]);
      setExistingPhotos([]);
      router.replace("/explore");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo publicar el local.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>CRECE CON TU COMUNIDAD</Text>
        <Text style={styles.title}>{edit ? "Editar mi local" : "Publica tu local"}</Text>
        <Text style={styles.subtitle}>
          Comparte lo que vendes y ayuda a tus vecinos a encontrarte.
        </Text>

        {!(auth?.currentUser || demoOwnerId) ? (
          <View style={styles.loginCard}>
            <Text style={styles.loginText}>Necesitas una cuenta para publicar.</Text>
            <ActionButton
              label="Iniciar sesion"
              onPress={() => router.push("/")}
              variant="secondary"
            />
          </View>
        ) : null}

        <View style={styles.form}>
          <TextField
            autoCapitalize="words"
            label="Nombre del puesto o negocio"
            onChangeText={setName}
            placeholder="Ej. Bazar del Angel"
            value={name}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryGrid}>
              {localCategories.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.chip, category === item && styles.selectedChip]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      category === item && styles.selectedChipText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextField
            label="Descripcion"
            multiline
            numberOfLines={4}
            onChangeText={setDescription}
            placeholder="Cuenta que hace especial a tu negocio..."
            style={styles.multilineInput}
            textAlignVertical="top"
            value={description}
          />
          <TextField
            label="Direccion"
            onChangeText={setAddress}
            placeholder="Calle, numero, colonia..."
            value={address}
          />
          <TextField
            label="Horario (opcional)"
            onChangeText={setHours}
            placeholder="Lun a sab, 10:00 a 19:00"
            value={hours}
          />
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Correo publico de contacto (opcional)"
            onChangeText={setContactEmail}
            placeholder="contacto@minegocio.com"
            value={contactEmail}
          />

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Ubicacion</Text>
              {coordinates ? (
                <Text style={styles.locationSet}>Ubicacion fijada</Text>
              ) : null}
            </View>
            <ActionButton
              label={coordinates ? "Actualizar mi ubicacion" : "Fijar mi ubicacion actual"}
              onPress={() => void setCurrentLocation()}
              variant="secondary"
            />
            {!coordinates ? (
              <Text style={styles.helperText}>
                Puedes publicar sin coordenadas y agregarlas despues.
              </Text>
            ) : null}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Fotos del local</Text>
            <View style={styles.photoActions}>
              <Pressable
                onPress={() => void addPhotos("camera")}
                style={styles.photoAction}
              >
                <Text style={styles.photoActionIcon}>◎</Text>
                <Text style={styles.photoActionText}>Tomar foto</Text>
              </Pressable>
              <Pressable
                onPress={() => void addPhotos("gallery")}
                style={styles.photoAction}
              >
                <Text style={styles.photoActionIcon}>▧</Text>
                <Text style={styles.photoActionText}>Elegir fotos</Text>
              </Pressable>
            </View>
            {edit && existingPhotos.length > 0 ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.helperText}>Fotos publicadas (toca una para quitarla del local):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.photoList}>
                    {existingPhotos.map((url) => (
                      <Pressable key={url} accessibilityLabel="Quitar fotografia existente" onPress={() => setExistingPhotos(current => current.filter(item => item !== url))} style={styles.photoPreview}>
                        <Image contentFit="cover" source={{uri:url}} style={styles.photo} />
                        <View style={styles.removePhoto}><Text style={styles.removePhotoText}>×</Text></View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : null}
            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photoList}>
                  {photos.map((photo, index) => (
                    <Pressable
                      accessibilityLabel={`Quitar foto ${index + 1}`}
                      key={`${photo.uri}-${index}`}
                      onPress={() =>
                        setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      style={styles.photoPreview}
                    >
                      <Image contentFit="cover" source={{ uri: photo.uri }} style={styles.photo} />
                      <View style={styles.removePhoto}>
                        <Text style={styles.removePhotoText}>×</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.helperText}>Hasta 5 fotos. Toca una foto para quitarla.</Text>
            )}
          </View>

          {errorMessage ? <Notice message={errorMessage} variant="error" /> : null}
          {successMessage ? <Notice message={successMessage} /> : null}
          {!isFirebaseConfigured ? (
            <Notice message="Modo local: los negocios se guardan en este dispositivo, no en Firebase." />
          ) : null}
          {loading ? (
            <ActivityIndicator color={colors.green} />
          ) : (
            <ActionButton label={edit ? "Guardar cambios" : "Publicar mi local"} onPress={() => void submit()} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 10,
  },
  eyebrow: {
    color: colors.green,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 7,
  },
  loginCard: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.greenPale,
  },
  loginText: {
    color: colors.greenDark,
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    gap: 19,
  },
  fieldGroup: {
    gap: 9,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationSet: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "700",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  selectedChip: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  selectedChipText: {
    color: colors.white,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  helperText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  photoActions: {
    flexDirection: "row",
    gap: 10,
  },
  photoAction: {
    flex: 1,
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#B7C7BA",
    backgroundColor: colors.greenPale,
  },
  photoActionIcon: {
    color: colors.green,
    fontSize: 21,
    fontWeight: "700",
  },
  photoActionText: {
    color: colors.greenDark,
    fontSize: 11,
    fontWeight: "700",
  },
  photoList: {
    flexDirection: "row",
    gap: 9,
    paddingVertical: 2,
  },
  photoPreview: {
    position: "relative",
  },
  photo: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: colors.greenPale,
  },
  removePhoto: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(23, 42, 36, 0.8)",
  },
  removePhotoText: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 19,
  },
});
