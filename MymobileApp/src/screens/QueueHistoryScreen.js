import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, SOCKET, COLORS } from '../config';

export default function QueueHistoryScreen({ navigation }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
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

  const statusMeta = (status) => ({
    completed: { color: COLORS.green, bg: COLORS.greenSoft, icon: '✓' },
    cancelled: { color: COLORS.red, bg: COLORS.redSoft, icon: '✕' },
    waiting: { color: COLORS.accent, bg: COLORS.accentSoft, icon: '⏳' },
    serving: { color: COLORS.blue, bg: COLORS.blueSoft, icon: '●' },
  })[status] || { color: COLORS.gray, bg: '#ECEFF1', icon: '?' };

  const filtered = filter === 'all' ? tokens : tokens.filter(t => t.status === filter);
  const sorted = [...filtered].sort((a, b) => b.token_id - a.token_id);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'waiting', label: '⏳' },
    { key: 'serving', label: '●' },
    { key: 'completed', label: '✓' },
    { key: 'cancelled', label: '✕' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Queue Details</Text>
        <Text style={styles.headerSub}>Track all your token history</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {tabs.map(tab => (
            <TouchableOpacity key={tab.key}
              style={[styles.tab, filter === tab.key && styles.tabActive]}
              onPress={() => setFilter(tab.key)}>
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTokens(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 40 }} />
        ) : sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Tokens</Text>
            <Text style={styles.emptySub}>Get a token from Home to start</Text>
          </View>
        ) : (
          sorted.map(token => {
            const m = statusMeta(token.status);
            const timeAgo = token.created_at ? (() => {
              const diff = Date.now() - new Date(token.created_at).getTime();
              const min = Math.floor(diff / 60000);
              return min < 1 ? 'Just now' : min < 60 ? `${min}m ago` : `${Math.floor(min / 60)}h ago`;
            })() : '';
            return (
              <TouchableOpacity key={token.token_id} style={styles.queueCard}
                onPress={() => navigation.navigate('TokenDetails', { token })}>
                <View style={[styles.sidebar, { backgroundColor: m.color }]} />
                <View style={styles.content}>
                  <View style={styles.topRow}>
                    <Text style={styles.tokenNum}>{token.token_number}</Text>
                    {token.queue_position > 0 && token.status === 'waiting' && (
                      <View style={styles.posBadge}><Text style={styles.posText}>#{token.queue_position}</Text></View>
                    )}
                    <Text style={styles.timeAgo}>{timeAgo}</Text>
                  </View>
                  <View style={styles.bottomRow}>
                    <Text style={styles.counterName}>{token.counter_name}</Text>
                    <View style={[styles.pill, { backgroundColor: m.bg }]}>
                      <Text style={[styles.pillText, { color: m.color }]}>{m.icon} {statusMeta(token.status).icon === '✓' ? 'Done' : statusMeta(token.status).icon === '✕' ? 'Cancelled' : statusMeta(token.status).icon === '⏳' ? 'Waiting' : statusMeta(token.status).icon === '●' ? 'Serving' : token.status}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  tabScroll: { maxHeight: 48, marginTop: 12 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  tabActive: { backgroundColor: COLORS.teal },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.white },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  queueCard: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 8, borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  sidebar: { width: 4 },
  content: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  tokenNum: { fontSize: 17, fontWeight: '800', color: COLORS.dark, flex: 1 },
  posBadge: { backgroundColor: COLORS.tealSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  posText: { color: COLORS.teal, fontSize: 11, fontWeight: '700' },
  timeAgo: { fontSize: 10, color: COLORS.gray },
  bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  counterName: { fontSize: 12, color: COLORS.gray, flex: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  pillText: { fontSize: 10, fontWeight: '700' },
});
