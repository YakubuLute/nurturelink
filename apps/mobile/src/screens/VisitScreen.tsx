import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { v4 as uuidv4 } from 'uuid';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store';
import { enqueue } from '../sync/outbox';

type Props = NativeStackScreenProps<RootStackParamList, 'Visit'>;

const FOOD_GROUPS = [
  { key: 'grains_roots_tubers', label: 'Grains / TZ / Yam' },
  { key: 'legumes_nuts', label: 'Beans / Groundnut' },
  { key: 'dairy', label: 'Milk / Yogurt' },
  { key: 'flesh_foods', label: 'Meat / Fish' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'vit_a_fruits_veg', label: 'Orange/dark green vegetables' },
  { key: 'other_fruits_veg', label: 'Other fruits & vegetables' },
  { key: 'breastmilk', label: 'Breastmilk' },
] as const;

export function VisitScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { auth } = useAppStore();

  const [weightKg, setWeightKg] = useState('');
  const [hbGDl, setHbGDl] = useState('');
  const [muacMm, setMuacMm] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  function toggleGroup(key: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);

    const visitId = uuidv4();
    const now = new Date().toISOString();

    const visit = {
      id: visitId,
      clientId,
      userId: auth.userId!,
      visitedAt: now,
      weightKg: weightKg ? parseFloat(weightKg) : null,
      hbGDl: hbGDl ? parseFloat(hbGDl) : null,
      muacMm: muacMm ? parseFloat(muacMm) : null,
      dietRecall: Array.from(selectedGroups),
      dangerSigns: [],
      notes: null,
      updatedAt: now,
    };

    // TODO: write to local SQLite first (always succeeds)
    await enqueue('visits', visitId, 'insert', visit);

    // TODO: compute flags from visit data and clinical thresholds
    // const flags = computeFlags(visit, clinicalThresholds);
    // if (flags.some(f => ['SEVERE_MUAC', 'SEVERE_ANAEMIA', 'DANGER_SIGNS'].includes(f.code))) {
    //   navigate to ReferralScreen
    // }

    Alert.alert('Visit saved', 'The visit has been recorded and will sync when connected.', [
      {
        text: 'Generate Plan',
        onPress: () => navigation.navigate('Plan', { clientId, visitId }),
      },
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);

    setIsSaving(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Weight (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={weightKg}
        onChangeText={setWeightKg}
        placeholder="e.g. 12.4"
        accessibilityLabel="Weight in kilograms"
      />

      <Text style={styles.label}>Haemoglobin (g/dL)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={hbGDl}
        onChangeText={setHbGDl}
        placeholder="e.g. 10.2"
        accessibilityLabel="Haemoglobin in grams per decilitre"
      />

      <Text style={styles.label}>MUAC (mm)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={muacMm}
        onChangeText={setMuacMm}
        placeholder="e.g. 128"
        accessibilityLabel="Mid-upper arm circumference in millimetres"
      />

      <Text style={styles.label}>What did the client eat yesterday?</Text>
      <Text style={styles.subLabel}>Select all food groups eaten in the last 24 hours</Text>
      {FOOD_GROUPS.map(({ key, label }) => (
        <TouchableOpacity
          key={key}
          style={[styles.groupChip, selectedGroups.has(key) && styles.groupChipSelected]}
          onPress={() => toggleGroup(key)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selectedGroups.has(key) }}
          accessibilityLabel={label}
        >
          <Text
            style={[styles.groupChipText, selectedGroups.has(key) && styles.groupChipTextSelected]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel="Save visit"
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save Visit'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 6 },
  subLabel: { fontSize: 13, color: '#666', marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    minHeight: 48,
  },
  groupChip: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  groupChipSelected: { borderColor: '#1a7c4e', backgroundColor: '#e8f5ee' },
  groupChipText: { fontSize: 15, color: '#444' },
  groupChipTextSelected: { color: '#1a7c4e', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#1a7c4e',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    minHeight: 56,
    justifyContent: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#aaa' },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
