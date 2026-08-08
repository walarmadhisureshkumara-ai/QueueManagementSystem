import React, { useState, useContext } from 'react'; // Import React and hooks for state/context
import { // Import React Native UI components
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { loginAPI, registerAPI } from '../api';
import { COLORS } from '../config';
import { AuthContext } from '../context/AuthContext'; // Import authentication context

export default function LoginScreen() { // Main login/register screen component
  const { signIn } = useContext(AuthContext); // Destructure signIn function from auth context
  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [isRegister, setIsRegister] = useState(false); // Toggle between login and register mode
  const [name, setName] = useState(''); // State for name input (registration only)
  const [phone, setPhone] = useState(''); // State for phone input (registration only)

  const handleLogin = async () => { // Handle user login
    if (!email || !password) { // Validate that fields are not empty
      Alert.alert('Validation', 'Please enter email and password'); return; // Show error alert and exit
    }
    if (!email.includes('@') || !email.includes('.')) { // Validate email format
      Alert.alert('Validation', 'Please enter a valid email address'); return;
    }
    if (password.length < 4) { // Validate password minimum length
      Alert.alert('Validation', 'Password must be at least 4 characters'); return;
    }
    setLoading(true); // Show loading spinner
    try { // Attempt login API call
      const res = await loginAPI(email, password); // POST credentials to backend
      if (res.data.success) { // Check if server returned success
        await signIn({ token: res.data.token, customerId: res.data.customerId, name: res.data.name }); // Store auth data via context
      } else { // Login failed according to server
        Alert.alert('Login Failed', res.data.message || 'Invalid credentials'); // Show error message
      }
    } catch (err) { // Handle network or server errors
      if (err.code === 'ERR_NETWORK') { // Detect network connectivity issue
        Alert.alert('Connection Error', 'Cannot reach server.\n\nCheck that:\n• Backend is running (port 3000)\n• Phone is on same Wi-Fi\n• IP address is correct'); // Show troubleshooting alert
      } else { // Other error types
        Alert.alert('Error', err.response?.data?.message || 'Something went wrong'); // Show generic error
      }
    } finally { setLoading(false); } // Hide loading spinner regardless of outcome
  };

  const handleRegister = async () => { // Handle new user registration
    if (!name || !email || !phone || !password) { // Validate all registration fields
      Alert.alert('Validation', 'Please fill all fields'); return; // Show validation error and exit
    }
    if (name.trim().length < 2) { // Validate name minimum length
      Alert.alert('Validation', 'Name must be at least 2 characters'); return;
    }
    if (!email.includes('@') || !email.includes('.')) { // Validate email format
      Alert.alert('Validation', 'Please enter a valid email address'); return;
    }
    if (phone.replace(/\D/g, '').length < 10) { // Validate phone has at least 10 digits
      Alert.alert('Validation', 'Please enter a valid 10-digit phone number'); return;
    }
    if (password.length < 4) { // Validate password minimum length
      Alert.alert('Validation', 'Password must be at least 4 characters'); return;
    }
    setLoading(true); // Show loading spinner
    try { // Attempt registration API call
      const res = await registerAPI(name, email, phone, password); // POST registration data
      if (res.data.success) { // Check if server confirmed registration
        Alert.alert('Success', 'Account created! Please login.'); // Notify user of success
        setIsRegister(false); // Switch back to login mode
        setName(''); setPhone(''); setEmail(''); setPassword(''); // Clear all input fields
      } else { // Registration failed according to server
        Alert.alert('Error', res.data.message || 'Registration failed'); // Show error message
      }
    } catch (err) { // Handle network or server errors
      Alert.alert('Error', err.code === 'ERR_NETWORK' // Detect network error
        ? 'Cannot reach server.' // Show network error message
        : err.response?.data?.message || 'Server error'); // Show server error message
    } finally { setLoading(false); } // Hide loading spinner
  };

  return ( // Render the UI
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
      {/* Scrollable container with keyboard handling */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Avoid keyboard overlap on iOS */}
        {/* BOC Branding */}
        {/* Branding section label */}
        <View style={styles.brandSection}>
          {/* Branding container */}
          <View style={styles.logoRow}>
            {/* Horizontal logo row */}
            <View style={styles.logoMark}>
              {/* Logo mark circle */}
              <Text style={styles.logoText}>B</Text>
            {/* Letter "B" inside logo */}
            </View>
            <View>
              {/* Bank name container */}
              <Text style={styles.bankName}>BANK OF CEYLON</Text>
              {/* Bank name heading */}
              <Text style={styles.bankSub}>Customer Portal</Text>
            {/* Subtitle below bank name */}
            </View>
          </View>
          <Text style={styles.tagline}>Queue Management System</Text>
        {/* Tagline below branding */}
        </View>

        {/* Card */}
        {/* Form card section label */}
        <View style={styles.card}>
          {/* White card container */}
          <Text style={styles.cardTitle}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          {/* Dynamic title based on mode */}
          <Text style={styles.cardSub}>{isRegister ? 'Register for a new account' : 'Sign in to continue'}</Text>
          {/* Dynamic subtitle */}

          {isRegister && ( // Conditionally render registration-only fields
            <>
              <Text style={styles.label}>Full Name</Text>
              {/* Full name label */}
              <TextInput style={styles.input} placeholder="e.g. Kamal Perera" placeholderTextColor="#90A4AE"
                value={name} onChangeText={setName} />
              {/* Controlled name input */}
              <Text style={styles.label}>Phone Number</Text>
              {/* Phone label */}
              <TextInput style={styles.input} placeholder="e.g. 0712345678" placeholderTextColor="#90A4AE"
                keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            {/* Phone number with numeric keyboard */}
            </>
          )}

          <Text style={styles.label}>Email</Text>
          {/* Email label */}
          <TextInput style={styles.input} placeholder="e.g. kamal@email.com" placeholderTextColor="#90A4AE"
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} value={email} onChangeText={setEmail} />
          {/* Email keyboard, no auto-capitalize */}

          <Text style={styles.label}>Password</Text>
          {/* Password label */}
          <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor="#90A4AE"
            secureTextEntry value={password} onChangeText={setPassword} />
          {/* Hidden text entry */}
          <Text style={styles.passwordHint}>Min 4 characters</Text>

          <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={isRegister ? handleRegister : handleLogin} disabled={loading}>
            {/* Call appropriate handler, disable while loading */}
            {loading ? <ActivityIndicator color="#fff" /> : // Show spinner when loading
              <Text style={styles.buttonText}>{isRegister ? 'REGISTER' : 'SIGN IN'}</Text>}
          {/* Dynamic button text */}
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={() => { setIsRegister(!isRegister); setEmail(''); setPassword(''); setName(''); setPhone(''); }}>
            {/* Toggle between login/register and clear fields */}
            <Text style={styles.switchText}>
              {/* Switch mode link text */}
              {isRegister ? 'Already registered? Sign In' : "New customer? Register here"}
            {/* Dynamic link text */}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Secured Access · BOC Digital Banking</Text>
      {/* Footer security notice */}
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ // Style definitions
  container: { flex: 1, backgroundColor: COLORS.primaryDark }, // Full screen with dark primary background
  contentContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 }, // Centered content with padding
  brandSection: { alignItems: 'center', marginBottom: 28, marginTop: 20 }, // Centered branding with vertical margins
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, // Horizontal row with gap between items
  logoMark: { // Logo circle styling
    width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center', elevation: 6, // Android shadow
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, // iOS shadow
  },
  logoText: { fontSize: 24, fontWeight: '900', color: COLORS.dark }, // Bold "B" letter
  bankName: { fontSize: 16, fontWeight: '800', color: COLORS.white, letterSpacing: 1.5 }, // Bank name styling
  bankSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginTop: 1 }, // Subtitle styling
  tagline: { fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginTop: 8 }, // Tagline styling
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 }, // White card with shadow
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.dark, textAlign: 'center' }, // Card title
  cardSub: { fontSize: 12, color: COLORS.gray, textAlign: 'center', marginBottom: 16, marginTop: 4 }, // Card subtitle
  label: { fontSize: 12, fontWeight: '600', color: '#546E7A', marginBottom: 6, marginTop: 12, letterSpacing: 0.3 }, // Input label
  input: { borderWidth: 1.5, borderColor: '#CFD8DC', padding: 12, borderRadius: 10, backgroundColor: COLORS.surface, fontSize: 14, color: COLORS.dark }, // Text input field
  button: { backgroundColor: COLORS.teal, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 20, elevation: 2 }, // Submit button
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 }, // Button text
  switchBtn: { marginTop: 16, padding: 6 }, // Toggle mode button
  switchText: { textAlign: 'center', color: COLORS.teal, fontWeight: '600', fontSize: 13 }, // Toggle link text
  footer: { textAlign: 'center', marginTop: 16, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }, // Footer text
  passwordHint: { fontSize: 11, color: 'gray', marginTop: 4, marginLeft: 2 }, // Password hint text
});
