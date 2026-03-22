import React, { useState } from 'react';

interface SidebarProps {
  activeDemo: string;
  onDemoChange: (demo: string) => void;
}

interface NavSection {
  label: string;
  items: { id: string; label: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'General',
    items: [
      { id: 'showcase', label: 'Showcase' },
      { id: 'vertical', label: 'Flow Chart' },
    ],
  },
  {
    label: 'Power Systems',
    items: [
      { id: 'hvdc', label: 'HVDC Super Grid' },
      { id: 'nuclear', label: 'Nuclear PWR' },
      { id: 'smr', label: 'SMR Reactor' },
      { id: 'power-supply', label: 'Power Supply' },
    ],
  },
  {
    label: 'Renewables',
    items: [
      { id: 'wind-farm', label: 'Wind Farm' },
      { id: 'solar-plant', label: 'Solar Plant' },
      { id: 'hydro-plant', label: 'Hydro Plant' },
      { id: 'hydrogen', label: 'Green Hydrogen' },
    ],
  },
  {
    label: 'Infrastructure',
    items: [
      { id: 'datacenter', label: 'Data Center' },
      { id: 'dc-facility', label: 'DC Facility' },
      { id: 'gas-pipeline', label: 'Gas Pipeline' },
    ],
  },
  {
    label: 'Project Management',
    items: [
      { id: 'project', label: 'Project View' },
    ],
  },
];

export function Sidebar({ activeDemo, onDemoChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(NAV_SECTIONS.map(s => s.label))
  );

  const toggleSection = (label: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  if (collapsed) {
    return (
      <div style={{
        width: 48,
        height: '100%',
        background: '#fff',
        borderRight: '1px solid #e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        flexShrink: 0,
      }}>
        <button
          onClick={() => setCollapsed(false)}
          style={{
            width: 32, height: 32, border: 'none', background: 'none',
            cursor: 'pointer', borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#1a1a1a',
          }}
          title="Expand sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9,18 15,12 9,6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: 220,
      height: '100%',
      background: '#fff',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 12px 8px', borderBottom: '1px solid #e0e0e0',
      }}>
        <span style={{
          fontSize: 14, fontWeight: 700, color: '#1a1a1a',
          letterSpacing: '0.5px',
        }}>
          NODESCAPE
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            width: 28, height: 28, border: 'none', background: 'none',
            cursor: 'pointer', borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: '#888',
          }}
          title="Collapse sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
        </button>
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <button
              onClick={() => toggleSection(section.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                width: '100%', padding: '6px 12px', border: 'none',
                background: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.8px',
                color: '#888',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" style={{
                transform: expandedSections.has(section.label) ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s ease',
                flexShrink: 0,
              }}>
                <path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {section.label}
            </button>
            {expandedSections.has(section.label) && (
              <div>
                {section.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onDemoChange(item.id)}
                    style={{
                      display: 'block', width: '100%', padding: '7px 12px 7px 28px',
                      border: 'none', textAlign: 'left', cursor: 'pointer',
                      fontSize: 12, fontWeight: activeDemo === item.id ? 600 : 400,
                      color: activeDemo === item.id ? '#1a1a1a' : '#888',
                      background: activeDemo === item.id ? '#f0f0f0' : 'transparent',
                      borderRadius: 0,
                      transition: 'background 0.1s ease, color 0.1s ease',
                      borderLeft: activeDemo === item.id ? '2px solid #3b82f6' : '2px solid transparent',
                    }}
                    onMouseOver={(e) => {
                      if (activeDemo !== item.id) {
                        (e.target as HTMLElement).style.background = '#f5f5f5';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeDemo !== item.id) {
                        (e.target as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
