import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAppStore } from '../store';
import { ChevronLeft, Check, AlertTriangle } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Visit'>;

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:         '#08283B',
  bg:              '#F2F4F5',
  surface:         '#FDFDFD',
  border:          '#E5E7EB',
  fg1:             '#08283B',
  fg2:             '#374151',
  fg3:             '#6B7280',
  fg4:             '#9CA3AF',
  lb50:            '#EFF7FE',
  lb200:           '#B4DAFB',
  success:         '#057A55',
  successBg:       '#F3FAF7',
  successBorder:   '#BCF0DA',
  warning:         '#B48700',
  warningBg:       '#FFF9E6',
  warningBorder:   '#FFE18A',
  error:           '#C81E1E',
  errorBg:         '#FDF2F2',
  errorBorder:     '#FBD5D5',
  errorDark:       '#9B1C1C',
  highPriority:    '#B54000',
  highPriorityBg:  '#FFEFE6',
};

// ─── Food group config ────────────────────────────────────────────────────────
const FOOD_GROUPS = [
  { id: 'grains',  label: 'Grains & roots',       color: '#B48700' },
  { id: 'legumes', label: 'Legumes & nuts',        color: '#B54000' },
  { id: 'dairy',   label: 'Dairy',                 color: '#427CAF' },
  { id: 'flesh',   label: 'Meat & fish',           color: '#036672' },
  { id: 'eggs',    label: 'Eggs',                  color: '#BF125D' },
  { id: 'vita',    label: 'Vit-A veg & fruit',     color: '#057A55' },
  { id: 'veg',     label: 'Other veg & fruit',     color: '#6C2BD9' },
  { id: 'breast',  label: 'Breastmilk',            color: '#559FE0' },
];

const DANGER_SIGNS = [
  { id: 'oedema',  label: 'Swelling of both feet (bilateral oedema)' },
  { id: 'nofeed',  label: 'Not feeding or vomiting everything' },
  { id: 'convuls', label: 'Convulsions or unusually sleepy' },
  { id: 'fever',   label: 'High fever or body very cold' },
  { id: 'bleeding',label: 'Bleeding or severe pain (obstetric)' },
];

