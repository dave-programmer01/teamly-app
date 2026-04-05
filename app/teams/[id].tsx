import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import { Team } from '../../components/TeamCard';
import MemberAvatar from '../../components/MemberAvatar';
import PrimaryButton from '../../components/PrimaryButton';

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user, isAdmin } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);

  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const [teamRes, membersRes] = await Promise.all([
        apiFetch(endpoints.teams, {}, token),
        apiFetch(endpoints.teamMembers(Number(id)), {}, token)
      ]);

      if (teamRes.ok) {
        const allTeams: Team[] = await teamRes.json();
        const data = allTeams.find(t => t.teamId === Number(id));
        
        if (data) {
          setTeam(data);
          if (membersRes.ok) {
            const mData = await membersRes.json();
            setMembers(mData);
          }
          Animated.spring(contentAnim, {
            toValue: 1, useNativeDriver: true, tension: 70, friction: 9,
          }).start();
        } else {
          Alert.alert('Error', 'Team not found.');
          router.back();
        }
      } else {
        Alert.alert('Error', 'Team not found.');
        router.back();
      }
    } catch (_) {
      Alert.alert('Error', 'Could not load team.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Team',
      `Are you sure you want to delete "${team?.teamName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await apiFetch(
                endpoints.team(Number(id)),
                { method: 'DELETE' },
                token
              );
              if (res.ok || res.status === 204) {
                router.back();
              } else {
                const body = await res.text();
                Alert.alert('Error', body || 'Could not delete team.');
              }
            } catch (_) {
              Alert.alert('Error', 'Network error.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await apiFetch(
        endpoints.teamJoin(Number(id)),
        {
          method: 'POST',
          body: JSON.stringify({ position: "Volunteer" })
        },
        token
      );
      if (res.ok) {
        Alert.alert('Success', 'Joined team successfully!');
        fetchTeam(); // Refresh
      } else {
        Alert.alert('Error', 'Could not join team.');
      }
    } catch (_) {
      Alert.alert('Error', 'Network error.');
    } finally {
      setJoining(false);
    }
  };

  const isOwner = team?.ownerUsername === user?.username;
  const isMember = members.some(m => m.username === user?.username);

  const initials = team?.teamName
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  if (!team) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroDecor} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.textWhite} />
          </TouchableOpacity>

          {/* Team Avatar */}
          <View style={styles.teamAvatarWrapper}>
            <View style={styles.teamAvatar}>
              <Text style={styles.teamInitials}>{initials}</Text>
            </View>
            {isOwner && (
              <View style={styles.ownerCrown}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.navyDark} />
              </View>
            )}
          </View>

          <Text style={styles.teamName}>{team.teamName}</Text>

          {isOwner && (
            <View style={styles.ownerBadge}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.gold} />
              <Text style={styles.ownerBadgeText}>You are the Team Owner</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>{members.length}</Text>
              <Text style={styles.heroStatLabel}>Members</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNumber}>#{team.teamId}</Text>
              <Text style={styles.heroStatLabel}>Team ID</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={18} color={Colors.gold} />
            <Text style={styles.cardTitle}>About</Text>
          </View>
          <Text style={styles.descriptionText}>
            {team.teamDescription || 'No description provided for this team.'}
          </Text>
        </Animated.View>

        {/* Owner */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.gold} />
            <Text style={styles.cardTitle}>Team Leader</Text>
          </View>
          {team.ownerUsername && (
            <View style={styles.ownerRow}>
              <MemberAvatar
                username={team.ownerUsername}
                size={50}
              />
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{team.ownerUsername}</Text>
                <Text style={styles.ownerRole}>Team Owner</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Members */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={18} color={Colors.gold} />
            <Text style={styles.cardTitle}>
              Members ({members.length})
            </Text>
          </View>

          {members.length === 0 ? (
            <Text style={styles.noMembers}>No members have joined yet.</Text>
          ) : (
            <View style={styles.membersGrid}>
              {members.map((m, i) => (
                <MemberAvatar
                  key={i}
                  username={m.username}
                  size={52}
                  showName
                />
              ))}
            </View>
          )}

          {!isOwner && !isMember && (
            <PrimaryButton
              title={joining ? "Joining..." : "Join Team"}
              onPress={handleJoin}
              loading={joining}
              style={styles.joinBtn}
            />
          )}
        </Animated.View>

        {/* Owner Actions */}
        {isOwner && isAdmin && (
          <Animated.View
            style={[
              styles.actionsWrapper,
              { 
                opacity: contentAnim,
                transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
              },
            ]}
          >
            <PrimaryButton
              title="Edit Team"
              variant="navy"
              onPress={() => router.push(`/teams/create?id=${id}&name=${team.teamName}&desc=${team.teamDescription}` as any)}
              style={styles.editBtn}
            />
            <PrimaryButton
              title={deleting ? 'Deleting…' : 'Delete Team'}
              variant="outline"
              onPress={handleDelete}
              loading={deleting}
              style={styles.deleteBtn}
            />
          </Animated.View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },

  // Hero
  hero: {
    backgroundColor: Colors.navyDark,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroDecor: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: Colors.gold + '0A', top: -80, right: -80,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: Colors.navyLight + '70',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  teamAvatarWrapper: { position: 'relative', marginBottom: 16 },
  teamAvatar: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: Colors.navyLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.gold + '60',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  teamInitials: {
    fontSize: 34, fontWeight: '800', color: Colors.gold,
  },
  ownerCrown: {
    position: 'absolute', bottom: -6, right: -6,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.navyDark,
  },
  teamName: {
    fontSize: 26, fontWeight: '800', color: Colors.textWhite,
    textAlign: 'center', marginBottom: 8,
  },
  ownerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.gold + '20',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  ownerBadgeText: {
    fontSize: 12, color: Colors.gold, fontWeight: '600',
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: Colors.navyLight,
    borderRadius: 18, paddingVertical: 16,
    paddingHorizontal: 32, alignItems: 'center', gap: 32,
    alignSelf: 'stretch',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatNumber: {
    fontSize: 22, fontWeight: '800', color: Colors.gold, marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 12, color: Colors.textMuted, fontWeight: '500',
  },
  heroStatDivider: {
    width: 1, height: 32, backgroundColor: Colors.navyDark,
  },

  // Cards
  card: {
    backgroundColor: Colors.surfaceCard,
    marginHorizontal: 20, borderRadius: 20,
    padding: 20, marginBottom: 16,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary,
  },
  descriptionText: {
    fontSize: 15, color: Colors.textSecondary, lineHeight: 22,
  },

  // Owner row
  ownerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  ownerInfo: {},
  ownerName: {
    fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2,
  },
  ownerRole: {
    fontSize: 13, color: Colors.gold, fontWeight: '600',
  },

  // Members
  membersGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
  },
  noMembers: {
    fontSize: 14, color: Colors.textMuted, fontStyle: 'italic',
  },

  // Actions
  actionsWrapper: {
    paddingHorizontal: 20, gap: 12,
  },
  editBtn: {},
  joinBtn: {
    marginTop: 20,
  },
  deleteBtn: {
    borderColor: Colors.danger + '80',
  },
});
