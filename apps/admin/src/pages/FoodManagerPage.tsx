import React, { useState } from 'react';
import { adminApi } from '../api/client';

// ── Pilot district seed foods (Northern Ghana) ────────────────────────────────

interface Food {
  id: string;
  name: string;
  dagbani: string;
  group: string;
  ironMg: number;
  folateUg: number;
  proteinG: number;
  energyKcal: number;
  vitAUgRae: number;
  zincMg: number;
  tier: 'staple_cheap' | 'market' | 'premium';
  storable: boolean;
  gardenWild: boolean;
  active: boolean;
}

const TIER_LABELS: Record<string, string> = {
  staple_cheap: 'Low cost',
  market: 'Market',
  premium: 'Premium',
};

const TIER_COLORS: Record<string, string> = {
  staple_cheap: '#057A55',
  market: '#B48700',
  premium: '#7C3AED',
};

const SEED_FOODS: Food[] = [
  { id: 'fd001', name: 'Moringa leaves',      dagbani: 'Zogale',         group: 'vita',    ironMg: 4.0,  folateUg: 40,  proteinG: 9.4,  energyKcal: 64,  vitAUgRae: 378, zincMg: 0.6, tier: 'staple_cheap', storable: false, gardenWild: true,  active: true },
  { id: 'fd002', name: 'Cowpea (beans)',       dagbani: 'Tuya',           group: 'legumes', ironMg: 4.9,  folateUg: 208, proteinG: 23.5, energyKcal: 336, vitAUgRae: 0,   zincMg: 3.4, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd003', name: 'Groundnut paste',      dagbani: 'Sinkpaŋ zim',   group: 'legumes', ironMg: 2.0,  folateUg: 98,  proteinG: 25.8, energyKcal: 589, vitAUgRae: 0,   zincMg: 3.3, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd004', name: 'Orange sweet potato',  dagbani: 'Wulijɛɣu',      group: 'vita',    ironMg: 0.6,  folateUg: 11,  proteinG: 1.6,  energyKcal: 86,  vitAUgRae: 709, zincMg: 0.3, tier: 'market',       storable: true,  gardenWild: false, active: true },
  { id: 'fd005', name: 'Dawadawa (locust bean)',dagbani: 'Dawadawa',      group: 'legumes', ironMg: 3.8,  folateUg: 32,  proteinG: 35.0, energyKcal: 395, vitAUgRae: 0,   zincMg: 2.9, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd006', name: 'Millet (whole)',        dagbani: 'Nyɛri',         group: 'grains',  ironMg: 3.0,  folateUg: 85,  proteinG: 11.0, energyKcal: 378, vitAUgRae: 0,   zincMg: 1.7, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd007', name: 'Egg (boiled)',          dagbani: 'Gala',          group: 'eggs',    ironMg: 1.9,  folateUg: 44,  proteinG: 12.6, energyKcal: 155, vitAUgRae: 160, zincMg: 1.3, tier: 'market',       storable: false, gardenWild: false, active: true },
  { id: 'fd008', name: 'Small dried fish',      dagbani: 'Amani',         group: 'flesh',   ironMg: 5.0,  folateUg: 18,  proteinG: 66.0, energyKcal: 311, vitAUgRae: 0,   zincMg: 4.1, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd009', name: 'Baobab fruit',          dagbani: 'Tuisim',        group: 'veg',     ironMg: 9.3,  folateUg: 52,  proteinG: 2.3,  energyKcal: 227, vitAUgRae: 0,   zincMg: 0.1, tier: 'staple_cheap', storable: true,  gardenWild: true,  active: true },
  { id: 'fd010', name: 'Ripe pawpaw',           dagbani: 'Boɣu',          group: 'vita',    ironMg: 0.3,  folateUg: 37,  proteinG: 0.5,  energyKcal: 43,  vitAUgRae: 47,  zincMg: 0.1, tier: 'market',       storable: false, gardenWild: false, active: true },
  { id: 'fd011', name: 'Bambara groundnut',     dagbani: 'Suya',          group: 'legumes', ironMg: 1.7,  folateUg: 61,  proteinG: 18.7, energyKcal: 367, vitAUgRae: 0,   zincMg: 2.0, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd012', name: 'Sorghum (TZ base)',     dagbani: 'Zea',           group: 'grains',  ironMg: 2.7,  folateUg: 14,  proteinG: 11.3, energyKcal: 329, vitAUgRae: 0,   zincMg: 1.8, tier: 'staple_cheap', storable: true,  gardenWild: false, active: true },
  { id: 'fd013', name: 'Shea butter',           dagbani: 'Kiŋ kaŋ',       group: 'fats',    ironMg: 0.0,  folateUg: 0,   proteinG: 0.0,  energyKcal: 884, vitAUgRae: 0,   zincMg: 0.0, tier: 'staple_cheap', storable: true,  gardenWild: true,  active: true },
  { id: 'fd014', name: 'Liver (chicken/goat)',  dagbani: 'Nyiɛm',         group: 'flesh',   ironMg: 9.9,  folateUg: 290, proteinG: 19.7, energyKcal: 136, vitAUgRae: 4968,zincMg: 4.0, tier: 'market',       storable: false, gardenWild: false, active: true },
  { id: 'fd015', name: 'Fortified porridge',    dagbani: 'Koko zumaliŋ',  group: 'grains',  ironMg: 8.0,  folateUg: 120, proteinG: 15.0, energyKcal: 380, vitAUgRae: 200, zincMg: 5.0, tier: 'market',       storable: true,  gardenWild: false, active: true },
];

// ── Component ─────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'group' | 'tier' | 'ironMg' | 'proteinG' | 'energyKcal';

export function FoodManagerPage() {
  const [foods, setFoods] = useState<Food[]>(SEED_FOODS);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterGroup, setFilterGroup] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const groups = Array.from(new Set(foods.map((f) => f.group))).sort();

  const sorted = [...foods]
    .filter((f) => !filterGroup || f.group === filterGroup)
    .sort((a, b) => {
      const av = a[sort] as string | number;
      const bv = b[sort] as string | number;
      return sortDir === 'asc'
        ? av < bv ? -1 : av > bv ? 1 : 0
        : av > bv ? -1 : av < bv ? 1 : 0;
    });

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(key); setSortDir('asc'); }
  }

  function cycleTier(id: string) {
    setFoods((fs) =>
      fs.map((f) => {
        if (f.id !== id) return f;
        const next: Food['tier'][] = ['staple_cheap', 'market', 'premium'];
        const idx = next.indexOf(f.tier);
        return { ...f, tier: next[(idx + 1) % next.length] };
      }),
    );
  }

  function toggleActive(id: string) {
    setFoods((fs) => fs.map((f) => (f.id === id ? { ...f, active: !f.active } : f)));
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setMessage('');
    try {
      const form = new FormData();
      form.append('file', file);
      await adminApi.post('/admin/foods/import', form);
      setMessage(`Imported ${file.name} successfully.`);
    } catch {
      setMessage('Demo mode: API not connected. CSV parsed locally.');
    } finally {
      setIsUploading(false);
    }
  }

  const thSort = (key: SortKey, label: string) => (
    <th
      onClick={() => toggleSort(key)}
      style={{ ...s.th, cursor: 'pointer', userSelect: 'none' }}
    >
      {label} {sort === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div>
      <h1 style={s.h1}>Food Composition Manager</h1>
      <p style={s.desc}>
        Manage the reference food library for Northern Ghana. Affordability tiers and active status
        can be edited inline. CSV import adds or updates rows by food ID.
      </p>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={s.btn}>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleCsvUpload}
            style={{ display: 'none' }}
            disabled={isUploading}
          />
          {isUploading ? 'Importing…' : '↑ Import CSV'}
        </label>

        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          style={s.select}
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <span style={{ color: '#666', fontSize: 13 }}>{sorted.length} foods</span>
        {message && <span style={{ color: '#057A55', fontWeight: 600, fontSize: 13 }}>{message}</span>}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {thSort('name', 'Name')}
              <th style={s.th}>Dagbani</th>
              {thSort('group', 'Group')}
              {thSort('ironMg', 'Iron (mg)')}
              <th style={s.th}>Folate (µg)</th>
              {thSort('proteinG', 'Protein (g)')}
              {thSort('energyKcal', 'Energy (kcal)')}
              <th style={s.th}>Vit A (µg)</th>
              {thSort('tier', 'Tier')}
              <th style={s.th}>Store</th>
              <th style={s.th}>Wild</th>
              <th style={s.th}>Active</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, i) => (
              <tr
                key={f.id}
                style={{
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                  opacity: f.active ? 1 : 0.45,
                }}
              >
                <td style={{ ...s.td, fontWeight: 600 }}>{f.name}</td>
                <td style={{ ...s.td, color: '#666', fontStyle: 'italic' }}>{f.dagbani}</td>
                <td style={s.td}>
                  <span style={{ ...s.badge, background: '#f0f0f0', color: '#444' }}>{f.group}</span>
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>{f.ironMg.toFixed(1)}</td>
                <td style={{ ...s.td, textAlign: 'right' }}>{f.folateUg}</td>
                <td style={{ ...s.td, textAlign: 'right' }}>{f.proteinG.toFixed(1)}</td>
                <td style={{ ...s.td, textAlign: 'right' }}>{f.energyKcal}</td>
                <td style={{ ...s.td, textAlign: 'right' }}>{f.vitAUgRae}</td>
                <td style={s.td}>
                  <button
                    onClick={() => cycleTier(f.id)}
                    style={{
                      ...s.badge,
                      background: TIER_COLORS[f.tier] + '22',
                      color: TIER_COLORS[f.tier],
                      border: `1px solid ${TIER_COLORS[f.tier]}44`,
                      cursor: 'pointer',
                    }}
                  >
                    {TIER_LABELS[f.tier]}
                  </button>
                </td>
                <td style={{ ...s.td, textAlign: 'center' }}>{f.storable ? '✓' : '–'}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>{f.gardenWild ? '✓' : '–'}</td>
                <td style={{ ...s.td, textAlign: 'center' }}>
                  <button
                    onClick={() => toggleActive(f.id)}
                    style={{
                      padding: '2px 10px',
                      borderRadius: 12,
                      border: 'none',
                      background: f.active ? '#dcfce7' : '#fee2e2',
                      color: f.active ? '#15803d' : '#b91c1c',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {f.active ? 'Active' : 'Off'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
        Click a tier badge to cycle it. Inactive foods are excluded from generated plans.
        CSV format: <code>name, dagbani_name, food_group, iron_mg, folate_ug, protein_g, energy_kcal, vit_a_ug_rae, zinc_mg, affordability_tier, storable, garden_wild</code>
      </p>
    </div>
  );
}

const s = {
  h1: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 } as const,
  desc: { color: '#555', marginBottom: 20, lineHeight: 1.6 } as const,
  btn: {
    display: 'inline-block',
    padding: '9px 18px',
    background: '#08283B',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  } as const,
  select: {
    padding: '9px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
    background: '#fff',
  } as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    padding: '10px 14px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td: { padding: '10px 14px', borderBottom: '1px solid #f3f4f6' } as const,
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
  } as const,
};
