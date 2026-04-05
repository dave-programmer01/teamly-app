import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import AuthInput from '../../components/AuthInput';
import PrimaryButton from '../../components/PrimaryButton';

export default function CreateTeamScreen() {
  const { token, isAdmin } = useAuth();
  // Support edit mode via query params
  const params = useLocalSearchParams<{ id?: string; name?: string; desc?: string }>();
  const isEdit = !!params.id;

  const [teamName, setTeamName] = useState(params.name ?? '');
  const [teamDescription, setTeamDescription] = useState(params.desc ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ teamName?: string; teamDescription?: string }>({});

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1, useNativeDriver: true, tension: 70, friction: 9,
    }).start();
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!teamName.trim()) newErrors.teamName = 'Team name is required';
    else if (teamName.length < 3) newErrors.teamName = 'At least 3 characters required';
    if (!teamDescription.trim()) newErrors.teamDescription = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const url = isEdit ? endpoints.team(Number(params.id)) : endpoints.teams;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(
        url,
        {
          method,
          body: JSON.stringify({ teamName, teamDescription }),
        },
        token
      );

      if (!res.ok) {
        const body = await res.text();
        Alert.alert('Error', body || 'Something went wrong.');
        return;
      }

      Alert.alert(
        'Success! 🎉',
        isEdit ? 'Team updated successfully.' : 'Team created successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (_) {
      Alert.alert('Error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <StatusBar style="light" />
        <Ionicons name="lock-closed" size={60} color={Colors.gold} style={{ marginBottom: 20 }} />
        <Text style={[styles.headerTitle, { textAlign: 'center' }]}>Access Denied</Text>
        <Text style={[styles.headerSubtitle, { marginBottom: 30, textAlign: 'center' }]}>
          Only Administrators can create or edit teams.
        </Text>
        <PrimaryButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerDecor} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color={Colors.textWhite} />
            </TouchableOpacity>

            <View style={styles.headerIcon}>
              <Ionicons
                name={isEdit ? 'create' : 'add-circle'}
                size={32}
                color={Colors.gold}
              />
            </View>
            <Text style={styles.headerTitle}>
              {isEdit ? 'Edit Team' : 'Create Team'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEdit
                ? 'Update your team info below'
                : 'Build a new team for your ministry'}
            </Text>
          </View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: slideAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <AuthInput
              label="Team Name"
              icon="people"
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g. Worship Team"
              maxLength={60}
              error={errors.teamName}
            />

            <AuthInput
              label="Description"
              icon="document-text"
              value={teamDescription}
              onChangeText={setTeamDescription}
              placeholder="Describe what this team does…"
              multiline
              numberOfLines={4}
              maxLength={300}
              error={errors.teamDescription}
            />

            {/* Char count */}
            <Text style={styles.charCount}>
              {teamDescription.length}/300 characters
            </Text>

            {/* Info tip */}
            {!isEdit && (
              <View style={styles.tipBox}>
                <Ionicons name="information-circle" size={18} color={Colors.gold} />
                <Text style={styles.tipText}>
                  You will automatically become the Team Owner.
                </Text>
              </View>
            )}

            <PrimaryButton
              title={isEdit ? 'Save Changes' : 'Create Team'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />

            <PrimaryButton
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
            />
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    backgroundColor: Colors.navyDark,
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerDecor: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.gold + '0A', top: -60, right: -60,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: Colors.navyLight + '70',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: Colors.navyLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.gold + '40',
    marginBottom: 16,
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '800', color: Colors.textWhite, marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14, color: Colors.textMuted, textAlign: 'center',
  },

  formCard: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: 20, borderRadius: 24,
    padding: 24,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  charCount: {
    fontSize: 12, color: Colors.textMuted,
    textAlign: 'right', marginTop: -8, marginBottom: 20,
  },
  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.gold + '15',
    borderRadius: 12, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.gold + '30',
  },
  tipText: {
    flex: 1, fontSize: 13, color: Colors.textSecondary,
    lineHeight: 18, fontWeight: '500',
  },
  submitBtn: { marginBottom: 12 },
});
