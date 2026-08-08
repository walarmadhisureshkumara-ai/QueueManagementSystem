import React, { useState, useCallback, useRef, useEffect } from 'react'; // Import React and hooks
import { // Import React Native components
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import local storage
import { useFocusEffect } from '@react-navigation/native'; // Import navigation focus hook
import { io } from 'socket.io-client'; // Import Socket.IO client for real-time updates
import { getMyTokensAPI } from '../api';
import { SOCKET, COLORS } from '../config';

export default function QueueHistoryScreen({ navigation }) { // Queue history screen component
  const [tokens, setTokens] = useState([]); // State for list of all tokens
  const [loading, setLoading] = useState(true); // State for initial loading indicator
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh indicator
  const [filter, setFilter] = useState('all'); // State for active filter tab
  const socketRef = useRef(null); // Ref to hold socket connection

  useEffect(() => { // Setup socket connection on mount
    socketRef.current = io(SOCKET); // Connect to Socket.IO server
    socketRef.current.on('TOKEN_STATUS_CHANGE', loadTokens); // Reload on status change
    socketRef.current.on('NEW_STAFF_NOTIFICATION', loadTokens); // Reload on staff notification
    return () => { if (socketRef.current) socketRef.current.disconnect(); }; // Cleanup on unmount
  }, []); // Empty dependency array — run once

  useFocusEffect(useCallback(() => { loadTokens(); }, [])); // Load tokens when screen gains focus

  const loadTokens = async () => { // Fetch tokens from API
    const cid = await AsyncStorage.getItem('customerId'); // Get customer ID from storage
    if (!cid) return; // Exit if no customer ID
    try { // Attempt API call
      const res = await getMyTokensAPI(); // GET all tokens for customer
      if (res.data.success) setTokens(res.data.tokens); // Update tokens state
    } catch (e) { /* skip */ } // Silently ignore errors
    finally { setLoading(false); setRefreshing(false); } // Stop loading/refreshing
  };

  const statusMeta = (status) => ({ // Map status to visual metadata
    completed: { color: COLORS.green, bg: COLORS.greenSoft, icon: '✓' }, // Green for completed
    cancelled: { color: COLORS.red, bg: COLORS.redSoft, icon: '✕' }, // Red for cancelled
    pending: { color: COLORS.gray, bg: '#ECEFF1', icon: '⏰' }, // Gray for pending
    waiting: { color: COLORS.accent, bg: COLORS.accentSoft, icon: '⏳' }, // Accent for waiting
    serving: { color: COLORS.blue, bg: COLORS.blueSoft, icon: '●' }, // Blue for serving
  })[status] || { color: COLORS.gray, bg: '#ECEFF1', icon: '?' }; // Fallback for unknown

  const filtered = filter === 'all' ? tokens : tokens.filter(t => t.status === filter); // Apply status filter
  const sorted = [...filtered].sort((a, b) => b.token_id - a.token_id); // Sort newest first

  const tabs = [ // Define filter tab options
    { key: 'all', label: 'All' }, // Show all tokens
    { key: 'pending', label: '⏰' }, // Filter by pending
    { key: 'waiting', label: '⏳' }, // Filter by waiting
    { key: 'serving', label: '●' }, // Filter by serving
    { key: 'completed', label: '✓' }, // Filter by completed
    { key: 'cancelled', label: '✕' }, // Filter by cancelled
  ];

  return ( // Main UI render
    <View style={styles.container}>
      {/* Screen container */}
      <View style={styles.header}>
        {/* Header section */}
        <Text style={styles.headerTitle}>Queue Details</Text>
        {/* Header title */}
        <Text style={styles.headerSub}>Track all your token history</Text>
      {/* Header subtitle */}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {/* Horizontal tab scroll */}
        <View style={styles.tabRow}>
          {/* Tab row container */}
          {tabs.map(tab => ( // Render each filter tab
            <TouchableOpacity key={tab.key}
              style={[styles.tab, filter === tab.key && styles.tabActive]} // Highlight active tab
              onPress={() => setFilter(tab.key)}>
              {/* Set filter on press */}
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            {/* Tab label */}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTokens(); }} />}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Bottom padding */}
        {loading ? ( // Show spinner while loading
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 40 }} />
        ) : sorted.length === 0 ? ( // Show empty state if no tokens match filter
          <View style={styles.empty}>
            {/* Empty state container */}
            <Text style={styles.emptyIcon}>📋</Text>
            {/* Empty icon */}
            <Text style={styles.emptyTitle}>No Tokens</Text>
            {/* Empty title */}
            <Text style={styles.emptySub}>Get a token from Home to start</Text>
          {/* Instruction */}
          </View>
        ) : ( // Render token list
          sorted.map(token => { // Map each token to a card
            const m = statusMeta(token.status); // Get status metadata
            const timeAgo = token.created_at ? (() => { // Calculate relative time
              const diff = Date.now() - new Date(token.created_at).getTime(); // Time difference in ms
              const min = Math.floor(diff / 60000); // Convert to minutes
              return min < 1 ? 'Just now' : min < 60 ? `${min}m ago` : `${Math.floor(min / 60)}h ago`; // Format relative time
            })() : ''; // Empty string if no timestamp
            return ( // Token card (touchable)
              <TouchableOpacity key={token.token_id} style={styles.queueCard}
                onPress={() => navigation.navigate('TokenDetails', { token })}>
                {/* Navigate to details */}
                <View style={[styles.sidebar, { backgroundColor: m.color }]} />
                {/* Colored sidebar */}
                <View style={styles.content}>
                  {/* Card content */}
                  <View style={styles.topRow}>
                    {/* Top row with token number and time */}
                    <Text style={styles.tokenNum}>{token.token_number}</Text>
                    {/* Token number */}
                    {token.queue_position > 0 && token.status === 'waiting' && ( // Show queue position badge
                      <View style={styles.posBadge}><Text style={styles.posText}>#{token.queue_position}</Text></View>
                    )}
                    <Text style={styles.timeAgo}>{timeAgo}</Text>
                  {/* Relative time */}
                  </View>
                  <View style={styles.bottomRow}>
                    {/* Bottom row with counter and status */}
                    <Text style={styles.counterName}>{token.counter_name}</Text>
                    {/* Counter name */}
                    <View style={[styles.pill, { backgroundColor: m.bg }]}>
                      {/* Status pill */}
                      <Text style={[styles.pillText, { color: m.color }]}>{m.icon} {statusMeta(token.status).icon === '✓' ? 'Done' : statusMeta(token.status).icon === '✕' ? 'Cancelled' : statusMeta(token.status).icon === '⏳' ? 'Waiting' : statusMeta(token.status).icon === '●' ? 'Serving' : token.status}</Text>
                    {/* Human-readable status */}
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

const styles = StyleSheet.create({ // Style definitions
  container: { flex: 1, backgroundColor: COLORS.surface }, // Full screen surface background
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }, // Teal header
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white }, // Header title
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }, // Header subtitle
  tabScroll: { maxHeight: 48, marginTop: 12 }, // Horizontal tab scroll constraints
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 }, // Tab row layout
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, // Tab pill
  tabActive: { backgroundColor: COLORS.teal }, // Active tab background
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray }, // Inactive tab text
  tabTextActive: { color: COLORS.white }, // Active tab text
  empty: { alignItems: 'center', marginTop: 60 }, // Empty state centering
  emptyIcon: { fontSize: 48, marginBottom: 12 }, // Empty icon
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.dark }, // Empty title
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 4 }, // Empty subtitle
  queueCard: { flexDirection: 'row', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 8, borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, // Token card with sidebar
  sidebar: { width: 4 }, // Colored status sidebar
  content: { flex: 1, padding: 14 }, // Card content area
  topRow: { flexDirection: 'row', alignItems: 'center' }, // Top info row
  tokenNum: { fontSize: 17, fontWeight: '800', color: COLORS.dark, flex: 1 }, // Token number
  posBadge: { backgroundColor: COLORS.tealSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }, // Queue position badge
  posText: { color: COLORS.teal, fontSize: 11, fontWeight: '700' }, // Position text
  timeAgo: { fontSize: 10, color: COLORS.gray }, // Relative time text
  bottomRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 }, // Bottom info row
  counterName: { fontSize: 12, color: COLORS.gray, flex: 1 }, // Counter name
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 }, // Status pill
  pillText: { fontSize: 10, fontWeight: '700' }, // Pill text
});
