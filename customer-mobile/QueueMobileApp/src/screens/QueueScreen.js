import React from "react";
import { View, Text } from "react-native";

export default function QueueScreen() {
  return (
    <View
      style={{
        flex:1,
        backgroundColor:"#040B1D",
        justifyContent:"center",
        alignItems:"center",
      }}
    >
      <Text style={{color:"white"}}>
        Live Queue Screen
      </Text>
    </View>
  );
}