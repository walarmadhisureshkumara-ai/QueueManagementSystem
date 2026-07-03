import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Button, Alert } from 'react-native';

const AVAILABLE_COUNTERS = Array.from({ length: 10 }, (_, i) => ({ id: `${i+1}`, name: `Counter ${i+1}` }));

export default function CounterSelectionScreen({ navigation }) {
  const [selectedCounters, setSelectedCounters] = useState([]);

  const toggleCounter = (id) => {
    if (selectedCounters.includes(id)) {
      setSelectedCounters(selectedCounters.filter(cId => cId !== id));
    } else {
      if (selectedCounters.length >= 7) {
        Alert.alert("Limit Reached", "You can select a maximum of 7 counters.");
        return;
      }
      setSelectedCounters([...selectedCounters, id]);
    }
  };

  const handleRequestToken = async () => {
    if (selectedCounters.length === 0) {
      Alert.alert("Error", "Please select at least 1 counter.");
      return;
    }

    try {
      // API Call to your backend goes here: 
      // const response = await requestTokenFromBackend(selectedCounters);
      
      const mockTokenData = {
        tokenId: 'TK-9942',
        queuePosition: 14,
        selectedCounters: selectedCounters
      };

      // Navigate to the live details screen
      navigation.navigate('ActiveToken', { tokenData: mockTokenData });
    } catch (error) {
      Alert.alert("Error", "Could not generate token. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select up to 7 Counters ({selectedCounters.length}/7)</Text>
      <FlatList
        data={AVAILABLE_COUNTERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedCounters.includes(item.id);
          return (
            <TouchableOpacity 
              style={[styles.item, isSelected && styles.selectedItem]} 
              onPress={() => toggleCounter(item.id)}
            >
              <Text style={isSelected ? styles.selectedText : styles.text}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />
      <Button title="Request Token" onPress={handleRequestToken} color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  item: { padding: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 10 },
  selectedItem: { backgroundColor: '#007AFF', borderColor: '#0056b3' },
  text: { color: '#000' },
  selectedText: { color: '#fff', fontWeight: 'bold' }
});