import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import TeamCard, { Team } from '../../components/TeamCard';

export default function TeamsScreen() {
  const { token, user, isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filtered, setFiltered] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fabAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: 1, useNativeDriver: true, tension: 80, friction: 9,
      }),
      Animated.spring(fabAnim, {
        toValue: 1, useNativeDriver: true, tension: 80, friction: 9, delay: 300,
      }),
    ]).start();
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await apiFetch(endpoints.teams, {}, token);
      if (res.ok) {
        const data: Team[] = await res.json();
        setTeams(data);
        setFiltered(data);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(teams);
    } else {
      setFiltered(
        teams.filter(
          (t) =>
            t.teamName.toLowerCase().includes(text.toLowerCase()) ||
            t.teamDescription?.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  }, [teams]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>
        {search ? 'No matches found' : 'No Teams Yet'}
      </Text>
      <Text style={styles.emptyText}>
        {search
          ? 'Try a different search term'
          : 'Be the first to create a team!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerDecor} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>Ministry Teams</Text>
            <Text style={styles.headerTitle}>All Teams</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{teams.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search teams…"
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={handleSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </Animated.View>

      {/* Team List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.teamId)}
        renderItem={({ item }) => (
          <TeamCard
            team={item}
            onPress={() => router.push(`/teams/${item.teamId}` as any)}
            isOwner={item.ownerUsername === user?.username}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? null : renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
          />
        }
      />

      {/* FAB */}
      {isAdmin && (
        <Animated.View
          style={[
            styles.fabWrapper,
            {
              opacity: fabAnim,
              transform: [{ scale: fabAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/teams/create')}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color={Colors.navyDark} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    backgroundColor: Colors.navyDark,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    marginBottom: 8,
  },
  headerDecor: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.gold + '0C', top: -60, right: -40,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 20,
  },
  headerLabel: {
    fontSize: 13, color: Colors.gold, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: Colors.textWhite,
  },
  countBadge: {
    backgroundColor: Colors.gold + '25',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  countText: {
    fontSize: 18, fontWeight: '800', color: Colors.gold,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.navyLight + 'CC',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.navyLight,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1, fontSize: 15, color: Colors.textWhite, fontWeight: '500',
  },

  list: {
    paddingTop: 12, paddingBottom: 120,
  },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.textPrimary,
    marginTop: 16, marginBottom: 8,
  },
  emptyText: {
    fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20,
  },

  fabWrapper: {
    position: 'absolute', bottom: 100, right: 24,
  },
  fab: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
