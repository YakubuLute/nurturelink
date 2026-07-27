import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore, UiLang } from '../store';
import { BottomTabBar } from '../components/BottomTabBar';
import { ChevronLeft, BarChart2, User, BatteryMedium, HardDrive, Zap, TrendingUp, LayoutGrid, ChevronRight } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const {
    battery,
    storageUsed,
    adaptiveSync,
    telemetryCount,
    uiLang,
    referrals,
    sync,
    toggleAdaptive,
    setUiLang,
    logout,
  } = useAppStore();

  const issuedCount = referrals.filter((r) => r.status === 'issued').length;
  const storagePct = Math.min((storageUsed / 250) * 100, 100);

  function handleSignOut() {
    logout();
    navigation.replace('Login');
  }

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={24} color="#FDFDFD" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile & device</Text>
            <View style={{ width: 36 }} />
          </View>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>YL</Text>
            </View>
            <View>
              <Text style={styles.profileName}>Yakubu Lute</Text>
              <Text style={styles.profileRole}>Community Health Officer · Kukuo</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* THIS DEVICE section */}
        <Text style={styles.sectionLabel}>THIS DEVICE</Text>
        <View style={styles.card}>
          {/* Profiles row */}
          <View style={styles.settingRow}>
            <User size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>3 worker profiles</Text>
              <Text style={styles.settingDesc}>Shared compound handset · each logs in with a PIN</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Battery row */}
          <View style={styles.settingRow}>
            <BatteryMedium size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Battery {battery}%</Text>
              <Text style={styles.settingDesc}>Heavy syncs pause below 30% unless on power</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Storage row */}
          <View style={styles.settingRow}>
            <HardDrive size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Storage · {storageUsed} MB of 250 MB</Text>
              <View style={styles.storageBar}>
                <View style={[styles.storageBarFill, { width: `${storagePct}%` }]} />
              </View>
              <Text style={styles.settingDesc}>Old audio clears automatically under 10% free</Text>
            </View>
          </View>
        </View>

        {/* SYNC & DATA section */}
        <Text style={styles.sectionLabel}>SYNC & DATA</Text>
        <View style={styles.card}>
          {/* Adaptive sync toggle */}
          <View style={styles.settingRowSpaced}>
            <Zap size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Battery-aware sync</Text>
              <Text style={styles.settingDesc}>Large downloads only on power or Wi-Fi</Text>
            </View>
            <Switch
              value={adaptiveSync}
              onValueChange={toggleAdaptive}
              trackColor={{ false: '#E5E7EB', true: '#427CAF' }}
              thumbColor="#FFFFFF"
              accessibilityLabel="Toggle battery-aware sync"
            />
          </View>
          <View style={styles.divider} />

          {/* Telemetry row */}
          <View style={styles.settingRow}>
            <BarChart2 size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Telemetry queue · {telemetryCount} events</Text>
              <Text style={styles.settingDesc}>Anonymised usage, PII stripped, sent with sync</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Monthly tally row */}
          <TouchableOpacity
            style={styles.settingRowSpaced}
            onPress={() => navigation.navigate('Tally')}
            accessibilityRole="button"
            accessibilityLabel="Monthly tally"
          >
            <TrendingUp size={20} color="#374151" />
            <View style={styles.settingBody}>
              <Text style={styles.settingTitle}>Monthly tally · DHIMS2</Text>
              <Text style={styles.settingDesc}>Auto-generated CHPS report</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* INTERFACE LANGUAGE section */}
        <Text style={styles.sectionLabel}>INTERFACE LANGUAGE</Text>
        <View style={[styles.card, { gap: 12 }]}>
          <View style={styles.langToggleRow}>
            {(['en', 'dag'] as UiLang[]).map((lang) => {
              const isActive = uiLang === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langBtn,
                    isActive ? styles.langBtnActive : styles.langBtnInactive,
                  ]}
                  onPress={() => setUiLang(lang)}
                  accessibilityRole="button"
                  accessibilityLabel={lang === 'en' ? 'English' : 'Dagbani'}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.langBtnText, isActive ? styles.langBtnTextActive : styles.langBtnTextInactive]}>
                    {lang === 'en' ? 'English' : 'Dagbani'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.betaRow}>
            <View style={styles.betaBadge}>
              <Text style={styles.betaBadgeText}>Beta</Text>
            </View>
            <Text style={styles.betaNote}>Interface translation is under native-speaker review</Text>
          </View>
        </View>

        {/* District overview */}
        <TouchableOpacity
          style={styles.districtCard}
          onPress={() => navigation.navigate('Supervisor')}
          accessibilityRole="button"
          accessibilityLabel="District overview"
        >
          <LayoutGrid size={20} color="#374151" />
          <View style={styles.settingBody}>
            <Text style={styles.settingTitle}>District overview</Text>
            <Text style={styles.settingDesc}>Sagnarigu district · 6 CHPS zones</Text>
          </View>
          <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabBar
        active="profile"
        onHome={() => navigation.navigate('Home')}
        onReferrals={() => navigation.navigate('ReferralsList')}
        onSync={sync}
        onProfile={() => {}}
        referralBadge={issuedCount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F4F5',
  },
  headerSafe: {
    backgroundColor: '#08283B',
  },
  header: {
    backgroundColor: '#08283B',
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#427CAF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  profileRole: {
    fontSize: 12.5,
    color: '#92C9F9',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 6,
  },

  card: {
    backgroundColor: '#FDFDFD',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 15,
    marginBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F1F3',
    marginVertical: 0,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    gap: 12,
  },
  settingRowSpaced: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  settingBody: {
    flex: 1,
    gap: 3,
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#08283B',
  },
  settingDesc: {
    fontSize: 11.5,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Storage bar
  storageBar: {
    height: 7,
    backgroundColor: '#ECECEB',
    borderRadius: 4,
    marginVertical: 6,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#427CAF',
    borderRadius: 4,
  },

  // Language toggle
  langToggleRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 13,
    paddingBottom: 0,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  langBtnActive: {
    backgroundColor: '#08283B',
    borderColor: '#08283B',
  },
  langBtnInactive: {
    backgroundColor: '#FDFDFD',
    borderColor: '#E5E7EB',
  },
  langBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
  },
  langBtnTextInactive: {
    color: '#374151',
  },

  betaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 13,
  },
  betaBadge: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE18A',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  betaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C6900',
  },
  betaNote: {
    fontSize: 11,
    color: '#8C6900',
    flex: 1,
    lineHeight: 15,
  },

  // District card
  districtCard: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },

  // Sign out
  signOutBtn: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FBD5D5',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C81E1E',
  },
});
