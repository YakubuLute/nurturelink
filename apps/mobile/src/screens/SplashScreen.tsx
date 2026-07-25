import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 1900);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.root}>
      {/* Logo container */}
      <View style={styles.logoContainer}>
        <LogoMark size={54} onDark={false} />
      </View>

      {/* Brand name */}
      <Text style={styles.brandName}>NurtureLink</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Offline nutrition companion for CHPS frontline workers
      </Text>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Spinner */}
      <ActivityIndicator color="#92C9F9" size="small" />

      {/* Tagline */}
      <Text style={styles.tagline}>NurtureLink · UNICEF StartUp Lab</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08283B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 26,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    // Android elevation
    elevation: 10,
  },
  brandName: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#92C9F9',
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
    maxHeight: 80,
  },
  tagline: {
    marginTop: 12,
    fontSize: 11,
    color: '#5A6F7C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
