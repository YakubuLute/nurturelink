import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore, DemoReferral, initials, avatarStyle } from '../store';
import { BottomTabBar } from '../components/BottomTabBar';
import { ChevronLeft, Check, Phone, Shield, Clock } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'ReferralsList'>;

function ReferralCard({
  referral,
  onConfirm,
}: {
  referral: DemoReferral;
  onConfirm: () => void;
}) {
  const av = avatarStyle(referral.type);
  const ins = initials(referral.name);
  const isIssued = referral.status === 'issued';
  const isSeen = referral.status === 'seen';

  return (
    <View style={styles.card}>
      {/* Top row: avatar + name + facility + status badge */}
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: av.bg }]}>
          <Text style={[styles.avatarText, { color: av.fg }]}>{ins}</Text>
        </View>
        <View style={styles.cardTopMid}>
          <Text style={styles.clientName}>{referral.name}</Text>
          <Text style={styles.facilityText}>{referral.facility}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isIssued
              ? { backgroundColor: '#FFEFE6' }
              : { backgroundColor: '#F3FAF7' },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              isIssued ? { color: '#B54000' } : { color: '#057A55' },
            ]}
          >
            {isIssued ? 'AWAITING' : 'SEEN'}
          </Text>
        </View>
      </View>

      {/* Reason box */}
      <View style={styles.reasonBox}>
        <Text style={styles.reasonText}>{referral.reason}</Text>
      </View>

      {/* Due / seen strip */}
      {isIssued && referral.due && (
        <View style={styles.stripIssued}>
          <Clock size={14} color="#B48700" />
          <Text style={styles.stripTextIssued}>Due {referral.due}</Text>
        </View>
      )}
      {isSeen && referral.seenAt && (
        <View style={styles.stripSeen}>
          <Check size={14} color="#057A55" strokeWidth={3} />
          <Text style={styles.stripTextSeen}>Seen at facility {referral.seenAt}</Text>
        </View>
      )}

      {/* Footer row */}
      <View style={styles.cardFooter}>
        <Text style={styles.issuedAt}>Issued {referral.at}</Text>
        {isIssued && (
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.callBtn}
              accessibilityRole="button"
              accessibilityLabel="Call client"
            >
              <Phone size={14} color="#08283B" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm client was seen"
            >
              <Text style={styles.confirmBtnText}>Confirm seen</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export function ReferralsListScreen({ navigation }: Props) {
  const { referrals, confirmReferralSeen, sync } = useAppStore();

  const issuedCount = referrals.filter((r) => r.status === 'issued').length;
  const seenCount = referrals.filter((r) => r.status === 'seen').length;

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <SafeAreaView style={styles.headerSafe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color="#FDFDFD" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Referrals</Text>
            <Text style={styles.headerSub}>Post-referral follow-up</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {referrals.length > 0 ? (
          <>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: '#FFF9E6', borderColor: '#FFE18A' }]}>
                <Text style={[styles.statCount, { color: '#B48700' }]}>{issuedCount}</Text>
                <Text style={[styles.statLabel, { color: '#8C6900' }]}>Awaiting confirmation</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#F3FAF7', borderColor: '#BCF0DA' }]}>
                <Text style={[styles.statCount, { color: '#057A55' }]}>{seenCount}</Text>
                <Text style={[styles.statLabel, { color: '#046C4E' }]}>Seen at facility</Text>
              </View>
            </View>
            <Text style={styles.statsNote}>
              Track each severe case until the child is confirmed seen
            </Text>

            {/* Referral cards */}
            {referrals.map((r) => (
              <ReferralCard
                key={r.id}
                referral={r}
                onConfirm={() => confirmReferralSeen(r.clientId)}
              />
            ))}
          </>
        ) : (
          /* Empty state */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Shield size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No open referrals</Text>
            <Text style={styles.emptyBody}>
              Severe cases referred to a health facility will appear here for follow-up.
            </Text>
          </View>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      <BottomTabBar
        active="referrals"
        onHome={() => navigation.navigate('Home')}
        onReferrals={() => {}}
        onSync={sync}
        onProfile={() => navigation.navigate('Settings')}
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#92C9F9',
    marginTop: 2,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statCount: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  statsNote: {
    fontSize: 11.5,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 16,
  },

  // Referral card
  card: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardTopMid: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#08283B',
    marginBottom: 2,
  },
  facilityText: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Reason box
  reasonBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },

  // Strips
  stripIssued: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginBottom: 12,
  },
  stripSeen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F3FAF7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginBottom: 12,
  },
  stripTextIssued: {
    fontSize: 12,
    color: '#8C6900',
    fontWeight: '600',
  },
  stripTextSeen: {
    fontSize: 12,
    color: '#057A55',
    fontWeight: '600',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  issuedAt: {
    fontSize: 11,
    color: '#9CA3AF',
    flex: 1,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    backgroundColor: '#F2F4F5',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  callBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#08283B',
  },
  confirmBtn: {
    backgroundColor: '#057A55',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  confirmBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13.5,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
