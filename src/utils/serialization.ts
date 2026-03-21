import type { FlowDiagram } from '../types';

/** Serialize a diagram to a JSON string */
export function serializeDiagram(diagram: FlowDiagram): string {
  return JSON.stringify(diagram, null, 2);
}

/** Deserialize a JSON string to a diagram */
export function deserializeDiagram(json: string): FlowDiagram {
  return JSON.parse(json) as FlowDiagram;
}

/** Save diagram to localStorage */
export function saveDiagramToStorage(key: string, diagram: FlowDiagram): void {
  localStorage.setItem(key, serializeDiagram(diagram));
}

/** Load diagram from localStorage */
export function loadDiagramFromStorage(key: string): FlowDiagram | null {
  const json = localStorage.getItem(key);
  if (!json) return null;
  try {
    return deserializeDiagram(json);
  } catch {
    return null;
  }
}
