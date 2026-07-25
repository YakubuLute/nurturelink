import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';
import { useAppStore } from '../store';
import { storeSession } from '../auth/session';
import type { Role } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// ─── PIN keypad layout ────────────────────────────────────────────────────────

const KEYPAD_ROWS: (string | null)[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  [null, '0', '⌫'],
];

// ─── User profiles shown per role ────────────────────────────────────────────

const USER_PROFILES: Record<Role, { name: string; subtitle: string }> = {
  cho: { name: 'Yakubu Lute', subtitle: 'Community Health Officer · Kukuo CHPS' },
  sup: { name: 'Yakubu Lute', subtitle: 'Supervisor · Tamale Metro District' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: Props) {
  const login = useAppStore((s) => s.login);

  const [role, setRole] = useState<Role>('cho');
  const [pin, setPin] = useState<string>('');

  function handleKey(key: string | null) {
    if (key === null) return;

    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }

    if (pin.length >= 4) return;

    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      setTimeout(async () => {
        // Store demo token so sync layer has a non-empty Authorization header
        await storeSession(role).catch(() => { /* non-fatal */ });
        login(role);
        if (role === 'sup') {
          navigation.replace('Supervisor');
        } else {
          navigation.replace('Home');
        }
      }, 260);
    }
  }

  const profile = USER_PROFILES[role];
  const avatarBg = role === 'cho' ? '#92C9F9' : '#FFEFE6';
  const avatarInitials = 'YL';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo row ── */}
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <LogoMark size={22} onDark={false} />
          </View>
          <Text style={styles.logoLabel}>NurtureLink</Text>
        </View>

        {/* ── Heading ── */}
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.headingSub}>Enter your PIN to open your caseload</Text>

        {/* ── Role switcher ── */}
        <View style={styles.roleSwitcher}>
          <Pressable
            style={[styles.roleBtn, role === 'cho' && styles.roleBtnActive]}
            onPress={() => { setRole('cho'); setPin(''); }}
            accessibilityRole="radio"
            accessibilityState={{ checked: role === 'cho' }}
          >
            <Text style={[styles.roleBtnText, role === 'cho' && styles.roleBtnTextActive]}>
              Health worker
            </Text>
          </Pressable>
          <Pressable
            style={[styles.roleBtn, role === 'sup' && styles.roleBtnActive]}
            onPress={() => { setRole('sup'); setPin(''); }}
            accessibilityRole="radio"
            accessibilityState={{ checked: role === 'sup' }}
          >
            <Text style={[styles.roleBtnText, role === 'sup' && styles.roleBtnTextActive]}>
              Supervisor
            </Text>
          </Pressable>
        </View>

        {/* ── Shared device info ── */}
        <View style={styles.sharedRow}>
          <Text style={styles.sharedIcon}>👥</Text>
          <Text style={styles.sharedText}>
            Shared device · 3 worker profiles · drafts stay locked to you
          </Text>
        </View>

        {/* ── Selected user card ── */}
        <View style={styles.userCard}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{avatarInitials}</Text>
          </View>
          <View style={styles.userCardText}>
            <Text style={styles.userName}>{profile.name}</Text>
            <Text style={styles.userRole}>{profile.subtitle}</Text>
          </View>
        </View>

        {/* ── PIN dots ── */}
        <View style={styles.pinRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < pin.length ? styles.pinDotFilled : styles.pinDotEmpty,
              ]}
            />
          ))}
        </View>

        {/* ── Spacer ── */}
        <View style={{ flex: 1 }} />

        {/* ── Keypad ── */}
        <View style={styles.keypad}>
          {KEYPAD_ROWS.map((row, rowIdx) => (
            <View key={rowIdx} style={styles.keypadRow}>
              {row.map((key, colIdx) => {
                const isBlank = key === null;
                const isDelete = key === '⌫';
                const isDigit = key !== null && key !== '⌫';

                return (
                  <Pressable
                    key={colIdx}
                    style={({ pressed }) => [
                      styles.keyBtn,
                      isDigit && styles.keyBtnDigit,
                      pressed && isDigit && styles.keyBtnPressed,
                    ]}
                    onPress={() => !isBlank && handleKey(key)}
                    disabled={isBlank}
                    accessibilityLabel={isDelete ? 'Delete' : key ?? undefined}
                    accessibilityRole="button"
                  >
                    {isBlank ? null : (
                      <Text
                        style={[
                          styles.keyText,
                          isDelete && styles.keyTextDelete,
                        ]}
                      >
                        {key}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* ── Demo hint ── */}
        <Text style={styles.demoHint}>Demo PIN — enter any 4 digits</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08283B',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 34,
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  // Logo row
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    justifyContent: 'center',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  logoLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.1,
  },

  // Heading
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FDFDFD',
    marginBottom: 6,
  },
  headingSub: {
    fontSize: 14,
    color: '#8D9CA5',
    marginBottom: 24,
  },

  // Role switcher
  roleSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 11,
    padding: 4,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  roleBtnActive: {
    backgroundColor: '#FDFDFD',
  },
  roleBtnText: {
    fontSize: 14,
    color: '#8D9CA5',
    fontWeight: '500',
  },
  roleBtnTextActive: {
    color: '#08283B',
    fontWeight: '600',
  },

  // Shared device row
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sharedIcon: {
    fontSize: 13,
  },
  sharedText: {
    fontSize: 11.5,
    color: '#5A6F7C',
    flexShrink: 1,
    lineHeight: 16,
  },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
    marginBottom: 28,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#08283B',
  },
  userCardText: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FDFDFD',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#8D9CA5',
  },

  // PIN dots
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  pinDotFilled: {
    backgroundColor: '#FF5A00',
  },
  pinDotEmpty: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'transparent',
  },

  // Keypad
  keypad: {
    gap: 10,
    marginTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keyBtn: {
    flex: 1,
    height: 62,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  keyBtnDigit: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  keyBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FDFDFD',
  },
  keyTextDelete: {
    fontSize: 20,
    fontWeight: '600',
    color: '#92C9F9',
  },

  // Demo hint
  demoHint: {
    marginTop: 18,
    fontSize: 12,
    color: '#5A6F7C',
    textAlign: 'center',
  },
});
