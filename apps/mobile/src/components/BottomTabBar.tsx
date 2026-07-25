import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  active: 'home' | 'referrals' | 'sync' | 'profile';
  onHome: () => void;
  onReferrals: () => void;
  onSync: () => void;
  onProfile: () => void;
  referralBadge?: number;
}

// Minimalist icon drawn with View shapes
function HomeIcon({ active }: { active: boolean }) {
  const c = active ? '#08283B' : '#9CA3AF';
  return (
    <View style={{ width: 22, height: 20, alignItems: 'center', justifyContent: 'flex-end' }}>
      {/* Roof triangle */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 11,
          borderRightWidth: 11,
          borderBottomWidth: 9,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: c,
          marginBottom: 0,
        }}
      />
      {/* Body rectangle */}
      <View
        style={{
          width: 14,
          height: 9,
          backgroundColor: c,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      />
    </View>
  );
}

function ReferralsIcon({ active }: { active: boolean }) {
  const c = active ? '#08283B' : '#9CA3AF';
  return (
    <View style={{ width: 18, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      {/* Shield shape: rounded top, pointed bottom */}
      <View
        style={{
          width: 16,
          height: 12,
          backgroundColor: c,
          borderRadius: 4,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }}
      />
      {/* Shield point */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderTopWidth: 7,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: c,
          marginTop: -1,
        }}
      />
    </View>
  );
}

function SyncIcon({ active }: { active: boolean }) {
  const c = active ? '#08283B' : '#9CA3AF';
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 17, color: c, lineHeight: 20 }}>↺</Text>
    </View>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? '#08283B' : '#9CA3AF';
  return (
    <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
      {/* Head circle */}
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          backgroundColor: c,
          marginBottom: 1,
        }}
      />
      {/* Shoulders arc */}
      <View
        style={{
          width: 16,
          height: 7,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          backgroundColor: c,
        }}
      />
    </View>
  );
}

export function BottomTabBar({ active, onHome, onReferrals, onSync, onProfile, referralBadge }: Props) {
  const tabs: {
    key: 'home' | 'referrals' | 'sync' | 'profile';
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
  }[] = [
    {
      key: 'home',
      label: 'Home',
      icon: <HomeIcon active={active === 'home'} />,
      onPress: onHome,
    },
    {
      key: 'referrals',
      label: 'Referrals',
      icon: <ReferralsIcon active={active === 'referrals'} />,
      onPress: onReferrals,
    },
    {
      key: 'sync',
      label: 'Sync',
      icon: <SyncIcon active={active === 'sync'} />,
      onPress: onSync,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <ProfileIcon active={active === 'profile'} />,
      onPress: onProfile,
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={tab.onPress}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconWrapper}>
              {tab.icon}
              {tab.key === 'referrals' && referralBadge !== undefined && referralBadge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{referralBadge > 99 ? '99+' : referralBadge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDFDFD',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 22,
    paddingTop: 8,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 24,
  },
  label: {
    fontSize: 10,
  },
  labelActive: {
    color: '#08283B',
    fontWeight: '600',
  },
  labelInactive: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#C81E1E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 13,
  },
});
