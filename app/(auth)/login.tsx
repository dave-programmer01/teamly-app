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
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/colors';
import { endpoints, apiFetch } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import AuthInput from '../../components/AuthInput';
import PrimaryButton from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  // Reset Password states
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1); // 1: Email, 2: Token + Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const logoAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(logoAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
      delay: 100,
    }).start();
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await apiFetch(endpoints.authenticate, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch (_) {}
        Alert.alert(
          `Login Failed (${res.status})`,
          body
            ? `Server says:\n${body}`
            : 'No response body. Check Expo logs for details.'
        );
        return;
      }
      const data = await res.json();
      login(data.token, { 
        username, 
        role: data.role, 
        teamId: data.teamId,
        profilePicture: data.profilePicture 
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Network Error', `Could not reach the server.\n\n${e?.message ?? ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) return Alert.alert('Error', 'Please enter your email');
    setResetLoading(true);
    try {
      const res = await apiFetch(endpoints.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      if (res.ok) {
        setResetStep(2);
        Alert.alert('Success', 'Check your email for the reset token.');
      } else {
        const body = await res.text();
        Alert.alert('Error', body || 'Email not found or server error.');
      }
    } catch (_) {
      Alert.alert('Network Error', 'Could not reach server.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetToken.trim()) return Alert.alert('Error', 'Please enter the token');
    if (newResetPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    setResetLoading(true);
    try {
      const res = await apiFetch(endpoints.resetPassword, {
        method: 'POST',
        body: JSON.stringify({ token: resetToken.trim(), newPassword: newResetPassword }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Password reset successfully. You can now login.');
        setResetModalVisible(false);
        setResetStep(1);
        setResetToken('');
        setNewResetPassword('');
      } else {
        const body = await res.text();
        Alert.alert('Error', body || 'Invalid/expired token.');
      }
    } catch (_) {
      Alert.alert('Network Error', 'Could not reach server.');
    } finally {
      setResetLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Decorative circles */}
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
          {/* Logo / branding */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: logoAnim,
                transform: [
                  {
                    translateY: logoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="people" size={38} color={Colors.gold} />
            </View>
            <Text style={styles.appName}>Teamly</Text>
            <Text style={styles.churchName}>New Life Church · Bronx, NY</Text>
          </Animated.View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to manage your teams</Text>

            <AuthInput
              label="Username"
              icon="person"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Enter your username"
              error={errors.username}
            />

            <AuthInput
              label="Password"
              icon="lock-closed"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
              error={errors.password}
            />

            <TouchableOpacity
              onPress={() => setResetModalVisible(true)}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.button}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to Teamly?</Text>
              <View style={styles.dividerLine} />
            </View>

            <PrimaryButton
              title="Create Account"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
            />
          </View>

          {/* Reset Password Modal */}
          <Modal
            visible={resetModalVisible}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {resetStep === 1 ? 'Reset Password' : 'New Password'}
                  </Text>
                  <TouchableOpacity onPress={() => setResetModalVisible(false)}>
                    <Ionicons name="close" size={24} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {resetStep === 1 ? (
                  <>
                    <Text style={styles.modalText}>
                      Enter your email to receive a recovery token.
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="email@example.com"
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                    <PrimaryButton
                      title="Send Reset Token"
                      onPress={handleForgotPassword}
                      loading={resetLoading}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.modalText}>
                      Enter the token from your email and your new password.
                    </Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Reset Token"
                      value={resetToken}
                      onChangeText={setResetToken}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={styles.modalInput}
                      placeholder="New Password (6+ chars)"
                      value={newResetPassword}
                      onChangeText={setNewResetPassword}
                      secureTextEntry
                    />
                    <PrimaryButton
                      title="Reset Password"
                      onPress={handleResetPassword}
                      loading={resetLoading}
                    />
                    <TouchableOpacity 
                      style={styles.resendBtn} 
                      onPress={() => setResetStep(1)}
                    >
                      <Text style={styles.resendText}>Didn't get an email? Try again</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navyDark,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    backgroundColor: Colors.navyDark,
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: Colors.surface,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.gold + '12',
    top: -80,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.navyLight + '40',
    top: 120,
    left: -60,
  },
  kav: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.gold + '40',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textWhite,
    letterSpacing: -0.5,
  },
  churchName: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 28,
    padding: 28,
    shadowColor: Colors.navyDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  button: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -16,
    marginBottom: 16,
    paddingVertical: 8,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.gold,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.navyDark,
  },
  modalText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    color: Colors.textPrimary,
  },
  resendBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
});
