import React from 'react';

/**
 * Clinical Rules Governance Console
 * - View WHO/GHS clinical thresholds with source citations
 * - Propose updates (value + justification)
 * - Requires second-admin sign-off before publishing
 *
 * IMPORTANT: All threshold changes are logged in audit_log.
 * No threshold can be published without a signed justification.
 */
export function ClinicalRulesPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Clinical Rules Governance</h1>
      <p style={{ color: '#555', marginBottom: 8 }}>
        These are the WHO/GHS thresholds that drive referral decisions and flag severity.
        Any update requires a justification and a second-admin sign-off.
      </p>
      <p
        style={{
          background: '#fff3cd',
          borderLeft: '4px solid #e6a817',
          padding: '10px 14px',
          borderRadius: 4,
          color: '#856404',
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        Changing thresholds directly affects clinical care decisions. All changes are logged and
        require approval before taking effect on field devices.
      </p>

      {/* TODO: fetch clinical_thresholds and render editable table */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, color: '#888' }}>
        <p>Threshold table renders here: metric | condition | severity | value | source | actions</p>
      </div>
    </div>
  );
}
