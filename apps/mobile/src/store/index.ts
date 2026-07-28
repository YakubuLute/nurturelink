/**
 * NurtureLink — Zustand app store.
 *
 * This store drives both the live app state and the demo seed data used for
 * the prototype. Real persistence (SQLCipher) and sync are wired separately;
 * for the hackathon demo everything lives in memory.
 */
import { create } from 'zustand';
import * as Battery from 'expo-battery';
import * as FileSystem from 'expo-file-system';
import { loadReferenceBundle } from '../db/bundle-loader';
import { clearSession, getToken } from '../auth/session';
import { persistClient, persistVisit, persistReferral, uuidv4 } from '../db/persist';
import { syncNow } from '../sync/orchestrator';
import type { ReferenceBundle } from '../engine/types';

// ─── Domain types (local, demo-optimised) ────────────────────────────────────

export type ClientType = 'pregnant' | 'child';
export type Priority = 'urgent' | 'high' | 'stable' | 'new';
export type TrendArrow = 'up' | 'down' | 'flat';
export type UiLang = 'en' | 'dag';
export type Role = 'cho' | 'sup';
export type ReferralStatus = 'issued' | 'seen';
export type NotifKind = 'referral' | 'risk' | 'sync' | 'bundle' | 'voice';
export type NotifGroup = 'today' | 'earlier';

export interface ChoActivity {
  id: string;
  name: string;
  zone: string;
  clients: number;
  visited: number;
  pending: number;
  lastSync: string;
  synced: boolean;
}

export interface DemoVisit {
  date: string;
  weight: number;
  hb: number | null;
  muac: number;
  diet: string[];
  danger: string[];
  synced: boolean;
  owner: string;
}

export interface DemoClient {
  id: string;
  name: string;
  type: ClientType;
  age: string | number;
  community: string;
  caregiver: string;
  priority: Priority;
  metric: 'hb' | 'weight' | 'muac';
  severe: boolean;
  referred: boolean;
  flag: string;
  flagDetail: string;
  trendNote: string;
  trendArrow: TrendArrow;
  trendColor: string;
  visits: DemoVisit[];
  // POST-HACKATHON additions
  lifestage?: string;        // 'pregnant' | 'postpartum' | 'lactating'
  linkedClientId?: string;   // linked mother (for child) or child (for mother)
}

export interface VaccineRecord {
  id: string;
  vaccineId: string;
  givenAt: string;             // YYYY-MM-DD
  batchNumber?: string;
  aefi?: string;               // adverse event description
  aefiSeverity?: 'mild' | 'moderate' | 'severe';
}

export interface DemoReferral {
  id: string;
  clientId: string;
  name: string;
  type: ClientType;
  reason: string;
  facility: string;
  status: ReferralStatus;
  at: string;
  seenAt?: string;
  due?: string;
  // G7: enriched confirmation data
  confirmSource?: string;
  outcome?: string;
  nextFollowUp?: string;
}

export interface AppNotification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: NotifGroup;
  target: string;
}

export interface PlanData {
  seasonNote: string;
  targetNote: string;
  foods: PlanFood[];
  alternates: PlanFood[];
  adequacy: { label: string; pct: number }[];
  rationale: string[];
  voiceEn: string;
  voiceDag: string;
}

export interface PlanFood {
  name: string;
  local: string;
  group: string;
  tier: string;
  why: string;
}

export interface VisitForm {
  // Always present
  weight: string;
  hb: string;
  muac: string;
  diet: string[];
  danger: string[];
  // Children only (all ages)
  heightCm: string;
  oedema: string;               // 'yes' | 'no' | ''
  // Pregnant only
  bpSystolic: string;
  bpDiastolic: string;
  ancVisited: string;           // 'yes' | 'no' | ''
  supplementGiven: string;      // 'yes' | 'no' | ''
  // Child 0–5 mo
  exclusiveBreastfeeding: string; // 'yes' | 'no' | ''
  feedingDifficulty: string;    // 'yes' | 'no' | ''
  // Child 6–23 mo
  mealFreqPerDay: string;
  feedingTexture: string;       // 'smooth' | 'mashed' | 'lumpy' | 'family' | ''
  feedingDuringIllness: string; // 'yes' | 'no' | ''
  // Child 6–59 mo (Vitamin A)
  vitaminAGiven: string;        // 'yes' | 'no' | ''
  // Newborn only (< 1 month)
  cordCondition: string;        // 'yes' | 'no' | '' (yes = normal cord)
  jaundice: string;             // 'yes' | 'no' | ''
  breastfeedInitiated: string;  // 'yes' | 'no' | ''
}

