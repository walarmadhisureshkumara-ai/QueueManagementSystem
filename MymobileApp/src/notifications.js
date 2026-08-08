import AsyncStorage from '@react-native-async-storage/async-storage'; // Import async storage for persistence

const STORAGE_KEY = '@notifications'; // Storage key for notifications array

export async function getNotifications() { // Retrieve all stored notifications
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY); // Get raw JSON string from storage
    return raw ? JSON.parse(raw) : []; // Parse JSON or return empty array if null
  } catch { return []; } // Return empty array on any error
}

export async function addNotification(title, message, tokenNumber, status) { // Add a new notification
  const existing = await getNotifications(); // Fetch existing notifications
  const notif = { // Build new notification object
    id: Date.now() + '_' + Math.random().toString(36).slice(2, 6), // Unique ID from timestamp + random string
    title, // Notification title
    message, // Notification message body
    token_number: tokenNumber, // Associated token number
    status, // Token status (waiting/serving/completed/cancelled)
    timestamp: new Date().toISOString(), // ISO timestamp of creation
    read: false, // Mark as unread by default
  };
  existing.unshift(notif); // Prepend new notification to the front
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 100))); // Save, keep only latest 100
  return notif; // Return the created notification
}

export async function markNotificationRead(id) { // Mark a single notification as read
  const all = await getNotifications(); // Get all notifications
  const updated = all.map(n => n.id === id ? { ...n, read: true } : n); // Toggle read flag for matching ID
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); // Save updated list
}

export async function markAllRead() { // Mark all notifications as read
  const all = await getNotifications(); // Get all notifications
  const updated = all.map(n => ({ ...n, read: true })); // Set read to true on every notification
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); // Save updated list
}

export async function clearNotifications() { // Clear all notifications
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([])); // Overwrite with empty array
}

export async function getUnreadCount() { // Get count of unread notifications
  const all = await getNotifications(); // Get all notifications
  return all.filter(n => !n.read).length; // Filter and count unread ones
}
