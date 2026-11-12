import {
  addDoc,
  deleteDoc,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { uploadStorePhoto } from "@/lib/cloudinary";
import { readDemoStores, writeDemoStores } from "@/lib/demo";
import { assertOnline, withConnectionTimeout } from "@/lib/connectivity";

export type StoreCoordinates = {
  latitude: number;
  longitude: number;
};

export type Store = {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  description: string;
  address: string;
  coordinates: StoreCoordinates | null;
  imageUrls: string[];
  contactEmail: string;
  hours: string;
};

export type StorePhoto = {
  uri: string;
  mimeType?: string | null;
};

export type StoreDraft = Omit<Store, "id" | "imageUrls">;

function requireFirestore() {
  if (!db) {
    throw new Error("Firebase no esta configurado. Completa primero el archivo .env.");
  }

  return db;
}

function toStore(id: string, data: Record<string, unknown>): Store {
  const rawCoordinates = data.coordinates;
  const coordinates =
    rawCoordinates &&
    typeof rawCoordinates === "object" &&
    "latitude" in rawCoordinates &&
    "longitude" in rawCoordinates &&
    typeof rawCoordinates.latitude === "number" &&
    typeof rawCoordinates.longitude === "number"
      ? {
          latitude: rawCoordinates.latitude,
          longitude: rawCoordinates.longitude,
        }
      : null;

  return {
    id,
    ownerId: typeof data.ownerId === "string" ? data.ownerId : "",
    name: typeof data.name === "string" ? data.name : "Local sin nombre",
    category: typeof data.category === "string" ? data.category : "Otros",
    description: typeof data.description === "string" ? data.description : "",
    address: typeof data.address === "string" ? data.address : "",
    coordinates,
    imageUrls: Array.isArray(data.imageUrls)
      ? data.imageUrls.filter((url): url is string => typeof url === "string")
      : [],
    contactEmail: typeof data.contactEmail === "string" ? data.contactEmail : "",
    hours: typeof data.hours === "string" ? data.hours : "",
  };
}

export async function getStores() {
  if (!isFirebaseConfigured) return readDemoStores<Store>();
  await assertOnline();
  const snapshot = await withConnectionTimeout(getDocsFromServer(collection(requireFirestore(), "stores")));
  return snapshot.docs.map((storeDoc) =>
    toStore(storeDoc.id, storeDoc.data() as Record<string, unknown>),
  );
}

export async function getStoreById(id: string) {
  if (!isFirebaseConfigured) return (await readDemoStores<Store>()).find((store) => store.id === id) ?? null;
  await assertOnline();
  const snapshot = await withConnectionTimeout(getDocFromServer(doc(requireFirestore(), "stores", id)));
  return snapshot.exists()
    ? toStore(snapshot.id, snapshot.data() as Record<string, unknown>)
    : null;
}

export async function createStore(draft: StoreDraft, photos: StorePhoto[]) {
  if (!isFirebaseConfigured) {
    const stores = await readDemoStores<Store>();
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    stores.push({ ...draft, id, imageUrls: photos.map((p) => p.uri) });
    await writeDemoStores(stores);
    return id;
  }
  await assertOnline();
  const firestore = requireFirestore();
  const imageUrls: string[] = [];

  if (photos.length > 5) throw new Error("Solo puedes agregar hasta 5 fotografias.");
  for (const photo of photos) {
    await assertOnline();
    imageUrls.push(await uploadStorePhoto(photo));
  }

  await assertOnline();
  const newStore = await withConnectionTimeout(addDoc(collection(firestore, "stores"), {
    ...draft,
    imageUrls,
    createdAt: serverTimestamp(),
  }));

  return newStore.id;
}

export async function updateStore(id: string, ownerId: string, draft: Omit<StoreDraft, 'ownerId'>, photos: StorePhoto[] = [], retainedImageUrls?: string[]) {
  const original = await getStoreById(id);
  if (!original) throw new Error('No encontramos el local.');
  if (original.ownerId !== ownerId) throw new Error('No tienes permisos para modificar este local.');
  const kept = retainedImageUrls === undefined ? original.imageUrls : original.imageUrls.filter(url => retainedImageUrls.includes(url));
  if (kept.length + photos.length > 5) throw new Error('Puedes guardar un maximo de 5 fotos por local.');
  if (!isFirebaseConfigured) {
    const stores = await readDemoStores<Store>();
    const updated = stores.map((store) => store.id === id
      ? { ...store, ...draft, imageUrls: [...kept, ...photos.map((photo) => photo.uri)].slice(0, 5) }
      : store);
    await writeDemoStores(updated);
    return;
  }
  const imageUrls = [...kept];
  if (imageUrls.length + photos.length > 5) {
    throw new Error('Puedes guardar un maximo de 5 fotos por local.');
  }
  for (const photo of photos) {
    await assertOnline();
    imageUrls.push(await uploadStorePhoto(photo));
  }
  await assertOnline();
  await withConnectionTimeout(updateDoc(doc(requireFirestore(), 'stores', id), { ...draft, imageUrls: imageUrls.slice(0,5), updatedAt: serverTimestamp() }));
}

/** Elimina el documento del negocio, pero no elimina los archivos de Cloudinary. */
export async function deleteStore(id: string, ownerId: string): Promise<void> {
  if (!ownerId) throw new Error("Inicia sesión para eliminar tu local.");
  if (!isFirebaseConfigured) {
    const stores = await readDemoStores<Store>();
    const original = stores.find((store) => store.id === id);
    if (!original) throw new Error("No encontramos el local.");
    if (original.ownerId !== ownerId) throw new Error("No tienes permisos para eliminar este local.");
    await writeDemoStores(stores.filter((store) => store.id !== id));
    return;
  }
  await assertOnline();
  const original = await getStoreById(id);
  if (!original) throw new Error("No encontramos el local.");
  if (original.ownerId !== ownerId) throw new Error("No tienes permisos para eliminar este local.");
  // Firestore también verifica ownerId con las reglas del servidor.
  await assertOnline();
  await withConnectionTimeout(deleteDoc(doc(requireFirestore(), "stores", id)));
}
