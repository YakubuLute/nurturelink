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
import {
  ChevronLeft, Check, WifiOff, Baby, User, CalendarDays,
  Phone, MapPin, FileText, Info,
} from 'lucide-react-native';
import { syncNow } from '../sync/orchestrator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const COMMUNITIES = ['Kukuo', 'Sagnarigu', 'Gizaa', 'Voggu'] as const;
const RELATIONSHIPS = ['Mother', 'Father', 'Grandparent', 'Guardian'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function calcEddFromLmp(lmpIso: string): string {
  const d = new Date(lmpIso);
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={sh.label}>{label}</Text>;
}

const sh = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 4,
  },
});

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

function ChipSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | string;
  onChange: (v: T) => void;
}) {
  return (
    <View style={chip.wrap}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[chip.item, value === o ? chip.itemActive : chip.itemInactive]}
          onPress={() => onChange(o)}
          accessibilityRole="button"
          accessibilityLabel={o}
          accessibilityState={{ selected: value === o }}
        >
          <Text style={[chip.text, value === o ? chip.textActive : chip.textInactive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5 },
  itemActive: { backgroundColor: '#08283B', borderColor: '#08283B' },
  itemInactive: { backgroundColor: '#FDFDFD', borderColor: '#D1D5DB' },
  text: { fontSize: 14, fontWeight: '500' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#08283B' },
});

function DateField({
  label,
  value,
  onChange,
  isFuture,
  hint,
}: {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  isFuture?: boolean;
  hint?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = value ? new Date(value) : null;
  const pickerValue = dateObj ?? (isFuture ? new Date() : new Date(2000, 0, 1));
  const maxDate = isFuture ? undefined : new Date();

  return (
    <View>
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
      {Platform.OS === 'web' && (
        <DateTimePicker
          value={pickerValue}
          mode="date"
          display="default"
          maximumDate={maxDate}
          onValueChange={(_, date) => { if (date) onChange(date.toISOString().slice(0, 10)); }}
        />
      )}
      {hint ? <Text style={dp.hint}>{hint}</Text> : null}
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
  btnOpen: { borderColor: '#08283B' },
  btnText: { fontSize: 15, color: '#08283B', flex: 1 },
  btnPlaceholder: { color: '#9CA3AF' },
  hint: { fontSize: 11.5, color: '#6B7280', marginTop: 5, marginLeft: 2 },
});

function ConsentRow({
  checked,
  onToggle,
  clientType,
}: {
  checked: boolean;
  onToggle: () => void;
  clientType: RegForm['type'];
}) {
  const isPregnant = clientType === 'pregnant';
  const title = isPregnant ? 'Client consent given' : 'Caregiver consent given';
  const desc = isPregnant
    ? 'The client has been informed that this data will be stored and used for health monitoring by the CHPS compound.'
    : 'The caregiver has been informed that this data will be stored and used for health monitoring by the CHPS compound.';

  return (
    <TouchableOpacity
      style={[ct.wrap, checked ? ct.wrapChecked : ct.wrapUnchecked]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={title}
      accessibilityState={{ checked }}
      activeOpacity={0.8}
    >
      <View style={[ct.box, checked ? ct.boxChecked : ct.boxUnchecked]}>
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <View style={ct.body}>
        <Text style={ct.title}>{title}</Text>
        <Text style={ct.desc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

const ct = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 12,
  },
  wrapChecked: { backgroundColor: '#F3FAF7', borderColor: '#BCF0DA' },
  wrapUnchecked: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
  box: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
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

  const isChild = regForm.type === 'child';
  const isPregnant = regForm.type === 'pregnant';
  const isReady = regForm.name.trim().length > 0 && regForm.consent;

  function handleLmpChange(iso: string) {
    setRegField('lmp', iso);
    // Auto-calculate EDD from LMP (Naegele's rule: LMP + 280 days)
    setRegField('edd', calcEddFromLmp(iso));
  }

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── CLIENT TYPE ── */}
        <View style={styles.section}>
          <SectionHeader label="Client type" />
          <TypeSelector
            value={regForm.type}
            onChange={(t) => setRegField('type', t)}
          />
        </View>

        {/* ── ABOUT THE CLIENT ── */}
        <View style={styles.section}>
          <SectionHeader label="About the client" />

          {/* Full name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isChild ? "Child's full name" : "Mother's full name"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={isChild ? "Child's full name" : "Mother's full name"}
              placeholderTextColor="#9CA3AF"
              value={regForm.name}
              onChangeText={(v) => setRegField('name', v)}
              autoCapitalize="words"
              returnKeyType="next"
              accessibilityLabel="Full name"
            />
          </View>

          {/* Sex — child only */}
          {isChild && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sex</Text>
              <ChipSelector
                options={['Male', 'Female'] as const}
                value={regForm.sex}
                onChange={(v) => setRegField('sex', v.toLowerCase())}
              />
            </View>
          )}

          {/* Date of birth */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              {isChild ? 'Date of birth' : "Mother's date of birth (optional)"}
            </Text>
            <DateField
              label={isChild ? 'Date of birth' : "Mother's date of birth"}
              value={regForm.dob}
              onChange={(iso) => setRegField('dob', iso)}
              isFuture={false}
            />
          </View>
        </View>

        {/* ── PREGNANCY DETAILS (pregnant only) ── */}
        {isPregnant && (
          <View style={styles.section}>
            <SectionHeader label="Pregnancy details" />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Last menstrual period</Text>
              <DateField
                label="Last menstrual period"
                value={regForm.lmp}
                onChange={handleLmpChange}
                isFuture={false}
                hint="Expected delivery date is calculated automatically"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Expected delivery date</Text>
              <DateField
                label="Expected delivery date"
                value={regForm.edd}
                onChange={(iso) => setRegField('edd', iso)}
                isFuture
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ANC folder number (optional)</Text>
              <View style={styles.iconInput}>
                <FileText size={18} color="#9CA3AF" style={styles.iconInputIcon} />
                <TextInput
                  style={styles.iconInputText}
                  placeholder="e.g. ANC-2026-00142"
                  placeholderTextColor="#9CA3AF"
                  value={regForm.ancFolderNumber}
                  onChangeText={(v) => setRegField('ancFolderNumber', v)}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  accessibilityLabel="ANC folder number"
                />
              </View>
            </View>

            <View style={styles.row2}>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>Gravida</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="No. of pregnancies"
                  placeholderTextColor="#9CA3AF"
                  value={regForm.gravida}
                  onChangeText={(v) => setRegField('gravida', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  returnKeyType="next"
                  accessibilityLabel="Gravida"
                />
              </View>
              <View style={[styles.fieldGroup, styles.flex1]}>
                <Text style={styles.fieldLabel}>Parity</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="No. of births"
                  placeholderTextColor="#9CA3AF"
                  value={regForm.parity}
                  onChangeText={(v) => setRegField('parity', v.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  returnKeyType="next"
                  accessibilityLabel="Parity"
                />
              </View>
            </View>

            <View style={styles.infoRow}>
              <Info size={14} color="#427CAF" />
              <Text style={styles.infoText}>
                Gravida = total pregnancies including this one. Parity = previous births.
              </Text>
            </View>
          </View>
        )}

        {/* ── CHILD HEALTH RECORDS (child only) ── */}
        {isChild && (
          <View style={styles.section}>
            <SectionHeader label="Child health records" />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CWC card number (optional)</Text>
              <View style={styles.iconInput}>
                <FileText size={18} color="#9CA3AF" style={styles.iconInputIcon} />
                <TextInput
                  style={styles.iconInputText}
                  placeholder="e.g. CWC-2026-00089"
                  placeholderTextColor="#9CA3AF"
                  value={regForm.cwcCardNumber}
                  onChangeText={(v) => setRegField('cwcCardNumber', v)}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  accessibilityLabel="CWC card number"
                />
              </View>
            </View>
          </View>
        )}

        {/* ── CAREGIVER (child only) ── */}
        {isChild && (
          <View style={styles.section}>
            <SectionHeader label="Caregiver" />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Caregiver name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Caregiver's full name"
                placeholderTextColor="#9CA3AF"
                value={regForm.caregiverName}
                onChangeText={(v) => setRegField('caregiverName', v)}
                autoCapitalize="words"
                returnKeyType="next"
                accessibilityLabel="Caregiver name"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Relationship to child</Text>
              <ChipSelector
                options={RELATIONSHIPS}
                value={regForm.caregiverRelationship}
                onChange={(v) => setRegField('caregiverRelationship', v)}
              />
            </View>
          </View>
        )}

        {/* ── HOUSEHOLD CONTACT ── */}
        <View style={styles.section}>
          <SectionHeader label="Household contact (optional)" />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.iconInput}>
              <Phone size={18} color="#9CA3AF" style={styles.iconInputIcon} />
              <TextInput
                style={styles.iconInputText}
                placeholder="e.g. 0241234567"
                placeholderTextColor="#9CA3AF"
                value={regForm.phone}
                onChangeText={(v) => setRegField('phone', v)}
                keyboardType="phone-pad"
                returnKeyType="next"
                accessibilityLabel="Phone number"
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Landmark or household description</Text>
            <View style={styles.iconInput}>
              <MapPin size={18} color="#9CA3AF" style={styles.iconInputIcon} />
              <TextInput
                style={styles.iconInputText}
                placeholder="e.g. Near the borehole, red gate"
                placeholderTextColor="#9CA3AF"
                value={regForm.landmark}
                onChangeText={(v) => setRegField('landmark', v)}
                autoCapitalize="sentences"
                returnKeyType="next"
                accessibilityLabel="Landmark"
              />
            </View>
          </View>
        </View>

        {/* ── COMMUNITY ── */}
        <View style={styles.section}>
          <SectionHeader label="Community" />
          <ChipSelector
            options={COMMUNITIES}
            value={regForm.community}
            onChange={(c) => setRegField('community', c)}
          />
        </View>

        {/* ── CONSENT ── */}
        <View style={styles.section}>
          <SectionHeader label="Consent" />
          <ConsentRow
            checked={regForm.consent}
            onToggle={() => setRegField('consent', !regForm.consent)}
            clientType={regForm.type}
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
      <View style={[styles.saveWrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
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
  root: { flex: 1, backgroundColor: '#F2F4F5' },

  header: {
    backgroundColor: '#08283B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnPlaceholder: { width: 36 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  section: {
    backgroundColor: '#FDFDFD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#08283B',
    height: 52,
  },

  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  iconInputIcon: { marginRight: 10 },
  iconInputText: {
    flex: 1,
    fontSize: 15,
    color: '#08283B',
    paddingVertical: 13,
  },

  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: -4,
    marginBottom: 4,
  },
  infoText: { fontSize: 11.5, color: '#427CAF', flex: 1, lineHeight: 16 },

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
  saveBtn: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnActive: { backgroundColor: '#08283B' },
  saveBtnDisabled: { backgroundColor: '#B2BCC2' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
