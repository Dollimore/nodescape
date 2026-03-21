import React from 'react';

export interface SymbolProps {
  size?: number;
  color?: string;
}

// Resistor — zigzag pattern
export function Resistor({ size = 24, color = 'currentColor' }: SymbolProps) {
  const w = size;
  const h = size * 0.4;
  return (
    <svg width={w} height={h} viewBox="0 0 60 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 12 L8 12 L12 2 L20 22 L28 2 L36 22 L44 2 L48 12 L60 12" />
    </svg>
  );
}

// Capacitor — two parallel lines
export function Capacitor({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <line x1="12" y1="16" x2="12" y2="22" />
    </svg>
  );
}

// Inductor — coil/bumps
export function Inductor({ size = 24, color = 'currentColor' }: SymbolProps) {
  const w = size;
  const h = size * 0.5;
  return (
    <svg width={w} height={h} viewBox="0 0 60 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M0 20 L8 20 C8 20 8 4 16 4 C24 4 24 20 24 20 C24 20 24 4 32 4 C40 4 40 20 40 20 C40 20 40 4 48 4 C56 4 56 20 52 20 L60 20" />
    </svg>
  );
}

// Transformer — two inductors with lines between
export function Transformer({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      {/* Primary coil */}
      <path d="M4 8 C4 8 4 14 8 14 C12 14 12 8 12 8 C12 8 12 14 16 14 C20 14 20 8 20 8" />
      {/* Secondary coil */}
      <path d="M4 26 C4 26 4 32 8 32 C12 32 12 26 12 26 C12 26 12 32 16 32 C20 32 20 26 20 26" />
      {/* Core lines */}
      <line x1="2" y1="18" x2="22" y2="18" />
      <line x1="2" y1="22" x2="22" y2="22" />
      {/* Leads */}
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="20" y1="8" x2="24" y2="8" />
      <line x1="0" y1="26" x2="4" y2="26" />
      <line x1="20" y1="26" x2="24" y2="26" />
    </svg>
  );
}

// Ground — three horizontal lines decreasing in size
export function Ground({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="2" x2="12" y2="10" />
      <line x1="4" y1="10" x2="20" y2="10" />
      <line x1="7" y1="14" x2="17" y2="14" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  );
}

// VoltageSource — circle with + and -
export function VoltageSource({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
      <text x="12" y="9" textAnchor="middle" fontSize="8" fill={color} stroke="none" fontFamily="system-ui">+</text>
      <text x="12" y="19" textAnchor="middle" fontSize="8" fill={color} stroke="none" fontFamily="system-ui">-</text>
    </svg>
  );
}

// CurrentSource — circle with arrow
export function CurrentSource({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
      <line x1="12" y1="18" x2="12" y2="6" />
      <polyline points="9,10 12,6 15,10" fill="none" />
    </svg>
  );
}

// Switch — open/closed
export function Switch({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 40 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="12" x2="12" y2="12" />
      <circle cx="14" cy="12" r="2" fill={color} />
      <line x1="14" y1="12" x2="30" y2="4" />
      <circle cx="32" cy="12" r="2" fill={color} />
      <line x1="34" y1="12" x2="40" y2="12" />
    </svg>
  );
}

// Diode — triangle with line
export function Diode({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="10" x2="12" y2="10" />
      <polygon points="12,2 12,18 28,10" fill="none" stroke={color} />
      <line x1="28" y1="2" x2="28" y2="18" />
      <line x1="28" y1="10" x2="40" y2="10" />
    </svg>
  );
}

// Transistor NPN
export function TransistorNPN({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="16" x2="10" y2="16" />
      <line x1="10" y1="6" x2="10" y2="26" />
      <line x1="10" y1="10" x2="24" y2="4" />
      <line x1="10" y1="22" x2="24" y2="28" />
      {/* Arrow on emitter */}
      <polyline points="18,26 24,28 20,22" fill="none" />
      {/* Leads */}
      <line x1="24" y1="4" x2="24" y2="0" />
      <line x1="24" y1="28" x2="24" y2="32" />
    </svg>
  );
}