function eyebrow(label: string) {
  return (
    <Text style={styles.eyebrow}>{label}</Text>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function VisitScreen({ navigation, route }: Props) {
  const { clientId } = route.params;
  const store = useAppStore();
  const client = store.clients.find((c) => c.id === clientId);
  const form = store.visitForm;

  if (!client) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.fg3 }}>Client not found.</Text>
      </View>
    );
  }

  const score = form.diet.length;
  const hasDanger = form.danger.length > 0;

  function scoreColor(n: number) {
    if (n >= 5) return C.success;
    if (n >= 3) return C.warning;
    return C.error;
  }
  function scoreBg(n: number) {
    if (n >= 5) return C.successBg;
    if (n >= 3) return C.warningBg;
    return C.errorBg;
  }

  function handleSave() {
    const result = store.saveVisit(clientId);
    store.resetVisitForm();
    if (result === 'referral') {
      navigation.navigate('ReferralGuardrail', { clientId });
    } else {
      navigation.navigate('Plan', { clientId });
    }
  }

  function toClient() {
    navigation.navigate('Client', { clientId });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primary }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toClient} style={styles.backBtn} accessibilityLabel="Go back">
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ marginTop: 4 }}>
          <Text style={styles.headerTitle}>New visit</Text>
          <Text style={styles.headerSub}>{client.name} · today</Text>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Measurements ── */}
        {eyebrow('MEASUREMENTS')}

        {/* Weight + Hb row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <View style={[styles.measureCard, { flex: 1 }]}>
            <Text style={styles.measureLabel}>Weight</Text>
            <TextInput
              style={styles.measureInput}
              inputMode="decimal"
              value={form.weight}
              onChangeText={(v) => store.setVisitField('weight', v)}
              placeholder="0.0"
              placeholderTextColor={C.fg4}
              accessibilityLabel="Weight in kilograms"
            />
            <Text style={styles.measureUnit}>kg</Text>
          </View>
          <View style={[styles.measureCard, { flex: 1 }]}>
            <Text style={styles.measureLabel}>Haemoglobin</Text>
            <TextInput
              style={styles.measureInput}
              inputMode="decimal"
              value={form.hb}
              onChangeText={(v) => store.setVisitField('hb', v)}
              placeholder="0.0"
              placeholderTextColor={C.fg4}
              accessibilityLabel="Haemoglobin g/dL"
            />
            <Text style={styles.measureUnit}>g/dL</Text>
          </View>
        </View>

        {/* MUAC full width */}
        <View style={[styles.measureCard, { marginBottom: 20 }]}>
          <Text style={styles.measureLabel}>MUAC</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <TextInput
              style={[styles.measureInput, { flex: 1 }]}
              inputMode="decimal"
              value={form.muac}
              onChangeText={(v) => store.setVisitField('muac', v)}
              placeholder="000"
              placeholderTextColor={C.fg4}
              accessibilityLabel="MUAC in mm"
            />
            <Text style={styles.measureUnit}>mm</Text>
          </View>
        </View>

        {/* ── Dietary recall ── */}
        {eyebrow('DIETARY RECALL · PAST 24H')}
        <Text style={styles.hint}>Tap every food group the client ate</Text>

        <View style={styles.gridWrap}>
          {FOOD_GROUPS.map((g) => {
            const sel = form.diet.includes(g.id);
            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: sel ? C.lb50 : C.surface,
                    borderColor: sel ? C.lb200 : C.border,
                    width: '48%',
                  },
                ]}
                onPress={() => store.toggleDiet(g.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={g.label}
              >
                <View
                  style={[
                    styles.chipBox,
                    { backgroundColor: sel ? g.color : '#ECECEB' },
                  ]}
                >
                  {sel && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={{ fontSize: 12.5, color: sel ? C.fg1 : C.fg2, fontWeight: sel ? '600' : '400', flexShrink: 1 }}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Diet diversity counter */}
        <View style={[styles.diversityRow, { backgroundColor: scoreBg(score) }]}>
          <Text style={{ fontSize: 12.5, color: C.fg2 }}>Diet diversity score</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: scoreColor(score) }}>{score}/8</Text>
        </View>

        {/* ── Danger signs ── */}
        {eyebrow('DANGER SIGNS')}
        <Text style={[styles.hint, { marginBottom: 12 }]}>
          Any of these bypasses counselling and routes to referral
        </Text>

        {DANGER_SIGNS.map((d) => {
          const sel = form.danger.includes(d.id);
          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.dangerRow,
                {
                  backgroundColor: sel ? C.errorBg : '#fff',
                  borderColor: sel ? C.errorBorder : C.border,
                },
              ]}
              onPress={() => store.toggleDanger(d.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={d.label}
            >
              <View
                style={[
                  styles.dangerCheck,
                  {
                    backgroundColor: sel ? C.error : '#fff',
                    borderColor: sel ? C.error : C.border,
                  },
                ]}
              >
                {sel && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={{ flex: 1, fontSize: 13, color: sel ? C.errorDark : C.fg2, lineHeight: 19 }}>
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Danger warning banner */}
        {hasDanger && (
          <View style={[styles.dangerBanner]}>
            <AlertTriangle size={16} color={C.errorDark} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12.5, color: C.errorDark, flex: 1, lineHeight: 18 }}>
              Saving will route to referral — counselling is bypassed
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Save button ── */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: hasDanger ? C.error : C.primary }]}
          onPress={handleSave}
          accessibilityLabel={hasDanger ? 'Save and refer' : 'Save visit'}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
            {hasDanger ? 'Save & refer' : 'Save visit'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: '#92C9F9',
    marginTop: 2,
  },
  body: {
    flex: 1,
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: C.fg4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: C.fg4,
    marginBottom: 10,
  },
  measureCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 12,
  },
  measureLabel: {
    fontSize: 12,
    color: C.fg3,
    marginBottom: 4,
  },
  measureInput: {
    fontSize: 22,
    fontWeight: '700',
    color: C.fg1,
    padding: 0,
    minHeight: 32,
  },
  measureUnit: {
    fontSize: 12,
    color: C.fg4,
    marginTop: 2,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diversityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  dangerCheck: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 12,
    padding: 13,
    marginTop: 6,
  },
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
});
