import React, { useState } from 'react';

/**
 * Voice Pack Audio Studio
 * - Upload .mp3/.aac audio clips tagged with a phrase key
 * - Preview playback in the browser
 * - Auto-packages into a compressed bundle for device download
 */
export function VoiceStudioPage() {
  const [phraseKey, setPhraseKey] = useState('');

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Voice Pack Studio</h1>
      <p style={{ color: '#555', marginBottom: 24 }}>
        Upload pre-recorded audio clips for each phrase key. Audio must be in AAC-HE or Opus
        format, 32 kbps mono (keep each file under 100 KB).
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Phrase key</label>
          <input
            value={phraseKey}
            onChange={(e) => setPhraseKey(e.target.value)}
            placeholder="e.g. food_name_fd000001-..."
            style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: 6, width: 280 }}
          />
        </div>
        <label
          style={{
            padding: '10px 20px',
            background: '#1a7c4e',
            color: '#fff',
            borderRadius: 6,
            cursor: phraseKey ? 'pointer' : 'not-allowed',
            opacity: phraseKey ? 1 : 0.5,
            fontWeight: 600,
          }}
        >
          <input
            type="file"
            accept=".mp3,.aac,.m4a,.ogg"
            style={{ display: 'none' }}
            disabled={!phraseKey}
            onChange={() => {
              // TODO: POST /admin/voice-packs/phrases { phraseKey, file }
            }}
          />
          Upload Audio
        </label>
      </div>

      {/* TODO: fetch and list uploaded phrase keys with preview players */}
      <div style={{ background: '#fff', borderRadius: 8, padding: 24, color: '#888' }}>
        <p>Uploaded phrases will appear here with ▶ preview buttons.</p>
      </div>
    </div>
  );
}
