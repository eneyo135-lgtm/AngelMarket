import AsyncStorage from '@react-native-async-storage/async-storage';

export type DemoUser = { uid: string; displayName: string; email: string };
const SESSION_KEY = 'angelmarket.demo.session.v1';
const STORES_KEY = 'angelmarket.demo.stores.v1';

export async function getDemoUser(): Promise<DemoUser | null> {
  const value = await AsyncStorage.getItem(SESSION_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as DemoUser; } catch { return null; }
}
export async function enterDemo(name: string, email: string): Promise<DemoUser> {
  const normalized = email.trim().toLowerCase();
  const user = { uid: 'demo-' + normalized, displayName: name.trim() || 'Usuario demo', email: normalized };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}
export async function updateDemoUser(name: string): Promise<DemoUser> {
  const user = await getDemoUser();
  if (!user) throw new Error('Inicia sesión para actualizar tu perfil.');
  const updated = { ...user, displayName: name.trim() };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}
export async function exitDemo() { await AsyncStorage.removeItem(SESSION_KEY); }
export async function readDemoStores<T>(): Promise<T[]> {
  const value = await AsyncStorage.getItem(STORES_KEY);
  if (!value) return [];
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : []; } catch { return []; }
}
export async function writeDemoStores<T>(stores: T[]) {
  await AsyncStorage.setItem(STORES_KEY, JSON.stringify(stores));
}
