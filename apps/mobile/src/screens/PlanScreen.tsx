import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { PlanCard } from '../components/PlanCard';
import { playPlanAudio, sharePlanAudio } from '../audio/player';

type Props = NativeStackScreenProps<RootStackParamList, 'Plan'>;

export function PlanScreen({ route }: Props) {
  const { clientId, visitId } = route.params;
  const [plan, setPlan] = useState<null | {
    selectedFoods: Array<{ id: string; name: string; localName: string; reasons: string[] }>;
    adequacy: Record<string, number>;
    voiceScript: string;
  }>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // TODO: load existing plan for visitId from SQLite
    // TODO: if no plan, run engine.generatePlan() with reference bundle
  }, [visitId]);

  async function handleGenerate() {
    setIsGenerating(true);
    // TODO:
    // 1. Load flags for visitId
    // 2. If severe flags → navigate to ReferralScreen (guardrail enforced here too)
    // 3. Load reference bundle from SQLite
    // 4. Run generatePlan(input, bundle)
    // 5. Save plan to SQLite + enqueue to outbox
    setIsGenerating(false);
  }

  async function handlePlayAudio() {
    if (!plan) return;
    setIsPlaying(true);
    try {
      // TODO: assemblePlanAudio → playPlanAudio
      await playPlanAudio([]);
    } finally {
      setIsPlaying(false);
    }
  }

  if (isGenerating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a7c4e" />
        <Text style={styles.generatingText}>Generating plan…</Text>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No plan generated yet for this visit.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
          <Text style={styles.primaryButtonText}>Generate Nutrition Plan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Recommended foods this week</Text>
      {plan.selectedFoods.map((food) => (
        <PlanCard key={food.id} food={food} />
      ))}

      <Text style={styles.sectionTitle}>Nutrient adequacy</Text>
      {Object.entries(plan.adequacy).map(([nutrient, fraction]) => (
        <View key={nutrient} style={styles.adequacyRow}>
          <Text style={styles.nutrientLabel}>{nutrient}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(fraction * 100, 100)}%` }]} />
          </View>
          <Text style={styles.adequacyPct}>{Math.round(fraction * 100)}%</Text>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.audioButton, isPlaying && styles.audioButtonActive]}
        onPress={handlePlayAudio}
        disabled={isPlaying}
        accessibilityRole="button"
        accessibilityLabel="Play nutrition plan voice note"
      >
        <Text style={styles.audioButtonText}>{isPlaying ? '▶ Playing…' : '▶ Play Voice Note'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={() => sharePlanAudio('')}
        accessibilityRole="button"
        accessibilityLabel="Share voice note with caregiver"
      >
        <Text style={styles.shareButtonText}>Share with Caregiver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  generatingText: { marginTop: 16, color: '#555', fontSize: 16 },
  emptyText: { color: '#555', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#444', marginTop: 20, marginBottom: 12 },
  adequacyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  nutrientLabel: { width: 80, fontSize: 13, color: '#444' },
  progressBar: { flex: 1, height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1a7c4e', borderRadius: 5 },
  adequacyPct: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#333' },
  primaryButton: {
    backgroundColor: '#1a7c4e',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  audioButton: {
    backgroundColor: '#1a7c4e',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 56,
    justifyContent: 'center',
  },
  audioButtonActive: { backgroundColor: '#145c3a' },
  audioButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  shareButton: {
    borderColor: '#1a7c4e',
    borderWidth: 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  shareButtonText: { color: '#1a7c4e', fontSize: 15, fontWeight: '600' },
});
