/**
 * Persistence helpers — write store mutations to local SQLite and enqueue
 * them in the outbox for later sync with the server.
 *
 * All functions are fire-and-forget safe: callers .catch() errors so a DB
 * failure never blocks the UI (architecture invariant #3).
 */

import { v4 as uuidv4 } from 'uuid';
import { execute } from './index';
import { enqueue } from '../sync/outbox';

const FACILITY_ID = 'f1000000-0000-0000-0000-000000000001'; // Kukuo CHPS — matches seed
const USER_ID = 'u1000000-0000-0000-0000-000000000001';     // Demo CHO — matches seed
const BUNDLE_VERSION = 'v1.0-seed';

// ── Household + Client ────────────────────────────────────────────────────────

export interface PersistClientInput {
  clientId: string;
  name: string;
  type: 'pregnant' | 'child';
  community: string;
  dob: string | null;
  consentAt: string;
}

export async function persistClient(input: PersistClientInput): Promise<void> {
  const householdId = uuidv4();
  const now = new Date().toISOString();

  // Write household
  await execute(
    `INSERT INTO households (id, facility_id, label, community, updated_at, synced_at)
     VALUES (?,?,?,?,?,NULL)
     ON CONFLICT(id) DO NOTHING`,
    [householdId, FACILITY_ID, input.community, input.community, now],
  );

  // Write client
  await execute(
    `INSERT INTO clients (id, household_id, type, name, dob, consent_at, active, updated_at, synced_at)
     VALUES (?,?,?,?,?,?,1,?,NULL)
     ON CONFLICT(id) DO NOTHING`,
    [input.clientId, householdId, input.type, input.name, input.dob, input.consentAt, now],
  );

  // Enqueue outbox mutations
  await enqueue('households', householdId, 'insert', {
    id: householdId,
    facilityId: FACILITY_ID,
    label: input.community,
    community: input.community,
    updatedAt: now,
  });

  await enqueue('clients', input.clientId, 'insert', {
    id: input.clientId,
    householdId,
    type: input.type,
    name: input.name,
    dob: input.dob,
    consentAt: input.consentAt,
    active: true,
    updatedAt: now,
  });
}

// ── Visit + Flag ──────────────────────────────────────────────────────────────

export interface PersistVisitInput {
  visitId: string;
  clientId: string;
  visitedAt: string;
  weightKg: number | null;
  hbGDl: number | null;
  muacMm: number | null;
  dietRecall: string[];
  dangerSigns: string[];
  notes: string | null;
}

export interface PersistFlagInput {
  flagId: string;
  clientId: string;
  visitId: string;
  severity: 'ok' | 'watch' | 'refer';
  reasons: Array<{ code: string; value?: number; detail?: string }>;
}

export async function persistVisit(
  visit: PersistVisitInput,
  flag: PersistFlagInput,
): Promise<void> {
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO visits
       (id, client_id, user_id, visited_at, weight_kg, hb_g_dl, muac_mm,
        diet_recall, danger_signs, notes, updated_at, synced_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL)
     ON CONFLICT(id) DO NOTHING`,
    [
      visit.visitId, visit.clientId, USER_ID,
      visit.visitedAt,
      visit.weightKg, visit.hbGDl, visit.muacMm,
      JSON.stringify(visit.dietRecall),
      visit.dangerSigns.length > 0 ? JSON.stringify(visit.dangerSigns) : null,
      visit.notes,
      now,
    ],
  );

  await execute(
    `INSERT INTO flags (id, client_id, visit_id, severity, reasons, computed_at, reference_bundle_version)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(id) DO NOTHING`,
    [
      flag.flagId, flag.clientId, flag.visitId,
      flag.severity,
      JSON.stringify(flag.reasons),
      now,
      BUNDLE_VERSION,
    ],
  );

  await enqueue('visits', visit.visitId, 'insert', {
    id: visit.visitId,
    clientId: visit.clientId,
    userId: USER_ID,
    visitedAt: visit.visitedAt,
    weightKg: visit.weightKg,
    hbGDl: visit.hbGDl,
    muacMm: visit.muacMm,
    dietRecall: visit.dietRecall,
    dangerSigns: visit.dangerSigns,
    notes: visit.notes,
    updatedAt: now,
  });

  await enqueue('flags', flag.flagId, 'insert', {
    id: flag.flagId,
    clientId: flag.clientId,
    visitId: flag.visitId,
    severity: flag.severity,
    reasons: flag.reasons,
    computedAt: now,
    referenceBundleVersion: BUNDLE_VERSION,
  });
}

// ── Referral ──────────────────────────────────────────────────────────────────

export interface PersistReferralInput {
  referralId: string;
  clientId: string;
  visitId: string;
  reason: string;
  flagCodes: string[];
}

export async function persistReferral(input: PersistReferralInput): Promise<void> {
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO referrals
       (id, client_id, visit_id, reason, flag_codes, status, queued_offline, issued_at, updated_at, synced_at)
     VALUES (?,?,?,?,?,'issued',1,?,?,NULL)
     ON CONFLICT(id) DO NOTHING`,
    [
      input.referralId, input.clientId, input.visitId,
      input.reason,
      JSON.stringify(input.flagCodes),
      now, now,
    ],
  );

  await enqueue('referrals', input.referralId, 'insert', {
    id: input.referralId,
    clientId: input.clientId,
    visitId: input.visitId,
    reason: input.reason,
    flagCodes: input.flagCodes,
    status: 'issued',
    queuedOffline: true,
    issuedAt: now,
    updatedAt: now,
  });
}

export { uuidv4 };
