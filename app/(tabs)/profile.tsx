import React, { useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import PrimaryButton from '../../components/PrimaryButton';

const INFO_ROWS = [
  { icon: 'person-outline' as const, label: 'Username', key: 'username' as const },
  { icon: 'mail-outline' as const, label: 'Email', key: 'email' as const },
];

export default function ProfileScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);

  const avatarAnim = useRef(new Animated.Value(1)).current;

  const handleAvatarPress = async () => {
    Animated.sequence([
      Animated.spring(avatarAnim, { toValue: 0.92, useNativeDriver: true, tension: 300, friction: 8 }),
      Animated.spring(avatarAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start();

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadProfilePicture(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open image picker.');
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    if (!token) return;
    setUploading(true);
    try {
      const filename = uri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      const formData = new FormData();
      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);

      const res = await apiFetch(
        endpoints.profilePicture,
        {
          method: 'PUT',
          body: formData,
        },
        token
      );

      if (!res.ok) {
        const errBody = await res.text();
        Alert.alert('Upload Failed', errBody || 'Something went wrong uploading your photo.');
        return;
      }

      const imageUrl = await res.text(); // Assuming endpoint returns string URL directly
      updateUser({ profilePicture: imageUrl });
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Could not upload the new profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            // The API delete endpoint requires a User ID but the payload we've been storing only has username/email.
            // Ideally the ID is in the context. If not, this is a placeholder behavior.
            Alert.alert(
              'Not Implemented',
              'The AuthResponse payload currently needs to include the userId to delete via /api/auth/delete/{id}.'
            );
          },
        },
      ]
    );
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroDecor1} />
          <View style={styles.heroDecor2} />

          <Text style={styles.heroLabel}>Your Account</Text>
          <Text style={styles.heroTitle}>Profile</Text>

          {/* Avatar */}
          <Animated.View style={{ transform: [{ scale: avatarAnim }], alignSelf: 'center', marginTop: 24 }}>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.9}>
              <View style={styles.avatarRing}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
              </View>
              <View style={styles.avatarEditBadge}>
                {uploading ? (
                  <ActivityIndicator size="small" color={Colors.navyDark} />
                ) : (
                  <Ionicons name="camera" size={14} color={Colors.navyDark} />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.heroName}>{user?.username}</Text>
          <Text style={styles.heroBadge}>🙏 New Life Church Member</Text>
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Info</Text>
          {INFO_ROWS.map((row) => (
            <View key={row.key} style={styles.infoRow}>
              <View style={styles.infoIconWrapper}>
                <Ionicons name={row.icon} size={18} color={Colors.gold} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>
                  {(user as any)?.[row.key] ?? '—'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Actions Card */}
        <View style={[styles.card, { marginTop: 0 }]}>
          <Text style={styles.cardTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/teams/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.gold + '20' }]}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.gold} />
            </View>
            <Text style={styles.menuLabel}>Create a Team</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push('/(tabs)/teams')}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#5B8AF520' }]}>
              <Ionicons name="people-outline" size={20} color="#5B8AF5" />
            </View>
            <Text style={styles.menuLabel}>Browse Teams</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout & Delete */}
        <View style={styles.logoutWrapper}>
          <PrimaryButton
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
          />
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountBtn}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  hero: {
    backgroundColor: Colors.navyDark,
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroDecor1: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: Colors.gold + '0A', top: -80, right: -80,
  },
  heroDecor2: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.navyLight + '50', bottom: -20, left: -40,
  },
  heroLabel: {
    fontSize: 13, color: Colors.gold, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28, fontWeight: '800', color: Colors.textWhite,
  },

  // Avatar
  avatarRing: {
    width: 100, height: 100, borderRadius: 30,
    borderWidth: 3, borderColor: Colors.gold,
    overflow: 'hidden',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: Colors.navyLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 38, fontWeight: '800', color: Colors.gold,
  },
  avatarEditBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.navyDark,
  },
  heroName: {
    fontSize: 22, fontWeight: '800', color: Colors.textWhite,
    textAlign: 'center', marginTop: 16, marginBottom: 6,
  },
  heroBadge: {
    fontSize: 13, color: Colors.gold, textAlign: 'center', fontWeight: '500',
  },

  // Cards
  card: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: 20, borderRadius: 20,
    padding: 20, marginBottom: 16,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16,
  },

  // Info Row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  infoIconWrapper: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.gold + '18',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 12, color: Colors.textMuted, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  infoValue: {
    fontSize: 15, color: Colors.textPrimary, fontWeight: '600',
  },

  // Menu Row
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  menuLabel: {
    flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary,
  },

  // Logout & Delete
  logoutWrapper: { paddingHorizontal: 20 },
  logoutButton: {
    borderColor: Colors.navyLight,
  },
  deleteAccountBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteAccountText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});
