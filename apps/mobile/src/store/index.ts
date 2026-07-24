import { create } from 'zustand';
import { Client, Visit, Plan, Referral } from '@nurturelink/shared';

interface AuthState {
  userId: string | null;
  facilityId: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

interface AppState {
  auth: AuthState;
  selectedClientId: string | null;
  clients: Client[];
  visits: Record<string, Visit[]>;
  plans: Record<string, Plan[]>;
  referrals: Record<string, Referral[]>;
  isSyncing: boolean;

  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  setSelectedClient: (id: string | null) => void;
  setClients: (clients: Client[]) => void;
  setVisits: (clientId: string, visits: Visit[]) => void;
  setPlans: (clientId: string, plans: Plan[]) => void;
  setReferrals: (clientId: string, referrals: Referral[]) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  auth: { userId: null, facilityId: null, role: null, isAuthenticated: false },
  selectedClientId: null,
  clients: [],
  visits: {},
  plans: {},
  referrals: {},
  isSyncing: false,

  setAuth: (auth) => set({ auth }),
  clearAuth: () =>
    set({ auth: { userId: null, facilityId: null, role: null, isAuthenticated: false } }),
  setSelectedClient: (id) => set({ selectedClientId: id }),
  setClients: (clients) => set({ clients }),
  setVisits: (clientId, visits) =>
    set((s) => ({ visits: { ...s.visits, [clientId]: visits } })),
  setPlans: (clientId, plans) =>
    set((s) => ({ plans: { ...s.plans, [clientId]: plans } })),
  setReferrals: (clientId, referrals) =>
    set((s) => ({ referrals: { ...s.referrals, [clientId]: referrals } })),
  setSyncing: (isSyncing) => set({ isSyncing }),
}));
