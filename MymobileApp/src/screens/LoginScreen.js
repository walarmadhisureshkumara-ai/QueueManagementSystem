import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../../App';
import { API, COLORS } from '../config';

export default function LoginScreen() {
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password'); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/customer/login`, { email, password });
      if (res.data.success) {
        await signIn({ token: res.data.token, customerId: res.data.customerId, name: res.data.name });
      } else {
        Alert.alert('Login Failed', res.data.message || 'Invalid credentials');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        Alert.alert('Connection Error', 'Cannot reach server.\n\nCheck that:\n• Backend is running (port 3000)\n• Phone is on same Wi-Fi\n• IP address is correct');
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Validation', 'Please fill all fields'); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/customer/register`, { name, email, phone, password });
      if (res.data.success) {
        Alert.alert('Success', 'Account created! Please login.');
        setIsRegister(false);
        setName(''); setPhone(''); setEmail(''); setPassword('');
      } else {
        Alert.alert('Error', res.data.message || 'Registration failed');
      }
    } catch (err) {
      Alert.alert('Error', err.code === 'ERR_NETWORK'
        ? 'Cannot reach server.'
        : err.response?.data?.message || 'Server error');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* BOC Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <View>
              <Text style={styles.bankName}>BANK OF CEYLON</Text>
              <Text style={styles.bankSub}>Customer Portal</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Queue Management System</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.cardSub}>{isRegister ? 'Register for a new account' : 'Sign in to continue'}</Text>

          {isRegister && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Kamal Perera" placeholderTextColor="#90A4AE"
                value={name} onChangeText={setName} />
              <Text style={styles.label}>Phone Number</Text>
              <TextInput style={styles.input} placeholder="e.g. 0712345678" placeholderTextColor="#90A4AE"
                keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="e.g. kamal@email.com" placeholderTextColor="#90A4AE"
            keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor="#90A4AE"
            secureTextEntry value={password} onChangeText={setPassword} />

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={isRegister ? handleRegister : handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.buttonText}>{isRegister ? 'REGISTER' : 'SIGN IN'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => { setIsRegister(!isRegister); setEmail(''); setPassword(''); setName(''); setPhone(''); }}>
            <Text style={styles.switchText}>
              {isRegister ? 'Already registered? Sign In' : "New customer? Register here"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Secured Access · BOC Digital Banking</Text>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDark },
  contentContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  brandSection: { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', elevation: 6,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
  },
  logoText: { fontSize: 24, fontWeight: '900', color: COLORS.dark },
  bankName: { fontSize: 16, fontWeight: '800', color: COLORS.white, letterSpacing: 1.5 },
  bankSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginTop: 1 },
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginTop: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, textAlign: 'center' },
  cardSub: { fontSize: 12, color: COLORS.gray, textAlign: 'center', marginBottom: 16, marginTop: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#546E7A', marginBottom: 6, marginTop: 12, letterSpacing: 0.3 },
  input: { borderWidth: 1.5, borderColor: '#CFD8DC', padding: 12, borderRadius: 10, backgroundColor: COLORS.surface, fontSize: 14, color: COLORS.dark },
  button: { backgroundColor: COLORS.teal, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20, elevation: 2 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  switchBtn: { marginTop: 16, padding: 6 },
  switchText: { textAlign: 'center', color: COLORS.teal, fontWeight: '600', fontSize: 13 },
  footer: { textAlign: 'center', marginTop: 16, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 },
});
