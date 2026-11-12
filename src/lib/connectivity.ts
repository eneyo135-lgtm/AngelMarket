import { Platform } from "react-native";

const OFFLINE_MESSAGE = "Sin conexión a Internet. Conéctate e inténtalo de nuevo.";
const TIMEOUT_MESSAGE = "La conexión tardó demasiado. Revisa tu Internet e inténtalo de nuevo.";

export async function assertOnline(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new Error(OFFLINE_MESSAGE);
    }
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    // Este endpoint devuelve 204 cuando hay acceso a Internet; no envía datos del usuario.
    const response = await fetch("https://www.gstatic.com/generate_204", {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(OFFLINE_MESSAGE);
  } catch {
    throw new Error(OFFLINE_MESSAGE);
  } finally {
    clearTimeout(timer);
  }
}

export async function withConnectionTimeout<T>(operation: Promise<T>, ms = 12000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(TIMEOUT_MESSAGE)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
