import React from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const AVAILABILITY_COLORS = {
  abundant: '#1a7c4e',
  available: '#76c893',
  scarce: '#ffe066',
  none: '#eee',
};

/**
 * Seasonal Matrix Scheduler
 * - Interactive grid: foods × months
 * - Click a cell to cycle through abundant → available → scarce → none
 * - Publishes staged changes as a new versioned bundle
 */
export function SeasonalMatrixPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Seasonal Availability Matrix</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Click a cell to set availability for each food by month. Changes are staged until you publish a bundle.
      </p>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.entries(AVAILABILITY_COLORS).map(([label, color]) => (
          <span
            key={label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
          >
            <span
              style={{ width: 14, height: 14, borderRadius: 3, background: color, border: '1px solid #ccc' }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* TODO: fetch foods + seasonal_availability from API and render grid */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, color: '#888' }}>
        <p>Grid renders here — rows = foods, columns = months (Jan–Dec).</p>
        <p>Each cell is clickable and cycles: abundant → available → scarce → none.</p>
      </div>

      <button
        style={{
          marginTop: 24,
          padding: '12px 28px',
          background: '#1a7c4e',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 700,
          cursor: 'pointer',
          fontSize: 15,
        }}
        onClick={() => {
          // TODO: POST /admin/reference/publish with staged changes
        }}
      >
        Publish Bundle
      </button>
    </div>
  );
}
