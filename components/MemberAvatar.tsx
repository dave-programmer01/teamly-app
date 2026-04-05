import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface MemberAvatarProps {
  username: string;
  profilePicture?: string;
  size?: number;
  showName?: boolean;
}

export default function MemberAvatar({
  username,
  profilePicture,
  size = 44,
  showName = false,
}: MemberAvatarProps) {
  const initial = username?.[0]?.toUpperCase() ?? '?';

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View style={styles.container}>
      {profilePicture ? (
        <Image
          source={{ uri: profilePicture }}
          style={[styles.image, avatarStyle]}
        />
      ) : (
        <View style={[styles.placeholder, avatarStyle]}>
          <Text
            style={[
              styles.initial,
              { fontSize: size * 0.4 },
            ]}
          >
            {initial}
          </Text>
        </View>
      )}
      {showName && (
        <Text style={styles.name} numberOfLines={1}>
          {username}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    maxWidth: 64,
  },
  image: {
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  placeholder: {
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold + '60',
  },
  initial: {
    color: Colors.gold,
    fontWeight: '700',
  },
  name: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
});
