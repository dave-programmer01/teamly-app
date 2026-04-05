import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/colors';
import { endpoints, apiFetch } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import AuthInput from '../../components/AuthInput';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiFetch(endpoints.register, {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
      if (!res.ok) {
        const body = await res.text();
        Alert.alert('Registration Failed', body || 'Something went wrong. Please try again.');
        return;
      }
      const data = await res.json();
      login(data.token, { username, email });
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header row */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
            </TouchableOpacity>
            <View style={styles.logoRow}>
              <View style={styles.logoCircle}>
                <Ionicons name="people" size={28} color={Colors.gold} />
              </View>
              <View>
                <Text style={styles.appName}>Teamly</Text>
                <Text style={styles.churchName}>New Life Church</Text>
              </View>
            </View>
          </Animated.View>

          {/* Card */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Join the Teamly community today</Text>

            <AuthInput
              label="Username"
              icon="person"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Choose a username"
              error={errors.username}
            />

            <AuthInput
              label="Email"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="your@email.com"
              error={errors.email}
            />

            <AuthInput
              label="Password"
              icon="lock-closed"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Create a strong password"
              error={errors.password}
            />

            <PrimaryButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={styles.button}
            />

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.back()}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navyDark },
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
    backgroundColor: Colors.navyDark,
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
    backgroundColor: Colors.surface,
  },
  circle1: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: Colors.gold + '10', top: -60, left: -60,
  },
  circle2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: Colors.navyLight + '30', top: 80, right: -40,
  },
  kav: { flex: 1 },
  scrollContent: {
    flexGrow: 1, justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: Colors.navyLight + '60',
    alignItems: 'center', justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.navyLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.gold + '40',
  },
  appName: {
    fontSize: 22, fontWeight: '800',
    color: Colors.textWhite, letterSpacing: -0.5,
  },
  churchName: {
    fontSize: 11, color: Colors.gold,
    fontWeight: '500', letterSpacing: 0.3,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 28, padding: 28,
    shadowColor: Colors.navyDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
  },
  cardTitle: {
    fontSize: 26, fontWeight: '800',
    color: Colors.textPrimary, marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14, color: Colors.textSecondary, marginBottom: 28,
  },
  button: { marginTop: 8 },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: Colors.textSecondary },
  loginLinkBold: { color: Colors.gold, fontWeight: '700' },
});
