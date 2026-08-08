import React, { useState, useContext, useCallback } from 'react'; // Import React and hooks
import { // Import React Native components
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import local storage
import { useFocusEffect } from '@react-navigation/native'; // Import navigation focus hook
import { AuthContext } from '../context/AuthContext'; // Import authentication context from correct path
import { getMyTokensAPI } from '../api';
import { COLORS } from '../config';
import { getNotifications, getUnreadCount, markAllRead, clearNotifications } from '../notifications'; // Import notification helpers

export default function ProfileScreen() { // Profile screen component
  const { signOut } = useContext(AuthContext); // Destructure signOut from auth context
  const [name, setName] = useState(''); // State for customer name
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 }); // State for token statistics
  const [notifs, setNotifs] = useState([]); // State for notification list
  const [unread, setUnread] = useState(0); // State for unread notification count
  const [showNotifs, setShowNotifs] = useState(false); // State to toggle notification visibility
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh

  useFocusEffect(useCallback(() => { loadData(); }, [])); // Load data when screen gains focus

  const loadData = async () => { // Fetch all profile data
    const n = await AsyncStorage.getItem('customerName'); // Get stored customer name
    setName(n || 'Customer'); // Default to 'Customer' if none
    const cid = await AsyncStorage.getItem('customerId'); // Get customer ID
    try { // Attempt API call
      const res = await getMyTokensAPI(); // GET all tokens
      if (res.data.success) { // Check response success
        setStats({ // Update stats with computed values
          total: res.data.tokens.length, // Total token count
          active: res.data.tokens.filter(t => t.status === 'pending' || t.status === 'waiting' || t.status === 'serving').length, // Active count
          completed: res.data.tokens.filter(t => t.status === 'completed').length, // Completed count
        });
      }
    } catch (e) { /* skip */ } // Silently ignore errors
    const allNotifs = await getNotifications(); // Get stored notifications
    setNotifs(allNotifs); // Set notification list
    setUnread(allNotifs.filter(n => !n.read).length); // Count unread notifications
    setRefreshing(false); // Stop refresh indicator
  };

  const handleMarkRead = async () => { // Mark all notifications as read
    await markAllRead(); // Call storage helper
    setNotifs(prev => prev.map(n => ({ ...n, read: true }))); // Update local state
    setUnread(0); // Reset unread count
  };

  const handleClear = () => { // Show confirmation to clear all notifications
    Alert.alert('Clear All', 'Remove all notifications?', [ // Confirmation dialog
      { text: 'Cancel', style: 'cancel' }, // Cancel button
      { text: 'Clear', style: 'destructive', onPress: async () => { // Destructive clear
        await clearNotifications(); // Call storage helper
        setNotifs([]); setUnread(0); // Reset local state
      }},
    ]);
  };

  const handleLogout = () => { // Show confirmation to sign out
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [ // Confirmation dialog
      { text: 'Cancel', style: 'cancel' }, // Cancel button
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() }, // Destructive sign out
    ]);
  };

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'; // Generate avatar initials from name

  return ( // Main UI render
    <View style={styles.container}>
      {/* Screen container */}
      <View style={styles.header}>
        {/* Header with notification badge */}
        <Text style={styles.headerTitle}>Profile</Text>
        {/* Header title */}
        {unread > 0 && ( // Show badge only if unread exists
          <TouchableOpacity style={styles.notifBadge} onPress={() => setShowNotifs(!showNotifs)}>
            {/* Toggle notifications */}
            <Text style={styles.notifBadgeText}>🔔 {unread}</Text>
          {/* Bell icon with count */}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Bottom padding */}
        {/* Profile Card */}
        {/* Profile card section label */}
        <View style={styles.profileCard}>
          {/* Profile card container */}
          <View style={styles.avatar}>
            {/* Avatar circle */}
            <Text style={styles.avatarText}>{initials}</Text>
          {/* Initials text */}
          </View>
          <Text style={styles.name}>{name}</Text>
          {/* Customer name */}
          <Text style={styles.memberSince}>BOC Customer</Text>
        {/* Membership label */}
        </View>

        {/* Stats */}
        {/* Stats section label */}
        <View style={styles.statsRow}>
          {/* Stats row container */}
          <View style={styles.statItem}>
            {/* Total stat */}
            <Text style={styles.statNum}>{stats.total}</Text>
            {/* Total count */}
            <Text style={styles.statLabel}>Total</Text>
          {/* Label */}
          </View>
          <View style={styles.divider} />
          {/* Vertical divider */}
          <View style={styles.statItem}>
            {/* Active stat */}
            <Text style={[styles.statNum, { color: COLORS.blue }]}>{stats.active}</Text>
            {/* Active count in blue */}
            <Text style={styles.statLabel}>Active</Text>
          {/* Label */}
          </View>
          <View style={styles.divider} />
          {/* Vertical divider */}
          <View style={styles.statItem}>
            {/* Completed stat */}
            <Text style={[styles.statNum, { color: COLORS.green }]}>{stats.completed}</Text>
            {/* Completed count in green */}
            <Text style={styles.statLabel}>Done</Text>
          {/* Label */}
          </View>
        </View>

        {/* Notifications Section */}
        {/* Notifications section label */}
        <View style={styles.notifHeader}>
          {/* Notification header row */}
          <Text style={styles.sectionTitle}>Notifications</Text>
          {/* Section heading */}
          {notifs.length > 0 && ( // Show actions if notifications exist
            <View style={styles.notifActions}>
              {/* Action buttons row */}
              <TouchableOpacity onPress={handleMarkRead}><Text style={styles.notifAction}>Mark read</Text></TouchableOpacity>
              {/* Mark all as read */}
              <Text style={styles.notifDot}>·</Text>
              {/* Dot separator */}
              <TouchableOpacity onPress={handleClear}><Text style={styles.notifAction}>Clear</Text></TouchableOpacity>
            {/* Clear all */}
            </View>
          )}
        </View>

        {notifs.length === 0 ? ( // Show empty state if no notifications
          <View style={styles.noNotif}>
            {/* Empty container */}
            <Text style={styles.noNotifIcon}>🔔</Text>
            {/* Bell icon */}
            <Text style={styles.noNotifText}>No notifications yet</Text>
          {/* Empty text */}
          </View>
        ) : ( // Render notification list
          notifs.slice(0, 20).map(n => ( // Show up to 20 notifications
            <View key={n.id} style={[styles.notifCard, !n.read && styles.notifUnread]}>
              {/* Card with unread indicator */}
              <View style={styles.notifDotCol}>
                {/* Unread dot column */}
                {!n.read && <View style={styles.unreadDot} />}
              {/* Green dot if unread */}
              </View>
              <View style={styles.notifContent}>
                {/* Notification text content */}
                <Text style={styles.notifTitle}>{n.title}</Text>
                {/* Title */}
                <Text style={styles.notifMsg}>{n.message}</Text>
                {/* Message body */}
                <Text style={styles.notifTime}>
                  {/* Timestamp */}
                  {n.timestamp ? new Date(n.timestamp).toLocaleString() : ''} // Formatted timestamp
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Sign Out */}
        {/* Sign out section label */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          {/* Logout button */}
          <Text style={styles.logoutIcon}>🚪</Text>
          {/* Door icon */}
          <Text style={styles.logoutText}>Sign Out</Text>
        {/* Label */}
        </TouchableOpacity>

        <Text style={styles.version}>BOC Queue System v1.0.0</Text>
      {/* Version info */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ // Style definitions
  container: { flex: 1, backgroundColor: COLORS.surface }, // Full screen surface background
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, // Teal header with notification badge
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white }, // Header title
  notifBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }, // Semi-transparent notification badge
  notifBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' }, // Badge text
  profileCard: { alignItems: 'center', marginTop: -32, marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 20, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }, // Profile card overlapping header
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.teal, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }, // Avatar circle
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.white }, // Avatar initials
  name: { fontSize: 18, fontWeight: '700', color: COLORS.dark }, // Customer name
  memberSince: { fontSize: 11, color: COLORS.gray, marginTop: 2 }, // Membership label
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, alignItems: 'center' }, // Stats bar
  statItem: { flex: 1, alignItems: 'center' }, // Stat item centered
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.teal }, // Stat number
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '600' }, // Stat label
  divider: { width: 1, height: 28, backgroundColor: '#E0E0E0' }, // Vertical divider
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 20, marginBottom: 8 }, // Notification header row
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark }, // Section heading
  notifActions: { flexDirection: 'row', gap: 6 }, // Action buttons row
  notifAction: { fontSize: 12, color: COLORS.teal, fontWeight: '600' }, // Action link
  notifDot: { fontSize: 12, color: COLORS.gray }, // Separator dot
  noNotif: { alignItems: 'center', padding: 24, backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 14 }, // Empty notifications
  noNotifIcon: { fontSize: 32, marginBottom: 8 }, // Empty icon
  noNotifText: { fontSize: 13, color: COLORS.gray }, // Empty text
  notifCard: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 6, padding: 14, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, // Notification card
  notifUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.teal }, // Unread indicator
  notifDotCol: { width: 16, justifyContent: 'flex-start', alignItems: 'center' }, // Dot column
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.teal, marginTop: 6 }, // Unread dot
  notifContent: { flex: 1 }, // Notification text area
  notifTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark }, // Notification title
  notifMsg: { fontSize: 12, color: COLORS.gray, marginTop: 2 }, // Notification message
  notifTime: { fontSize: 10, color: '#B0BEC5', marginTop: 4 }, // Timestamp
  logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1, borderColor: COLORS.redSoft }, // Logout button outline
  logoutIcon: { fontSize: 16, marginRight: 8 }, // Logout icon
  logoutText: { fontSize: 14, fontWeight: '700', color: COLORS.red }, // Logout text
  version: { textAlign: 'center', fontSize: 10, color: COLORS.gray, marginTop: 16 }, // Version text
});
