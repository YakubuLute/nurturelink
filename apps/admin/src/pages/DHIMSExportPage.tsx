import React, { useState } from 'react';
import { adminApi } from '../api/client';

export function DHIMSExportPage() {
  const [facilityId, setFacilityId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    if (!facilityId || !periodStart || !periodEnd) return;
    setIsExporting(true);
    try {
      const csv = await adminApi.post<string>('/export/dhims2', {
        facilityId,
        periodStart,
        periodEnd,
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhims2-${periodStart}-${periodEnd}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>DHIMS2 Export</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Generate a monthly CHPS tally summary matching the national DHIMS2 reporting format.
      </p>

      <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 480 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Facility</label>
          {/* TODO: Replace with a dropdown loaded from GET /admin/facilities */}
          <input
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            placeholder="Facility UUID"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 6 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Period start</label>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 6 }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Period end</label>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 6 }}
          />
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || !facilityId || !periodStart || !periodEnd}
          style={{
            padding: '12px 28px',
            background: '#1a7c4e',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 15,
            opacity: isExporting || !facilityId ? 0.6 : 1,
          }}
        >
          {isExporting ? 'Generating…' : 'Download CSV'}
        </button>
      </div>
    </div>
  );
}
