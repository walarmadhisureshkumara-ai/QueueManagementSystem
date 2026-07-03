import React from "react";
import { View, Text } from "react-native";

export default function MyTokenScreen() {
  return (
    <View
      style={{
        flex:1,
        backgroundColor:"#040B1D",
        justifyContent:"center",
        alignItems:"center",
      }}
    >
      <Text
        style={{
          color:"#39C6FF",
          fontSize:50,
          fontWeight:"bold",
        }}
      >
        A-041
      </Text>
    </View>
  );
}