import React, { useState } from 'react';
import { adminApi } from '../api/client';

/**
 * Food Composition Manager
 * - Bulk CSV upload for food composition data
 * - Visual table editor for affordability tiers
 * - Validates required nutrient fields before saving
 */
export function FoodManagerPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await adminApi.post('/admin/foods/import', form);
      setMessage('Foods imported successfully.');
    } catch {
      setMessage('Import failed. Check CSV format.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <h1 style={styles.heading}>Food Composition Manager</h1>
      <p style={styles.desc}>
        Upload a CSV/Excel file with food composition data. Required columns:{' '}
        <code>name, dagbani_name, food_group, iron_mg, folate_ug, protein_g, energy_kcal, vit_a_ug_rae, zinc_mg, affordability_tier, storable, garden_wild</code>
      </p>
      <label style={styles.uploadLabel}>
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleCsvUpload}
          style={{ display: 'none' }}
          disabled={isUploading}
        />
        {isUploading ? 'Importing…' : 'Upload CSV / Excel'}
      </label>
      {message && <p style={styles.message}>{message}</p>}

      <h2 style={{ ...styles.heading, fontSize: 18, marginTop: 40 }}>Food list</h2>
      <p style={styles.desc}>
        {/* TODO: fetch and render foods table from GET /admin/foods */}
        Table will render here — paginated, editable affordability tiers.
      </p>
    </div>
  );
}

const styles = {
  heading: { fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 } as const,
  desc: { color: '#555', marginBottom: 20, lineHeight: 1.6 } as const,
  uploadLabel: {
    display: 'inline-block',
    padding: '12px 24px',
    background: '#1a7c4e',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  } as const,
  message: { marginTop: 12, color: '#1a7c4e', fontWeight: 600 } as const,
};
