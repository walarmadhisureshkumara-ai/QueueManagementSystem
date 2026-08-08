import React, { useState, useEffect } from 'react'; // Import React and hooks
import { // Import React Native components
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import local storage
import { getCountersAPI, requestTokenAPI } from '../api';
import { COLORS } from '../config';

const ICONS = ['💵', '💴', '🎧', '📋', '🏦', '🗒️', '💳']; // Array of icons for counter cards

export default function CounterSelectionScreen({ navigation }) { // Counter selection screen component
  const [counters, setCounters] = useState([]); // State for list of counters
  const [loading, setLoading] = useState(true); // State for initial loading indicator
  const [requesting, setRequesting] = useState(null); // State tracking which counter is being requested

  useEffect(() => { loadCounters(); }, []); // Load counters on mount

  const loadCounters = async () => { // Fetch available counters from API
    try { // Attempt API call
      const res = await getCountersAPI(); // GET all counters
      if (res.data.success) setCounters(res.data.data); // Update counter list
    } catch (e) { // Handle error
      Alert.alert('Error', 'Failed to load counters'); // Show error alert
    } finally { setLoading(false); } // Stop loading indicator
  };

  const requestToken = async (counter) => { // Request a new token for selected counter
    setRequesting(counter.counter_id); // Mark this counter as being requested
    try { // Attempt API call
      const res = await requestTokenAPI(counter.counter_id); // POST to create token
      if (res.data.success) { // Check if token was created
        const newToken = { // Build local token object
          token_id: res.data.token_id, // Server-assigned token ID
          token_number: res.data.token_number, // Server-assigned token number
          counter_name: counter.counter_name, // Counter display name
          status: 'pending', // Initial status
          created_at: new Date().toISOString(), // Current timestamp
        };
        navigation.navigate('TokenDetails', { token: newToken }); // Navigate to token details
      } else { // Server reported failure
        Alert.alert('Error', res.data.message || 'Failed to create token'); // Show error
      }
    } catch (e) { // Network or server error
      Alert.alert('Error', e.response?.data?.message || 'Server error'); // Show error
    } finally { setRequesting(null); } // Clear requesting state
  };

  if (loading) { // Show spinner while loading counters
    return ( // Centered spinner
      <View style={styles.center}>
        {/* Centered container */}
        <ActivityIndicator size="large" color={COLORS.teal} />
      {/* Teal spinner */}
      </View>
    );
  }

  return ( // Main UI render
    <View style={styles.container}>
      {/* Screen container */}
      <View style={styles.header}>
        {/* Header with back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          {/* Back button */}
          <Text style={styles.backText}>←</Text>
        {/* Arrow icon */}
        </TouchableOpacity>
        <View>
          {/* Title container */}
          <Text style={styles.headerTitle}>Select Service</Text>
          {/* Header title */}
          <Text style={styles.headerSub}>Choose a counter for your token</Text>
        {/* Header subtitle */}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {/* Grid layout for counter cards */}
        {counters.map((c, i) => ( // Render each counter as a card
          <TouchableOpacity key={c.counter_id} style={styles.card}
            onPress={() => requestToken(c)} disabled={requesting === c.counter_id}>
            {/* Request token on press, disable if requesting */}
            <View style={styles.iconCircle}>
              {/* Icon circle */}
              <Text style={styles.icon}>{ICONS[i % ICONS.length]}</Text>
            {/* Cycle through icons */}
            </View>
            <Text style={styles.name} numberOfLines={2}>{c.counter_name}</Text>
            {/* Counter name (max 2 lines) */}
            <TouchableOpacity style={[styles.getBtn, requesting === c.counter_id && { opacity: 0.5 }]}
              onPress={() => requestToken(c)}>
              {/* Also request on button press */}
              {requesting === c.counter_id ? ( // Show spinner if requesting this counter
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : ( // Show text normally
                <Text style={styles.getBtnText}>Request</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ // Style definitions
  container: { flex: 1, backgroundColor: COLORS.surface }, // Full screen surface background
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface }, // Centered container
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', alignItems: 'center' }, // Teal header with back button
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }, // Semi-transparent back button
  backText: { fontSize: 16, color: COLORS.white, fontWeight: '700' }, // Back arrow
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white }, // Header title
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }, // Header subtitle
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingBottom: 24 }, // 2-column wrapping grid
  card: { width: '46%', backgroundColor: COLORS.white, margin: '2%', borderRadius: 18, padding: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5 }, // Counter card with shadow
  iconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.tealSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, // Icon background
  icon: { fontSize: 26 }, // Icon size
  name: { fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 6, lineHeight: 18 }, // Counter name
  getBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' }, // Request button
  getBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 }, // Request button text
});
