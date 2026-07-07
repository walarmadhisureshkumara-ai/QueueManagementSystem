import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@notifications';

export async function getNotifications() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addNotification(title, message, tokenNumber, status) {
  const existing = await getNotifications();
  const notif = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title,
    message,
    token_number: tokenNumber,
    status,
    timestamp: new Date().toISOString(),
    read: false,
  };
  existing.unshift(notif);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 100)));
  return notif;
}

export async function markNotificationRead(id) {
  const all = await getNotifications();
  const updated = all.map(n => n.id === id ? { ...n, read: true } : n);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function markAllRead() {
  const all = await getNotifications();
  const updated = all.map(n => ({ ...n, read: true }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function clearNotifications() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

export async function getUnreadCount() {
  const all = await getNotifications();
  return all.filter(n => !n.read).length;
}
