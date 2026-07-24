import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import { RootStackParamList } from '../../App';
import { enqueue } from '../sync/outbox';
import { syncNow } from '../sync/orchestrator';

type Props = NativeStackScreenProps<RootStackParamList, 'Referral'>;

export function ReferralScreen({ navigation, route }: Props) {
  const { clientId, visitId, triggeringFlags } = route.params;
  const [facilityTo, setFacilityTo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleIssueReferral() {
    if (isSaving) return;
    setIsSaving(true);

    const referralId = uuidv4();
    const now = new Date().toISOString();
    const reason = triggeringFlags
      .map((f) => f.replace('_', ' ').toLowerCase())
      .join('; ');

    const referral = {
      id: referralId,
      clientId,
      visitId,
      reason,
      flagCodes: triggeringFlags,
      facilityTo: facilityTo || null,
      status: 'issued',
      queuedOffline: true,
      issuedAt: now,
      updatedAt: now,
    };

    // TODO: write to local SQLite
    await enqueue('referrals', referralId, 'insert', referral);

    // Emergency push — referrals always sync immediately
    await syncNow('referral_emergency');

    Alert.alert(
      'Referral issued',
      `The referral for this client has been recorded${
        facilityTo ? ` to ${facilityTo}` : ''
      } and synced.`,
      [{ text: 'OK', onPress: () => navigation.popToTop() }],
    );

    setIsSaving(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>⚠ Referral Required</Text>
        <Text style={styles.alertBody}>
          This client has a severe clinical condition that cannot be managed at home. A referral to a
          health facility is required.
        </Text>
      </View>

      <Text style={styles.label}>Clinical reason</Text>
      <View style={styles.reasonBox}>
        {triggeringFlags.map((flag) => (
          <Text key={flag} style={styles.reasonItem}>
            • {flag.replace(/_/g, ' ').toLowerCase()}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Refer to facility (optional)</Text>
      <TextInput
        style={styles.input}
        value={facilityTo}
        onChangeText={setFacilityTo}
        placeholder="e.g. Nalerigu Government Hospital"
        accessibilityLabel="Facility name to refer client to"
      />

      <TouchableOpacity
        style={[styles.issueButton, isSaving && styles.issueButtonDisabled]}
        onPress={handleIssueReferral}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Issue referral"
      >
        <Text style={styles.issueButtonText}>{isSaving ? 'Issuing…' : 'Issue Referral'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  alertBox: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#e6a817',
    borderRadius: 6,
    padding: 16,
    marginBottom: 24,
  },
  alertTitle: { fontSize: 17, fontWeight: '700', color: '#92650a', marginBottom: 6 },
  alertBody: { fontSize: 14, color: '#7a5600', lineHeight: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  reasonBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  reasonItem: { fontSize: 14, color: '#444', marginBottom: 4, textTransform: 'capitalize' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    minHeight: 48,
  },
  issueButton: {
    backgroundColor: '#c0392b',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    minHeight: 56,
    justifyContent: 'center',
  },
  issueButtonDisabled: { backgroundColor: '#aaa' },
  issueButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
