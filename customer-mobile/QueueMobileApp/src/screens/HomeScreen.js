import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>

      <Text style={styles.welcome}>
        Welcome back 👋
      </Text>

      <Text style={styles.name}>
        Ashan Perera
      </Text>

      <View style={styles.tokenCard}>
        <Text style={styles.token}>
          A-041
        </Text>

        <Text style={styles.sub}>
          Queue Position 4 ahead
        </Text>
      </View>

      <Text style={styles.section}>
        SELECT A COUNTER
      </Text>

      <View style={styles.counter}>
        <Text style={styles.counterTitle}>
          Counter 1
        </Text>

        <Text style={styles.available}>
          Available
        </Text>
      </View>

      <View style={styles.counter}>
        <Text style={styles.counterTitle}>
          Counter 2
        </Text>

        <Text style={styles.busy}>
          Busy
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:"#040B1D",
    padding:20,
  },

  welcome:{
    color:"#A0AFC9",
    marginTop:50,
  },

  name:{
    color:"#fff",
    fontSize:28,
    fontWeight:"bold",
    marginBottom:20,
  },

  tokenCard:{
    backgroundColor:"#16284A",
    borderRadius:20,
    padding:20,
  },

  token:{
    color:"#39C6FF",
    fontSize:40,
    fontWeight:"bold",
  },

  sub:{
    color:"#fff",
    marginTop:10,
  },

  section:{
    color:"#fff",
    marginTop:25,
    marginBottom:15,
  },

  counter:{
    backgroundColor:"#09172F",
    padding:20,
    borderRadius:15,
    marginBottom:15,
  },

  counterTitle:{
    color:"#fff",
    fontSize:18,
  },

  available:{
    color:"#00E676",
    marginTop:5,
  },

  busy:{
    color:"orange",
    marginTop:5,
  },
});