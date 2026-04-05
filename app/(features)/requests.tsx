import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Alert, TextInput, Modal, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import PrimaryButton from '../../components/PrimaryButton';

interface MinistryRequest {
  id: number;
  item: string;
  quantity: number;
  status: string; // e.g. 'PENDING', 'APPROVED', 'COMPLETED'
  createdAt: string;
  toTeamId: number;
}

interface Team {
  teamId: number;
  teamName: string;
}

export default function RequestsScreen() {
  const { token, isAdmin, user } = useAuth();
  const [requests, setRequests] = useState<MinistryRequest[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Post modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [posting, setPosting] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 70, friction: 9,
    }).start();
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const [res, teamsRes] = await Promise.all([
        apiFetch(endpoints.requests, {}, token),
        apiFetch(endpoints.teams, {}, token)
      ]);

      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const updateStatus = async (id: number, currentStatus: string) => {
    // Basic toggle loop for demonstration (PENDING -> APPROVED -> COMPLETED -> PENDING)
    let nextStatus = 'APPROVED';
    if (currentStatus === 'APPROVED') nextStatus = 'COMPLETED';
    else if (currentStatus === 'COMPLETED') nextStatus = 'PENDING';

    try {
      const res = await apiFetch(endpoints.requestStatus(id), {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      }, token);
      if (res.ok) fetchRequests();
    } catch (_) {}
  };

  const handleCreate = async (shouldClose = true) => {
    if (!toTeamId || !item.trim() || !quantity.trim()) return Alert.alert('Error', 'Please fill out all fields');
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) return Alert.alert('Error', 'Quantity must be at least 1');

    setPosting(true);
    try {
      const res = await apiFetch(endpoints.requests, {
        method: 'POST',
        body: JSON.stringify({ 
          toTeamId, 
          item, 
          quantity: qty
        })
      }, token);
      
      if (res.ok) {
        if (shouldClose) {
          setModalVisible(false);
          setToTeamId(null);
        } else {
          // Stay open, provide visual feedback
          Alert.alert('Success', `Added ${qty}x ${item}. You can add more now.`);
        }
        setItem('');
        setQuantity('1');
        fetchRequests();
      } else {
        Alert.alert('Error', 'Failed to submit request.');
      }
    } catch (_) {
      Alert.alert('Network Error', 'Please try again later.');
    } finally {
      setPosting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return '#5ECC8B';
      case 'COMPLETED': return Colors.gold;
      default: return '#F1A528'; // Pending
    }
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
        <Text style={styles.headerTitle}>Ministry Requests</Text>
      </Animated.View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={'#5ECC8B'}/></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await fetchRequests(); setRefreshing(false); }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No requests submitted.</Text>
            </View>
          }
          renderItem={({ item: req }) => {
            const canUpdate = isAdmin || (user?.teamId === req.toTeamId);
            return (
              <View style={styles.card}>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{req.item}</Text>
                  <Text style={styles.cardContent}>Quantity: {req.quantity}</Text>
                  <Text style={styles.cardDate}>{req.createdAt || 'Just now'}</Text>
                </View>
                
                <TouchableOpacity 
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) + '20' }]}
                  onPress={() => canUpdate && updateStatus(req.id, req.status)}
                  disabled={!canUpdate}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(req.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(req.status) }]}>{req.status || 'PENDING'}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Everyone can submit a request */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color={Colors.textWhite} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Submit Request</Text>

          <Text style={{fontWeight: '700', marginBottom: 8, color: Colors.textSecondary}}>Request To Team</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow: 0, marginBottom: 16}}>
            {teams.map(t => (
              <TouchableOpacity
                key={t.teamId}
                onPress={() => setToTeamId(t.teamId)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 10,
                  backgroundColor: toTeamId === t.teamId ? '#3DAF73' : Colors.surfaceCard,
                  borderRadius: 20, marginRight: 10, borderWidth: 1,
                  borderColor: toTeamId === t.teamId ? '#3DAF73' : '#DDD'
                }}
              >
                <Text style={{color: toTeamId === t.teamId ? '#FFF' : Colors.textPrimary, fontWeight: '600'}}>
                  {t.teamName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={styles.input}
            placeholder="Item needed (e.g. Chairs, Water)"
            value={item}
            onChangeText={setItem}
            placeholderTextColor={Colors.textMuted}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholderTextColor={Colors.textMuted}
          />

          <PrimaryButton title={posting ? "Submitting..." : "Submit & Close"} onPress={() => handleCreate(true)} loading={posting} variant="navy" />
          
          <TouchableOpacity 
            style={styles.addAnotherBtn} 
            onPress={() => handleCreate(false)}
            disabled={posting}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.gold} />
            <Text style={styles.addAnotherText}>Add another request</Text>
          </TouchableOpacity>

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
    backgroundColor: '#3DAF73', padding: 24, paddingTop: 60,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 24, color: Colors.textWhite, fontWeight: '800' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surfaceCard, padding: 20, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#5ECC8B',
    flexDirection: 'row', alignItems: 'flex-start',
  },
  cardBody: { flex: 1, paddingRight: 16 },
  cardTitle: { fontSize: 18, color: Colors.textPrimary, fontWeight: '700', marginBottom: 6 },
  cardContent: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 12 },
  cardDate: { fontSize: 12, color: Colors.textMuted },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  emptyText: { marginTop: 16, fontSize: 16, color: Colors.textMuted, fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: 40, right: 24,
    backgroundColor: '#3DAF73', width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3DAF73', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5,
  },
  modalContainer: { flex: 1, padding: 24, backgroundColor: Colors.surface, paddingTop: 60 },
  modalTitle: { fontSize: 26, fontWeight: '800', color: Colors.navyDark, marginBottom: 24 },
  input: {
    backgroundColor: Colors.surfaceCard, borderWidth: 1, borderColor: '#DDD', borderRadius: 12,
    padding: 16, fontSize: 16, marginBottom: 16, color: Colors.textPrimary,
  },
  textArea: { height: 160, textAlignVertical: 'top' },
  cancelBtn: { marginTop: 8, alignItems: 'center', padding: 12 },
  cancelText: { color: Colors.textMuted, fontWeight: '500', fontSize: 15 },
  addAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  addAnotherText: {
    color: Colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
});
