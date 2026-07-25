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
  weight: string;
  hb: string;
  muac: string;
  diet: string[];
  danger: string[];
}

export interface RegForm {
  type: ClientType;
  name: string;
  community: string;
  dob: string;
  consent: boolean;
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const SEED_CLIENTS: DemoClient[] = [
  {
    id: 'amina',
    name: 'Amina Mahama',
    type: 'pregnant',
    age: 26,
    community: 'Kukuo',
    caregiver: 'Amina',
    priority: 'high',
    metric: 'hb',
    severe: false,
    referred: false,
    flag: 'Falling haemoglobin',
    flagDetail: 'Hb 11.2 → 9.6 g/dL over 3 visits · mild anaemia',
    trendNote: 'Falling — approaching anaemia threshold (11.0 g/dL)',
    trendArrow: 'down',
    trendColor: '#C81E1E',
    visits: [
      { date: '12th Sep, 2026', weight: 58.4, hb: 11.2, muac: 242, diet: ['grains', 'legumes', 'veg'], danger: [], synced: true, owner: 'You' },
      { date: '10th Oct, 2026', weight: 59.1, hb: 10.4, muac: 238, diet: ['grains', 'legumes'], danger: [], synced: true, owner: 'You' },
      { date: '7th Nov, 2026',  weight: 59.8, hb: 9.6,  muac: 235, diet: ['grains', 'legumes'], danger: [], synced: false, owner: 'You' },
    ],
  },
  {
    id: 'rahim',
    name: 'Baby Rahim',
    type: 'child',
    age: '14 mo',
    community: 'Sagnarigu',
    caregiver: 'Fuseina A.',
    priority: 'high',
    metric: 'weight',
    severe: false,
    referred: false,
    flag: 'Flat weight-for-age',
    flagDetail: 'No weight gain in 2 months · only 2 food groups',
    trendNote: 'Weight has plateaued — growth faltering',
    trendArrow: 'flat',
    trendColor: '#B48700',
    visits: [
      { date: '15th Sep, 2026', weight: 8.1, hb: null, muac: 132, diet: ['grains', 'legumes', 'vita'], danger: [], synced: true, owner: 'You' },
      { date: '13th Oct, 2026', weight: 8.2, hb: null, muac: 129, diet: ['grains', 'legumes'], danger: [], synced: true, owner: 'You' },
      { date: '9th Nov, 2026',  weight: 8.2, hb: null, muac: 128, diet: ['grains', 'legumes'], danger: [], synced: false, owner: 'You' },
    ],
  },
  {
    id: 'latif',
    name: 'Baby Latif',
    type: 'child',
    age: '9 mo',
    community: 'Gizaa',
    caregiver: 'Memuna I.',
    priority: 'urgent',
    metric: 'muac',
    severe: true,
    referred: true,
    flag: 'Severe wasting risk',
    flagDetail: 'MUAC 108 mm — below the 115 mm red-zone threshold',
    trendNote: 'MUAC in the red zone — danger sign',
    trendArrow: 'down',
    trendColor: '#C81E1E',
    visits: [
      { date: '18th Oct, 2026', weight: 6.4, hb: null, muac: 118, diet: ['grains', 'legumes'], danger: [], synced: true, owner: 'You' },
      { date: '12th Nov, 2026', weight: 6.1, hb: null, muac: 108, diet: ['grains'], danger: [], synced: false, owner: 'You' },
    ],
  },
  {
    id: 'zeinab',
    name: 'Zeinab Osman',
    type: 'pregnant',
    age: 31,
    community: 'Kukuo',
    caregiver: 'Zeinab',
    priority: 'stable',
    metric: 'hb',
    severe: false,
    referred: false,
    flag: 'On track · Hb stable',
    flagDetail: 'Hb steady at 11.8 g/dL',
    trendNote: 'Stable and healthy',
    trendArrow: 'up',
    trendColor: '#057A55',
    visits: [
      { date: '14th Sep, 2026', weight: 62.1, hb: 11.6, muac: 258, diet: ['grains', 'legumes', 'flesh', 'veg'], danger: [], synced: true, owner: 'You' },
      { date: '12th Nov, 2026', weight: 63.4, hb: 11.8, muac: 260, diet: ['grains', 'legumes', 'flesh', 'vita', 'veg'], danger: [], synced: true, owner: 'You' },
    ],
  },
  {
    id: 'sadia',
    name: 'Baby Sadia',
    type: 'child',
    age: '20 mo',
    community: 'Sagnarigu',
    caregiver: 'Ayishetu M.',
    priority: 'stable',
    metric: 'weight',
    severe: false,
    referred: false,
    flag: 'Diet improving',
    flagDetail: 'Diet diversity up from 3 to 5 groups',
    trendNote: 'Gaining well',
    trendArrow: 'up',
    trendColor: '#057A55',
    visits: [
      { date: '16th Sep, 2026', weight: 10.2, hb: null, muac: 145, diet: ['grains', 'legumes', 'vita'], danger: [], synced: true, owner: 'You' },
      { date: '10th Nov, 2026', weight: 10.9, hb: null, muac: 148, diet: ['grains', 'legumes', 'flesh', 'vita', 'veg'], danger: [], synced: true, owner: 'You' },
    ],
  },
];

const SEED_REFERRALS: DemoReferral[] = [
  {
    id: 'r1',
    clientId: 'latif',
    name: 'Baby Latif',
    type: 'child',
    reason: 'MUAC 108 mm — below the 115 mm severe-wasting threshold',
    facility: 'Tamale West Hospital',
    status: 'issued',
    at: '12th Nov, 2026',
    due: '15th Nov, 2026',
  },
  {
    id: 'r0',
    clientId: 'fatima',
    name: 'Baby Fatima',
    type: 'child',
    reason: 'Bilateral oedema (danger sign) recorded at visit',
    facility: 'Tamale West Hospital',
    status: 'seen',
    at: '2nd Nov, 2026',
    seenAt: '5th Nov, 2026',
  },
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', kind: 'referral', title: 'Follow-up due: Baby Latif', body: 'Confirm the referral was seen at Tamale West Hospital.', time: '20 min ago', read: false, group: 'today', target: 'referrals' },
  { id: 'n2', kind: 'risk', title: 'Priority raised: Amina Mahama', body: 'Haemoglobin fell to 9.6 g/dL — counselling recommended.', time: '2 h ago', read: false, group: 'today', target: 'client:amina' },
  { id: 'n3', kind: 'sync', title: '3 records pending sync', body: "They'll upload automatically when you're back online.", time: '3 h ago', read: false, group: 'today', target: 'sync' },
  { id: 'n4', kind: 'bundle', title: 'New seasonal bundle available', body: 'v1.4 · November foods for Kukuo zone. Syncs on Wi-Fi.', time: 'Yesterday', read: true, group: 'earlier', target: '' },
  { id: 'n5', kind: 'voice', title: 'Dagbani voice pack updated', body: 'Refreshed counselling phrases were added.', time: '2 days ago', read: true, group: 'earlier', target: '' },
];

export const PLANS: Record<string, PlanData> = {
  amina: {
    seasonNote: 'In season · November · Kukuo zone',
    targetNote: "Amina's haemoglobin has fallen to 9.6 g/dL. This plan closes an iron & folate gap using foods available and affordable in her locality this month.",
    foods: [
      { name: 'Moringa leaves',     local: 'Zogale',       group: 'vita',    tier: 'Free / garden', why: 'Rich in iron & folate; grows around the compound.' },
      { name: 'Cowpea (beans)',     local: 'Tuya',         group: 'legumes', tier: 'Low cost',       why: 'Iron & protein; stores well through the dry season.' },
      { name: 'Groundnut paste',    local: 'Sinkpaŋ zim',  group: 'legumes', tier: 'Low cost',       why: 'Energy, protein & folate; add to soups and koko.' },
      { name: 'Orange sweet potato',local: 'Wulijɛɣu',    group: 'vita',    tier: 'Market',         why: 'Vitamin A & energy; in season and cheap now.' },
      { name: 'Dawadawa',           local: 'Dawadawa',     group: 'legumes', tier: 'Low cost',       why: 'Iron-rich condiment used in most local dishes.' },
    ],
    alternates: [
      { name: 'Boiled egg',   local: 'Gala',   group: 'eggs', tier: 'Market',        why: 'Extra protein & iron when affordable this week.' },
      { name: 'Baobab fruit', local: 'Tuisim', group: 'veg',  tier: 'Free / garden', why: 'Vitamin C to boost iron absorption from greens.' },
    ],
    adequacy: [
      { label: 'Iron',      pct: 94 },
      { label: 'Folate',    pct: 88 },
      { label: 'Vitamin C', pct: 76 },
      { label: 'Energy',    pct: 82 },
      { label: 'Protein',   pct: 90 },
    ],
    rationale: [
      'Hb of 9.6 g/dL is mild anaemia, above the severe threshold — so nutrition counselling is appropriate rather than referral.',
      'Every food is locally available and affordable in Kukuo this month; none rely on the market price of meat.',
      'Pairing zogale and beans with an orange fruit or sweet potato improves how much iron the body absorbs.',
    ],
    voiceEn:  'Good morning, Amina. Your blood level has dropped a little this month, so it is important to eat iron-rich foods often. Cook zogale leaves, beans and groundnut most days, and add orange sweet potato for strength. All of these foods are in the market now and cost very little. Please come to the clinic for your next check-up.',
    voiceDag: 'Dasiba, Amina. A ʒim maa siɣindi bɛla goli ŋɔ, dinzuɣu di simdi ni a dirila bindira din mali ʒim yɛlni. Dim zogale, tuya ni sinkpaŋ dabsili kam, ka pahi wulijɛɣu ni a mali yaa. Bindira ŋɔ zaa bela daa ni pumpɔŋɔ ka bi mali daa. Labmi na ti nya alaafee kariti.',
  },
  rahim: {
    seasonNote: 'In season · November · Sagnarigu',
    targetNote: "Rahim's weight has been flat for two months on only 2 food groups. This plan adds energy, protein and diet diversity from foods available now.",
    foods: [
      { name: 'Enriched koko',    local: 'Koko + sinkpaŋ', group: 'grains',  tier: 'Low cost',       why: 'Millet porridge with groundnut paste for extra energy.' },
      { name: 'Egg',              local: 'Gala',            group: 'eggs',    tier: 'Market',         why: 'Complete protein; one a day supports steady growth.' },
      { name: 'Mashed cowpea',    local: 'Tuya',            group: 'legumes', tier: 'Low cost',       why: 'Protein & iron, softened for a young child.' },
      { name: 'Moringa leaves',   local: 'Zogale',          group: 'vita',    tier: 'Free / garden',  why: 'Adds vitamins A & C and a whole new food group.' },
      { name: 'Small dried fish', local: 'Amani',           group: 'flesh',   tier: 'Low cost',       why: 'Protein, iron & zinc; ground into powder over food.' },
    ],
    alternates: [
      { name: 'Ripe pawpaw',    local: 'Boɣu', group: 'vita',    tier: 'Market',   why: 'Soft vitamin-A fruit babies accept easily.' },
      { name: 'Bambara beans',  local: 'Suya', group: 'legumes', tier: 'Low cost', why: 'Another protein source to rotate through the week.' },
    ],
    adequacy: [
      { label: 'Energy',         pct: 86 },
      { label: 'Protein',        pct: 92 },
      { label: 'Iron',           pct: 80 },
      { label: 'Vitamin A',      pct: 88 },
      { label: 'Diet diversity', pct: 70 },
    ],
    rationale: [
      'No weight gain over two months with a diet of only 2 food groups is growth faltering, not a severe case — nutrition support is the right response.',
      'The plan lifts Rahim from 2 to 5 food groups, crossing the WHO minimum diet-diversity mark.',
      'All items are low cost and available in Sagnarigu now; dried-fish powder and egg add protein without the price of fresh meat.',
    ],
    voiceEn:  "Good morning. Rahim's weight has stayed the same for two months, so he needs more variety in his meals. Give him enriched koko with groundnut paste, mashed beans, egg and zogale every day, and a little dried-fish powder over his food. These foods are available now and low cost. Please bring him back next month so we can weigh him again.",
    voiceDag: 'Dasiba. Rahim tibigginsim maa bi paɣi chira ayi ŋɔ, dinzuɣu o bɔri bindira balibu balibu. Tim o koko din mali sinkpaŋ, tuya din nyɔɣisi, gala ni zogale dabsili kam, ka pahi amani zim o bindirigu zuɣu. Bindira ŋɔ bela daa ni ka bi mali daa. Labmi na ti mali o kariti biɛɣu.',
  },
};

// ─── Store state shape ────────────────────────────────────────────────────────

interface StoreState {
  // Auth
  role: Role;
  isLoggedIn: boolean;
  uiLang: UiLang;

