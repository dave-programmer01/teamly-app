import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const MENU_ITEMS = [
  {
    id: 'announcements',
    icon: 'megaphone' as const,
    title: 'Announcements',
    subtitle: 'Stay updated with church news',
    route: '/(features)/announcements',
    color: Colors.gold,
  },
  {
    id: 'events',
    icon: 'calendar' as const,
    title: 'Events',
    subtitle: 'Upcoming gatherings and tasks',
    route: '/(features)/events',
    color: '#5B8AF5',
  },
  {
    id: 'requests',
    icon: 'mail' as const,
    title: 'Requests',
    subtitle: 'Submit and view ministry requests',
    route: '/(features)/requests',
    color: '#5ECC8B',
  },
];

export default function MenuScreen() {
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 9,
    }).start();
  }, []);

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
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerDecor} />
        <Text style={styles.headerLabel}>More Options</Text>
        <Text style={styles.headerTitle}>Menu</Text>
      </Animated.View>

      {/* Items */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {MENU_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
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
    marginBottom: 16,
  },
  headerDecor: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.gold + '0C', top: -60, right: -40,
  },
  headerLabel: {
    fontSize: 13, color: Colors.gold, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: Colors.textWhite,
  },

  list: { paddingHorizontal: 20, paddingTop: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: { flex: 1 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
