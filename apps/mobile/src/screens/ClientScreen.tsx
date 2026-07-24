import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { NutritionTrendChart } from '../components/NutritionTrendChart';
import { FlagBadge } from '../components/FlagBadge';
import { useAppStore } from '../store';

type Props = NativeStackScreenProps<RootStackParamList, 'Client'>;

export function ClientScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const { clients, visits } = useAppStore();
  const client = clients.find((c) => c.id === clientId);
  const clientVisits = visits[clientId] ?? [];

  if (!client) return <Text style={{ padding: 24 }}>Client not found.</Text>;

  const latestVisit = clientVisits[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name}>{client.name}</Text>
        <Text style={styles.type}>{client.type === 'pregnant' ? 'Pregnant woman' : 'Child under 5'}</Text>
        {/* TODO: render current flag badge from latest flag computation */}
        {latestVisit && <FlagBadge severity="watch" label="Falling haemoglobin" />}
      </View>

      <Text style={styles.sectionTitle}>Nutrition trend</Text>
      <NutritionTrendChart visits={clientVisits} clientType={client.type} />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Visit', { clientId })}
        accessibilityRole="button"
        accessibilityLabel="Record new visit"
      >
        <Text style={styles.primaryButtonText}>Record Visit</Text>
      </TouchableOpacity>

      {latestVisit && (
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Plan', { clientId, visitId: latestVisit.id })}
          accessibilityRole="button"
          accessibilityLabel="Generate nutrition plan"
        >
          <Text style={styles.secondaryButtonText}>Generate Nutrition Plan</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Visit history</Text>
      {clientVisits.map((visit) => (
        <View key={visit.id} style={styles.visitRow}>
          <Text style={styles.visitDate}>{visit.visitedAt.slice(0, 10)}</Text>
          {visit.weightKg && <Text style={styles.visitStat}>Wt: {visit.weightKg} kg</Text>}
          {visit.hbGDl && <Text style={styles.visitStat}>Hb: {visit.hbGDl} g/dL</Text>}
          {visit.muacMm && <Text style={styles.visitStat}>MUAC: {visit.muacMm} mm</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  header: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },
  type: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#444', marginTop: 20, marginBottom: 8 },
  primaryButton: {
    backgroundColor: '#1a7c4e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#fff',
    borderColor: '#1a7c4e',
    borderWidth: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { color: '#1a7c4e', fontSize: 15, fontWeight: '600' },
  visitRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  visitDate: { fontWeight: '600', color: '#333' },
  visitStat: { color: '#555' },
});
