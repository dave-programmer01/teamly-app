import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import { Team } from '../../components/TeamCard';

const QUICK_ACTIONS = [
  {
    icon: 'add-circle' as const,
    label: 'Create Team',
    color: Colors.gold,
    route: '/teams/create' as const,
  },
  {
    icon: 'people' as const,
    label: 'Browse Teams',
    color: '#5B8AF5',
    route: '/(tabs)/teams' as const,
  },
  {
    icon: 'person-circle' as const,
    label: 'My Profile',
    color: '#5ECC8B',
    route: '/(tabs)/profile' as const,
  },
];

export default function HomeScreen() {
  const { user, token, isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.spring(statsAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
    ]).start();

    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await apiFetch(endpoints.teams, {}, token);
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (_) {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  };

  const myTeam = teams.find(
    (t) => t.ownerUsername === user?.username
  );
  // Backend doesn't currently return members in the TeamResponse DTO
  const memberOf: Team[] = []; // Placeholder until backend supports members

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const slideIn = (delay = 0) => ({
    opacity: statsAnim,
    transform: [
      {
        translateY: statsAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      >
        {/* Hero Header */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.heroDecorTop} />
          <View style={styles.heroDecorBot} />

          <View style={styles.heroContent}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.username}>{user?.username ?? 'Friend'} 🙌</Text>
              <Text style={styles.churchTag}>New Life Church · Bronx, NY</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{teams.length}</Text>
              <Text style={styles.statLabel}>Total Teams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{myTeam ? 1 : 0}</Text>
              <Text style={styles.statLabel}>Leading</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{memberOf.length}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.section, slideIn()]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.filter(a => isAdmin || a.label !== 'Create Team').map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}
                >
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recent Teams */}
        <Animated.View style={[styles.section, slideIn()]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Teams</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/teams')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {teams.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Teams Yet</Text>
              <Text style={styles.emptyText}>
                Create or join a team to get started
              </Text>
            </View>
          ) : (
            teams.slice(0, 3).map((team) => (
              <TouchableOpacity
                key={team.teamId}
                style={styles.recentTeamRow}
                onPress={() => router.push(`/teams/${team.teamId}` as any)}
                activeOpacity={0.8}
              >
                <View style={styles.recentTeamAvatar}>
                  <Text style={styles.recentTeamInitials}>
                    {team.teamName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recentTeamInfo}>
                  <Text style={styles.recentTeamName} numberOfLines={1}>
                    {team.teamName}
                  </Text>
                  <Text style={styles.recentTeamMeta} numberOfLines={1}>
                    {team.ownerUsername ?? 'Unknown'}
                  </Text>
                </View>
                {team.ownerUsername === user?.username && (
                  <View style={styles.ownerDot} />
                )}
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  // Hero
  hero: {
    backgroundColor: Colors.navyDark,
    paddingTop: 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
  },
  heroDecorTop: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.gold + '0A', top: -60, right: -60,
  },
  heroDecorBot: {
    position: 'absolute', width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.navyLight + '40', bottom: -40, left: -40,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  greeting: {
    fontSize: 16, color: Colors.gold, fontWeight: '500', marginBottom: 4,
  },
  username: {
    fontSize: 28, fontWeight: '800', color: Colors.textWhite, marginBottom: 4,
  },
  churchTag: {
    fontSize: 12, color: Colors.textMuted, fontWeight: '400',
  },
  notifBtn: {},
  avatarCircle: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: Colors.navyLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.gold + '60',
  },
  avatarInitial: {
    fontSize: 20, fontWeight: '800', color: Colors.gold,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.navyLight,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statCard: { flex: 1, alignItems: 'center' },
  statNumber: {
    fontSize: 28, fontWeight: '800', color: Colors.gold, marginBottom: 2,
  },
  statLabel: {
    fontSize: 12, color: Colors.textMuted, fontWeight: '500',
  },
  statDivider: {
    width: 1, height: 36, backgroundColor: Colors.navyDark,
  },

  // Section
  section: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.textPrimary,
  },
  seeAll: { fontSize: 14, color: Colors.gold, fontWeight: '600' },

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row', gap: 12,
  },
  actionCard: {
    flex: 1, backgroundColor: Colors.surfaceCard,
    borderRadius: 18, padding: 16, alignItems: 'center',
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 2,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  actionLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Recent Teams
  recentTeamRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  recentTeamAvatar: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: Colors.navy,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  recentTeamInitials: {
    fontSize: 15, fontWeight: '800', color: Colors.gold,
  },
  recentTeamInfo: { flex: 1 },
  recentTeamName: {
    fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3,
  },
  recentTeamMeta: {
    fontSize: 12, color: Colors.textMuted,
  },
  ownerDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.gold, marginRight: 8,
  },

  // Empty
  emptyCard: {
    backgroundColor: Colors.surfaceCard, borderRadius: 20,
    padding: 32, alignItems: 'center',
    shadowColor: Colors.navy, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.textPrimary, marginTop: 12,
  },
  emptyText: {
    fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center',
  },
});
