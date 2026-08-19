import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import api from '../config/api';
import { getSocket } from '../config/socket';

const CounterSelectionScreen = ({ navigation }) => {
  const [counters, setCounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);

  useEffect(() => {
    loadCounters();
  }, []);

  const loadCounters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/counters');
      if (response.data.success) {
        setCounters(response.data.counters);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load counters');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCounter = (counter) => {
    setSelectedCounter(counter);
    setShowModal(true);
  };

  const handleGenerateToken = async () => {
    if (!selectedCounter) return;

    try {
      setGeneratingToken(true);
      const response = await api.post('/customer/tokens', {
        counterId: selectedCounter._id,
      });

      if (response.data.success) {
        const socket = getSocket();
        if (socket) {
          socket.emit('tokenGenerated', response.data.token);
        }

        setShowModal(false);
        setSelectedCounter(null);

        Alert.alert(
          'Success',
          `Token #${response.data.token.tokenNumber} generated for ${selectedCounter.name}`,
          [
            {
              text: 'View Token',
              onPress: () =>
                navigation.navigate('TokenDetails', { token: response.data.token }),
            },
            {
              text: 'Back to Dashboard',
              onPress: () => navigation.navigate('Dashboard'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate token');
    } finally {
      setGeneratingToken(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#27ae60';
      case 'inactive':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Counter</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e3c72" />
          <Text style={styles.loadingText}>Loading counters...</Text>
        </View>
      ) : counters.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No counters available</Text>
        </View>
      ) : (
        <ScrollView style={styles.countersList}>
          {counters.map((counter) => (
            <TouchableOpacity
              key={counter._id}
              style={[
                styles.counterCard,
                counter.status !== 'active' && styles.inactiveCard,
              ]}
              onPress={() => handleSelectCounter(counter)}
              disabled={counter.status !== 'active'}
            >
              <View style={styles.counterContent}>
                <View
                  style={[
                    styles.counterBadge,
                    { backgroundColor: getStatusColor(counter.status) },
                  ]}
                >
                  <Text style={styles.counterBadgeText}>{counter.name?.charAt(0)}</Text>
                </View>

                <View style={styles.counterInfo}>
                  <Text style={styles.counterName}>{counter.name}</Text>
                  <Text style={styles.counterType}>{counter.type || 'General'}</Text>
                  <View style={styles.counterDetails}>
                    <Text style={styles.detailText}>
                      Queue: {counter.tokenQueue?.length || 0}
                    </Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          color: getStatusColor(counter.status),
                        },
                      ]}
                    >
                      {counter.status?.toUpperCase() || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Selection Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Counter Selection</Text>

            {selectedCounter && (
              <View style={styles.selectedCounterInfo}>
                <View
                  style={[
                    styles.largeCounterBadge,
                    { backgroundColor: getStatusColor(selectedCounter.status) },
                  ]}
                >
                  <Text style={styles.largeCounterBadgeText}>
                    {selectedCounter.name?.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.selectedCounterName}>{selectedCounter.name}</Text>
                <Text style={styles.selectedCounterType}>
                  {selectedCounter.type || 'General'}
                </Text>
              </View>
            )}

            <Text style={styles.confirmText}>
              You are about to generate a token for this counter. Is this correct?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowModal(false)}
                disabled={generatingToken}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, generatingToken && { opacity: 0.6 }]}
                onPress={handleGenerateToken}
                disabled={generatingToken}
              >
                {generatingToken ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>GENERATE TOKEN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  countersList: {
    flex: 1,
    padding: 15,
  },
  counterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inactiveCard: {
    opacity: 0.5,
  },
  counterContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterBadgeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  counterInfo: {
    flex: 1,
  },
  counterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  counterType: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  counterDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  detailText: {
    fontSize: 11,
    color: '#999',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 20,
    color: '#1e3c72',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 35,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectedCounterInfo: {
    alignItems: 'center',
    marginBottom: 25,
  },
  largeCounterBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  largeCounterBadgeText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  selectedCounterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedCounterType: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  confirmText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#1e3c72',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CounterSelectionScreen;

