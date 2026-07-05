import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../config/api';

const TokenHistoryScreen = ({ navigation }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTokenHistory();
  }, [filter]);

  const loadTokenHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customer/tokens', {
        params: { status: filter !== 'all' ? filter : undefined },
      });
      if (response.data.success) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Error loading token history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTokenHistory();
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

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Waiting', value: 'waiting' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Token History</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              filter === option.value && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(option.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === option.value && styles.filterButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tokens List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e3c72" />
        </View>
      ) : tokens.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No tokens found</Text>
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
                    <Text style={styles.tokenCounter}>
                      {token.counter?.name || 'Unknown Counter'}
                    </Text>
                    <Text style={styles.tokenTime}>
                      {new Date(token.createdAt).toLocaleDateString()} at{' '}
                      {new Date(token.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.statusLabel,
                    { color: getStatusColor(token.status) },
                  ]}
                >
                  {token.status?.toUpperCase()}
                </Text>
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
  backButton: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#1e3c72',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  tokensList: {
    flex: 1,
    padding: 15,
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
  statusLabel: {
    fontWeight: 'bold',
    fontSize: 12,
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
  },
});

export default TokenHistoryScreen;
