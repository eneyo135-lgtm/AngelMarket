import { Platform } from "react-native";
import { File } from "expo-file-system";

export type UploadPhoto = { uri: string; mimeType?: string | null };

const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

export async function uploadStorePhoto(photo: UploadPhoto): Promise<string> {
  if (!cloudName || !uploadPreset) {
    throw new Error("Falta configurar Cloudinary. Agrega EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME y EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET al archivo .env y reinicia Expo.");
  }
  const fileType = photo.mimeType || "image/jpeg";
  if (!fileType.startsWith("image/")) throw new Error("Solo se permiten fotografias.");
  const form = new FormData();
  form.append("upload_preset", uploadPreset);
  if (Platform.OS === "web") {
    const imageResponse = await fetch(photo.uri);
    if (!imageResponse.ok) throw new Error("No se pudo leer la fotografia.");
    const blob = await imageResponse.blob();
    if (blob.size > 8 * 1024 * 1024) throw new Error("La fotografia supera 8 MB.");
    form.append("file", blob, `angelmarket-${Date.now()}.jpg`);
  } else {
    // Expo's FormData expects a real Blob/File, not the legacy { uri, type, name } object.
    const file = new File(photo.uri);
    if (!file.exists) throw new Error("No se encontro la fotografia seleccionada.");
    if (file.size > 8 * 1024 * 1024) throw new Error("La fotografia supera 8 MB.");
    form.append("file", file as Blob, file.name || `angelmarket-${Date.now()}.jpg`);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    const result = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || `Cloudinary no pudo subir la foto (${response.status}).`);
    }
    if (!result.secure_url.startsWith("https://res.cloudinary.com/")) {
      throw new Error("Cloudinary devolvio un enlace inesperado.");
    }
    return result.secure_url;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("La subida de fotografia tardo demasiado. Revisa tu conexion e intenta de nuevo.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