// Fuse
export function Fuse({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.4} viewBox="0 0 40 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="6" x2="8" y2="6" />
      <rect x="8" y="1" width="24" height="10" rx="2" />
      <line x1="32" y1="6" x2="40" y2="6" />
    </svg>
  );
}

// Motor — circle with M
export function Motor({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">M</text>
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
    </svg>
  );
}

// Generator — circle with G
export function Generator({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">G</text>
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
    </svg>
  );
}

// LED
export function LED({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="14" x2="8" y2="14" />
      <polygon points="8,6 8,22 22,14" fill="none" />
      <line x1="22" y1="6" x2="22" y2="22" />
      <line x1="22" y1="14" x2="32" y2="14" />
      {/* Light arrows */}
      <line x1="18" y1="4" x2="22" y2="0" />
      <polyline points="20,0 22,0 22,2" fill="none" strokeWidth="1.5" />
      <line x1="22" y1="4" x2="26" y2="0" />
      <polyline points="24,0 26,0 26,2" fill="none" strokeWidth="1.5" />
    </svg>
  );
}

// Op-Amp — triangle
export function OpAmp({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="4,2 4,30 28,16" fill="none" />
      <text x="10" y="12" fontSize="8" fill={color} stroke="none" fontFamily="system-ui">+</text>
      <text x="10" y="24" fontSize="8" fill={color} stroke="none" fontFamily="system-ui">-</text>
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="0" y1="24" x2="4" y2="24" />
      <line x1="28" y1="16" x2="32" y2="16" />
    </svg>
  );
}

// Battery
export function Battery({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 28" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="0" x2="12" y2="6" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <line x1="8" y1="18" x2="16" y2="18" />
      <line x1="12" y1="18" x2="12" y2="24" />
    </svg>
  );
}

// Speaker
export function Speaker({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="6" height="8" />
      <polygon points="8,8 16,4 16,20 8,16" fill="none" />
      <line x1="0" y1="12" x2="2" y2="12" />
    </svg>
  );
}

// Antenna
export function Antenna({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="24" x2="12" y2="12" />
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="20" y1="4" x2="12" y2="12" />
    </svg>
  );
}

// Crystal Oscillator
export function Crystal({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <line x1="12" y1="0" x2="12" y2="4" />
      <line x1="6" y1="4" x2="18" y2="4" />
      <rect x="8" y="6" width="8" height="12" />
      <line x1="6" y1="20" x2="18" y2="20" />
      <line x1="12" y1="20" x2="12" y2="24" />
    </svg>
  );
}

// Connector/Plug — circle with dot
export function Connector({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="0" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="24" />
    </svg>
  );
}

// Relay — coil with switch
export function Relay({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="2" width="16" height="20" rx="2" strokeDasharray="4 2" />
      {/* Coil */}
      <path d="M8 6 C8 6 8 10 10 10 C12 10 12 6 12 6 C12 6 12 10 14 10 C16 10 16 6 16 6" />
      {/* Switch */}
      <circle cx="10" cy="18" r="1.5" fill={color} />
      <line x1="10" y1="18" x2="18" y2="14" />
      <circle cx="18" cy="18" r="1.5" fill={color} />
    </svg>
  );
}

// Voltmeter — circle with V
export function Voltmeter({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">V</text>
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
    </svg>
  );
}

// Ammeter — circle with A
export function Ammeter({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">A</text>
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
    </svg>
  );
}

// Wattmeter — circle with W
export function Wattmeter({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">W</text>
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
    </svg>
  );
}

// Frequency meter — circle with Hz
export function FrequencyMeter({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <text x="12" y="15" textAnchor="middle" fontSize="8" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">Hz</text>
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="24" x2="12" y2="22" />
    </svg>
  );
}

