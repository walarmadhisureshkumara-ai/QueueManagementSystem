import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, SOCKET, COLORS } from '../config';
import { addNotification, getUnreadCount } from '../notifications';

export default function HomeScreen({ navigation }) {
  const [customerName, setCustomerName] = useState('');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [toast, setToast] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const socketRef = useRef(null);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET);
    socketRef.current.on('TOKEN_STATUS_CHANGE', async (data) => {
      loadTokens();
      const cid = await AsyncStorage.getItem('customerId');
      if (String(data.customer_id) === cid) {
        const msg = data.status === 'serving' ? `Token ${data.token_number} is now being served` :
                    data.status === 'completed' ? `Token ${data.token_number} completed` :
                    data.status === 'cancelled' ? `Token ${data.token_number} cancelled` : '';
        if (msg) {
          await addNotification('Status Update', msg, data.token_number, data.status);
          showToast(msg);
        }
      }
    });
    socketRef.current.on('NEW_STAFF_NOTIFICATION', async (data) => {
      loadTokens();
      const cid = await AsyncStorage.getItem('customerId');
      const res = await axios.get(`${API}/customer/tokens`, { params: { customer_id: cid } });
      if (res.data.success) {
        const latest = res.data.tokens[0];
        if (latest && cid && String(latest.customer_id) === cid) {
          await addNotification('Token Generated', `Token ${latest.token_number} created for ${latest.counter_name}`, latest.token_number, 'waiting');
          showToast(`Token ${latest.token_number} created`);
        }
      }
    });
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    try {
      const name = await AsyncStorage.getItem('customerName');
      setCustomerName(name);
      await loadTokens();
    } catch (e) { /* skip */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadTokens = async () => {
    const cid = await AsyncStorage.getItem('customerId');
    if (!cid) return;
    try {
      const res = await axios.get(`${API}/customer/tokens`, { params: { customer_id: cid } });
      if (res.data.success) setTokens(res.data.tokens);
    } catch (e) { /* skip */ }
  };

  const activeTokens = tokens.filter(t => t.status === 'waiting' || t.status === 'serving');
  const completedTokens = tokens.filter(t => t.status === 'completed');
  const nowServing = tokens.find(t => t.status === 'serving');
  const waitingCount = tokens.filter(t => t.status === 'waiting').length;
  const servingCount = tokens.filter(t => t.status === 'serving').length;

  return (
    <View style={styles.container}>
      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastIcon}>🔔</Text>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.customerName}>{customerName || 'Customer'}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.badgeCircle}>
                <Text style={styles.badgeNum}>{activeTokens.length}</Text>
                <Text style={styles.badgeLabel}>Active</Text>
              </View>
            </View>
          </View>
          <Text style={styles.headerSub}>BOC Queue Management</Text>
        </View>

        {/* Serving Banner */}
        {nowServing ? (
          <View style={styles.servingCard}>
            <Text style={styles.servingIcon}>🎯</Text>
            <View style={styles.servingInfo}>
              <Text style={styles.servingLabel}>Now Serving</Text>
              <Text style={styles.servingToken}>{nowServing.token_number}</Text>
              <Text style={styles.servingAt}>{nowServing.counter_name}</Text>
            </View>
          </View>
        ) : waitingCount > 0 ? (
          <View style={styles.waitingCard}>
            <Text style={styles.waitingIcon}>⏳</Text>
            <Text style={styles.waitingText}>{waitingCount} token{waitingCount > 1 ? 's' : ''} waiting in queue</Text>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{waitingCount}</Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: COLORS.blue }]}>{servingCount}</Text>
            <Text style={styles.statLabel}>Serving</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: COLORS.green }]}>{completedTokens.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Get Token CTA */}
        <TouchableOpacity style={styles.ctaCard}
          onPress={() => navigation.navigate('CounterSelection')}
          activeOpacity={0.85}>
          <View style={styles.ctaLeft}>
            <View style={styles.ctaIconBox}>
              <Text style={styles.ctaIcon}>🎫</Text>
            </View>
            <View>
              <Text style={styles.ctaTitle}>Get New Token</Text>
              <Text style={styles.ctaSub}>Select a service counter</Text>
            </View>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>

        {/* Latest Token */}
        {activeTokens.length > 0 && (
          <TouchableOpacity style={styles.latestCard}
            onPress={() => navigation.navigate('TokenDetails', { token: activeTokens[activeTokens.length - 1] })}>
            <Text style={styles.latestLabel}>Latest Token</Text>
            <View style={styles.latestRow}>
              <Text style={styles.latestNum}>{activeTokens[activeTokens.length - 1].token_number}</Text>
              <Text style={styles.latestArrow}>View →</Text>
            </View>
            <Text style={styles.latestCounter}>{activeTokens[activeTokens.length - 1].counter_name}</Text>
          </TouchableOpacity>
        )}

        {/* Info Cards */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoTitle}>Branch Hours</Text>
            <Text style={styles.infoText}>Mon–Fri  8:30 AM – 3:00 PM</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoTitle}>Our Branch</Text>
            <Text style={styles.infoText}>Colombo Main Street</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  toast: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: COLORS.tealDark, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 },
  toastIcon: { fontSize: 16, marginRight: 10 },
  toastText: { color: COLORS.white, fontSize: 13, fontWeight: '600', flex: 1 },
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  customerName: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerRight: { alignItems: 'center' },
  badgeCircle: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 50 },
  badgeNum: { fontSize: 20, fontWeight: '800', color: COLORS.accent },
  badgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: -2 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, letterSpacing: 1 },
  servingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blueSoft, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: COLORS.blue },
  servingIcon: { fontSize: 28, marginRight: 12 },
  servingInfo: { flex: 1 },
  servingLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  servingToken: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginTop: 2 },
  servingAt: { fontSize: 12, color: COLORS.blue, fontWeight: '600', marginTop: 2 },
  waitingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accentSoft, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: COLORS.accent },
  waitingIcon: { fontSize: 20, marginRight: 10 },
  waitingText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  statNum: { fontSize: 24, fontWeight: '800', color: COLORS.teal },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '600' },
  ctaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, padding: 18, borderRadius: 16, elevation: 3, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctaIconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.tealSoft, justifyContent: 'center', alignItems: 'center' },
  ctaIcon: { fontSize: 26 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark },
  ctaSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  ctaArrow: { fontSize: 22, color: COLORS.teal, fontWeight: '700' },
  latestCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  latestLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray, marginBottom: 6 },
  latestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  latestNum: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  latestArrow: { fontSize: 13, fontWeight: '700', color: COLORS.teal },
  latestCounter: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  infoRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 24, gap: 10 },
  infoCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  infoIcon: { fontSize: 22, marginBottom: 6 },
  infoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  infoText: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
});
