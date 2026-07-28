import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, User, Phone, Lock, Eye, EyeOff, Briefcase, Building2 } from 'lucide-react-native';

import { RootStackParamList } from '../../App';
import { LogoMark } from '../assets/LogoMark';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
type AppRole = 'CHO' | 'supervisor';

interface Facility {
  id: string;
  name: string;
  district: string;
  region: string;
}

const ROLES: { value: AppRole; label: string; sub: string }[] = [
  { value: 'CHO', label: 'Community Health Officer', sub: 'Records visits and manages caseload' },
  { value: 'supervisor', label: 'Supervisor', sub: 'Oversees CHOs across the district' },
];

export function SignUpScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<AppRole>('CHO');
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/facilities`)
      .then((r) => r.json())
      .then((data: { facilities: Facility[] }) => {
        setFacilities(data.facilities ?? []);
      })
      .catch(() => {
        // Non-fatal — user can still register without a facility
      })
      .finally(() => setFacilitiesLoading(false));
  }, []);

  function validate(): string | null {
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!phone.trim() || phone.trim().length < 10) return 'Enter a valid phone number.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  }

  async function handleSignUp() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName:  firstName.trim(),
          lastName:   lastName.trim(),
          ...(otherNames.trim() ? { otherNames: otherNames.trim() } : {}),
          phone:      phone.trim(),
          password,
          role,
          ...(facilityId ? { facilityId } : {}),
        }),
      });

      if (res.status === 201 || res.status === 200) {
        navigation.replace('VerifyAccount', {
          mode: 'registration',
          phone: phone.trim(),
        });
      } else if (res.status === 409) {
        setError('An account with this phone number already exists.');
      } else {
        const body = await res.json().catch(() => ({})) as { message?: string };
        setError(body.message ?? 'Registration failed. Please try again.');
      }
    } catch {
      setError('No connection. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ChevronLeft size={24} color="#FDFDFD" />
          </Pressable>
          <View style={styles.logoBox}>
            <LogoMark size={18} onDark={false} />
          </View>
        </View>

        {/* Heading */}
        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.headingSub}>Register to manage your caseload offline</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* First name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>First name</Text>
            <View style={styles.inputRow}>
              <User size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={(v) => { setFirstName(v); setError(null); }}
                placeholder="Yakubu"
                placeholderTextColor="#5A6F7C"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Last name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Last name</Text>
            <View style={styles.inputRow}>
              <User size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={(v) => { setLastName(v); setError(null); }}
                placeholder="Lute"
                placeholderTextColor="#5A6F7C"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Other names */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Other names <Text style={styles.optionalTag}>(optional)</Text></Text>
            <View style={styles.inputRow}>
              <User size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={otherNames}
                onChangeText={(v) => { setOtherNames(v); setError(null); }}
                placeholder="Middle name, etc."
                placeholderTextColor="#5A6F7C"
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <View style={styles.inputRow}>
              <Phone size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(v) => { setPhone(v); setError(null); }}
                placeholder="+233 244 000 000"
                placeholderTextColor="#5A6F7C"
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={password}
                onChangeText={(v) => { setPassword(v); setError(null); }}
                placeholder="Min. 8 characters"
                placeholderTextColor="#5A6F7C"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff size={18} color="#8D9CA5" />
                  : <Eye size={18} color="#8D9CA5" />}
              </Pressable>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm password</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color="#8D9CA5" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
                placeholder="Repeat your password"
                placeholderTextColor="#5A6F7C"
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <Pressable
                onPress={() => setShowConfirm((v) => !v)}
                style={styles.eyeBtn}
                accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm
                  ? <EyeOff size={18} color="#8D9CA5" />
                  : <Eye size={18} color="#8D9CA5" />}
              </Pressable>
            </View>
          </View>

          {/* Role */}
          <View style={styles.fieldGroup}>
            <View style={styles.iconLabelRow}>
              <Briefcase size={15} color="#8D9CA5" />
              <Text style={styles.fieldLabel}>Role</Text>
            </View>
            <View style={styles.optionList}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  style={[styles.optionRow, role === r.value && styles.optionRowActive]}
                  onPress={() => setRole(r.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: role === r.value }}
                >
                  <View style={[styles.radioCircle, role === r.value && styles.radioCircleFilled]}>
                    {role === r.value && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, role === r.value && styles.optionLabelActive]}>
                      {r.label}
                    </Text>
                    <Text style={styles.optionSub}>{r.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Facility */}
          <View style={styles.fieldGroup}>
            <View style={styles.iconLabelRow}>
              <Building2 size={15} color="#8D9CA5" />
              <Text style={styles.fieldLabel}>CHPS facility <Text style={styles.optionalTag}>(optional)</Text></Text>
            </View>
            {facilitiesLoading ? (
              <View style={styles.facilitiesLoading}>
                <ActivityIndicator size="small" color="#8D9CA5" />
                <Text style={styles.facilitiesLoadingText}>Loading facilities…</Text>
              </View>
            ) : facilities.length === 0 ? (
              <Text style={styles.facilitiesEmpty}>No facilities available. You can update this later.</Text>
            ) : (
              <View style={styles.optionList}>
                {facilities.map((f) => (
                  <Pressable
                    key={f.id}
                    style={[styles.optionRow, facilityId === f.id && styles.optionRowActive]}
                    onPress={() => setFacilityId((prev) => prev === f.id ? null : f.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: facilityId === f.id }}
                  >
                    <View style={[styles.radioCircle, facilityId === f.id && styles.radioCircleFilled]}>
                      {facilityId === f.id && <View style={styles.radioDot} />}
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionLabel, facilityId === f.id && styles.optionLabelActive]}>
                        {f.name}
                      </Text>
                      <Text style={styles.optionSub}>{f.district} · {f.region}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            onPress={handleSignUp}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#FDFDFD" size="small" />
              : <Text style={styles.submitBtnText}>Create account</Text>}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            <Text style={styles.footerLink}> Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const BRAND = '#FF5A00';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#08283B',
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 52,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FDFDFD',
    marginBottom: 6,
  },
  headingSub: {
    fontSize: 14,
    color: '#8D9CA5',
    marginBottom: 28,
  },

  form: {
    gap: 0,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C2D0D9',
    marginBottom: 8,
  },
  optionalTag: {
    fontWeight: '400',
    color: '#5A6F7C',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FDFDFD',
    padding: 0,
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 6,
  },

  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },

  optionList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionRowActive: {
    borderColor: BRAND,
    backgroundColor: 'rgba(255,90,0,0.08)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5A6F7C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleFilled: {
    borderColor: BRAND,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: BRAND,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8D9CA5',
    marginBottom: 2,
  },
  optionLabelActive: {
    color: '#FDFDFD',
  },
  optionSub: {
    fontSize: 12,
    color: '#5A6F7C',
    lineHeight: 16,
  },

  facilitiesLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  facilitiesLoadingText: {
    fontSize: 13,
    color: '#5A6F7C',
  },
  facilitiesEmpty: {
    fontSize: 13,
    color: '#5A6F7C',
    paddingVertical: 8,
  },

  errorText: {
    fontSize: 13,
    color: '#FC8181',
    marginBottom: 12,
    lineHeight: 18,
  },

  submitBtn: {
    height: 52,
    backgroundColor: BRAND,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  submitBtnPressed: {
    opacity: 0.85,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDFDFD',
    letterSpacing: 0.2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#8D9CA5',
  },
  footerLink: {
    fontSize: 14,
    color: BRAND,
    fontWeight: '600',
  },
});
