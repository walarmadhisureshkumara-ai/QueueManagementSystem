import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../config/api';
import { connectSocket, getSocket } from '../config/socket';

const DashboardScreen = ({ navigation }) => {
  const [customerName, setCustomerName] = useState('');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCustomerData();
      return () => {};
    }, [])
  );

  useEffect(() => {
    const setupSocket = async () => {
      const socket = await connectSocket();
      socket.on('tokenStatusUpdated', handleTokenUpdate);
      socket.on('tokenCreated', handleNewToken);
      return () => {
        socket.off('tokenStatusUpdated');
        socket.off('tokenCreated');
      };
    };
    setupSocket();
  }, []);

  const loadCustomerData = async () => {
    try {
      const name = await AsyncStorage.getItem('customerName');
      setCustomerName(name);
      await loadTokens();
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  };

  const loadTokens = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customer/tokens');
      if (response.data.success) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tokens');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleTokenUpdate = (updatedToken) => {
    setTokens((prevTokens) =>
      prevTokens.map((token) =>
        token._id === updatedToken._id ? updatedToken : token
      )
    );
  };

  const handleNewToken = (newToken) => {
    setTokens((prevTokens) => [newToken, ...prevTokens]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTokens();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Logout',
        onPress: async () => {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('customerId');
          await AsyncStorage.removeItem('customerName');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#27ae60';
      case 'cancelled':
        return '#e74c3c';
      case 'waiting':
        return '#f39c12';
      case 'serving':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      case 'waiting':
        return '⏳';
      case 'serving':
        return '🎯';
      default:
        return '❓';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome Back!</Text>
          <Text style={styles.headerSubtitle}>{customerName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CounterSelection')}
        >
          <Text style={styles.actionIcon}>🎫</Text>
          <Text style={styles.actionText}>Get Token</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('TokenHistory')}
        >
          <Text style={styles.actionIcon}>📜</Text>
          <Text style={styles.actionText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Tokens List */}
      <View style={styles.tokensHeader}>
        <Text style={styles.tokensTitle}>Your Tokens</Text>
        <Text style={styles.tokenCount}>{tokens.length}</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e3c72" />
        </View>
      ) : tokens.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No tokens yet</Text>
          <Text style={styles.emptySubtext}>Get a token to get started</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.tokensList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {tokens.map((token, index) => (
            <TouchableOpacity
              key={token._id}
              style={styles.tokenCard}
              onPress={() => navigation.navigate('TokenDetails', { token })}
            >
              <View style={styles.tokenCardContent}>
                <View style={styles.tokenInfo}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(token.status) },
                    ]}
                  >
                    <Text style={styles.statusIcon}>{getStatusIcon(token.status)}</Text>
                  </View>
                  <View style={styles.tokenDetails}>
                    <Text style={styles.tokenNumber}>Token #{token.tokenNumber}</Text>
                    <Text style={styles.tokenCounter}>{token.counter?.name || 'N/A'}</Text>
                    <Text style={styles.tokenTime}>
                      {new Date(token.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.tokenStatus}>
                  <Text style={[styles.statusText, { color: getStatusColor(token.status) }]}>
                    {token.status.toUpperCase()}
                  </Text>
                  <Text style={styles.position}>{token.position || '-'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1e3c72',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  logoutButton: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  tokensHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tokensTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenCount: {
    backgroundColor: '#1e3c72',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tokensList: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tokenCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tokenCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 24,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenCounter: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  tokenTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  tokenStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  position: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
  },
});

export default DashboardScreen;
