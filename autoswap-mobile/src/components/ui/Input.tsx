import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Props = {
  value: string | number;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
};

export const Input: React.FC<Props> = ({ value, onChangeText, placeholder, keyboardType = 'default' }) => {
  return (
    <TextInput
      style={styles.input}
      value={String(value)}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      keyboardType={keyboardType}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#111827',
    marginBottom: 12,
  } as ViewStyle,
});
