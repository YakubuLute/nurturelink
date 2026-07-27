import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Shield, RefreshCw, User } from 'lucide-react-native';

interface Props {
  active: 'home' | 'referrals' | 'sync' | 'profile';
  onHome: () => void;
  onReferrals: () => void;
  onSync: () => void;
  onProfile: () => void;
  referralBadge?: number;
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
      icon: <Home size={22} color={active === 'home' ? '#08283B' : '#9CA3AF'} />,
      onPress: onHome,
    },
    {
      key: 'referrals',
      label: 'Referrals',
      icon: <Shield size={22} color={active === 'referrals' ? '#08283B' : '#9CA3AF'} />,
      onPress: onReferrals,
    },
    {
      key: 'sync',
      label: 'Sync',
      icon: <RefreshCw size={22} color={active === 'sync' ? '#08283B' : '#9CA3AF'} />,
      onPress: onSync,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={22} color={active === 'profile' ? '#08283B' : '#9CA3AF'} />,
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
