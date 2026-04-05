import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'gold' | 'navy' | 'outline';
  style?: ViewStyle;
}

export default function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'gold',
  style,
}: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const bgStyle =
    variant === 'gold'
      ? styles.goldBg
      : variant === 'navy'
      ? styles.navyBg
      : styles.outlineBg;

  const textStyle =
    variant === 'outline' ? styles.outlineText : styles.solidText;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[styles.button, bgStyle, (disabled || loading) && styles.disabled, style]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? Colors.gold : Colors.navyDark}
            size="small"
          />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  goldBg: {
    backgroundColor: Colors.gold,
  },
  navyBg: {
    backgroundColor: Colors.navy,
    shadowColor: Colors.navyDark,
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.gold,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  solidText: {
    color: Colors.navyDark,
  },
  outlineText: {
    color: Colors.gold,
  },
});
