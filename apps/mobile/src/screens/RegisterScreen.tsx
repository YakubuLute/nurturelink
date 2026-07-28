import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { useAppStore, RegForm } from '../store';
import { ChevronLeft, Check, WifiOff, Baby, User, CalendarDays } from 'lucide-react-native';
import { syncNow } from '../sync/orchestrator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const COMMUNITIES = ['Kukuo', 'Sagnarigu', 'Gizaa', 'Voggu'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(iso: string): string {
  // iso is YYYY-MM-DD
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Client type selector ─────────────────────────────────────────────────────

function TypeSelector({
  value,
  onChange,
}: {
  value: RegForm['type'];
  onChange: (t: RegForm['type']) => void;
}) {
  return (
    <View style={ts.row}>
      <TouchableOpacity
        style={[ts.btn, value === 'child' ? ts.btnActive : ts.btnInactive]}
        onPress={() => onChange('child')}
        accessibilityRole="button"
        accessibilityLabel="Child"
        accessibilityState={{ selected: value === 'child' }}
      >
        <Baby size={18} color={value === 'child' ? '#FFFFFF' : '#08283B'} />
        <Text style={[ts.label, value === 'child' ? ts.textActive : ts.textInactive]}>Child</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[ts.btn, value === 'pregnant' ? ts.btnActive : ts.btnInactive]}
        onPress={() => onChange('pregnant')}
        accessibilityRole="button"
        accessibilityLabel="Pregnant woman"
        accessibilityState={{ selected: value === 'pregnant' }}
      >
        <User size={18} color={value === 'pregnant' ? '#FFFFFF' : '#08283B'} />
        <Text style={[ts.label, value === 'pregnant' ? ts.textActive : ts.textInactive]}>
          Pregnant woman
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const ts = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  btnActive: { backgroundColor: '#08283B', borderColor: '#08283B' },
  btnInactive: { backgroundColor: '#FDFDFD', borderColor: '#D1D5DB' },
  label: { fontSize: 14, fontWeight: '600' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#08283B' },
});

// ─── Community chip selector ──────────────────────────────────────────────────

function CommunitySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <View style={cs.wrap}>
      {COMMUNITIES.map((c) => (
        <TouchableOpacity
          key={c}
          style={[cs.chip, value === c ? cs.chipActive : cs.chipInactive]}
          onPress={() => onChange(c)}
          accessibilityRole="button"
          accessibilityLabel={c}
          accessibilityState={{ selected: value === c }}
        >
          <Text style={[cs.chipText, value === c ? cs.textActive : cs.textInactive]}>{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipActive: { backgroundColor: '#08283B', borderColor: '#08283B' },
  chipInactive: { backgroundColor: '#FDFDFD', borderColor: '#D1D5DB' },
  chipText: { fontSize: 14, fontWeight: '500' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#08283B' },
});

// ─── Native date picker ───────────────────────────────────────────────────────

function DateField({
  label,
  value,
  onChange,
  isFuture,
}: {
  label: string;
  value: string;          // YYYY-MM-DD or ''
  onChange: (iso: string) => void;
  isFuture?: boolean;     // true for EDD (no maximumDate cap)
}) {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = value ? new Date(value) : null;

  const pickerValue = dateObj ?? (isFuture ? new Date() : new Date(2000, 0, 1));
  const maxDate = isFuture ? undefined : new Date();

  return (
    <View>
      {/* Trigger button — shown on Android and web (iOS shows inline) */}
      {Platform.OS !== 'ios' && (
        <Pressable
          style={[dp.btn, showPicker && dp.btnOpen]}
          onPress={() => setShowPicker((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <CalendarDays size={18} color={dateObj ? '#08283B' : '#9CA3AF'} />
          <Text style={[dp.btnText, !dateObj && dp.btnPlaceholder]}>
            {dateObj ? formatDisplayDate(value) : `Select ${label.toLowerCase()}`}
          </Text>
        </Pressable>
      )}

      {/* iOS: button + collapsible inline spinner */}
      {Platform.OS === 'ios' && (
        <>
          <Pressable
            style={[dp.btn, dp.btnOpen]}
            onPress={() => setShowPicker((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={label}
          >
            <CalendarDays size={18} color={dateObj ? '#08283B' : '#9CA3AF'} />
            <Text style={[dp.btnText, !dateObj && dp.btnPlaceholder]}>
              {dateObj ? formatDisplayDate(value) : `Select ${label.toLowerCase()}`}
            </Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={pickerValue}
              mode="date"
              display="spinner"
              maximumDate={maxDate}
              onValueChange={(_, date) => { if (date) onChange(date.toISOString().slice(0, 10)); }}
              style={{ marginTop: 4 }}
            />
          )}
        </>
      )}

      {/* Android: modal dialog opened by button press */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          maximumDate={maxDate}
          onValueChange={(_, date) => { setShowPicker(false); if (date) onChange(date.toISOString().slice(0, 10)); }}
          onDismiss={() => setShowPicker(false)}
        />
      )}

      {/* Web: DateTimePicker renders as <input type="date"> automatically */}
      {Platform.OS === 'web' && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          maximumDate={maxDate}
          onValueChange={(_, date) => { if (date) onChange(date.toISOString().slice(0, 10)); }}
        />
      )}
    </View>
  );
}

const dp = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    height: 52,
  },
  btnOpen: {
    borderColor: '#08283B',
  },
  btnText: {
    fontSize: 15,
    color: '#08283B',
    flex: 1,
  },
  btnPlaceholder: {
    color: '#9CA3AF',
  },
});

// ─── Consent checkbox ─────────────────────────────────────────────────────────

function ConsentRow({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        consent.wrap,
        checked ? consent.wrapChecked : consent.wrapUnchecked,
      ]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel="Caregiver consent given"
      accessibilityState={{ checked }}
      activeOpacity={0.8}
    >
      <View style={[consent.box, checked ? consent.boxChecked : consent.boxUnchecked]}>
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <View style={consent.body}>
        <Text style={consent.title}>Caregiver consent given</Text>
        <Text style={consent.desc}>
          The caregiver has been informed that this data will be stored and used for health
          monitoring by the CHPS compound.
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const consent = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  wrapChecked: { backgroundColor: '#F3FAF7', borderColor: '#BCF0DA' },
  wrapUnchecked: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  boxChecked: { backgroundColor: '#FF5A00', borderColor: '#FF5A00' },
  boxUnchecked: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
  body: { flex: 1 },
  title: { fontSize: 13.5, fontWeight: '700', color: '#08283B', marginBottom: 4 },
  desc: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { regForm, setRegField, saveClient } = useAppStore();

  const isReady = regForm.name.trim().length > 0 && regForm.consent;

  const namePlaceholder =
    regForm.type === 'child' ? "Child's full name" : "Mother's full name";

  const dobLabel = regForm.type === 'child' ? 'Date of birth' : 'Expected delivery date';

  function handleSave() {
    const newClient = saveClient();
    if (!newClient) {
      Alert.alert('Incomplete form', 'Please enter a name and confirm consent.');
      return;
    }
    syncNow('foreground').catch(() => {});
    navigation.navigate('Client', { clientId: newClient.id });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Dark header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color="#FDFDFD" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register a client</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* ── Scrollable form body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Client type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Client type</Text>
          <TypeSelector
            value={regForm.type}
            onChange={(t) => setRegField('type', t)}
          />
        </View>

        {/* Full name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full name</Text>
          <TextInput
            style={styles.textInput}
            placeholder={namePlaceholder}
            placeholderTextColor="#9CA3AF"
            value={regForm.name}
            onChangeText={(v) => setRegField('name', v)}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Full name"
          />
        </View>

        {/* Community */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Community</Text>
          <CommunitySelector
            value={regForm.community}
            onChange={(c) => setRegField('community', c)}
          />
        </View>

        {/* Date of birth / EDD — native date picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{dobLabel}</Text>
          <DateField
            label={dobLabel}
            value={regForm.dob}
            onChange={(iso) => setRegField('dob', iso)}
            isFuture={regForm.type === 'pregnant'}
          />
        </View>

        {/* Consent */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Consent</Text>
          <ConsentRow
            checked={regForm.consent}
            onToggle={() => setRegField('consent', !regForm.consent)}
          />
        </View>

        {/* Offline note */}
        <View style={styles.offlineNote}>
          <WifiOff size={16} color="#427CAF" />
          <Text style={styles.offlineText}>
            Saved on device now · encrypted · syncs later
          </Text>
        </View>
      </ScrollView>

      {/* ── Save button (pinned bottom) ── */}
      <View
        style={[
          styles.saveWrap,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveBtn, isReady ? styles.saveBtnActive : styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isReady}
          accessibilityRole="button"
          accessibilityLabel="Save client"
          accessibilityState={{ disabled: !isReady }}
        >
          <Text style={styles.saveBtnText}>Save client</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F4F5',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: { width: 36 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },

  fieldGroup: { marginBottom: 22 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.06 * 12,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#FDFDFD',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#08283B',
    height: 52,
  },

  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE18A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  offlineText: { fontSize: 12.5, color: '#8C6900', fontWeight: '500', flex: 1 },

  saveWrap: {
    backgroundColor: '#FDFDFD',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: { backgroundColor: '#08283B' },
  saveBtnDisabled: { backgroundColor: '#B2BCC2' },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
