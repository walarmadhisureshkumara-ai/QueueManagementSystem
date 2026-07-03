import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.welcome}>Welcome Back 👋</Text>
      <Text style={styles.name}>Queue App</Text>

      <View style={styles.tokenCard}>
        <Text style={styles.tokenLabel}>ACTIVE TOKEN</Text>
        <Text style={styles.tokenNumber}>A-041</Text>
        <Text style={styles.tokenInfo}>4 People Ahead</Text>
      </View>

      <Text style={styles.sectionTitle}>
        SELECT A COUNTER
      </Text>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.counterCard}>
          <Text style={styles.counterTitle}>Counter 1</Text>
          <Text style={styles.available}>Available</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.counterCard}>
          <Text style={styles.counterTitle}>Counter 2</Text>
          <Text style={styles.busy}>Busy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.counterCard}>
          <Text style={styles.counterTitle}>Counter 3</Text>
          <Text style={styles.available}>Available</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.counterCard}>
          <Text style={styles.counterTitle}>Counter 4</Text>
          <Text style={styles.busy}>Busy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>
          NOW SERVING
        </Text>

        <Text style={styles.servingNumber}>
          A-037
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
    padding: 20,
  },

  welcome: {
    color: "#8E9AB0",
    marginTop: 40,
  },

  name: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  tokenCard: {
    backgroundColor: "#178BFF",
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
  },

  tokenLabel: {
    color: "#fff",
  },

  tokenNumber: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "bold",
    marginVertical: 10,
  },

  tokenInfo: {
    color: "#fff",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  counterCard: {
    width: "48%",
    backgroundColor: "#111F35",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },

  counterTitle: {
    color: "#fff",
    fontSize: 18,
  },

  available: {
    color: "#00E676",
    marginTop: 10,
  },

  busy: {
    color: "#FFA726",
    marginTop: 10,
  },

  statsCard: {
    backgroundColor: "#111F35",
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },

  statsTitle: {
    color: "#8E9AB0",
  },

  servingNumber: {
    color: "#4FC3F7",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 10,
  },
});