export interface RegForm {
  type: ClientType;
  name: string;
  sex: string;          // 'male' | 'female' | ''
  community: string;
  dob: string;          // child's DOB or mother's DOB (YYYY-MM-DD)
  consent: boolean;
  // Household contact (both types)
  phone: string;
  landmark: string;
  // Pregnant-specific
  edd: string;          // expected delivery date (YYYY-MM-DD)
  lmp: string;          // last menstrual period (YYYY-MM-DD)
  ancFolderNumber: string;
  gravida: string;
  parity: string;
  // Child-specific
  cwcCardNumber: string;
  caregiverName: string;
  caregiverRelationship: string;
  // POST-HACKATHON additions
  lifestage: string;            // 'pregnant' | 'postpartum' | 'lactating'
  linkedClientId: string;       // mother's client ID (for child registration)
}

// Plans are generated per-client by the AI layer and stored in state.
// The PlanScreen falls back to a generic template if no plan is available.
export const PLANS: Record<string, PlanData> = {};

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

// ─── Server response types (used in loadUserData) ─────────────────────────────

interface ServerClient {
  id: string;
  householdId: string;
  type: 'pregnant' | 'child';
  name: string;
  dob: string | null;
  eddGestation: string | null;
  sex: 'M' | 'F' | 'unknown' | null;
  consentAt: string;
  active: boolean;
  updatedAt: string;
  community: string;
}

interface ServerReferral {
  id: string;
  clientId: string;
  visitId: string;
  reason: string;
  flagCodes: string[];
  facilityTo: string | null;
  status: string;
  issuedAt: string;
  updatedAt: string;
}

