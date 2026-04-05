import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { endpoints, apiFetch } from '../../constants/api';
import PrimaryButton from '../../components/PrimaryButton';

interface EventTask {
  id: number;
  label: string;
  isDone: boolean;
}

interface ChurchEvent {
  id: number;
  title: string;
  notes: string;
  eventDate: string;
  eventTime?: string;
  tasks?: EventTask[];
}

export default function EventsScreen() {
  const { token, isAdmin } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Post modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [posting, setPosting] = useState(false);
  
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [loadingTasks, setLoadingTasks] = useState<Record<number, boolean>>({});

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 70, friction: 9,
    }).start();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await apiFetch(endpoints.events, {}, token);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  const fetchTasks = async (eventId: number) => {
    setLoadingTasks(prev => ({ ...prev, [eventId]: true }));
    try {
      const res = await apiFetch(endpoints.eventTasks(eventId), {}, token);
      if (res.ok) {
        const tasks = await res.json();
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, tasks } : e));
      }
    } catch (_) {}
    finally { setLoadingTasks(prev => ({ ...prev, [eventId]: false })); }
  };

  const toggleExpand = (eventId: number) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      const ev = events.find(e => e.id === eventId);
      if (ev && !ev.tasks) {
        fetchTasks(eventId);
      }
    }
  };

  const toggleTaskStatus = async (taskId: number, currentStatus: boolean, eventId: number) => {
    try {
      const res = await apiFetch(endpoints.taskStatus(taskId), {
        method: 'PATCH',
        body: JSON.stringify({ isDone: !currentStatus })
      }, token);
      if (res.ok) {
        fetchTasks(eventId);
      }
    } catch (_) {}
  };

  const handlePost = async () => {
    if (!title.trim() || !notes.trim()) return Alert.alert('Error', 'Please fill out all fields');
    setPosting(true);
    try {
      const res = await apiFetch(endpoints.events, {
        method: 'POST',
        // Backend requires title, eventDate (YYYY-MM-DD), eventTime (HH:MM:SS), notes
        body: JSON.stringify({ 
          title, 
          notes, 
          eventDate: new Date().toISOString().split('T')[0],
          eventTime: '10:00:00' 
        })
      }, token);
      
      if (res.ok) {
        setModalVisible(false);
        setTitle('');
        setNotes('');
        fetchEvents();
      } else {
        Alert.alert('Error', 'Failed to create event.');
      }
    } catch (_) {
      Alert.alert('Network Error', 'Please try again.');
    } finally {
      setPosting(false);
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
        <Text style={styles.headerTitle}>Events</Text>
      </Animated.View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={'#5B8AF5'}/></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={async () => { setRefreshing(true); await fetchEvents(); setRefreshing(false); }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No upcoming events.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isExpanded = expandedEventId === item.id;
            return (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.cardHeader} activeOpacity={0.7}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.eventDate} at {item.eventTime || '10:00 AM'}</Text>
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={22} color={Colors.textMuted} />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.cardContent}>{item.notes}</Text>
                    
                    <Text style={styles.tasksTargetLabel}>Tasks / Requirements</Text>
                    {loadingTasks[item.id] ? (
                      <ActivityIndicator size="small" color="#5B8AF5" style={{marginVertical: 10}}/>
                    ) : item.tasks && item.tasks.length > 0 ? (
                      item.tasks.map(task => (
                        <TouchableOpacity
                          key={task.id}
                          style={styles.taskRow}
                          onPress={() => toggleTaskStatus(task.id, task.isDone, item.id)}
                        >
                          <Ionicons 
                            name={task.isDone ? "checkmark-circle" : "ellipse-outline"} 
                            size={22} 
                            color={task.isDone ? Colors.gold : Colors.textMuted} 
                          />
                          <Text style={[styles.taskDesc, task.isDone && styles.taskDone]}>
                            {task.label}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noTasks}>No tasks assigned to this event.</Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {isAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color={Colors.textWhite} />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Event</Text>
          <TextInput
            style={styles.input}
            placeholder="Event Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={Colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes or Description..."
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholderTextColor={Colors.textMuted}
          />
          <PrimaryButton title={posting ? "Creating..." : "Create Event"} onPress={handlePost} loading={posting} variant="navy" />
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
    backgroundColor: '#5B8AF5', padding: 24, paddingTop: 60,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 24, color: Colors.textWhite, fontWeight: '800' },
  list: { padding: 20, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surfaceCard, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: '#5B8AF5',
    overflow: 'hidden'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  cardTitleWrap: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 18, color: Colors.textPrimary, fontWeight: '700', marginBottom: 4 },
  cardDate: { fontSize: 13, color: '#5B8AF5', fontWeight: '600' },
  expandedContent: { padding: 20, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  cardContent: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginTop: 16, marginBottom: 16 },
  tasksTargetLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  taskDesc: { fontSize: 15, color: Colors.textSecondary, flex: 1 },
  taskDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  noTasks: { fontStyle: 'italic', color: Colors.textMuted, fontSize: 14 },
  emptyText: { marginTop: 16, fontSize: 16, color: Colors.textMuted, fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: 40, right: 24,
    backgroundColor: '#5B8AF5', width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B8AF5', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 5,
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
