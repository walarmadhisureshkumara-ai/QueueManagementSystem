import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getSocket } from '../config/socket';
import api from '../config/api';

const TokenDetailsScreen = ({ route, navigation }) => {
  const { token: initialToken } = route.params;
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.on('tokenUpdated', handleTokenUpdate);
    }
    return () => {
      if (socket) {
        socket.off('tokenUpdated');
      }
    };
  }, []);

  const handleTokenUpdate = (updatedToken) => {
    if (updatedToken._id === token._id) {
      setToken(updatedToken);
    }
  };

  const handleCancelToken = async () => {
    Alert.alert('Cancel Token', 'Are you sure you want to cancel this token?', [
      { text: 'No', onPress: () => {} },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            setCancelling(true);
            const response = await api.post(`/customer/tokens/${token._id}/cancel`);
            if (response.data.success) {
              setToken(response.data.token);
              Alert.alert('Success', 'Token cancelled successfully');
            }
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel token');
          } finally {
            setCancelling(false);
          }
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Token Details</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Token Number Card */}
        <View style={styles.tokenNumberCard}>
          <View
            style={[
              styles.statusCircle,
              { backgroundColor: getStatusColor(token.status) },
            ]}
          >
            <Text style={styles.statusIcon}>{getStatusIcon(token.status)}</Text>
          </View>
          <Text style={styles.tokenNumber}>#{token.tokenNumber}</Text>
          <Text style={styles.tokenStatus}>{token.status?.toUpperCase() || 'N/A'}</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Counter</Text>
            <Text style={styles.detailValue}>{token.counter?.name || 'N/A'}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Position</Text>
            <Text style={styles.detailValue}>{token.position || '-'}</Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Created At</Text>
            <Text style={styles.detailValue}>
              {new Date(token.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Updated At</Text>
            <Text style={styles.detailValue}>
              {new Date(token.updatedAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        {token.status && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timeline}>
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineMarker,
                    { backgroundColor: '#27ae60' },
                  ]}
                />
                <Text style={styles.timelineText}>Token Generated</Text>
              </View>
              {token.status !== 'waiting' && (
                <>
                  <View style={styles.timelineConnector} />
                  <View style={styles.timelineItem}>
                    <View
                      style={[
                        styles.timelineMarker,
                        { backgroundColor: getStatusColor(token.status) },
                      ]}
                    />
                    <Text style={styles.timelineText}>
                      Status: {token.status?.charAt(0).toUpperCase() + token.status?.slice(1)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {token.status !== 'completed' && token.status !== 'cancelled' && (
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.cancelButton, cancelling && { opacity: 0.6 }]}
              onPress={handleCancelToken}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color="#e74c3c" />
              ) : (
                <>
                  <Text style={styles.cancelButtonText}>CANCEL TOKEN</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  tokenNumberCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  statusCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusIcon: {
    fontSize: 40,
  },
  tokenNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tokenStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  detailCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  timeline: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timelineMarker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  timelineText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  timelineConnector: {
    height: 20,
    width: 2,
    backgroundColor: '#e0e0e0',
    marginLeft: 6,
    marginBottom: 5,
  },
  actionSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e74c3c',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default TokenDetailsScreen;
