/**
 * NurtureLink logomark — the sprouting heart icon.
 * Extracted from design/NurtureLink mobile prototype/assets/logomark.svg
 * and design/NurtureLink mobile prototype/NurtureLink.dc.html (splash + login usage).
 *
 * Uses inline SVG via react-native-svg (bundled with Expo SDK ≥ 47).
 * Falls back to a styled View if SVG is unavailable.
 */
import React from 'react';
import { View } from 'react-native';

// Try to import react-native-svg; fail gracefully if unavailable
let Svg: any, Path: any;
try {
  const svg = require('react-native-svg');
  Svg = svg.default ?? svg.Svg;
  Path = svg.Path;
} catch {
  Svg = null;
  Path = null;
}

interface Props {
  /** Icon size in dp (width = height). Default: 54 */
  size?: number;
  /** When true the heart body renders in white (for dark backgrounds). Default: false */
  onDark?: boolean;
}

export function LogoMark({ size = 54, onDark = false }: Props) {
  const heartFill = onDark ? '#FDFDFD' : '#08283B';

  if (Svg && Path) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 25" fill="none">
        {/* Heart body */}
        <Path
          d="M12 23.2C12 23.2 3.4 17.9 3.4 12.2C3.4 9 5.7 7.2 8.2 7.2C9.9 7.2 11.3 8 12 9.3C12.7 8 14.1 7.2 15.8 7.2C18.3 7.2 20.6 9 20.6 12.2C20.6 17.9 12 23.2 12 23.2Z"
          fill={heartFill}
        />
        {/* Stem */}
        <Path
          d="M12 9.4V2.6"
          stroke="#FF5A00"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Left leaf */}
        <Path
          d="M12 8C8.9 8 7.4 5.7 8 2.9C10.1 3.2 11.6 4.9 12 8Z"
          fill="#FF7B33"
        />
        {/* Right leaf */}
        <Path
          d="M12 8C15.1 8 16.6 5.7 16 2.9C13.9 3.2 12.4 4.9 12 8Z"
          fill="#FF5A00"
        />
      </Svg>
    );
  }

  // Fallback: orange square placeholder
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        backgroundColor: '#FF5A00',
      }}
    />
  );
}
