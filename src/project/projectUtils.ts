import type { FlowDiagram } from '../types';
import type { ProjectData, TaskStatus } from './types';

const STATUS_COLORS: Record<TaskStatus, string> = {
  'backlog': '#94a3b8',
  'todo': '#64748b',
  'in-progress': '#3b82f6',
  'review': '#f59e0b',
  'complete': '#22c55e',
};

/** Apply task status colors to linked diagram nodes */
export function applyProjectStatus(diagram: FlowDiagram, project: ProjectData): FlowDiagram {
  const taskByNodeId = new Map<string, ProjectData['tasks'][0]>();
  for (const task of project.tasks) {
    if (task.nodeId) taskByNodeId.set(task.nodeId, task);
  }

  return {
    ...diagram,
    nodes: diagram.nodes.map(node => {
      const task = taskByNodeId.get(node.id);
      if (!task) return node;
      return {
        ...node,
        style: { ...node.style, color: STATUS_COLORS[task.status] },
        progress: task.progress,
      };
    }),
  };
}

/** Get project summary stats */
export function getProjectSummary(project: ProjectData) {
  const total = project.tasks.filter(t => !t.isGroup).length;
  const complete = project.tasks.filter(t => t.status === 'complete').length;
  const inProgress = project.tasks.filter(t => t.status === 'in-progress').length;
  const overdue = project.tasks.filter(t => {
    if (t.status === 'complete') return false;
    return new Date(t.endDate) < new Date();
  }).length;
  const avgProgress = total > 0 ? Math.round(project.tasks.reduce((s, t) => s + t.progress, 0) / total) : 0;

  return {
    total,
    complete,
    inProgress,
    overdue,
    avgProgress,
    percentComplete: total > 0 ? Math.round((complete / total) * 100) : 0,
  };
}
