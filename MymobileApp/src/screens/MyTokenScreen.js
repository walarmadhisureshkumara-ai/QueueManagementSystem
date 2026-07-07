import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, SOCKET, COLORS } from '../config';
import { addNotification } from '../notifications';

export default function MyTokenScreen({ navigation }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET);
    socketRef.current.on('TOKEN_STATUS_CHANGE', loadTokens);
    socketRef.current.on('NEW_STAFF_NOTIFICATION', loadTokens);
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useFocusEffect(useCallback(() => { loadTokens(); }, []));

  const loadTokens = async () => {
    const cid = await AsyncStorage.getItem('customerId');
    if (!cid) return;
    try {
      const res = await axios.get(`${API}/customer/tokens`, { params: { customer_id: cid } });
      if (res.data.success) setTokens(res.data.tokens);
    } catch (e) { /* skip */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleCancel = (token) => {
    Alert.alert('Cancel Token', `Cancel ${token.token_number}?`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Token', style: 'destructive', onPress: async () => {
        try {
          await axios.post(`${API}/customer/tokens/${token.token_id}/cancel`);
          await addNotification('Token Cancelled', `${token.token_number} has been cancelled`, token.token_number, 'cancelled');
          loadTokens();
        } catch (e) {
          Alert.alert('Error', 'Failed to cancel token');
        }
      }},
    ]);
  };

  const activeTokens = tokens.filter(t => t.status === 'waiting' || t.status === 'serving')
    .sort((a, b) => b.token_id - a.token_id);
  const historyTokens = tokens.filter(t => t.status === 'completed' || t.status === 'cancelled')
    .sort((a, b) => b.token_id - a.token_id);

  const statusMeta = (status) => ({
    completed: { color: COLORS.green, bg: COLORS.greenSoft, icon: '✓', label: 'Completed' },
    cancelled: { color: COLORS.red, bg: COLORS.redSoft, icon: '✕', label: 'Cancelled' },
    waiting: { color: COLORS.accent, bg: COLORS.accentSoft, icon: '⏳', label: 'Waiting' },
    serving: { color: COLORS.blue, bg: COLORS.blueSoft, icon: '●', label: 'Serving' },
  })[status] || { color: COLORS.gray, bg: '#ECEFF1', icon: '?', label: 'Unknown' };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Token</Text>
        <Text style={styles.headerSub}>{activeTokens.length} active · {historyTokens.length} history</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTokens(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {activeTokens.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎫</Text>
            <Text style={styles.emptyTitle}>No Active Tokens</Text>
            <Text style={styles.emptySub}>Go to Home and tap "Get New Token"</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.emptyBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTokens.map(token => {
          const m = statusMeta(token.status);
          return (
            <TouchableOpacity key={token.token_id} style={styles.tokenCard}
              onPress={() => navigation.navigate('TokenDetails', { token })}>
              <View style={styles.tokenTop}>
                <View style={[styles.circle, { backgroundColor: m.bg }]}>
                  <Text style={[styles.circleText, { color: m.color }]}>{m.icon}</Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenNum}>{token.token_number}</Text>
                  <Text style={styles.tokenCounter}>{token.counter_name}</Text>
                </View>
                {token.status === 'waiting' && (
                  <TouchableOpacity style={styles.cancelBadge} onPress={() => handleCancel(token)}>
                    <Text style={styles.cancelBadgeText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.tokenMeta}>
                <View style={[styles.pill, { backgroundColor: m.bg }]}>
                  <Text style={[styles.pillText, { color: m.color }]}>{m.icon} {m.label}</Text>
                </View>
                {token.queue_position > 0 && token.status === 'waiting' && (
                  <Text style={styles.posText}>Position #{token.queue_position}</Text>
                )}
              </View>
              <Text style={styles.timeText}>{token.created_at ? new Date(token.created_at).toLocaleString() : ''}</Text>
            </TouchableOpacity>
          );
        })}

        {historyTokens.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            {historyTokens.slice(0, 15).map(token => {
              const m = statusMeta(token.status);
              return (
                <View key={token.token_id} style={styles.historyCard}>
                  <Text style={styles.historyNum}>{token.token_number}</Text>
                  <Text style={styles.historyCounter}>{token.counter_name}</Text>
                  <View style={[styles.pill, { backgroundColor: m.bg, marginLeft: 'auto' }]}>
                    <Text style={[styles.pillText, { color: m.color }]}>{m.icon} {m.label}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  emptyBtn: { marginTop: 16, backgroundColor: COLORS.teal, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  tokenCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  tokenTop: { flexDirection: 'row', alignItems: 'center' },
  circle: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  circleText: { fontSize: 16, fontWeight: '800' },
  tokenInfo: { flex: 1, marginLeft: 12 },
  tokenNum: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  tokenCounter: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  cancelBadge: { backgroundColor: COLORS.redSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cancelBadgeText: { color: COLORS.red, fontSize: 11, fontWeight: '700' },
  tokenMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginLeft: 50, gap: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 11, fontWeight: '700' },
  posText: { fontSize: 12, fontWeight: '700', color: COLORS.teal },
  timeText: { fontSize: 10, color: COLORS.gray, marginTop: 6, marginLeft: 50 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginHorizontal: 20, marginTop: 24, marginBottom: 6 },
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 6, padding: 12, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  historyNum: { fontSize: 16, fontWeight: '800', color: COLORS.dark, width: 65 },
  historyCounter: { fontSize: 12, color: COLORS.gray, flex: 1 },
});
