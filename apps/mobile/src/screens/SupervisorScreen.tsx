/**
 * SupervisorScreen — district-level overview for supervisors.
 * Shows aggregate caseload stats, referral pipeline, sync health,
 * and a list of CHO activity for the supervisor's zone.
 *
 * Supervisor role (Role = 'sup') is checked from the store; CHO-role users
 * should not see this screen in navigation.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Supervisor'>;

// ─── Demo district data ───────────────────────────────────────────────────────

const CHO_ACTIVITY = [
  {
    id: 'cho1',
    name: 'Yakubu Lute',
    zone: 'Kukuo CHPS',
    clients: 12,
    visited: 9,
    pending: 2,
    lastSync: '11:01 am',
    synced: true,
  },
  {
    id: 'cho2',
    name: 'Fati Abdulai',
    zone: 'Sagnarigu CHPS',
    clients: 15,
    visited: 11,
    pending: 0,
    lastSync: '9:45 am',
    synced: true,
  },
  {
    id: 'cho3',
    name: 'Issah Tahiru',
    zone: 'Gizaa CHPS',
    clients: 8,
    visited: 4,
    pending: 5,
    lastSync: '3 days ago',
    synced: false,
  },
  {
    id: 'cho4',
    name: 'Mariama Seidu',
    zone: 'Kpalsi CHPS',
    clients: 10,
    visited: 10,
    pending: 0,
    lastSync: 'Yesterday',
    synced: true,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  color = '#08283B',
  bg = '#FDFDFD',
}: {
  value: string | number;
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={[stat.card, { backgroundColor: bg }]}>
      <Text style={[stat.value, { color }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  );
}

function ChoRow({ cho }: { cho: (typeof CHO_ACTIVITY)[0] }) {
  const coverage = cho.clients > 0 ? Math.round((cho.visited / cho.clients) * 100) : 0;
  return (
    <View style={styles.choCard}>
      <View style={styles.choAvatar}>
        <Text style={styles.choAvatarText}>
          {cho.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
        </Text>
      </View>
      <View style={styles.choBody}>
        <View style={styles.choTopRow}>
          <Text style={styles.choName} numberOfLines={1}>{cho.name}</Text>
          <View
            style={[
              styles.syncBadge,
              { backgroundColor: cho.synced ? '#F3FAF7' : '#FFF9E6' },
            ]}
          >
            <Text
              style={[
                styles.syncBadgeText,
                { color: cho.synced ? '#057A55' : '#B48700' },
              ]}
            >
              {cho.synced ? 'Synced' : 'Behind'}
            </Text>
          </View>
        </View>
        <Text style={styles.choZone}>{cho.zone} · last sync {cho.lastSync}</Text>
        <View style={styles.choCovRow}>
          <View style={styles.choProgressBg}>
            <View style={[styles.choProgressFill, { width: `${coverage}%` }]} />
          </View>
          <Text style={styles.choProgressLabel}>{coverage}% visited</Text>
          {cho.pending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{cho.pending} pending</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function SupervisorScreen({ navigation }: Props) {
  const { clients, referrals } = useAppStore();
  const [tab, setTab] = useState<'overview' | 'chos'>('overview');

  const totalClients = clients.length + CHO_ACTIVITY.reduce((s, c) => s + c.clients, 0);
  const urgentCount = clients.filter((c) => c.priority === 'urgent').length + 1; // demo
  const totalReferrals = referrals.length + 2; // demo
  const pendingReferrals = referrals.filter((r) => r.status === 'issued').length + 1;
  const syncBehind = CHO_ACTIVITY.filter((c) => !c.synced).length;

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>District overview</Text>
            <Text style={styles.headerDate}>East Dagbon · {today}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab bar */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'overview' && styles.tabActive]}
            onPress={() => setTab('overview')}
            accessibilityRole="button"
          >
            <Text style={[styles.tabText, tab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'chos' && styles.tabActive]}
            onPress={() => setTab('chos')}
            accessibilityRole="button"
          >
            <Text style={[styles.tabText, tab === 'chos' && styles.tabTextActive]}>
              CHOs ({CHO_ACTIVITY.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'overview' ? (
          <>
            {/* Sync alert if any CHO behind */}
            {syncBehind > 0 && (
              <View style={styles.alertBanner}>
                <Text style={styles.alertIcon}>⚠</Text>
                <View style={styles.alertBody}>
                  <Text style={styles.alertTitle}>
                    {syncBehind} CHO{syncBehind !== 1 ? 's' : ''} not synced recently
                  </Text>
                  <Text style={styles.alertSub}>Check the CHOs tab for details</Text>
                </View>
              </View>
            )}

            {/* Caseload stats */}
            <Text style={styles.sectionTitle}>Caseload</Text>
            <View style={styles.statGrid}>
              <StatCard value={totalClients} label="Total clients" />
              <StatCard
                value={urgentCount}
                label="Urgent"
                color="#C81E1E"
                bg="#FDF2F2"
              />
              <StatCard
                value={totalReferrals}
                label="Referrals"
                color="#FF5A00"
                bg="#FFEFE6"
              />
              <StatCard
                value={pendingReferrals}
                label="Awaiting care"
                color="#B48700"
                bg="#FFF9E6"
              />
            </View>

            {/* Coverage */}
            <Text style={styles.sectionTitle}>Visit coverage this month</Text>
            <View style={styles.coverageCard}>
              {CHO_ACTIVITY.map((cho) => {
                const pct = Math.round((cho.visited / cho.clients) * 100);
                return (
                  <View key={cho.id} style={styles.coverageRow}>
                    <Text style={styles.coverageName} numberOfLines={1}>
                      {cho.name.split(' ')[0]}
                    </Text>
                    <View style={styles.coverageBarWrap}>
                      <View style={styles.coverageBarBg}>
                        <View style={[styles.coverageBarFill, { width: `${pct}%` }]} />
                      </View>
                    </View>
                    <Text style={styles.coveragePct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>

            {/* Referral pipeline */}
            <Text style={styles.sectionTitle}>Referral pipeline</Text>
            <View style={styles.pipelineCard}>
              <View style={styles.pipelineRow}>
                <View style={[styles.pipelineDot, { backgroundColor: '#FF5A00' }]} />
                <Text style={styles.pipelineLabel}>Issued</Text>
                <Text style={styles.pipelineValue}>{pendingReferrals}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pipelineRow}>
                <View style={[styles.pipelineDot, { backgroundColor: '#057A55' }]} />
                <Text style={styles.pipelineLabel}>Seen at facility</Text>
                <Text style={styles.pipelineValue}>{totalReferrals - pendingReferrals}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.pipelineRow}>
                <View style={[styles.pipelineDot, { backgroundColor: '#C81E1E' }]} />
                <Text style={styles.pipelineLabel}>{'Overdue (> 7 days)'}</Text>
                <Text style={[styles.pipelineValue, { color: '#C81E1E' }]}>1</Text>
              </View>
            </View>

            {/* Reference bundle */}
            <Text style={styles.sectionTitle}>Reference bundle</Text>
            <View style={styles.bundleCard}>
              <View style={styles.bundleRow}>
                <Text style={styles.bundleLabel}>Active version</Text>
                <Text style={styles.bundleValue}>v2.4.1</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.bundleRow}>
                <Text style={styles.bundleLabel}>Published</Text>
                <Text style={styles.bundleValue}>14 Nov 2026</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.bundleRow}>
                <Text style={styles.bundleLabel}>Devices on latest</Text>
                <Text style={styles.bundleValue}>3 / 4</Text>
              </View>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.bundlePushBtn} accessibilityRole="button">
                <Text style={styles.bundlePushBtnText}>Push update to devices</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Community health officers</Text>
            {CHO_ACTIVITY.map((cho) => (
              <ChoRow key={cho.id} cho={cho} />
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stat = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    margin: 4,
    minWidth: '45%',
  },
  value: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  label: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F5' },

  // Header
  headerSafe: { backgroundColor: '#08283B' },
  header: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 28, color: '#FDFDFD', lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FDFDFD' },
  headerDate: { fontSize: 11, color: '#8D9CA5', marginTop: 2 },

  // Tabs
  tabRow: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 0,
    gap: 0,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#FF5A00' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#8D9CA5' },
  tabTextActive: { color: '#FDFDFD', fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  // Alert
  alertBanner: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE18A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  alertIcon: { fontSize: 20, color: '#B48700' },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#08283B' },
  alertSub: { fontSize: 12, color: '#8C6900', marginTop: 2 },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },

  // Coverage
  coverageCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  coverageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coverageName: { width: 60, fontSize: 12, fontWeight: '600', color: '#374151' },
  coverageBarWrap: { flex: 1 },
  coverageBarBg: {
    height: 8,
    backgroundColor: '#F2F4F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  coverageBarFill: {
    height: '100%',
    backgroundColor: '#427CAF',
    borderRadius: 4,
  },
  coveragePct: { width: 36, fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'right' },

  // Pipeline
  pipelineCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 12,
  },
  pipelineDot: { width: 10, height: 10, borderRadius: 5 },
  pipelineLabel: { flex: 1, fontSize: 14, color: '#374151' },
  pipelineValue: { fontSize: 16, fontWeight: '700', color: '#08283B' },
  divider: { height: 1, backgroundColor: '#F0F1F3', marginVertical: 10 },

  // Bundle
  bundleCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
  },
  bundleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  bundleLabel: { fontSize: 14, color: '#374151' },
  bundleValue: { fontSize: 14, fontWeight: '600', color: '#08283B' },
  bundlePushBtn: {
    marginTop: 14,
    backgroundColor: '#08283B',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bundlePushBtnText: { fontSize: 14, fontWeight: '700', color: '#FDFDFD' },

  // CHO cards
  choCard: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  choAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6EAEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choAvatarText: { fontSize: 15, fontWeight: '700', color: '#08283B' },
  choBody: { flex: 1 },
  choTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  choName: { fontSize: 15, fontWeight: '700', color: '#08283B', flex: 1, marginRight: 8 },
  syncBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  syncBadgeText: { fontSize: 11, fontWeight: '600' },
  choZone: { fontSize: 11.5, color: '#9CA3AF', marginBottom: 8 },
  choCovRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  choProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F4F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  choProgressFill: {
    height: '100%',
    backgroundColor: '#08283B',
    borderRadius: 3,
  },
  choProgressLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
  pendingBadge: {
    backgroundColor: '#FFEFE6',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  pendingBadgeText: { fontSize: 10, fontWeight: '600', color: '#B54000' },
});
