import React from 'react';

interface SimpleMarkdownProps {
  text: string;
  className?: string;
}

/** Renders basic inline markdown: **bold**, *italic*, `code`, [links](url) */
export function SimpleMarkdown({ text, className }: SimpleMarkdownProps) {
  const parts = parseInlineMarkdown(text);
  return <div className={className}>{parts}</div>;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    let match = remaining.match(/^\*\*(.+?)\*\*/);
    if (match) {
      nodes.push(<strong key={key++}>{match[1]}</strong>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Italic: *text*
    match = remaining.match(/^\*(.+?)\*/);
    if (match) {
      nodes.push(<em key={key++}>{match[1]}</em>);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Inline code: `code`
    match = remaining.match(/^`(.+?)`/);
    if (match) {
      nodes.push(
        <code key={key++} style={{
          background: 'var(--fc-node-section-border, #f0f0f0)',
          padding: '1px 4px',
          borderRadius: '3px',
          fontSize: '0.9em',
          fontFamily: 'monospace',
        }}>
          {match[1]}
        </code>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Link: [text](url)
    match = remaining.match(/^\[(.+?)\]\((.+?)\)/);
    if (match) {
      nodes.push(
        <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'none' }}
          onMouseOver={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
          onMouseOut={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
        >
          {match[1]}
        </a>
      );
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // Plain text: consume up to the next special character
    match = remaining.match(/^[^*`\[]+/);
    if (match) {
      nodes.push(match[0]);
      remaining = remaining.slice(match[0].length);
      continue;
    }

    // If nothing matched, consume one character to prevent infinite loop
    nodes.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return nodes;
}
