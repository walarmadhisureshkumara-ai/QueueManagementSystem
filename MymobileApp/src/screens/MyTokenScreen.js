import React, { useState, useCallback, useRef, useEffect } from 'react'; // Import React and hooks
import { // Import React Native components
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import local storage for persistent data
import { useFocusEffect } from '@react-navigation/native'; // Import navigation focus hook
import { io } from 'socket.io-client'; // Import Socket.IO client for real-time updates
import { getMyTokensAPI, cancelTokenAPI } from '../api';
import { SOCKET, COLORS } from '../config';
import { addNotification } from '../notifications'; // Import notification helper

export default function MyTokenScreen({ navigation }) { // Main component for viewing user's tokens
  const [tokens, setTokens] = useState([]); // State for list of tokens
  const [loading, setLoading] = useState(true); // State for initial loading indicator
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh indicator
  const socketRef = useRef(null); // Ref to hold socket connection instance

  useEffect(() => { // Setup socket connection on mount
    socketRef.current = io(SOCKET); // Connect to Socket.IO server
    socketRef.current.on('TOKEN_STATUS_CHANGE', (data) => { // Listen for token status changes
      loadTokens(); // Reload tokens on status change

      {/* If this was a pending→waiting transition, show the new token number */}
      if (data.token_number) { // Check if token number is included
        addNotification('Token Generated', `Your token ${data.token_number} is ready`, data.token_number, 'waiting'); // Show local notification
      }
    });
    socketRef.current.on('NEW_STAFF_NOTIFICATION', loadTokens); // Reload tokens on staff updates
    return () => { if (socketRef.current) socketRef.current.disconnect(); }; // Cleanup: disconnect socket on unmount
  }, []); // Empty dependency array — run once

  useFocusEffect(useCallback(() => { loadTokens(); }, [])); // Reload tokens when screen gains focus

  const loadTokens = async () => { // Fetch tokens from API
    const cid = await AsyncStorage.getItem('customerId'); // Get customer ID from local storage
    if (!cid) return; // Exit if no customer ID found
    try { // Attempt API call
      const res = await getMyTokensAPI(); // GET tokens for this customer
      if (res.data.success) setTokens(res.data.tokens); // Update tokens state with response data
    } catch (e) { /* skip */ } // Silently ignore errors
    finally { setLoading(false); setRefreshing(false); } // Stop loading/refreshing indicators
  };

  const handleCancel = (token) => { // Show confirmation alert to cancel a token
    Alert.alert('Cancel Token', `Cancel ${token.token_number}?`, [ // Confirmation dialog
      { text: 'Keep', style: 'cancel' }, // Keep button (cancel action)
      { text: 'Cancel Token', style: 'destructive', onPress: async () => { // Destructive cancel button
        try { // Attempt cancellation API call
          const res = await cancelTokenAPI(token.token_id); // POST to cancel endpoint
          if (res.data.success) { // Check if cancellation succeeded
            await addNotification('Token Cancelled', `${token.token_number} has been cancelled`, token.token_number, 'cancelled'); // Show notification
            loadTokens(); // Reload tokens to reflect change
          } else { // Server reported failure
            Alert.alert('Error', res.data.message || 'Failed to cancel token'); // Show error
          }
        } catch (e) { // Network or server error
          Alert.alert('Error', e.response?.data?.message || 'Could not reach server'); // Show error
        }
      }},
    ]);
  };

  const activeTokens = tokens.filter(t => t.status === 'pending' || t.status === 'waiting' || t.status === 'serving') // Filter active statuses
    .sort((a, b) => b.token_id - a.token_id); // Sort newest first
  const historyTokens = tokens.filter(t => t.status === 'completed' || t.status === 'cancelled') // Filter completed/cancelled
    .sort((a, b) => b.token_id - a.token_id); // Sort newest first

  const statusMeta = (status) => ({ // Map status to visual metadata
    completed: { color: COLORS.green, bg: COLORS.greenSoft, icon: '✓', label: 'Completed' }, // Green for completed
    cancelled: { color: COLORS.red, bg: COLORS.redSoft, icon: '✕', label: 'Cancelled' }, // Red for cancelled
    pending: { color: COLORS.gray, bg: '#ECEFF1', icon: '⏰', label: 'Pending' }, // Gray for pending
    waiting: { color: COLORS.accent, bg: COLORS.accentSoft, icon: '⏳', label: 'Waiting' }, // Accent for waiting
    serving: { color: COLORS.blue, bg: COLORS.blueSoft, icon: '●', label: 'Serving' }, // Blue for serving
  })[status] || { color: COLORS.gray, bg: '#ECEFF1', icon: '?', label: 'Unknown' }; // Fallback for unknown status

  if (loading) { // Show loading spinner during initial load
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.teal} /></View>;
  {/* Centered spinner */}
  }

  return ( // Main UI render
    <View style={styles.container}>
      {/* Screen container */}
      <View style={styles.header}>
        {/* Header section */}
        <Text style={styles.headerTitle}>My Token</Text>
        {/* Header title */}
        <Text style={styles.headerSub}>{activeTokens.length} active · {historyTokens.length} history</Text>
      {/* Token counts */}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTokens(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Bottom padding */}
        {activeTokens.length === 0 && ( // Show empty state when no active tokens
          <View style={styles.empty}>
            {/* Empty state container */}
            <Text style={styles.emptyIcon}>🎫</Text>
            {/* Empty state icon */}
            <Text style={styles.emptyTitle}>No Active Tokens</Text>
            {/* Empty state title */}
            <Text style={styles.emptySub}>Go to Home and tap "Get New Token"</Text>
            {/* Instruction text */}
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Home')}>
              {/* Navigate to Home */}
              <Text style={styles.emptyBtnText}>Go to Home</Text>
            {/* Button label */}
            </TouchableOpacity>
          </View>
        )}

        {activeTokens.map(token => { // Render each active token
          const m = statusMeta(token.status); // Get status metadata
          return ( // Token card
            <View key={token.token_id} style={styles.tokenCard}>
              {/* Card container */}
              {token.status === 'pending' ? ( // Pending tokens have different layout
                <>
                  <TouchableOpacity onPress={() => navigation.navigate('TokenDetails', { token })}>
                    {/* Navigate to details */}
                    <View style={styles.pendingHero}>
                      {/* Pending hero section */}
                      <Text style={styles.pendingIcon}>⏰</Text>
                      {/* Clock icon */}
                      <Text style={styles.pendingTitle}>Request Submitted</Text>
                      {/* Status title */}
                      <Text style={styles.pendingSub}>Staff is reviewing your request</Text>
                    {/* Status description */}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelPendingBtn} onPress={() => handleCancel(token)}>
                    {/* Cancel button for pending */}
                    <Text style={styles.cancelBtnText}>Cancel Request</Text>
                  {/* Cancel label */}
                  </TouchableOpacity>
                  <Text style={styles.timeText}>{token.created_at ? new Date(token.created_at).toLocaleString() : ''}</Text>
                {/* Timestamp */}
                </>
              ) : ( // Non-pending tokens (waiting/serving)
                <>
                  <TouchableOpacity onPress={() => navigation.navigate('TokenDetails', { token })}>
                    {/* Navigate to details */}
                    <Text style={styles.yourTokenLabel}>YOUR TOKEN NUMBER</Text>
                    {/* Label above token number */}
                    <View style={styles.tokenHero}>
                      {/* Token hero row */}
                      <Text style={styles.tokenNumLarge}>{token.token_number}</Text>
                      {/* Large token number */}
                      <View style={[styles.statusBadge, { backgroundColor: m.bg }]}>
                        {/* Status badge with colored background */}
                        <Text style={[styles.statusBadgeText, { color: m.color }]}>{m.icon} {m.label}</Text>
                      {/* Status icon + label */}
                      </View>
                    </View>
                    <View style={styles.tokenInfoRow}>
                      {/* Info row with counter and queue position */}
                      <View style={styles.infoItem}>
                        {/* Counter info */}
                        <Text style={styles.infoLabel}>Counter</Text>
                        {/* Label */}
                        <Text style={styles.infoValue}>{token.counter_name}</Text>
                      {/* Counter name value */}
                      </View>
                      <View style={styles.infoItem}>
                        {/* Queue status info */}
                        <Text style={styles.infoLabel}>Queue Status</Text>
                        {/* Label */}
                        <Text style={[styles.infoValue, { color: token.queue_position > 0 ? COLORS.teal : COLORS.gray }]}>
                          {/* Color based on position */}
                          {token.status === 'serving' ? 'Being Served Now' : // Serving text
                           token.queue_position > 0 ? `#${token.queue_position} in queue` : // Position text
                           token.queue_position === 0 && token.status === 'waiting' ? 'You are next!' : // Next in line
                           '-'} // Fallback dash
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {token.status === 'waiting' && ( // Show cancel button only for waiting tokens
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(token)}>
                      {/* Cancel button */}
                      <Text style={styles.cancelBtnText}>Cancel Token</Text>
                    {/* Cancel label */}
                    </TouchableOpacity>
                  )}
                  <Text style={styles.timeText}>{token.created_at ? new Date(token.created_at).toLocaleString() : ''}</Text>
                {/* Timestamp */}
                </>
              )}
            </View>
          );
        })}

        {historyTokens.length > 0 && ( // Show history section if any completed/cancelled tokens exist
          <>
            <Text style={styles.sectionTitle}>History</Text>
            {/* Section heading */}
            {historyTokens.slice(0, 15).map(token => { // Show up to 15 history items
              const m = statusMeta(token.status); // Get status metadata
              return ( // History card
                <View key={token.token_id} style={styles.historyCard}>
                  {/* Card container */}
                  <Text style={styles.historyNum}>{token.token_number}</Text>
                  {/* Token number */}
                  <Text style={styles.historyCounter}>{token.counter_name}</Text>
                  {/* Counter name */}
                  <View style={[styles.pill, { backgroundColor: m.bg, marginLeft: 'auto' }]}>
                    {/* Status pill pushed right */}
                    <Text style={[styles.pillText, { color: m.color }]}>{m.icon} {m.label}</Text>
                  {/* Icon + label */}
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

const styles = StyleSheet.create({ // Style definitions
  container: { flex: 1, backgroundColor: COLORS.surface }, // Full screen with surface background
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface }, // Centered content
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }, // Teal header with rounded bottom
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white }, // Header title
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }, // Header subtitle
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 }, // Empty state centering
  emptyIcon: { fontSize: 48, marginBottom: 12 }, // Large empty icon
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark }, // Empty title
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 4, textAlign: 'center' }, // Empty subtitle
  emptyBtn: { marginTop: 16, backgroundColor: COLORS.teal, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }, // Empty state button
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 }, // Empty button text
  tokenCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 14, padding: 20, borderRadius: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }, // White token card with shadow
  yourTokenLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }, // Uppercase label above token
  tokenHero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, // Token number row
  tokenNumLarge: { fontSize: 30, fontWeight: '900', color: COLORS.dark, letterSpacing: 2 }, // Large token number
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 }, // Status badge pill
  statusBadgeText: { fontSize: 12, fontWeight: '700' }, // Status text inside badge
  tokenInfoRow: { flexDirection: 'row', gap: 12, marginBottom: 8, backgroundColor: COLORS.surface, borderRadius: 12, padding: 12 }, // Info row background
  infoItem: { flex: 1 }, // Equal width info items
  infoLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }, // Info label
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.dark }, // Info value
  cancelBtn: { backgroundColor: COLORS.redSoft, borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 6 }, // Cancel button for waiting
  cancelPendingBtn: { backgroundColor: COLORS.redSoft, borderRadius: 10, padding: 8, alignItems: 'center', marginTop: 8, marginBottom: 4 }, // Cancel button for pending
  cancelBtnText: { color: COLORS.red, fontWeight: '700', fontSize: 12 }, // Cancel button text
  pendingHero: { alignItems: 'center', paddingVertical: 10 }, // Pending state centered
  pendingIcon: { fontSize: 32, marginBottom: 6 }, // Pending icon
  pendingTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark }, // Pending title
  pendingSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 }, // Pending subtitle
  timeText: { fontSize: 10, color: COLORS.gray, marginTop: 4, textAlign: 'center' }, // Timestamp text
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginHorizontal: 20, marginTop: 24, marginBottom: 6 }, // Section heading
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 6, padding: 12, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, // History card
  historyNum: { fontSize: 16, fontWeight: '800', color: COLORS.dark, width: 65 }, // Fixed width token number
  historyCounter: { fontSize: 12, color: COLORS.gray, flex: 1 }, // Counter name flex fill
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }, // Status pill
  pillText: { fontSize: 11, fontWeight: '700' }, // Pill text
});
