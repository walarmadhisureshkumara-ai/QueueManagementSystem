import React, { useState, useCallback, useRef, useEffect } from 'react'; // Import React core hooks
import { // Import React Native components
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import async storage
import { useFocusEffect } from '@react-navigation/native'; // Import navigation focus hook
import { io } from 'socket.io-client'; // Import Socket.IO client
import { getMyTokensAPI } from '../api';
import { SOCKET, COLORS } from '../config';
import { addNotification, getUnreadCount } from '../notifications'; // Import notification helpers

export default function HomeScreen({ navigation }) { // Home screen component
  const [customerName, setCustomerName] = useState(''); // State for customer display name
  const [tokens, setTokens] = useState([]); // State for list of tokens
  const [loading, setLoading] = useState(true); // State for initial loading indicator
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh indicator
  const [greeting, setGreeting] = useState(''); // State for time-based greeting text
  const [toast, setToast] = useState(null); // State for toast notification message
  const fadeAnim = useRef(new Animated.Value(0)).current; // Ref for toast fade animation value
  const socketRef = useRef(null); // Ref to hold Socket.IO connection instance

  useEffect(() => { // Effect to set greeting based on current hour
    const h = new Date().getHours(); // Get current hour (0-23)
    if (h < 12) setGreeting('Good Morning'); // Before noon: Good Morning
    else if (h < 17) setGreeting('Good Afternoon'); // Before 5 PM: Good Afternoon
    else setGreeting('Good Evening'); // After 5 PM: Good Evening
  }, []);

  useEffect(() => { // Effect to set up Socket.IO listeners
    socketRef.current = io(SOCKET); // Connect to socket server
    socketRef.current.on('TOKEN_STATUS_CHANGE', async (data) => { // Listen for token status changes
      loadTokens(); // Refresh token list
      const cid = await AsyncStorage.getItem('customerId'); // Get current customer ID
      if (String(data.customer_id) === cid) { // Only notify if this token belongs to current user
        const msg = data.status === 'waiting' ? `Token ${data.token_number} is ready!` : // Message for waiting status
                    data.status === 'serving' ? `Token ${data.token_number} is now being served` : // Message for serving status
                    data.status === 'completed' ? `Token ${data.token_number} completed` : // Message for completed status
                    data.status === 'cancelled' ? `Token ${data.token_number} cancelled` : ''; // Message for cancelled status
        if (msg) { // If message is non-empty
          await addNotification('Status Update', msg, data.token_number, data.status); // Persist notification
          showToast(msg); // Show in-app toast
        }
      }
    });
    socketRef.current.on('NEW_STAFF_NOTIFICATION', async (data) => { // Listen for new token generation by staff
      loadTokens(); // Refresh token list
      const cid = await AsyncStorage.getItem('customerId'); // Get current customer ID
      const res = await getMyTokensAPI(); // Fetch latest tokens
      if (res.data.success) { // If API call succeeded
        const latest = res.data.tokens[0]; // Get the most recent token
        if (latest && cid && String(latest.customer_id) === cid) { // Verify token belongs to current user
          await addNotification('Token Generated', `Token ${latest.token_number} created for ${latest.counter_name}`, latest.token_number, 'waiting'); // Persist notification
          showToast(`Token ${latest.token_number} created`); // Show in-app toast
        }
      }
    });
    return () => { if (socketRef.current) socketRef.current.disconnect(); }; // Disconnect socket on unmount
  }, []);

  const showToast = (msg) => { // Show animated toast notification
    setToast(msg); // Set toast message
    Animated.sequence([ // Run animation sequence
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }), // Fade in over 300ms
      Animated.delay(3000), // Hold visible for 3 seconds
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }), // Fade out over 300ms
    ]).start(() => setToast(null)); // After animation, clear toast
  };

  useFocusEffect(useCallback(() => { loadData(); }, [])); // Load data every time screen gains focus

  const loadData = async () => { // Load all screen data
    try {
      const name = await AsyncStorage.getItem('customerName'); // Get customer name from storage
      setCustomerName(name); // Set customer name state
      await loadTokens(); // Load tokens
    } catch (e) { /* skip */ } // Silently handle errors
    finally { setLoading(false); setRefreshing(false); } // Stop loading and refreshing indicators
  };

  const loadTokens = async () => { // Fetch tokens from API
    const cid = await AsyncStorage.getItem('customerId'); // Get customer ID from storage
    if (!cid) return; // Exit if no customer ID found
    try {
      const res = await getMyTokensAPI(); // API call to get tokens
      if (res.data.success) setTokens(res.data.tokens); // Update tokens state on success
    } catch (e) { /* skip */ } // Silently handle errors
  };

  const activeTokens = tokens.filter(t => t.status === 'pending' || t.status === 'waiting' || t.status === 'serving'); // Filter tokens that are still active
  const completedTokens = tokens.filter(t => t.status === 'completed'); // Filter completed tokens
  const nowServing = tokens.find(t => t.status === 'serving'); // Find the token currently being served
  const waitingCount = tokens.filter(t => t.status === 'waiting').length; // Count tokens in waiting status
  const pendingCount = tokens.filter(t => t.status === 'pending').length; // Count tokens in pending status
  const servingCount = tokens.filter(t => t.status === 'serving').length; // Count tokens being served

  return ( // Render the home screen UI
    <View style={styles.container}>
      {/* Root container with surface background */}
      {/* Toast */}
      {toast && ( // Conditionally render toast when message exists
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          {/* Animated toast container */}
          <Text style={styles.toastIcon}>🔔</Text>
          {/* Bell icon */}
          <Text style={styles.toastText}>{toast}</Text>
        {/* Toast message text */}
        </Animated.View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        {/* Scrollable content with pull-to-refresh */}
        {/* Header */}
        <View style={styles.header}>
          {/* Teal header section */}
          <View style={styles.headerTop}>
            {/* Header top row */}
            <View>
              {/* Left side: greeting and customer name */}
              <Text style={styles.greeting}>{greeting},</Text>
              {/* Time-based greeting with comma */}
              <Text style={styles.customerName}>{customerName || 'Customer'}</Text>
            {/* Customer name or fallback */}
            </View>
            <View style={styles.headerRight}>
              {/* Right side: active badge */}
              <View style={styles.badgeCircle}>
                {/* Badge container */}
                <Text style={styles.badgeNum}>{activeTokens.length}</Text>
                {/* Active token count */}
                <Text style={styles.badgeLabel}>Active</Text>
              {/* Label below count */}
              </View>
            </View>
          </View>
          <Text style={styles.headerSub}>BOC Queue Management</Text>
        {/* Subtitle text */}
        </View>

          {/* Serving / Waiting / Pending Banner */}
          {nowServing ? ( // If a token is being served
            <View style={styles.servingCard}>
              {/* Blue-highlighted serving card */}
              <Text style={styles.servingIcon}>🎯</Text>
              {/* Target emoji */}
              <View style={styles.servingInfo}>
                {/* Token info container */}
                <Text style={styles.servingLabel}>Now Serving</Text>
                {/* Label */}
                <Text style={styles.servingToken}>{nowServing.token_number}</Text>
                {/* Token number */}
                <Text style={styles.servingAt}>{nowServing.counter_name}</Text>
              {/* Counter name */}
              </View>
            </View>
          ) : waitingCount > 0 ? ( // Otherwise if tokens are waiting
            <View style={styles.waitingCard}>
              {/* Amber-highlighted waiting card */}
              <Text style={styles.waitingIcon}>⏳</Text>
              {/* Hourglass emoji */}
              <Text style={styles.waitingText}>{waitingCount} token{waitingCount > 1 ? 's' : ''} waiting in queue</Text>
            {/* Waiting count text */}
            </View>
          ) : pendingCount > 0 ? ( // Otherwise if tokens are pending
            <View style={[styles.waitingCard, { borderLeftColor: COLORS.gray }]}>
              {/* Gray-bordered pending card */}
              <Text style={styles.waitingIcon}>⏰</Text>
              {/* Alarm clock emoji */}
              <Text style={styles.waitingText}>Request submitted — waiting for staff to generate token</Text>
            {/* Pending explanation */}
            </View>
          ) : null} // Otherwise render nothing

        {/* Stats */}
        <View style={styles.statsRow}>
          {/* Row of stat cards */}
          <View style={styles.statCard}>
            {/* Pending stat card */}
            <Text style={styles.statNum}>{pendingCount}</Text>
            {/* Pending count */}
            <Text style={styles.statLabel}>Pending</Text>
          {/* Label */}
          </View>
          <View style={styles.statCard}>
            {/* Waiting stat card */}
            <Text style={styles.statNum}>{waitingCount}</Text>
            {/* Waiting count */}
            <Text style={styles.statLabel}>Waiting</Text>
          {/* Label */}
          </View>
          <View style={styles.statCard}>
            {/* Serving stat card */}
            <Text style={[styles.statNum, { color: COLORS.blue }]}>{servingCount}</Text>
            {/* Serving count in blue */}
            <Text style={styles.statLabel}>Serving</Text>
          {/* Label */}
          </View>
          <View style={styles.statCard}>
            {/* Completed stat card */}
            <Text style={[styles.statNum, { color: COLORS.green }]}>{completedTokens.length}</Text>
            {/* Done count in green */}
            <Text style={styles.statLabel}>Done</Text>
          {/* Label */}
          </View>
        </View>

        {/* Get Token CTA */}
        <TouchableOpacity style={styles.ctaCard}
          onPress={() => navigation.navigate('CounterSelection')} // Navigate to counter selection screen
          activeOpacity={0.85}>
          {/* Press opacity feedback */}
          <View style={styles.ctaLeft}>
            {/* Left section with icon and text */}
            <View style={styles.ctaIconBox}>
              {/* Icon box container */}
              <Text style={styles.ctaIcon}>🎫</Text>
            {/* Ticket emoji */}
            </View>
            <View>
              {/* Text section */}
              <Text style={styles.ctaTitle}>Get New Token</Text>
              {/* Title */}
              <Text style={styles.ctaSub}>Select a service counter</Text>
            {/* Subtitle */}
            </View>
          </View>
          <Text style={styles.ctaArrow}>→</Text>
        {/* Right arrow indicator */}
        </TouchableOpacity>

        {/* Latest Token */}
        {activeTokens.length > 0 && (() => { // If active tokens exist, render latest token card
          const latest = activeTokens[activeTokens.length - 1]; // Get the most recent active token
          const isPending = latest.status === 'pending'; // Check if latest token is still pending
          return ( // Render the token card
            <TouchableOpacity style={isPending ? styles.waitingCard : styles.latestCard}
              onPress={() => navigation.navigate('TokenDetails', { token: latest })}>
              {/* Navigate to token details */}
              {isPending ? ( // If token is pending
                <>
                  <Text style={styles.waitingIcon}>⏰</Text>
                  {/* Alarm clock icon */}
                  <Text style={styles.waitingText}>Request submitted — waiting for staff to generate token</Text>
                {/* Pending message */}
                </>
              ) : ( // Otherwise show token details
                <>
                  <Text style={styles.latestLabel}>YOUR TOKEN NUMBER</Text>
                  {/* Section label */}
                  <View style={styles.latestRow}>
                    {/* Row with token number and view link */}
                    <Text style={styles.latestNum}>{latest.token_number}</Text>
                    {/* Token number */}
                    <Text style={styles.latestArrow}>View →</Text>
                  {/* View link */}
                  </View>
                  <Text style={styles.latestCounter}>{latest.counter_name}</Text>
                  {/* Counter name */}
                  <View style={styles.homeQueueRow}>
                    {/* Queue info row */}
                    <Text style={styles.homeQueueText}>
                      {/* Queue position text */}
                      {latest.status === 'serving' ? '● Being served now' : // If serving
                       latest.queue_position > 0 ? `⏳ #${latest.queue_position} in queue` : // If has queue position
                       latest.status === 'waiting' ? '⏳ You are next!' : ''} // If waiting and next
                    </Text>
                    <View style={[styles.homeStatusDot, { backgroundColor: latest.status === 'serving' ? COLORS.blue : COLORS.accent }]} />
                  {/* Status dot colored by state */}
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        })()}

        {/* Info Cards */}
        <View style={styles.infoRow}>
          {/* Row of info cards */}
          <View style={styles.infoCard}>
            {/* Branch hours card */}
            <Text style={styles.infoIcon}>🕐</Text>
            {/* Clock icon */}
            <Text style={styles.infoTitle}>Branch Hours</Text>
            {/* Title */}
            <Text style={styles.infoText}>Mon–Fri  8:30 AM – 3:00 PM</Text>
          {/* Hours text */}
          </View>
          <View style={styles.infoCard}>
            {/* Branch location card */}
            <Text style={styles.infoIcon}>📍</Text>
            {/* Pin icon */}
            <Text style={styles.infoTitle}>Our Branch</Text>
            {/* Title */}
            <Text style={styles.infoText}>Colombo Main Street</Text>
          {/* Address text */}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ // Stylesheet for HomeScreen
  container: { flex: 1, backgroundColor: COLORS.surface }, // Root container: full height, surface background
  toast: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: COLORS.tealDark, padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', zIndex: 100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5 }, // Toast notification: floating, dark teal, rounded, shadow
  toastIcon: { fontSize: 16, marginRight: 10 }, // Toast icon: 16px, right margin
  toastText: { color: COLORS.white, fontSize: 13, fontWeight: '600', flex: 1 }, // Toast text: white, bold
  header: { backgroundColor: COLORS.teal, paddingTop: 50, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }, // Header: teal background, curved bottom corners
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, // Header top row: space between, centered
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }, // Greeting text: semi-transparent white
  customerName: { fontSize: 22, fontWeight: '800', color: COLORS.white }, // Customer name: large, bold, white
  headerRight: { alignItems: 'center' }, // Header right section: centered
  badgeCircle: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 50 }, // Badge: semi-transparent white background, rounded
  badgeNum: { fontSize: 20, fontWeight: '800', color: COLORS.accent }, // Badge number: large, bold, accent color
  badgeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: -2 }, // Badge label: small, semi-transparent
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, letterSpacing: 1 }, // Header subtitle: tiny, spaced letters
  servingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.blueSoft, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: COLORS.blue }, // Serving card: blue left border, soft blue background
  servingIcon: { fontSize: 28, marginRight: 12 }, // Serving icon: 28px
  servingInfo: { flex: 1 }, // Serving info: fill remaining space
  servingLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' }, // Serving label: small, gray
  servingToken: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginTop: 2 }, // Serving token number: large, bold, dark
  servingAt: { fontSize: 12, color: COLORS.blue, fontWeight: '600', marginTop: 2 }, // Serving counter name: blue
  waitingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accentSoft, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: COLORS.accent }, // Waiting card: amber left border, soft amber background
  waitingIcon: { fontSize: 20, marginRight: 10 }, // Waiting icon: 20px
  waitingText: { fontSize: 13, fontWeight: '600', color: COLORS.dark }, // Waiting text: medium, bold, dark
  statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 }, // Stats row: horizontal layout with gaps
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, // Stat card: white, rounded, elevated
  statNum: { fontSize: 24, fontWeight: '800', color: COLORS.teal }, // Stat number: large, bold, teal
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '600' }, // Stat label: small, gray
  ctaCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16, padding: 18, borderRadius: 16, elevation: 3, shadowColor: COLORS.teal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 }, // CTA card: white, rounded, teal shadow
  ctaLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 }, // CTA left section: horizontal, with gap
  ctaIconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.tealSoft, justifyContent: 'center', alignItems: 'center' }, // CTA icon box: square, rounded, teal soft background
  ctaIcon: { fontSize: 26 }, // CTA icon: 26px
  ctaTitle: { fontSize: 16, fontWeight: '700', color: COLORS.dark }, // CTA title: medium, bold, dark
  ctaSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 }, // CTA subtitle: small, gray
  ctaArrow: { fontSize: 22, color: COLORS.teal, fontWeight: '700' }, // CTA arrow: large, teal
  latestCard: { backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 12, padding: 18, borderRadius: 14, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 }, // Latest token card: white, rounded, subtle shadow
  latestLabel: { fontSize: 10, fontWeight: '700', color: COLORS.gray, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }, // Latest label: tiny, uppercase, spaced
  latestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, // Latest row: space between, centered
  latestNum: { fontSize: 26, fontWeight: '900', color: COLORS.dark, letterSpacing: 2 }, // Latest token number: very large, bold, dark
  latestArrow: { fontSize: 13, fontWeight: '700', color: COLORS.teal }, // Latest arrow link: teal
  latestCounter: { fontSize: 13, color: COLORS.gray, marginTop: 2 }, // Latest counter name: gray
  homeQueueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' }, // Queue row: separated by top border
  homeQueueText: { fontSize: 12, fontWeight: '600', color: COLORS.teal }, // Queue text: teal
  homeStatusDot: { width: 8, height: 8, borderRadius: 4 }, // Status dot: small circle
  infoRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 24, gap: 10 }, // Info row: horizontal with gap
  infoCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, // Info card: white, rounded, light shadow
  infoIcon: { fontSize: 22, marginBottom: 6 }, // Info icon: 22px
  infoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark }, // Info title: dark, bold
  infoText: { fontSize: 11, color: COLORS.gray, marginTop: 2 }, // Info text: gray, small
});
