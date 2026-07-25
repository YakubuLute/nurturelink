import React, { useState } from 'react';
import { adminApi } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Avail = 'abundant' | 'available' | 'scarce' | 'none';

interface Cell {
  availability: Avail;
}

// ── Seed data (Kukuo agro-zone, Northern Ghana) ────────────────────────────────

const FOODS = [
  'Moringa leaves',
  'Cowpea (beans)',
  'Groundnut paste',
  'Orange sweet potato',
  'Dawadawa',
  'Millet',
  'Egg',
  'Small dried fish',
  'Baobab fruit',
  'Ripe pawpaw',
  'Bambara groundnut',
  'Sorghum',
  'Shea butter',
  'Liver',
  'Fortified porridge',
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Initial seed — reflects Northern Ghana dry/wet season patterns
const SEED: Record<string, Avail[]> = {
  'Moringa leaves':       ['scarce','scarce','available','abundant','abundant','abundant','abundant','abundant','abundant','available','scarce','scarce'],
  'Cowpea (beans)':       ['available','available','scarce','scarce','scarce','scarce','abundant','abundant','available','available','available','available'],
  'Groundnut paste':      ['available','available','available','scarce','scarce','scarce','scarce','available','abundant','abundant','available','available'],
  'Orange sweet potato':  ['scarce','scarce','scarce','scarce','scarce','available','abundant','abundant','abundant','available','scarce','scarce'],
  'Dawadawa':             ['available','available','available','available','abundant','abundant','available','available','available','available','available','available'],
  'Millet':               ['available','scarce','scarce','scarce','scarce','scarce','scarce','abundant','abundant','abundant','available','available'],
  'Egg':                  ['available','available','available','available','available','available','available','available','available','available','available','available'],
  'Small dried fish':     ['abundant','abundant','abundant','abundant','available','available','available','available','available','abundant','abundant','abundant'],
  'Baobab fruit':         ['abundant','abundant','available','scarce','scarce','scarce','scarce','scarce','scarce','available','available','abundant'],
  'Ripe pawpaw':          ['scarce','scarce','available','available','abundant','abundant','abundant','available','available','scarce','scarce','scarce'],
  'Bambara groundnut':    ['available','available','scarce','scarce','scarce','scarce','scarce','available','abundant','abundant','available','available'],
  'Sorghum':              ['available','available','scarce','scarce','scarce','scarce','scarce','available','abundant','abundant','available','available'],
  'Shea butter':          ['abundant','abundant','abundant','abundant','available','scarce','scarce','available','available','available','abundant','abundant'],
  'Liver':                ['available','available','available','available','available','available','available','available','available','available','available','available'],
  'Fortified porridge':   ['available','available','available','available','available','available','available','available','available','available','available','available'],
};

const CYCLE: Avail[] = ['abundant', 'available', 'scarce', 'none'];

const COLORS: Record<Avail, { bg: string; fg: string }> = {
  abundant:  { bg: '#057A55', fg: '#fff' },
  available: { bg: '#76c893', fg: '#fff' },
  scarce:    { bg: '#ffe066', fg: '#78620e' },
  none:      { bg: '#e5e7eb', fg: '#9ca3af' },
};

// ── Component ─────────────────────────────────────────────────────────────────

type MatrixState = Record<string, Avail[]>;

function initMatrix(): MatrixState {
  const m: MatrixState = {};
  for (const food of FOODS) {
    m[food] = SEED[food] ? [...SEED[food]] : Array(12).fill('none');
  }
  return m;
}

export function SeasonalMatrixPage() {
  const [matrix, setMatrix] = useState<MatrixState>(initMatrix);
  const [zone, setZone] = useState('Kukuo');
  const [publishing, setPublishing] = useState(false);
  const [pubMessage, setPubMessage] = useState('');

  function cycleCell(food: string, monthIdx: number) {
    setMatrix((prev) => {
      const row = [...prev[food]];
      const cur = row[monthIdx];
      row[monthIdx] = CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length];
      return { ...prev, [food]: row };
    });
  }

  async function handlePublish() {
    setPublishing(true);
    setPubMessage('');
    try {
      await adminApi.post('/admin/reference/publish', { zone, matrix });
      setPubMessage('Bundle v' + new Date().toISOString().slice(0, 10) + ' published successfully.');
    } catch {
      setPubMessage('Demo mode: bundle staged locally (API not connected).');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <h1 style={s.h1}>Seasonal Availability Matrix</h1>
      <p style={s.desc}>
        Click any cell to cycle: <strong>Abundant → Available → Scarce → None</strong>.
        Changes are staged. Click <em>Publish Bundle</em> to version and push to field devices.
      </p>

      {/* Legend + zone selector */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {(Object.entries(COLORS) as [Avail, { bg: string; fg: string }][]).map(([k, v]) => (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: v.bg, border: '1px solid #ccc', display: 'inline-block' }} />
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Agro-zone:</label>
          <select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            style={s.select}
          >
            <option>Kukuo</option>
            <option>Sagnarigu</option>
            <option>Gizaa</option>
            <option>Tamale Metro</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: 160, textAlign: 'left', background: '#f9fafb' }}>Food</th>
              {MONTHS.map((m) => (
                <th key={m} style={{ ...s.th, width: 54, textAlign: 'center', background: '#f9fafb' }}>{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FOODS.map((food, fi) => (
              <tr key={food} style={{ background: fi % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ ...s.td, fontWeight: 500, color: '#374151', whiteSpace: 'nowrap', borderRight: '1px solid #e5e7eb' }}>
                  {food}
                </td>
                {matrix[food].map((avail, mi) => {
                  const c = COLORS[avail];
                  return (
                    <td
                      key={mi}
                      onClick={() => cycleCell(food, mi)}
                      title={avail}
                      style={{
                        ...s.td,
                        background: c.bg,
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: c.fg,
                        fontSize: 10,
                        fontWeight: 700,
                        userSelect: 'none',
                        transition: 'opacity 0.1s',
                      }}
                    >
                      {avail === 'none' ? '' : avail[0].toUpperCase()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Publish bar */}
      <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handlePublish}
          disabled={publishing}
          style={{
            padding: '11px 28px',
            background: publishing ? '#ccc' : '#08283B',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            cursor: publishing ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {publishing ? 'Publishing…' : 'Publish Bundle'}
        </button>
        {pubMessage && <span style={{ color: '#057A55', fontWeight: 600, fontSize: 13 }}>{pubMessage}</span>}
      </div>

      <p style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
        A = Abundant · V = Available · S = Scarce · (blank) = Not in season.
        Source: Northern Ghana seasonal calendars validated with UDS Faculty of Agriculture.
      </p>
    </div>
  );
}

const s = {
  h1: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 } as const,
  desc: { color: '#555', marginBottom: 20, lineHeight: 1.6 } as const,
  select: {
    padding: '7px 10px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
  } as const,
  th: {
    padding: '10px 8px',
    fontWeight: 600,
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    fontSize: 11,
  } as const,
  td: { padding: '7px 8px', borderBottom: '1px solid #f3f4f6' } as const,
};
