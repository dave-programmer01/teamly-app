import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Alert, TextInput, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import PrimaryButton from '../../components/PrimaryButton';

interface Announcement {
  id: number;
  message: string;
  createdAt: string;
  teamId?: number; // Depending on what the response has
}

interface Team {
  teamId: number;
  teamName: string;
}

export default function AnnouncementsScreen() {
  const { token, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Post modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 70, friction: 9,
    }).start();
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const [res, teamsRes] = await Promise.all([
        apiFetch(endpoints.announcements, {}, token),
        apiFetch(endpoints.teams, {}, token) // Fetch teams for selection
      ]);

      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const handlePost = async () => {
    if (!teamId || !message.trim()) return Alert.alert('Error', 'Please fill out all fields. Make sure to select a team.');
    setPosting(true);
    try {
      const res = await apiFetch(endpoints.announcements, {
        method: 'POST',
        body: JSON.stringify({ teamId, message })
      }, token);
      
      if (res.ok) {
        setModalVisible(false);
        setTeamId(null);
        setMessage('');
        fetchAnnouncements();
      } else {
        Alert.alert('Error', 'Failed to post announcement.');
      }
    } catch (_) {
      Alert.alert('Network Error', 'Please try again later.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const res = await apiFetch(endpoints.announcement(id), { method: 'DELETE' }, token);
          if (res.ok) fetchAnnouncements();
          else Alert.alert('Error', 'Could not delete.');
        } catch (_) {}
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
      </Animated.View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.gold}/></View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await fetchAnnouncements(); setRefreshing(false); }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No announcements yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Announcement</Text>
                {isAdmin && (
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.cardContent}>{item.message}</Text>
              <Text style={styles.cardDate}>{item.createdAt || 'Recent'}</Text>
            </View>
          )}
        />
      )}

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color={Colors.navyDark} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>New Announcement</Text>
          
          <Text style={{fontWeight: '700', marginBottom: 8, color: Colors.textSecondary}}>Select Team</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow: 0, marginBottom: 16}}>
            {teams.map(t => (
              <TouchableOpacity
                key={t.teamId}
                onPress={() => setTeamId(t.teamId)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 10,
                  backgroundColor: teamId === t.teamId ? Colors.gold : Colors.surfaceCard,
                  borderRadius: 20, marginRight: 10, borderWidth: 1,
                  borderColor: teamId === t.teamId ? Colors.gold : '#DDD'
                }}
              >
                <Text style={{color: teamId === t.teamId ? '#FFF' : Colors.textPrimary, fontWeight: '600'}}>
                  {t.teamName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Type your announcement message here..."
            value={message}
            onChangeText={setMessage}
            multiline
            placeholderTextColor={Colors.textMuted}
          />
          <PrimaryButton title={posting ? "Posting..." : "Post Announcement"} onPress={handlePost} loading={posting} />
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  header: {
    backgroundColor: Colors.navyDark, padding: 24, paddingTop: 60,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 24, color: Colors.textWhite, fontWeight: '800' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surfaceCard, padding: 20, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: Colors.gold,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 18, color: Colors.textPrimary, fontWeight: '700', flex: 1 },
  cardContent: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 12 },
  cardDate: { fontSize: 12, color: Colors.textMuted },
  emptyText: { marginTop: 16, fontSize: 16, color: Colors.textMuted, fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: 40, right: 24,
    backgroundColor: Colors.gold, width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5,
  },
  modalContainer: { flex: 1, padding: 24, backgroundColor: Colors.surface, paddingTop: 60 },
  modalTitle: { fontSize: 26, fontWeight: '800', color: Colors.navyDark, marginBottom: 24 },
  input: {
    backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    padding: 16, fontSize: 16, marginBottom: 16, color: Colors.textPrimary,
  },
  textArea: { height: 160, textAlignVertical: 'top' },
  cancelBtn: { marginTop: 16, alignItems: 'center', padding: 12 },
  cancelText: { color: Colors.danger, fontWeight: '600', fontSize: 16 },
});
