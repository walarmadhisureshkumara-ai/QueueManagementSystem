import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API, SOCKET, COLORS } from '../config';
import { addNotification } from '../notifications';

const STATUS = {
  completed: { color: COLORS.green, bg: COLORS.greenSoft, icon: '✓', label: 'Completed' },
  cancelled: { color: COLORS.red, bg: COLORS.redSoft, icon: '✕', label: 'Cancelled' },
  waiting: { color: COLORS.accent, bg: COLORS.accentSoft, icon: '⏳', label: 'Waiting' },
  serving: { color: COLORS.blue, bg: COLORS.blueSoft, icon: '●', label: 'Being Served' },
};

export default function TokenDetailsScreen({ route, navigation }) {
  const { token: initialToken } = route.params;
  const [token, setToken] = useState(initialToken);
  const [cancelling, setCancelling] = useState(false);
  const intervalRef = useRef(null);
  const socketRef = useRef(null);

  const tokenId = token.token_id || token.id;
  const meta = STATUS[token.status] || STATUS.waiting;

  useEffect(() => {
    socketRef.current = io(SOCKET);
    socketRef.current.on('TOKEN_STATUS_CHANGE', (data) => {
      if (data.token_id === tokenId) {
        setToken(prev => ({ ...prev, status: data.status }));
      }
    });
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [tokenId]);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const cid = await AsyncStorage.getItem('customerId');
        const res = await axios.get(`${API}/customer/tokens`, { params: { customer_id: cid } });
        if (res.data.success) {
          const updated = res.data.tokens.find(t => (t.token_id || t.id) === tokenId);
          if (updated) setToken(updated);
        }
      } catch (e) { /* skip */ }
    }, 5000);
    intervalRef.current = iv;
    return () => clearInterval(iv);
  }, [tokenId]);

  const handleCancel = () => {
    Alert.alert('Cancel Token', `Cancel ${token.token_number}? This cannot be undone.`, [
      { text: 'No', style: 'cancel' },
      { text: 'Cancel Token', style: 'destructive', onPress: async () => {
        setCancelling(true);
        try {
          const res = await axios.post(`${API}/customer/tokens/${tokenId}/cancel`);
          if (res.data.success) {
            setToken({ ...token, status: 'cancelled' });
            await addNotification('Token Cancelled', `${token.token_number} has been cancelled`, token.token_number, 'cancelled');
          }
        } catch (e) {
          Alert.alert('Error', e.response?.data?.message || 'Failed to cancel');
        } finally { setCancelling(false); }
      }},
    ]);
  };

  const steps = [
    { label: 'Requested', done: true },
    { label: 'Serving', done: token.status === 'serving' || token.status === 'completed' },
    { label: 'Completed', done: token.status === 'completed' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Token Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={[styles.heroCircle, { backgroundColor: meta.bg }]}>
            <Text style={styles.heroIcon}>{meta.icon}</Text>
          </View>
          <Text style={styles.heroNum}>{token.token_number}</Text>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
          </View>
          {token.queue_position > 0 && token.status === 'waiting' && (
            <Text style={styles.queuePos}>Position in queue: #{token.queue_position}</Text>
          )}
        </View>

        {/* Progress Tracker */}
        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.trackCard}>
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <View style={styles.trackStep}>
                <View style={[styles.trackDot, s.done ? styles.trackDone : styles.trackPending]}>
                  <Text style={styles.trackDotText}>{s.done ? '✓' : '○'}</Text>
                </View>
                <Text style={[styles.trackLabel, s.done && styles.trackLabelDone]}>{s.label}</Text>
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.trackLine, steps[i + 1].done && styles.trackLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Counter</Text>
            <Text style={styles.gridValue}>{token.counter_name || 'N/A'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Status</Text>
            <Text style={[styles.gridValue, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Date</Text>
            <Text style={styles.gridValue}>{token.created_at ? new Date(token.created_at).toLocaleDateString() : '-'}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Time</Text>
            <Text style={styles.gridValue}>{token.created_at ? new Date(token.created_at).toLocaleTimeString() : '-'}</Text>
          </View>
        </View>

        {/* Cancel */}
        {token.status === 'waiting' && (
          <TouchableOpacity style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
            onPress={handleCancel} disabled={cancelling}>
            {cancelling ? (
              <ActivityIndicator color={COLORS.red} />
            ) : (
              <Text style={styles.cancelText}>Cancel This Token</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  backText: { fontSize: 16, color: COLORS.white, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white, flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  heroCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  heroCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  heroIcon: { fontSize: 30 },
  heroNum: { fontSize: 30, fontWeight: '900', color: COLORS.dark, letterSpacing: 1 },
  statusPill: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 14, marginTop: 10 },
  statusText: { fontSize: 13, fontWeight: '700' },
  queuePos: { fontSize: 14, fontWeight: '700', color: COLORS.teal, marginTop: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 20, marginBottom: 10 },
  trackCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  trackStep: { alignItems: 'center' },
  trackDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  trackDone: { backgroundColor: COLORS.green },
  trackPending: { backgroundColor: '#E0E0E0' },
  trackDotText: { fontSize: 12, color: COLORS.white, fontWeight: '700' },
  trackLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray },
  trackLabelDone: { color: COLORS.green },
  trackLine: { width: 24, height: 2, backgroundColor: '#E0E0E0', marginBottom: 20 },
  trackLineDone: { backgroundColor: COLORS.green },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  gridLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  gridValue: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  cancelBtn: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.redSoft },
  cancelText: { color: COLORS.red, fontWeight: '700', fontSize: 14 },
});
