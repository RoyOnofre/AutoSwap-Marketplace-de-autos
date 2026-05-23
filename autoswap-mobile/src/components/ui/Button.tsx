import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Props = {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

export const Button: React.FC<Props> = ({ onPress, title, variant = 'primary', disabled }) => {
  const containerStyle: ViewStyle = {
    backgroundColor: variant === 'primary' ? '#1e40af' : '#6b7280', // primary-600, secondary-500
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    opacity: disabled ? 0.6 : 1,
    alignItems: 'center',
  };
  const textStyle: TextStyle = {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  };
  return (
    <Pressable onPress={onPress} disabled={disabled} style={containerStyle}>
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
};