// Current Transformer (CT) — two circles
export function CurrentTransformer({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="10" cy="12" r="6" />
      <circle cx="14" cy="12" r="6" />
      <line x1="0" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}

// Potential Transformer (PT/VT) — two circles with dots
export function PotentialTransformer({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="10" cy="12" r="6" />
      <circle cx="14" cy="12" r="6" />
      <circle cx="8" cy="10" r="1" fill={color} />
      <circle cx="16" cy="10" r="1" fill={color} />
      <line x1="10" y1="2" x2="10" y2="6" />
      <line x1="14" y1="18" x2="14" y2="22" />
    </svg>
  );
}

// Protection Relay
export function ProtectionRelay({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <text x="12" y="15" textAnchor="middle" fontSize="7" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">87</text>
      <line x1="12" y1="0" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="24" />
    </svg>
  );
}

// Surge Arrester / Lightning Arrester
export function SurgeArrester({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="0" x2="12" y2="6" />
      <polyline points="6,6 12,14 18,6" />
      <line x1="6" y1="18" x2="18" y2="18" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="14" x2="12" y2="18" />
    </svg>
  );
}

// Circuit Breaker (standard IEC symbol)
export function CircuitBreaker({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="10" x2="12" y2="10" />
      <circle cx="14" cy="10" r="2" fill={color} />
      <line x1="14" y1="10" x2="26" y2="2" />
      <circle cx="28" cy="10" r="2" fill={color} />
      <line x1="30" y1="10" x2="40" y2="10" />
      <line x1="20" y1="6" x2="20" y2="0" />
    </svg>
  );
}

// Isolator/Disconnector
export function Disconnector({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 40 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="0" y1="12" x2="12" y2="12" />
      <circle cx="14" cy="12" r="2" />
      <line x1="14" y1="12" x2="28" y2="2" />
      <line x1="30" y1="12" x2="40" y2="12" />
    </svg>
  );
}

// Server Rack
export function ServerRack({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <circle cx="8" cy="5" r="1" fill={color} />
      <circle cx="8" cy="11" r="1" fill={color} />
      <circle cx="8" cy="18" r="1" fill={color} />
      <line x1="12" y1="5" x2="17" y2="5" />
      <line x1="12" y1="11" x2="17" y2="11" />
      <line x1="12" y1="18" x2="17" y2="18" />
    </svg>
  );
}

// Network Switch
export function NetworkSwitch({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="6" cy="12" r="1.5" fill={color} />
      <circle cx="10" cy="12" r="1.5" fill={color} />
      <circle cx="14" cy="12" r="1.5" fill={color} />
      <circle cx="18" cy="12" r="1.5" fill={color} />
      <line x1="6" y1="6" x2="6" y2="4" />
      <line x1="10" y1="6" x2="10" y2="4" />
      <line x1="14" y1="6" x2="14" y2="4" />
      <line x1="18" y1="6" x2="18" y2="4" />
    </svg>
  );
}

// Firewall
export function Firewall({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="7.5" x2="21" y2="7.5" strokeDasharray="2 2" />
      <line x1="3" y1="16.5" x2="21" y2="16.5" strokeDasharray="2 2" />
    </svg>
  );
}

// Router
export function Router({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4 L12 8 M12 16 L12 20 M4 12 L8 12 M16 12 L20 12" />
      <path d="M9 9 L15 15 M15 9 L9 15" strokeWidth="1" />
    </svg>
  );
}

// Load Balancer
export function LoadBalancer({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="8" width="20" height="8" rx="2" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <line x1="6" y1="16" x2="6" y2="20" />
      <line x1="12" y1="16" x2="12" y2="20" />
      <line x1="18" y1="16" x2="18" y2="20" />
      <path d="M8 12 L16 12" />
      <polygon points="14,10 16,12 14,14" fill={color} stroke="none" />
    </svg>
  );
}

// Chiller / Cooling Unit
export function Chiller({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M12 9 L12 15" />
      <path d="M9 10 L12 12 L15 10" />
      <path d="M9 14 L12 12 L15 14" />
      <line x1="7" y1="6" x2="7" y2="3" />
      <line x1="17" y1="6" x2="17" y2="3" />
    </svg>
  );
}

// ATS (Automatic Transfer Switch)
export function ATS({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">ATS</text>
      <line x1="8" y1="4" x2="8" y2="1" />
      <line x1="16" y1="4" x2="16" y2="1" />
      <line x1="12" y1="20" x2="12" y2="23" />
    </svg>
  );
}

// STS (Static Transfer Switch)
export function STS({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">STS</text>
      <line x1="8" y1="4" x2="8" y2="1" />
      <line x1="16" y1="4" x2="16" y2="1" />
      <line x1="12" y1="20" x2="12" y2="23" />
    </svg>
  );
}

// Fiber Patch Panel
export function PatchPanel({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="7" width="20" height="10" rx="2" />
      <circle cx="6" cy="12" r="1" fill={color} />
      <circle cx="9" cy="12" r="1" fill={color} />
      <circle cx="12" cy="12" r="1" fill={color} />
      <circle cx="15" cy="12" r="1" fill={color} />
      <circle cx="18" cy="12" r="1" fill={color} />
    </svg>
  );
}

// PDU (Power Distribution Unit) — rack-mount style
export function PDURack({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="6" y="2" width="12" height="20" rx="1" />
      <circle cx="12" cy="6" r="2" />
      <line x1="10" y1="10" x2="14" y2="10" />
      <line x1="10" y1="13" x2="14" y2="13" />
      <line x1="10" y1="16" x2="14" y2="16" />
      <line x1="10" y1="19" x2="14" y2="19" />
    </svg>
  );
}

// CRAH / CRAC (Computer Room Air Handler)
export function CRAH({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 7 C14 9, 14 11, 12 12 C10 13, 10 15, 12 17" />
    </svg>
  );
}

// UPS symbol (different from battery)
export function UPSUnit({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">UPS</text>
      <line x1="8" y1="4" x2="8" y2="1" />
      <line x1="16" y1="4" x2="16" y2="1" />
      <line x1="12" y1="20" x2="12" y2="23" />
    </svg>
  );
}

// Reactor Vessel
export function ReactorVessel({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <ellipse cx="12" cy="12" rx="7" ry="10" />
      <line x1="5" y1="8" x2="19" y2="8" />
      <line x1="5" y1="16" x2="19" y2="16" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="2" x2="12" y2="0" />
      <line x1="12" y1="22" x2="12" y2="24" />
    </svg>
  );
}

// Steam Generator
export function SteamGenerator({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 22 L7 8 Q7 2 12 2 Q17 2 17 8 L17 22" />
      <line x1="7" y1="22" x2="17" y2="22" />
      <line x1="7" y1="14" x2="17" y2="14" />
      <path d="M10 10 C10 10 11 8 12 10 C13 12 14 10 14 10" />
      <line x1="4" y1="18" x2="7" y2="18" />
      <line x1="17" y1="18" x2="20" y2="18" />
    </svg>
  );
}

// Turbine
export function Turbine({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="4,4 20,10 20,14 4,20" />
      <line x1="20" y1="12" x2="24" y2="12" />
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="0" y1="16" x2="4" y2="16" />
    </svg>
  );
}

// Condenser
export function Condenser({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 8 L8 16 M12 8 L12 16 M16 8 L16 16" strokeDasharray="2 2" />
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="0" y1="16" x2="4" y2="16" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}

// Cooling Tower
export function CoolingTower({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M6 22 L4 10 Q4 2 12 2 Q20 2 20 10 L18 22" />
      <line x1="6" y1="22" x2="18" y2="22" />
      <path d="M10 6 C10 4 14 4 14 6" strokeWidth="1" />
      <path d="M9 8 C9 6 15 6 15 8" strokeWidth="1" />
    </svg>
  );
}

// Control Rod
export function ControlRod({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="9" y="4" width="6" height="16" rx="1" />
      <line x1="12" y1="0" x2="12" y2="4" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="15" y2="16" />
      <polygon points="10,20 14,20 12,24" fill={color} stroke="none" />
    </svg>
  );
}

// Pump
export function Pump({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <polygon points="8,8 16,12 8,16" fill="none" />
      <line x1="0" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}

// Valve
export function Valve({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 32 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <line x1="0" y1="8" x2="8" y2="8" />
      <polygon points="8,2 16,8 8,14" fill="none" />
      <polygon points="24,2 16,8 24,14" fill="none" />
      <line x1="24" y1="8" x2="32" y2="8" />
      <line x1="16" y1="8" x2="16" y2="2" />
    </svg>
  );
}

// Containment Building
export function Containment({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 22 L4 10 Q4 2 12 2 Q20 2 20 10 L20 22" />
      <line x1="4" y1="22" x2="20" y2="22" />
      <circle cx="12" cy="14" r="4" strokeDasharray="3 2" />
      <circle cx="12" cy="14" r="1" fill={color} />
    </svg>
  );
}

// Radiation Symbol
export function Radiation({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" fill={color} />
      <path d="M12 9 L12 3 A9 9 0 0 1 19.8 7.5 L14.5 10.5" fill="none" />
      <path d="M14.5 13.5 L19.8 16.5 A9 9 0 0 1 12 21 L12 15" fill="none" />
      <path d="M9.5 10.5 L4.2 7.5 A9 9 0 0 1 12 3 L12 9" fill="none" />
    </svg>
  );
}

// Pressurizer
export function Pressurizer({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 20 L8 6 Q8 2 12 2 Q16 2 16 6 L16 20" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <path d="M10 8 L10 6 M12 9 L12 6 M14 8 L14 6" strokeWidth="1" />
      <line x1="4" y1="17" x2="8" y2="17" />
    </svg>
  );
}

// Heat Exchanger
export function HeatExchanger({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M6 8 L18 8 M6 12 L18 12 M6 16 L18 16" strokeDasharray="3 2" />
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="20" y1="8" x2="24" y2="8" />
      <line x1="0" y1="16" x2="4" y2="16" />
      <line x1="20" y1="16" x2="24" y2="16" />
    </svg>
  );
}

// --- Natural Gas ---

// Gas Turbine
export function GasTurbine({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <polygon points="4,6 20,12 4,18" />
      <circle cx="20" cy="12" r="3" />
      <line x1="0" y1="10" x2="4" y2="10" />
      <line x1="0" y1="14" x2="4" y2="14" />
    </svg>
  );
}

// Gas Pipeline
export function Pipeline({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.5} viewBox="0 0 40 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <line x1="0" y1="6" x2="40" y2="6" strokeWidth="3" />
      <line x1="0" y1="10" x2="40" y2="10" strokeWidth="3" />
      <line x1="10" y1="4" x2="10" y2="12" />
      <line x1="20" y1="4" x2="20" y2="12" />
      <line x1="30" y1="4" x2="30" y2="12" />
    </svg>
  );
}

// Compressor Station
export function Compressor({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M8 12 L16 8 L16 16 Z" fill="none" />
      <line x1="0" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}

// LNG Terminal
export function LNGTerminal({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="8" width="16" height="14" rx="2" />
      <path d="M4 8 Q12 0 20 8" />
      <text x="12" y="18" textAnchor="middle" fontSize="6" fill={color} stroke="none" fontWeight="bold" fontFamily="system-ui">LNG</text>
    </svg>
  );
}

// Gas Meter / Flow Meter
export function FlowMeter({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M8 16 L12 8 L16 16" fill="none" />
      <line x1="0" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}

// --- Renewables ---

// Wind Turbine
export function WindTurbine({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="12" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
      <circle cx="12" cy="12" r="2" fill={color} />
      <line x1="12" y1="10" x2="12" y2="2" />
      <line x1="12" y1="12" x2="5" y2="18" />
      <line x1="12" y1="12" x2="19" y2="18" />
    </svg>
  );
}

// Solar Panel
export function SolarPanel({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="3" y1="14" x2="21" y2="14" />
      <line x1="9" y1="6" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="18" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

// Inverter (solar/wind)
export function Inverter({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 12 C8 9 11 9 11 12" />
      <path d="M13 12 L16 9 M13 12 L16 15" strokeWidth="1" />
      <line x1="0" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}

// --- Hydro ---

// Hydro Dam
export function HydroDam({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 20 L6 4 L18 4 L22 20" />
      <line x1="2" y1="20" x2="22" y2="20" />
      <path d="M8 14 C8 12 10 12 10 14 C10 16 12 16 12 14 C12 12 14 12 14 14 C14 16 16 16 16 14" strokeWidth="1" />
      <line x1="12" y1="20" x2="12" y2="24" />
    </svg>
  );
}

// Water Turbine (Francis/Pelton)
export function WaterTurbine({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4 C14 8 14 8 12 9" />
      <path d="M20 12 C16 14 16 14 15 12" />
      <path d="M12 20 C10 16 10 16 12 15" />
      <path d="M4 12 C8 10 8 10 9 12" />
      <line x1="0" y1="8" x2="4" y2="8" />
      <line x1="20" y1="16" x2="24" y2="16" />
    </svg>
  );
}

// Penstock
export function Penstock({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 20" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M0 4 L16 4 Q20 4 20 8 L20 12 Q20 16 24 16 L40 16" />
      <path d="M0 8 L12 8 Q16 8 16 12 L16 12 Q16 16 20 16 L24 16" strokeWidth="1" strokeDasharray="3 2" />
    </svg>
  );
}

// Reservoir
export function Reservoir({ size = 24, color = 'currentColor' }: SymbolProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M4 8 Q12 4 20 8" />
      <path d="M4 8 L4 18 Q12 22 20 18 L20 8" />
      <path d="M6 12 C6 11 8 11 8 12 C8 13 10 13 10 12 C10 11 12 11 12 12" strokeWidth="1" />
    </svg>
  );
}

// Export a map of all symbols for easy lookup by name
export const electricalSymbols: Record<string, React.ComponentType<SymbolProps>> = {
  resistor: Resistor,
  capacitor: Capacitor,
  inductor: Inductor,
  transformer: Transformer,
  ground: Ground,
  'voltage-source': VoltageSource,
  'current-source': CurrentSource,
  switch: Switch,
  diode: Diode,
  'transistor-npn': TransistorNPN,
  fuse: Fuse,
  motor: Motor,
  generator: Generator,
  led: LED,
  'op-amp': OpAmp,
  battery: Battery,
  speaker: Speaker,
  antenna: Antenna,
  crystal: Crystal,
  connector: Connector,
  relay: Relay,
  voltmeter: Voltmeter,
  ammeter: Ammeter,
  wattmeter: Wattmeter,
  'frequency-meter': FrequencyMeter,
  'current-transformer': CurrentTransformer,
  'potential-transformer': PotentialTransformer,
  'protection-relay': ProtectionRelay,
  'surge-arrester': SurgeArrester,
  'circuit-breaker': CircuitBreaker,
  disconnector: Disconnector,
  'server-rack': ServerRack,
  'network-switch': NetworkSwitch,
  firewall: Firewall,
  router: Router,
  'load-balancer': LoadBalancer,
  chiller: Chiller,
  ats: ATS,
  sts: STS,
  'patch-panel': PatchPanel,
  'pdu-rack': PDURack,
  crah: CRAH,
  'ups-unit': UPSUnit,
  'reactor-vessel': ReactorVessel,
  'steam-generator': SteamGenerator,
  turbine: Turbine,
  condenser: Condenser,
  'cooling-tower': CoolingTower,
  'control-rod': ControlRod,
  pump: Pump,
  valve: Valve,
  containment: Containment,
  radiation: Radiation,
  pressurizer: Pressurizer,
  'heat-exchanger': HeatExchanger,
  // Natural Gas
  'gas-turbine': GasTurbine,
  pipeline: Pipeline,
  compressor: Compressor,
  'lng-terminal': LNGTerminal,
  'flow-meter': FlowMeter,
  // Renewables
  'wind-turbine': WindTurbine,
  'solar-panel': SolarPanel,
  inverter: Inverter,
  // Hydro
  'hydro-dam': HydroDam,
  'water-turbine': WaterTurbine,
  penstock: Penstock,
  reservoir: Reservoir,
};
