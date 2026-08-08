import React, { useState, useEffect, useRef } from 'react'; // Import React and hooks
import { // Import React Native components
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import local storage
import { io } from 'socket.io-client'; // Import Socket.IO client for real-time updates
import { getMyTokensAPI, cancelTokenAPI } from '../api';
import { SOCKET, COLORS } from '../config';
import { addNotification } from '../notifications'; // Import notification helper

const STATUS = { // Define visual metadata for each token status
  completed: { color: COLORS.green, bg: COLORS.greenSoft, icon: '✓', label: 'Completed' }, // Green for completed
  cancelled: { color: COLORS.red, bg: COLORS.redSoft, icon: '✕', label: 'Cancelled' }, // Red for cancelled
  pending: { color: COLORS.gray, bg: '#ECEFF1', icon: '⏰', label: 'Pending Approval' }, // Gray for pending
  waiting: { color: COLORS.accent, bg: COLORS.accentSoft, icon: '⏳', label: 'Waiting' }, // Accent for waiting
  serving: { color: COLORS.blue, bg: COLORS.blueSoft, icon: '●', label: 'Being Served' }, // Blue for serving
};

export default function TokenDetailsScreen({ route, navigation }) { // Token detail view component
  const { token: initialToken } = route.params; // Extract initial token from navigation params
  const [token, setToken] = useState(initialToken); // State for token data (starts with initial)
  const [cancelling, setCancelling] = useState(false); // State for cancellation in progress
  const intervalRef = useRef(null); // Ref to hold polling interval
  const socketRef = useRef(null); // Ref to hold socket connection

  const tokenId = token.token_id || token.id; // Normalize token ID field
  const meta = STATUS[token.status] || STATUS.waiting; // Get status metadata, default to waiting

  useEffect(() => { // Setup socket listener for real-time updates
    socketRef.current = io(SOCKET); // Connect to Socket.IO server
    socketRef.current.on('TOKEN_STATUS_CHANGE', (data) => { // Listen for status changes
      if (data.token_id === tokenId) { // Only update if this token's ID matches
        setToken(prev => ({ ...prev, status: data.status, token_number: data.token_number || prev.token_number, counter_name: data.counter_name || prev.counter_name })); // Merge updated fields
      }
    });
    return () => { if (socketRef.current) socketRef.current.disconnect(); }; // Cleanup on unmount
  }, [tokenId]); // Re-run if tokenId changes

  useEffect(() => { // Setup polling as fallback for updates
    const iv = setInterval(async () => { // Create 5-second polling interval
      try { // Attempt API call
        const cid = await AsyncStorage.getItem('customerId'); // Get customer ID
        const res = await getMyTokensAPI(); // Fetch all tokens
        if (res.data.success) { // Check response success
          const updated = res.data.tokens.find(t => (t.token_id || t.id) === tokenId); // Find this token in response
          if (updated) setToken(updated); // Update state if found
        }
      } catch (e) { /* skip */ } // Silently ignore errors
    }, 5000); // Poll every 5 seconds
    intervalRef.current = iv; // Store interval ref
    return () => clearInterval(iv); // Cleanup interval on unmount
  }, [tokenId]); // Re-run if tokenId changes

  const handleCancel = () => { // Show confirmation to cancel this token
    Alert.alert('Cancel Token', `Cancel ${token.token_number}? This cannot be undone.`, [ // Confirmation dialog
      { text: 'No', style: 'cancel' }, // Keep button
      { text: 'Cancel Token', style: 'destructive', onPress: async () => { // Destructive cancel
        setCancelling(true); // Show loading state
        try { // Attempt cancellation
          const res = await cancelTokenAPI(tokenId); // POST to cancel endpoint
          if (res.data.success) { // Check success
            setToken({ ...token, status: 'cancelled' }); // Update local token status
            await addNotification('Token Cancelled', `${token.token_number} has been cancelled`, token.token_number, 'cancelled'); // Show notification
          } else { // Server reported failure
            Alert.alert('Error', res.data.message || 'Failed to cancel'); // Show error
          }
        } catch (e) { // Network error
          Alert.alert('Error', e.response?.data?.message || 'Failed to cancel'); // Show error
        } finally { setCancelling(false); } // Hide loading state
      }},
    ]);
  };

  const steps = [ // Define progress tracker steps
    { label: 'Requested', done: token.status !== 'pending' }, // First step: done if not pending
    { label: 'Serving', done: token.status === 'serving' || token.status === 'completed' }, // Second step: done if serving or completed
    { label: 'Completed', done: token.status === 'completed' }, // Third step: done only if completed
  ];

  return ( // Main UI render
    <View style={styles.container}>
      {/* Screen container */}
      <View style={styles.header}>
        {/* Header with back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          {/* Back navigation button */}
          <Text style={styles.backText}>←</Text>
        {/* Arrow icon */}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Token Details</Text>
      {/* Header title */}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Scrollable content */}
        {/* Hero */}
        {/* Hero section label */}
        <View style={styles.heroCard}>
          {/* Hero card container */}
          <View style={[styles.heroCircle, { backgroundColor: meta.bg }]}>
            {/* Colored circle background */}
            <Text style={styles.heroIcon}>{meta.icon}</Text>
          {/* Status icon */}
          </View>
          <Text style={styles.heroNum}>{token.token_number}</Text>
          {/* Large token number */}
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            {/* Status badge pill */}
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.icon} {meta.label}</Text>
          {/* Status text with icon */}
          </View>
          {token.queue_position > 0 && token.status === 'waiting' && ( // Show queue position if waiting
            <Text style={styles.queuePos}>Position in queue: #{token.queue_position}</Text>
          )}
          {token.status === 'pending' && ( // Show pending message
            <Text style={[styles.queuePos, { color: COLORS.gray }]}>⏰ Awaiting staff to generate your token number</Text>
          )}
        </View>

        {/* Progress Tracker */}
        {/* Progress tracker section label */}
        <Text style={styles.sectionTitle}>Progress</Text>
        {/* Section heading */}
        <View style={styles.trackCard}>
          {/* Tracker card container */}
          {steps.map((s, i) => ( // Render each step
            <React.Fragment key={s.label}>
              {/* Fragment for each step + connecting line */}
              <View style={styles.trackStep}>
                {/* Step container */}
                <View style={[styles.trackDot, s.done ? styles.trackDone : styles.trackPending]}>
                  {/* Colored dot based on completion */}
                  <Text style={styles.trackDotText}>{s.done ? '✓' : '○'}</Text>
                {/* Checkmark or circle */}
                </View>
                <Text style={[styles.trackLabel, s.done && styles.trackLabelDone]}>{s.label}</Text>
              {/* Step label, dimmed if not done */}
              </View>
              {i < steps.length - 1 && ( // Render connecting line between steps
                <View style={[styles.trackLine, steps[i + 1].done && styles.trackLineDone]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Details */}
        {/* Details section label */}
        <Text style={styles.sectionTitle}>Details</Text>
        {/* Section heading */}
        <View style={styles.grid}>
          {/* 2-column grid */}
          <View style={styles.gridItem}>
            {/* Counter info */}
            <Text style={styles.gridLabel}>Counter</Text>
            {/* Label */}
            <Text style={styles.gridValue}>{token.counter_name || 'N/A'}</Text>
          {/* Value */}
          </View>
          <View style={styles.gridItem}>
            {/* Status info */}
            <Text style={styles.gridLabel}>Status</Text>
            {/* Label */}
            <Text style={[styles.gridValue, { color: meta.color }]}>{meta.label}</Text>
          {/* Colored status value */}
          </View>
          <View style={styles.gridItem}>
            {/* Date info */}
            <Text style={styles.gridLabel}>Date</Text>
            {/* Label */}
            <Text style={styles.gridValue}>{token.created_at ? new Date(token.created_at).toLocaleDateString() : '-'}</Text>
          {/* Formatted date */}
          </View>
          <View style={styles.gridItem}>
            {/* Time info */}
            <Text style={styles.gridLabel}>Time</Text>
            {/* Label */}
            <Text style={styles.gridValue}>{token.created_at ? new Date(token.created_at).toLocaleTimeString() : '-'}</Text>
          {/* Formatted time */}
          </View>
        </View>

        {/* Cancel */}
        {/* Cancel section label */}
        {(token.status === 'waiting' || token.status === 'pending') && ( // Only show for cancellable statuses
          <TouchableOpacity style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
            onPress={handleCancel} disabled={cancelling}>
            {/* Disable during cancellation */}
            {cancelling ? ( // Show spinner while cancelling
              <ActivityIndicator color={COLORS.red} />
            ) : ( // Show text normally
              <Text style={styles.cancelText}>Cancel This Token</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ // Style definitions
  container: { flex: 1, backgroundColor: COLORS.surface }, // Full screen surface background
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }, // Teal header with back button and title
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 }, // Semi-transparent back button
  backText: { fontSize: 16, color: COLORS.white, fontWeight: '700' }, // Back arrow text
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white, flex: 1 }, // Header title
  content: { padding: 16, paddingBottom: 32 }, // Content padding
  heroCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }, // White hero card
  heroCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }, // Status icon circle
  heroIcon: { fontSize: 30 }, // Status icon size
  heroNum: { fontSize: 30, fontWeight: '900', color: COLORS.dark, letterSpacing: 1 }, // Token number in hero
  statusPill: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 14, marginTop: 10 }, // Status badge pill
  statusText: { fontSize: 13, fontWeight: '700' }, // Status text
  queuePos: { fontSize: 14, fontWeight: '700', color: COLORS.teal, marginTop: 10 }, // Queue position text
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginTop: 20, marginBottom: 10 }, // Section heading
  trackCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, // Progress tracker card
  trackStep: { alignItems: 'center' }, // Step column
  trackDot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }, // Step dot
  trackDone: { backgroundColor: COLORS.green }, // Completed step green
  trackPending: { backgroundColor: '#E0E0E0' }, // Incomplete step gray
  trackDotText: { fontSize: 12, color: COLORS.white, fontWeight: '700' }, // Dot text
  trackLabel: { fontSize: 10, fontWeight: '600', color: COLORS.gray }, // Step label
  trackLabelDone: { color: COLORS.green }, // Completed label green
  trackLine: { width: 24, height: 2, backgroundColor: '#E0E0E0', marginBottom: 20 }, // Connecting line
  trackLineDone: { backgroundColor: COLORS.green }, // Completed line green
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, // 2-column grid
  gridItem: { width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, // Grid item card
  gridLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, // Grid label
  gridValue: { fontSize: 14, fontWeight: '700', color: COLORS.dark }, // Grid value
  cancelBtn: { padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 20, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.redSoft }, // Cancel button outline
  cancelText: { color: COLORS.red, fontWeight: '700', fontSize: 14 }, // Cancel text
});
