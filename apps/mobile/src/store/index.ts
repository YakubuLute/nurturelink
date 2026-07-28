/**
 * NurtureLink — Zustand app store.
 *
 * This store drives both the live app state and the demo seed data used for
 * the prototype. Real persistence (SQLCipher) and sync are wired separately;
 * for the hackathon demo everything lives in memory.
 */
import { create } from 'zustand';
import { loadReferenceBundle } from '../db/bundle-loader';
import { clearSession } from '../auth/session';
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

  // Actions — referrals
  issueReferral: (clientId: string) => void;
  confirmReferralSeen: (clientId: string) => void;

  // Actions — notifications
  markAllRead: () => void;
  markNotifRead: (id: string) => void;

  // Actions — sync
  sync: () => void;
  toggleOffline: () => void;
  toggleAdaptive: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const emptyVisitForm: VisitForm = {
  weight: '', hb: '', muac: '', diet: [], danger: [],
  heightCm: '', oedema: '',
  bpSystolic: '', bpDiastolic: '', ancVisited: '', supplementGiven: '',
  exclusiveBreastfeeding: '', feedingDifficulty: '',
  mealFreqPerDay: '', feedingTexture: '', feedingDuringIllness: '',
  vitaminAGiven: '',
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

  offline: true,
  syncing: false,
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
      'feedingTexture','feedingDuringIllness','vitaminAGiven'] as const) {
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
    };
    get().addClient(nc);
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
  confirmReferralSeen: (clientId) =>
    set((s) => ({
      referrals: s.referrals.map((r) =>
        r.clientId === clientId ? { ...r, status: 'seen', seenAt: '12th Nov, 2026' } : r,
      ),
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
    setTimeout(() => {
      set((s) => ({
        syncing: false,
        offline: false,
        telemetryCount: 0,
        pendingRecords: 0,
        clients: s.clients.map((c) => ({
          ...c,
          visits: c.visits.map((v) => ({ ...v, synced: true })),
        })),
      }));
    }, 1900);
  },
  toggleOffline: () => set((s) => ({ offline: !s.offline })),
  toggleAdaptive: () => set((s) => ({ adaptiveSync: !s.adaptiveSync })),
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