function ageFromDob(dob: string | null, type: 'pregnant' | 'child'): string | number {
  if (!dob) return type === 'pregnant' ? '—' : 'new';
  const months = Math.round((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (type === 'child') {
    if (months < 24) return `${months} mo`;
    return Math.floor(months / 12);
  }
  return Math.round(months / 12);
}

function serverClientToDemoClient(c: ServerClient): DemoClient {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    age: ageFromDob(c.dob, c.type),
    community: c.community,
    caregiver: c.name,
    priority: 'new',
    metric: c.type === 'pregnant' ? 'hb' : 'muac',
    severe: false,
    referred: false,
    flag: 'New client · awaiting first visit',
    flagDetail: '',
    trendNote: '',
    trendArrow: 'flat',
    trendColor: '#427CAF',
    visits: [],
  };
}

function serverReferralToDemoReferral(
  r: ServerReferral,
  clientMap: Map<string, DemoClient>,
): DemoReferral {
  const client = clientMap.get(r.clientId);
  const isActive = r.status === 'issued' || r.status === 'in_transit';
  return {
    id: r.id,
    clientId: r.clientId,
    name: client?.name ?? 'Unknown client',
    type: client?.type ?? 'child',
    reason: r.reason,
    facility: r.facilityTo ?? 'Referral facility',
    status: isActive ? 'issued' : 'seen',
    at: new Date(r.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  };
}

// ─── Store state shape ────────────────────────────────────────────────────────

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string | null;
  phone: string;
  role: Role;
  facilityName: string | null;
  facilityDistrict: string | null;
  facilityRegion: string | null;
}

/** Display-friendly full name: First [Other] Last */
export function displayName(user: Pick<CurrentUser, 'firstName' | 'lastName' | 'otherNames'>): string {
  return [user.firstName, user.otherNames, user.lastName].filter(Boolean).join(' ');
}

interface StoreState {
  // Auth
  role: Role;
  isLoggedIn: boolean;
  sessionExpired: boolean;
  uiLang: UiLang;
  currentUser: CurrentUser | null;

  // Data
  clients: DemoClient[];
  referrals: DemoReferral[];
  notifications: AppNotification[];
  dataLoading: boolean;

  // Supervisor
  choActivity: ChoActivity[];
  supervisorLoading: boolean;

  // Plan edits (removed / added alternates per client)
  planEdits: Record<string, { removed: string[]; added: string[] }>;
  // AI-generated plans per client (keyed by clientId)
  plans: Record<string, PlanData>;

  // Voice / audio
  voiceLang: UiLang;
  audioPlaying: boolean;
  audioT: number;        // 0–38 playback ticks
  recording: boolean;
  recorded: boolean;
  recordT: number;

  // Reference bundle (loaded from SQLite at startup; null until first download)
  referenceBundle: ReferenceBundle | null;
  loadBundle: () => Promise<void>;

  // Device / sync
  offline: boolean;
  syncing: boolean;
  lastSyncAt: string | null;     // ISO string of most recent completed sync
  adaptiveSync: boolean;
  battery: number;
  storageUsed: number;
  telemetryCount: number;
  pendingRecords: number;

  // Forms
  visitForm: VisitForm;
  regForm: RegForm;

  // Actions — auth
  login: (user: CurrentUser) => void;
  logout: () => void;
  setSessionExpired: (v: boolean) => void;
  setUiLang: (lang: UiLang) => void;
  loadUserData: (accessToken: string) => Promise<void>;
  loadSupervisorData: () => Promise<void>;

  // Actions — clients
  addClient: (c: DemoClient) => void;
  patchClient: (id: string, patch: Partial<DemoClient>) => void;

  // Actions — visits
  resetVisitForm: () => void;
  setVisitField: (k: keyof VisitForm, v: string | string[]) => void;
  toggleDiet: (id: string) => void;
  toggleDanger: (id: string) => void;
  saveVisit: (clientId: string) => 'plan' | 'referral';

  // Actions — registration
  setRegField: (k: keyof RegForm, v: string | boolean) => void;
  saveClient: () => DemoClient | null;

  // Actions — plan
  removePlanFood: (clientId: string, name: string) => void;
  addPlanAlternate: (clientId: string) => string | null;
  regeneratePlan: () => void;
  setVoiceLang: (lang: UiLang) => void;

  // Actions — audio
  setAudioT: (t: number) => void;
  setAudioPlaying: (v: boolean) => void;
  setRecording: (v: boolean) => void;
  setRecorded: (v: boolean) => void;
  setRecordT: (t: number) => void;

  // Immunization records
  immunizations: Record<string, VaccineRecord[]>;
  saveVaccineRecord: (clientId: string, record: VaccineRecord) => void;

  // Actions — referrals
  issueReferral: (clientId: string) => void;
  confirmReferralSeen: (clientId: string, details?: { seenAt: string; confirmSource: string; outcome: string; nextFollowUp?: string }) => void;

  // Actions — notifications
  markAllRead: () => void;
  markNotifRead: (id: string) => void;

  // Actions — sync
  sync: () => void;
  toggleOffline: () => void;
  toggleAdaptive: () => void;
  refreshDeviceStats: () => Promise<void>;

  // Demo
  seedDemoData: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const emptyVisitForm: VisitForm = {
  weight: '', hb: '', muac: '', diet: [], danger: [],
  heightCm: '', oedema: '',
  bpSystolic: '', bpDiastolic: '', ancVisited: '', supplementGiven: '',
  exclusiveBreastfeeding: '', feedingDifficulty: '',
  mealFreqPerDay: '', feedingTexture: '', feedingDuringIllness: '',
  vitaminAGiven: '',
  cordCondition: '', jaundice: '', breastfeedInitiated: '',
};
const emptyRegForm: RegForm = {
  type: 'child',
  name: '',
  sex: '',
  community: '',
  dob: '',
  consent: false,
  phone: '',
  landmark: '',
  edd: '',
  lmp: '',
  ancFolderNumber: '',
  gravida: '',
  parity: '',
  cwcCardNumber: '',
  caregiverName: '',
  caregiverRelationship: '',
  lifestage: '',
  linkedClientId: '',
};

export const useAppStore = create<StoreState>((set, get) => ({
  // Initial state
  role: 'cho',
  isLoggedIn: false,
  sessionExpired: false,
  uiLang: 'en',
  currentUser: null,

  clients: [],
  referrals: [],
  notifications: [],
  dataLoading: false,

  choActivity: [],
  supervisorLoading: false,

  planEdits: {},
  plans: {},

  voiceLang: 'en',
  audioPlaying: false,
  audioT: 0,
  recording: false,
  recorded: false,
  recordT: 0,

  referenceBundle: null,
  loadBundle: async () => {
    const bundle = await loadReferenceBundle();
    if (bundle) set({ referenceBundle: bundle });
  },

  immunizations: {},
  offline: true,
  syncing: false,
  lastSyncAt: null,
  adaptiveSync: true,
  battery: 62,
  storageUsed: 148,
  telemetryCount: 14,
  pendingRecords: 3,

  visitForm: emptyVisitForm,
  regForm: emptyRegForm,

  // ── Auth ──
  login: (user) => set({ isLoggedIn: true, role: user.role, currentUser: user, sessionExpired: false }),
  logout: () => {
    clearSession().catch(() => {});
    set({ isLoggedIn: false, currentUser: null, clients: [], referrals: [], notifications: [], sessionExpired: false });
  },
  setSessionExpired: (v) => set({ sessionExpired: v }),
  setUiLang: (lang) => set({ uiLang: lang }),

  loadUserData: async (accessToken: string) => {
    set({ dataLoading: true });
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const [clientsRes, referralsRes] = await Promise.all([
        fetch(`${API_URL}/clients`, { headers }),
        fetch(`${API_URL}/referrals`, { headers }),
      ]);

      const clientsJson = clientsRes.ok ? await clientsRes.json() : { clients: [] };
      const referralsJson = referralsRes.ok ? await referralsRes.json() : { referrals: [] };

      const serverClients: ServerClient[] = clientsJson.clients ?? [];
      const serverReferrals: ServerReferral[] = referralsJson.referrals ?? [];

      const clientMap = new Map<string, DemoClient>();
      const demoClients: DemoClient[] = serverClients.map((c) => {
        const dc = serverClientToDemoClient(c);
        clientMap.set(c.id, dc);
        return dc;
      });

      // Mark clients that have an active referral
      const referredIds = new Set(
        serverReferrals
          .filter((r) => r.status === 'issued' || r.status === 'in_transit')
          .map((r) => r.clientId),
      );
      for (const dc of demoClients) {
        if (referredIds.has(dc.id)) dc.referred = true;
      }

      const demoReferrals: DemoReferral[] = serverReferrals.map((r) =>
        serverReferralToDemoReferral(r, clientMap),
      );

      set({ clients: demoClients, referrals: demoReferrals, dataLoading: false, offline: false, pendingRecords: 0 });
    } catch (e) {
      console.warn('[Store] loadUserData error:', e);
      set({ dataLoading: false });
    }
  },

  loadSupervisorData: async () => {
    set({ supervisorLoading: true });
    try {
      const token = await getToken();
      if (!token || token.startsWith('demo.')) {
        set({ supervisorLoading: false });
        return;
      }
      const res = await fetch(`${API_URL}/supervisor/chos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        set({ choActivity: json.chos ?? [] });
      }
    } catch (e) {
      console.warn('[Store] loadSupervisorData error:', e);
    } finally {
      set({ supervisorLoading: false });
    }
  },

  // ── Clients ──
  addClient: (c) => set((s) => ({ clients: [...s.clients, c] })),
  patchClient: (id, patch) =>
    set((s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  // ── Visit form ──
  resetVisitForm: () => set({ visitForm: emptyVisitForm }),
  setVisitField: (k, v) => set((s) => ({ visitForm: { ...s.visitForm, [k]: v } })),
  toggleDiet: (id) =>
    set((s) => {
      const d = s.visitForm.diet;
      return { visitForm: { ...s.visitForm, diet: d.includes(id) ? d.filter((x) => x !== id) : [...d, id] } };
    }),
  toggleDanger: (id) =>
    set((s) => {
      const d = s.visitForm.danger;
      return { visitForm: { ...s.visitForm, danger: d.includes(id) ? d.filter((x) => x !== id) : [...d, id] } };
    }),

  saveVisit: (clientId) => {
    const { visitForm, clients } = get();
    const client = clients.find((c) => c.id === clientId);
    if (!client) return 'plan';

    const muac = parseFloat(visitForm.muac) || 0;
    const hb = visitForm.hb ? parseFloat(visitForm.hb) : null;
    const severe =
      visitForm.danger.length > 0 ||
      (muac > 0 && muac < 115) ||
      (hb !== null && hb > 0 && hb < 7);

    const lastVisit = client.visits[client.visits.length - 1];
    const newVisit: DemoVisit = {
      date: '12th Nov, 2026',
      weight: parseFloat(visitForm.weight) || lastVisit?.weight || 0,
      hb: hb !== null ? hb : null,
      muac: muac || 235,
      diet: visitForm.diet,
      danger: visitForm.danger,
      synced: false,
      owner: 'You',
    };

    const patch: Partial<DemoClient> = { visits: [...client.visits, newVisit] };

    let severity: 'ok' | 'watch' | 'refer' = 'ok';
    const flagReasons: Array<{ code: string; value?: number }> = [];

    if (severe) {
      severity = 'refer';
      patch.severe = true;
      patch.priority = 'urgent';
      patch.flag = 'Danger sign — referral needed';
      if (visitForm.danger.length > 0) {
        patch.flagDetail = 'Danger sign recorded at this visit';
        flagReasons.push({ code: 'DANGER_SIGNS' });
      } else if (muac > 0 && muac < 115) {
        patch.flagDetail = `MUAC ${Math.round(muac)} mm — below the 115 mm threshold`;
        flagReasons.push({ code: 'SEVERE_MUAC', value: muac });
      } else {
        patch.flagDetail = 'Hb below the severe-anaemia threshold (7 g/dL)';
        flagReasons.push({ code: 'SEVERE_ANAEMIA', value: hb ?? undefined });
      }
      patch.trendColor = '#C81E1E';
      patch.trendArrow = 'down';
      patch.trendNote = 'Danger sign — needs clinical care';
    } else {
      if (muac > 0 && muac < 125) { severity = 'watch'; flagReasons.push({ code: 'SEVERE_MUAC', value: muac }); }
      if (hb !== null && hb > 0 && hb < 11) { severity = 'watch'; flagReasons.push({ code: 'FALLING_HB', value: hb }); }
      if (client.priority === 'new') patch.priority = 'stable';
    }

    get().patchClient(clientId, patch);
    set((s) => ({ telemetryCount: s.telemetryCount + 1, pendingRecords: s.pendingRecords + 1 }));

    // Persist visit + flag to SQLite + outbox (fire-and-forget)
    const visitId = uuidv4();
    const flagId = uuidv4();
    // Serialize type-specific clinical fields into notes JSON
    const clinicalExtras: Record<string, string> = {};
    for (const k of ['heightCm','oedema','bpSystolic','bpDiastolic','ancVisited',
      'supplementGiven','exclusiveBreastfeeding','feedingDifficulty','mealFreqPerDay',
      'feedingTexture','feedingDuringIllness','vitaminAGiven',
      'cordCondition','jaundice','breastfeedInitiated'] as const) {
      const v = visitForm[k as keyof VisitForm] as string;
      if (v) clinicalExtras[k] = v;
    }
    persistVisit(
      {
        visitId,
        clientId,
        visitedAt: new Date().toISOString(),
        weightKg: parseFloat(visitForm.weight) || null,
        hbGDl: visitForm.hb ? parseFloat(visitForm.hb) : null,
        muacMm: muac || null,
        dietRecall: visitForm.diet,
        dangerSigns: visitForm.danger,
        notes: Object.keys(clinicalExtras).length > 0 ? JSON.stringify(clinicalExtras) : null,
      },
      { flagId, clientId, visitId, severity, reasons: flagReasons },
    ).catch((e) => console.warn('[Store] persistVisit error:', e));

    return severe ? 'referral' : 'plan';
  },

  // ── Registration ──
  setRegField: (k, v) => set((s) => ({ regForm: { ...s.regForm, [k]: v } })),
  saveClient: () => {
    const { regForm } = get();
    if (!regForm.name.trim() || !regForm.consent) return null;
    const id = uuidv4();
    const now = new Date().toISOString();
    const nc: DemoClient = {
      id,
      name: regForm.name.trim(),
      type: regForm.type,
      age: regForm.type === 'child' ? 'new' : '—',
      community: regForm.community,
      caregiver: regForm.type === 'child'
        ? (regForm.caregiverName.trim() || regForm.name.trim())
        : regForm.name.trim(),
      priority: 'new',
      metric: 'weight',
      severe: false,
      referred: false,
      flag: 'New client · awaiting first visit',
      flagDetail: '',
      trendNote: '',
      trendArrow: 'flat',
      trendColor: '#427CAF',
      visits: [],
      lifestage: regForm.lifestage || undefined,
      linkedClientId: regForm.linkedClientId || undefined,
    };
    get().addClient(nc);
    // Bidirectional link: update the linked mother/child to point back
    if (regForm.linkedClientId) {
      get().patchClient(regForm.linkedClientId, { linkedClientId: id });
    }
    set({ regForm: emptyRegForm });

    // Persist to SQLite + outbox (fire-and-forget)
    persistClient({
      clientId: id,
      name: nc.name,
      type: nc.type,
      sex: regForm.sex || null,
      community: nc.community,
      dob: regForm.dob || null,
      edd: regForm.edd || null,
      lmp: regForm.lmp || null,
      consentAt: now,
      phone: regForm.phone.trim() || null,
      landmark: regForm.landmark.trim() || null,
      ancFolderNumber: regForm.ancFolderNumber.trim() || null,
      gravida: regForm.gravida.trim() || null,
      parity: regForm.parity.trim() || null,
      cwcCardNumber: regForm.cwcCardNumber.trim() || null,
      caregiverName: regForm.caregiverName.trim() || null,
      caregiverRelationship: regForm.caregiverRelationship || null,
    }).catch((e) => console.warn('[Store] persistClient error:', e));

    return nc;
  },

  // ── Plan ──
  removePlanFood: (clientId, name) =>
    set((s) => {
      const e = s.planEdits[clientId] ?? { removed: [], added: [] };
      return { planEdits: { ...s.planEdits, [clientId]: { ...e, removed: [...e.removed, name] } } };
    }),
  addPlanAlternate: (clientId) => {
    const { planEdits, plans } = get();
    const e = planEdits[clientId] ?? { removed: [], added: [] };
    const plan = plans[clientId] ?? PLANS[clientId];
    if (!plan) return null;
    const next = plan.alternates.find((a) => !e.added.includes(a.name));
    if (!next) return null;
    set((s) => ({
      planEdits: { ...s.planEdits, [clientId]: { ...e, added: [...e.added, next.name] } },
    }));
    return next.name;
  },
  regeneratePlan: () => set((s) => ({ telemetryCount: s.telemetryCount + 1 })),
  setVoiceLang: (lang) => set({ voiceLang: lang }),

  // ── Audio ──
  setAudioT: (t) => set({ audioT: t }),
  setAudioPlaying: (v) => set({ audioPlaying: v }),
  setRecording: (v) => set({ recording: v }),
  setRecorded: (v) => set({ recorded: v }),
  setRecordT: (t) => set({ recordT: t }),

  // ── Referrals ──
  issueReferral: (clientId) => {
    const client = get().clients.find((c) => c.id === clientId);
    if (!client) return;
    const referralId = uuidv4();
    const ref: DemoReferral = {
      id: referralId,
      clientId,
      name: client.name,
      type: client.type,
      reason: client.flagDetail,
      facility: 'Tamale West Hospital',
      status: 'issued',
      at: '12th Nov, 2026',
      due: '15th Nov, 2026',
    };
    get().patchClient(clientId, { referred: true });
    set((s) => ({ referrals: [...s.referrals, ref], telemetryCount: s.telemetryCount + 1 }));

    // Persist + emergency sync (fire-and-forget)
    const visitId = uuidv4(); // placeholder — real flow uses the actual visit UUID
    persistReferral({
      referralId,
      clientId,
      visitId,
      reason: client.flagDetail,
      flagCodes: client.severe ? ['DANGER_SIGNS'] : [],
    })
      .then(() => syncNow('referral_emergency'))
      .catch((e) => console.warn('[Store] issueReferral persist error:', e));
  },
  confirmReferralSeen: (clientId, details) =>
    set((s) => ({
      referrals: s.referrals.map((r) =>
        r.clientId === clientId
          ? {
              ...r,
              status: 'seen',
              seenAt: details?.seenAt ?? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              confirmSource: details?.confirmSource,
              outcome: details?.outcome,
              nextFollowUp: details?.nextFollowUp,
            }
          : r,
      ),
    })),

  // ── Immunizations ──
  saveVaccineRecord: (clientId, record) =>
    set((s) => ({
      immunizations: {
        ...s.immunizations,
        [clientId]: [
          ...(s.immunizations[clientId] ?? []).filter((r) => r.vaccineId !== record.vaccineId),
          record,
        ],
      },
    })),

  // ── Notifications ──
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markNotifRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  // ── Sync ──
  sync: () => {
    const { syncing } = get();
    if (syncing) return;
    set({ syncing: true });
    syncNow('foreground')
      .catch((err) => console.error('[Store] Sync error', err))
      .finally(() => {
        set({ syncing: false, lastSyncAt: new Date().toISOString() });
      });
  },
  toggleOffline: () => set((s) => ({ offline: !s.offline })),
  toggleAdaptive: () => set((s) => ({ adaptiveSync: !s.adaptiveSync })),

  refreshDeviceStats: async () => {
    try {
      const [batteryLevel, dirInfo] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        FileSystem.getInfoAsync(FileSystem.documentDirectory ?? '', { size: true }),
      ]);
      const batteryPct = Math.round(batteryLevel * 100);
      const usedBytes = dirInfo.exists ? (dirInfo as { size?: number }).size ?? 0 : 0;
      const usedMB = Math.round(usedBytes / (1024 * 1024));
      set({ battery: batteryPct, storageUsed: Math.min(usedMB, 250) });
    } catch {
      // Leave existing values if device APIs are unavailable (e.g. web/simulator)
    }
  },

  seedDemoData: () => {
    const demoUser: CurrentUser = {
      id: 'demo-cho-001',
      firstName: 'Abubakari',
      lastName: 'Sulemana',
      otherNames: null,
      phone: '+233244000001',
      role: 'cho',
      facilityName: 'Kukuo CHPS Compound',
      facilityDistrict: 'Sagnarigu Municipal',
      facilityRegion: 'Northern Region',
    };

    // Client IDs match RANK_SIGNALS keys in ClientScreen for explainable ranking demo
    const demoClients: DemoClient[] = [
      {
        id: 'amina',
        name: 'Amina Yakubu',
        type: 'pregnant',
        age: 24,
        community: 'Kukuo',
        caregiver: 'Amina Yakubu',
        priority: 'urgent',
        metric: 'hb',
        severe: false,
        referred: false,
        flag: 'Haemoglobin falling — anaemia risk',
        flagDetail: 'Hb dropped from 11.2 to 9.6 g/dL across 3 visits',
        trendNote: 'Declining Hb — risk of moderate anaemia',
        trendArrow: 'down',
        trendColor: '#C81E1E',
        lifestage: 'pregnant',
        visits: [
          { date: '3rd Jun, 2026',  weight: 64.5, hb: 11.2, muac: 242, diet: ['grains','legumes','vita','veg'],        danger: [], synced: true,  owner: 'You' },
          { date: '28th Jun, 2026', weight: 66.1, hb: 10.4, muac: 238, diet: ['grains','legumes'],                     danger: [], synced: true,  owner: 'You' },
          { date: '18th Jul, 2026', weight: 68.3, hb: 9.6,  muac: 235, diet: ['grains'],                              danger: [], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'rahim',
        name: 'Rahimatu Issah',
        type: 'child',
        age: '18 mo',
        community: 'Choggu',
        caregiver: 'Issah Fuseini',
        priority: 'high',
        metric: 'weight',
        severe: false,
        referred: false,
        flag: 'Slow weight gain — nutrition gap',
        flagDetail: 'No weight gain in 2 consecutive months. Diet restricted to 2 food groups.',
        trendNote: 'Flat weight trend — expected growth not achieved',
        trendArrow: 'flat',
        trendColor: '#B54000',
        visits: [
          { date: '20th May, 2026', weight: 9.8, hb: null, muac: 126, diet: ['grains','breast'],         danger: [], synced: true,  owner: 'You' },
          { date: '19th Jun, 2026', weight: 9.8, hb: null, muac: 122, diet: ['grains'],                  danger: [], synced: true,  owner: 'You' },
          { date: '17th Jul, 2026', weight: 9.9, hb: null, muac: 124, diet: ['grains','breast'],         danger: [], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'latif',
        name: 'Abdul Latif Mahama',
        type: 'child',
        age: '11 mo',
        community: 'Katariga',
        caregiver: 'Fatimatu Mahama',
        priority: 'urgent',
        metric: 'muac',
        severe: true,
        referred: true,
        flag: 'Danger sign — referral needed',
        flagDetail: 'MUAC 108 mm — below severe-wasting threshold (115 mm)',
        trendNote: 'Danger-zone measurement — needs urgent clinical care',
        trendArrow: 'down',
        trendColor: '#C81E1E',
        visits: [
          { date: '1st Jul, 2026',  weight: 6.4, hb: null, muac: 115, diet: ['grains','breast'],   danger: [],         synced: true,  owner: 'You' },
          { date: '22nd Jul, 2026', weight: 6.1, hb: null, muac: 108, diet: ['grains'],            danger: ['oedema'], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'zeinab',
        name: 'Zeinab Alhassan',
        type: 'pregnant',
        age: 27,
        community: 'Lamashegu',
        caregiver: 'Zeinab Alhassan',
        priority: 'stable',
        metric: 'hb',
        severe: false,
        referred: false,
        flag: 'Stable · Hb within normal range',
        flagDetail: 'Hb stable at 11.8–11.9 g/dL. Good diet diversity across 5 food groups.',
        trendNote: 'Hb holding steady — continue iron/folate supplementation',
        trendArrow: 'up',
        trendColor: '#057A55',
        lifestage: 'pregnant',
        visits: [
          { date: '10th Jun, 2026', weight: 71.2, hb: 11.8, muac: 256, diet: ['grains','legumes','dairy','flesh','vita','veg'], danger: [], synced: true,  owner: 'You' },
          { date: '8th Jul, 2026',  weight: 73.6, hb: 11.9, muac: 258, diet: ['grains','legumes','eggs','vita','veg'],          danger: [], synced: false, owner: 'You' },
        ],
      },
      {
        id: 'sadia',
        name: 'Sadia Mohammed',
        type: 'child',
        age: '36 mo',
        community: 'Voggu',
        caregiver: 'Mohammed Alhassan',
        priority: 'stable',
        metric: 'weight',
        severe: false,
        referred: false,
        flag: 'Good progress · diet improving',
        flagDetail: 'Weight gaining consistently. Diet improved from 3 to 5 food groups.',
        trendNote: 'Positive weight trajectory',
        trendArrow: 'up',
        trendColor: '#057A55',
        visits: [
          { date: '5th May, 2026',  weight: 10.2, hb: null, muac: 148, diet: ['grains','legumes','vita'],               danger: [], synced: true,  owner: 'You' },
          { date: '2nd Jun, 2026',  weight: 10.6, hb: null, muac: 151, diet: ['grains','legumes','vita','veg'],          danger: [], synced: true,  owner: 'You' },
          { date: '30th Jun, 2026', weight: 10.9, hb: null, muac: 153, diet: ['grains','legumes','flesh','vita','veg'], danger: [], synced: false, owner: 'You' },
        ],
      },
    ];

    const demoReferrals: DemoReferral[] = [
      {
        id: 'ref-latif-001',
        clientId: 'latif',
        name: 'Abdul Latif Mahama',
        type: 'child',
        reason: 'MUAC 108 mm — below severe-wasting threshold (115 mm). Bilateral oedema present.',
        facility: 'Tamale West Hospital',
        status: 'issued',
        at: '22nd Jul, 2026',
        due: '25th Jul, 2026',
      },
    ];

    const demoNotifications: AppNotification[] = [
      {
        id: 'notif-latif',
        kind: 'risk',
        title: 'Urgent: Abdul Latif Mahama',
        body: 'MUAC 108 mm recorded — referral issued to Tamale West Hospital.',
        time: '22nd Jul, 14:22',
        read: false,
        group: 'today',
        target: 'latif',
      },
      {
        id: 'notif-amina',
        kind: 'risk',
        title: 'Amina Yakubu — Hb declining',
        body: 'Hb dropped to 9.6 g/dL. Follow-up recommended within 7 days.',
        time: '18th Jul, 10:05',
        read: false,
        group: 'today',
        target: 'amina',
      },
      {
        id: 'notif-bundle',
        kind: 'bundle',
        title: 'Reference bundle updated',
        body: 'Seasonal food data v2.1 downloaded. Rainy-season foods now available.',
        time: '15th Jul, 08:30',
        read: true,
        group: 'earlier',
        target: '',
      },
    ];

    set({
      isLoggedIn: true,
      role: 'cho',
      currentUser: demoUser,
      sessionExpired: false,
      clients: demoClients,
      referrals: demoReferrals,
      notifications: demoNotifications,
      offline: true,
      syncing: false,
      lastSyncAt: null,
      pendingRecords: 3, // 3 unsynced visits across the caseload
      dataLoading: false,
    });
  },
}));

// ─── Selector helpers ─────────────────────────────────────────────────────────

export function initials(name: string): string {
  return name
    .replace('Baby ', '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function avatarStyle(type: ClientType): { bg: string; fg: string } {
  return type === 'pregnant'
    ? { bg: '#EFF7FE', fg: '#427CAF' }
    : { bg: '#FFEFE6', fg: '#B54000' };
}

export function priorityStyle(p: Priority): { color: string; bg: string; label: string } {
  if (p === 'urgent') return { color: '#C81E1E', bg: '#FDE8E8', label: 'Urgent' };
  if (p === 'high')   return { color: '#B54000', bg: '#FFEFE6', label: 'Follow up' };
  if (p === 'new')    return { color: '#427CAF', bg: '#EFF7FE', label: 'New' };
  return { color: '#057A55', bg: '#F3FAF7', label: 'Stable' };
}

export function formatMetric(metric: 'hb' | 'weight' | 'muac', value: number | null): string {
  if (value === null) return '—';
  if (metric === 'muac') return `${Math.round(value)} mm`;
  if (metric === 'hb')   return `${value.toFixed(1)} g/dL`;
  return `${value.toFixed(1)} kg`;
}

export function metricLabel(metric: 'hb' | 'weight' | 'muac'): string {
  if (metric === 'hb')   return 'Haemoglobin (g/dL)';
  if (metric === 'muac') return 'MUAC (mm)';
  return 'Weight (kg)';
}

/**
 * Derives a human-readable NurtureLink client ID from list position.
 * Format: NL-{COM}-{YEAR}-{SEQ}  e.g. NL-KUK-2026-00003
 * Note: position-based, not stable if clients are reordered.
 */
export function clientHumanId(client: DemoClient, allClients: DemoClient[]): string {
  const prefix = client.community
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const idx = allClients.findIndex((c) => c.id === client.id);
  const seq = String(Math.max(idx, 0) + 1).padStart(5, '0');
  return `NL-${prefix}-${new Date().getFullYear()}-${seq}`;
}

/** Derives a household display ID from community prefix and index. */
export function householdHumanId(community: string, idx: number): string {
  const prefix = community
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  return `HH-${prefix}-${String(idx + 1).padStart(4, '0')}`;
}
