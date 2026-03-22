export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'complete';
export type DependencyType = 'FS' | 'FF' | 'SS' | 'SF';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  progress: number;
  assignee?: string;
  priority?: TaskPriority;
  dependencies?: TaskDependency[];
  nodeId?: string;
  groupId?: string;
  isMilestone?: boolean;
  isGroup?: boolean;
  children?: string[];
  color?: string;
  baselineStart?: string;
  baselineEnd?: string;
}

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
  lag?: number;
}

export interface ProjectData {
  tasks: ProjectTask[];
  title?: string;
}

export type TimeScale = 'day' | 'week' | 'month' | 'quarter' | 'year';
