import React from 'react';
import { icons } from 'lucide-react';
import type { ComponentType } from 'react';
import { electricalSymbols } from '../symbols/electrical';

interface NodeIconProps {
  icon: string | ComponentType<{ size?: number; color?: string }>;
  size?: number;
  color?: string;
}

export function NodeIcon({ icon, size = 16, color = 'currentColor' }: NodeIconProps) {
  if (typeof icon !== 'string') {
    const CustomIcon = icon;
    return <CustomIcon size={size} color={color} />;
  }

  // Look up Lucide icon by name (PascalCase)
  const pascalName = icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const LucideIcon = (icons as Record<string, ComponentType<any>>)[pascalName];

  if (!LucideIcon) {
    // Try electrical symbols
    const ElectricalSymbol = electricalSymbols[icon];
    if (ElectricalSymbol) {
      return <ElectricalSymbol size={size} color={color} />;
    }
    return null;
  }

  return <LucideIcon size={size} color={color} />;
}
