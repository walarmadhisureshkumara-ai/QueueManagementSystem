import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { AuthContext } from '../../App';
import { API, COLORS } from '../config';
import { getNotifications, getUnreadCount, markAllRead, clearNotifications } from '../notifications';

export default function ProfileScreen() {
  const { signOut } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    const n = await AsyncStorage.getItem('customerName');
    setName(n || 'Customer');
    const cid = await AsyncStorage.getItem('customerId');
    try {
      const res = await axios.get(`${API}/customer/tokens`, { params: { customer_id: cid } });
      if (res.data.success) {
        setStats({
          total: res.data.tokens.length,
          active: res.data.tokens.filter(t => t.status === 'waiting' || t.status === 'serving').length,
          completed: res.data.tokens.filter(t => t.status === 'completed').length,
        });
      }
    } catch (e) { /* skip */ }
    const allNotifs = await getNotifications();
    setNotifs(allNotifs);
    setUnread(allNotifs.filter(n => !n.read).length);
    setRefreshing(false);
  };

  const handleMarkRead = async () => {
    await markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleClear = () => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await clearNotifications();
        setNotifs([]); setUnread(0);
      }},
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {unread > 0 && (
          <TouchableOpacity style={styles.notifBadge} onPress={() => setShowNotifs(!showNotifs)}>
            <Text style={styles.notifBadgeText}>🔔 {unread}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.memberSince}>BOC Customer</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.blue }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: COLORS.green }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.notifHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {notifs.length > 0 && (
            <View style={styles.notifActions}>
              <TouchableOpacity onPress={handleMarkRead}><Text style={styles.notifAction}>Mark read</Text></TouchableOpacity>
              <Text style={styles.notifDot}>·</Text>
              <TouchableOpacity onPress={handleClear}><Text style={styles.notifAction}>Clear</Text></TouchableOpacity>
            </View>
          )}
        </View>

        {notifs.length === 0 ? (
          <View style={styles.noNotif}>
            <Text style={styles.noNotifIcon}>🔔</Text>
            <Text style={styles.noNotifText}>No notifications yet</Text>
          </View>
        ) : (
          notifs.slice(0, 20).map(n => (
            <View key={n.id} style={[styles.notifCard, !n.read && styles.notifUnread]}>
              <View style={styles.notifDotCol}>
                {!n.read && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{n.title}</Text>
                <Text style={styles.notifMsg}>{n.message}</Text>
                <Text style={styles.notifTime}>
                  {n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>BOC Queue System v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  notifBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  notifBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  profileCard: { alignItems: 'center', marginTop: -32, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 20, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 18, fontWeight: '700', color: COLORS.dark },
  memberSince: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.teal },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '600' },
  divider: { width: 1, height: 28, backgroundColor: '#E0E0E0' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  notifActions: { flexDirection: 'row', gap: 6 },
  notifAction: { fontSize: 12, color: COLORS.teal, fontWeight: '600' },
  notifDot: { fontSize: 12, color: COLORS.gray },
  noNotif: { alignItems: 'center', padding: 24, backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 14 },
  noNotifIcon: { fontSize: 32, marginBottom: 8 },
  noNotifText: { fontSize: 13, color: COLORS.gray },
  notifCard: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 6, padding: 14, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.teal },
  notifDotCol: { width: 16, justifyContent: 'flex-start', alignItems: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal, marginTop: 6 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  notifMsg: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  notifTime: { fontSize: 10, color: '#B0BEC5', marginTop: 4 },
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.redSoft },
  logoutIcon: { fontSize: 16, marginRight: 8 },
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.red },
  version: { textAlign: 'center', fontSize: 10, color: COLORS.gray, marginTop: 16 },
});
