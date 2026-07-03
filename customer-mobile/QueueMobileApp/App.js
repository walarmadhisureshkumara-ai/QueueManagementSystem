import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 7 Colorful Bank Units
const COUNTERS_DATA = [
  { id: '1', name: 'Cash Deposit & Checks', subtitle: 'Quick drop and validation', icon: 'cash-plus', color: '#10B981' },
  { id: '2', name: 'Instant Withdrawal', subtitle: 'High-volume cash outs', icon: 'cash-minus', color: '#EF4444' },
  { id: '3', name: 'Account Management', subtitle: 'Open, edit, or freeze tags', icon: 'account-cog', color: '#3B82F6' },
  { id: '4', name: 'Loans & Mortgages', subtitle: 'Consultations & application', icon: 'home-analytics', color: '#8B5CF6' },
  { id: '5', name: 'Wealth & Investments', subtitle: 'Stocks, bonds & portfolios', icon: 'chart-timeline-variant', color: '#F59E0B' },
  { id: '6', name: 'Business Banking', subtitle: 'Corporate and merchant trade', icon: 'briefcase', color: '#EC4899' },
  { id: '7', name: 'Foreign Exchange', subtitle: 'Currency trading & drafts', icon: 'currency-eur', color: '#06B6D4' },
];

const useSocket = () => {
  return { socket: { emit: (event, data) => console.log(`Emitted [${event}]:`, data) } };
};

export default function App() {
  const { socket } = useSocket();
  const [currentScreen, setCurrentScreen] = useState('welcome'); // 'welcome' | 'syncing' | 'home'
  const [selectedCounter, setSelectedCounter] = useState(null);
  
  // Animation Values
  const pulseValue = useRef(new Animated.Value(0.6)).current;
  const fadeWelcome = useRef(new Animated.Value(1)).current;

  // 1. Loading Pulse Loop
  useEffect(() => {
    if (currentScreen === 'syncing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 0.6, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();

      const timer = setTimeout(() => {
        setCurrentScreen('home');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Transition from Welcome Screen to Syncing
  const handleGetStarted = () => {
    Animated.timing(fadeWelcome, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setCurrentScreen('syncing'));
  };

  // 2. Send Request -> Directly broadcasts to Staff Dashboard
  const handleSendRequest = () => {
    if (!selectedCounter) return;

    const uniqueTicketToken = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

    if (socket) {
      // Emitting specific event that your staff dashboard UI listens for
      socket.emit('NEW_STAFF_NOTIFICATION', {
        ticketNumber: uniqueTicketToken,
        counterId: selectedCounter.id,
        serviceName: selectedCounter.name,
        colorTheme: selectedCounter.color,
        status: 'PENDING',
        timeRequested: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    Alert.alert(
      "Ticket Generated! 🎉", 
      `Your Ticket is ${uniqueTicketToken}\n\nStaff Dashboard has been notified. Please look at the overhead monitors.`,
      [{ text: "Got it", onPress: () => setSelectedCounter(null) }]
    );
  };

  // ==================== SCREEN A: WELCOME SLIDE ====================
  if (currentScreen === 'welcome') {
    return (
      <Animated.View style={[styles.welcomeWrapper, { opacity: fadeWelcome }]}>
        <StatusBar style="light" />
        <View style={styles.welcomeCircleDecor} />
        
        <View style={styles.welcomeCenterContent}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="qrcode-scan" size={42} color="#FFF" />
          </View>
          <Text style={styles.brandTitle}>SmartQueue</Text>
          <Text style={styles.brandTagline}>Skip the physical lines.{'\n'}Secure your service ticket instantly.</Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.getStartedBtn} onPress={handleGetStarted}>
          <Text style={styles.getStartedText}>Enter Smart Terminal</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#1E3A8A" />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ==================== SCREEN B: ENCRYPTED SYNCING ====================
  if (currentScreen === 'syncing') {
    return (
      <View style={styles.loadingWrapper}>
        <StatusBar style="light" />
        <Animated.View style={[styles.pulseCircle, { opacity: pulseValue, transform: [{ scale: pulseValue }] }]}>
          <MaterialCommunityIcons name="layers-triple" size={38} color="#60A5FA" />
        </Animated.View>
        <Text style={styles.syncText}>Synchronizing with Staff Dashboard...</Text>
        <Text style={styles.syncSubtext}>Securing node channels</Text>
      </View>
    );
  }

  // ==================== SCREEN C: COLORFUL MAIN HOME ====================
  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar style="dark" />
      
      {/* Header Profile Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Select Service</Text>
          <Text style={styles.instructionText}>Your selection informs nearby active staff</Text>
        </View>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#2563EB" />
        </View>
      </View>

      {/* Grid Allocation Layout */}
      <FlatList
        data={COUNTERS_DATA}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContainer} 
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedCounter?.id === item.id;
          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[
                styles.card,
                isSelected && { borderColor: item.color, backgroundColor: `${item.color}08`, transform: [{ scale: 0.98 }] }
              ]}
              onPress={() => setSelectedCounter(item)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>{item.subtitle}</Text>
              
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: item.color }]}>
                  <MaterialCommunityIcons name="check" size={12} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Persistent floating request button */}
      {selectedCounter && (
        <TouchableOpacity 
          activeOpacity={0.9}
          style={[styles.actionButton, { backgroundColor: selectedCounter.color }]}
          onPress={handleSendRequest}
        >
          <View style={styles.actionLeft}>
            <MaterialCommunityIcons name="broadcast" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>
              Broadcast to Dashboard {selectedCounter.id}
            </Text>
          </View>
          <MaterialCommunityIcons name="arrow-right-bold-circle" size={24} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Welcome Styling
  welcomeWrapper: {
    flex: 1,
    backgroundColor: '#1E3A8A', // Rich Blue
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  welcomeCircleDecor: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: (width * 1.5) / 2,
    backgroundColor: '#1E40AF',
    top: -width * 0.4,
    zIndex: -1,
  },
  welcomeCenterContent: {
    alignItems: 'center',
    marginTop: 100,
  },
  logoBadge: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 20,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 16,
    color: '#93C5FD',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    fontWeight: '500',
  },
  getStartedBtn: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedText: {
    color: '#1E3A8A',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },

  // Syncing / Loading Styling
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  pulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  syncText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  syncSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },

  // App Interface Layouts
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  instructionText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 110,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#FFFFFF',
    flex: 0.5,
    margin: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 15,
  },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    flexDirection: 'row',
    height: 56,
    borderRadius: 18,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});