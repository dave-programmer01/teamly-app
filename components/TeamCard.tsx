import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import MemberAvatar from './MemberAvatar';

export interface Team {
  teamId: number;
  teamName: string;
  teamDescription: string;
  ownerUsername?: string;
  teamCreatedDate?: string;
}

interface TeamCardProps {
  team: Team;
  onPress: () => void;
  isOwner?: boolean;
}

export default function TeamCard({ team, onPress, isOwner }: TeamCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  };

  // Backend doesn't currently return members inside the list DTO
  const memberCount = 0;
  const initials = team.teamName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.card}
      >
        {/* Left accent bar */}
        <View style={styles.accentBar} />

        {/* Team avatar/initials */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.teamName} numberOfLines={1}>
              {team.teamName}
            </Text>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Ionicons name="shield-checkmark" size={10} color={Colors.gold} />
                <Text style={styles.ownerBadgeText}>OWNER</Text>
              </View>
            )}
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {team.teamDescription || 'No description provided.'}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Ionicons name="people" size={13} color={Colors.textMuted} />
              <Text style={styles.footerText}>0 members</Text>
            </View>
            {team.ownerUsername && (
              <View style={styles.footerItem}>
                <Ionicons name="person" size={13} color={Colors.textMuted} />
                <Text style={styles.footerText}>{team.ownerUsername}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} style={styles.arrow} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 18,
    marginHorizontal: 20,
    marginVertical: 7,
    paddingVertical: 16,
    paddingRight: 16,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Colors.gold,
    borderRadius: 2,
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 3,
  },
  ownerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 14,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  arrow: {
    marginLeft: 8,
  },
});