  // Data
  clients: DemoClient[];
  referrals: DemoReferral[];
  notifications: AppNotification[];

  // Plan edits (removed / added alternates per client)
  planEdits: Record<string, { removed: string[]; added: string[] }>;

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
  login: (role: Role) => void;
  logout: () => void;
  setUiLang: (lang: UiLang) => void;

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

const emptyVisitForm: VisitForm = { weight: '', hb: '', muac: '', diet: [], danger: [] };
const emptyRegForm: RegForm = { type: 'child', name: '', community: 'Kukuo', dob: '', consent: false };

export const useAppStore = create<StoreState>((set, get) => ({
  // Initial state
  role: 'cho',
  isLoggedIn: false,
  uiLang: 'en',

  clients: SEED_CLIENTS,
  referrals: SEED_REFERRALS,
  notifications: SEED_NOTIFICATIONS,

  planEdits: {},

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
  login: (role) => set({ isLoggedIn: true, role }),
  logout: () => {
    clearSession().catch(() => {});
    set({ isLoggedIn: false });
  },
  setUiLang: (lang) => set({ uiLang: lang }),

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

    if (severe) {
      patch.severe = true;
      patch.priority = 'urgent';
      patch.flag = 'Danger sign — referral needed';
      patch.flagDetail =
        visitForm.danger.length > 0
          ? 'Danger sign recorded at this visit'
          : muac > 0 && muac < 115
          ? `MUAC ${Math.round(muac)} mm — below the 115 mm threshold`
          : 'Hb below the severe-anaemia threshold (7 g/dL)';
      patch.trendColor = '#C81E1E';
      patch.trendArrow = 'down';
      patch.trendNote = 'Danger sign — needs clinical care';
    } else if (client.priority === 'new') {
      patch.priority = 'stable';
    }

    get().patchClient(clientId, patch);
    set((s) => ({ telemetryCount: s.telemetryCount + 1, pendingRecords: s.pendingRecords + 1 }));

    return severe ? 'referral' : 'plan';
  },

  // ── Registration ──
  setRegField: (k, v) => set((s) => ({ regForm: { ...s.regForm, [k]: v } })),
  saveClient: () => {
    const { regForm } = get();
    if (!regForm.name.trim() || !regForm.consent) return null;
    const id = 'c' + Date.now();
    const nc: DemoClient = {
      id,
      name: regForm.name.trim(),
      type: regForm.type,
      age: regForm.type === 'child' ? 'new' : '—',
      community: regForm.community,
      caregiver: regForm.name.trim(),
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
    return nc;
  },

  // ── Plan ──
  removePlanFood: (clientId, name) =>
    set((s) => {
      const e = s.planEdits[clientId] ?? { removed: [], added: [] };
      return { planEdits: { ...s.planEdits, [clientId]: { ...e, removed: [...e.removed, name] } } };
    }),
  addPlanAlternate: (clientId) => {
    const { planEdits } = get();
    const e = planEdits[clientId] ?? { removed: [], added: [] };
    const plan = PLANS[clientId];
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
    const ref: DemoReferral = {
      id: 'r' + Date.now(),
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
