import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API, COLORS } from '../config';

const ICONS = ['💵', '💴', '🎧', '📋', '🏦', '🗒️', '💳'];

export default function CounterSelectionScreen({ navigation }) {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(null);

  useEffect(() => { loadCounters(); }, []);

  const loadCounters = async () => {
    try {
      const res = await axios.get(`${API}/counters`);
      if (res.data.success) setCounters(res.data.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load counters');
    } finally { setLoading(false); }
  };

  const requestToken = async (counter) => {
    setRequesting(counter.counter_id);
    try {
      const customerId = await AsyncStorage.getItem('customerId');
      const res = await axios.post(`${API}/request-token`, {
        customer_id: parseInt(customerId),
        counter_id: counter.counter_id,
        token_type_id: 1,
      });
      if (res.data.success) {
        const newToken = {
          token_id: res.data.token_id,
          token_number: res.data.token_number,
          counter_name: counter.counter_name,
          status: 'waiting',
          created_at: new Date().toISOString(),
        };
        navigation.navigate('TokenDetails', { token: newToken });
      } else {
        Alert.alert('Error', res.data.message || 'Failed to create token');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Server error');
    } finally { setRequesting(null); }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Select Service</Text>
          <Text style={styles.headerSub}>Choose a counter for your token</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {counters.map((c, i) => (
          <TouchableOpacity key={c.counter_id} style={styles.card}
            onPress={() => requestToken(c)} disabled={requesting === c.counter_id}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{ICONS[i % ICONS.length]}</Text>
            </View>
            <Text style={styles.name} numberOfLines={2}>{c.counter_name}</Text>
            <TouchableOpacity style={[styles.getBtn, requesting === c.counter_id && { opacity: 0.5 }]}
              onPress={() => requestToken(c)}>
              {requesting === c.counter_id ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.getBtnText}>Request</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  backText: { fontSize: 16, color: COLORS.white, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, paddingBottom: 24 },
  card: { width: '46%', backgroundColor: COLORS.white, margin: '2%', borderRadius: 18, padding: 20, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 5 },
  iconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.tealSoft, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 26 },
  name: { fontSize: 13, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 6, lineHeight: 18 },
  getBtn: { backgroundColor: COLORS.teal, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: 'center' },
  getBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
});
