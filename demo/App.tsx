import React from 'react';
import { FlowCanvas } from '../src';
import type { FlowDiagram } from '../src';

const sampleDiagram: FlowDiagram = {
  title: 'User Authentication Flow',
  layout: { direction: 'TB', routing: 'orthogonal', cornerRadius: 16 },
  nodes: [
    { id: 'start', type: 'start', label: 'User visits login page' },
    { id: 'input', label: 'Enter credentials', description: 'User provides email and password.' },
    {
      id: 'validate',
      type: 'decision',
      label: 'Valid credentials?',
      description: 'Check against stored hash.',
    },
    {
      id: 'grant',
      label: 'Grant access',
      description: 'Create session and redirect to dashboard.',
      sections: [
        { heading: 'Session', content: 'JWT token with 24h expiry.' },
        { heading: 'Redirect', content: 'Send to /dashboard.' },
      ],
    },
    { id: 'deny', label: 'Show error', description: 'Display invalid credentials message.' },
    { id: 'end-success', type: 'end', label: 'Dashboard' },
    { id: 'end-fail', type: 'end', label: 'Login page (retry)' },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'input' },
    { id: 'e2', source: 'input', target: 'validate' },
    { id: 'e3', source: 'validate', target: 'grant', label: 'Yes', type: 'success' },
    { id: 'e4', source: 'validate', target: 'deny', label: 'No', type: 'failure' },
    { id: 'e5', source: 'grant', target: 'end-success' },
    { id: 'e6', source: 'deny', target: 'end-fail' },
  ],
};

export function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <FlowCanvas diagram={sampleDiagram} mode="edit" onDiagramChange={console.log} background="isometric" />
    </div>
  );
}
