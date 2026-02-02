import { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  pushSubscription?: PushSubscriptionJSON | null;
  createdAt: Timestamp;
};

export type CustomerTemperature = 'hot' | 'warm' | 'cold';

export type Customer = {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  temperature: CustomerTemperature;
  lastContactDate: Timestamp | null;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ProjectStatus = 'active' | 'pending' | 'completed';

export type Project = {
  id?: string;
  name: string;
  description: string;
  customerId: string | null;
  customerName: string | null;
  status: ProjectStatus;
  targetStartDate: Timestamp | null;
  targetEndDate: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type Task = {
  id?: string;
  projectId: string | null;
  projectName: string | null;
  customerId: string | null;
  customerName: string | null;
  sourceCommunicationId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  dueDate: Timestamp | null;
  weeklyPlanDate: Timestamp | null;
  completedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CommunicationType = 'phone' | 'email' | 'meeting' | 'other';

export type Communication = {
  id?: string;
  customerId: string;
  customerName: string;
  projectId: string | null;
  projectName: string | null;
  type: CommunicationType;
  date: Timestamp;
  summary: string;
  nextAction: string | null;
  nextActionDate: Timestamp | null;
  createdAt: Timestamp;
};

export type GoalType = 'weekly' | 'monthly' | 'yearly';
export type GoalActionType = 'task' | 'contact' | 'project_start' | 'project_end' | 'milestone';
export type GoalStatus = 'planned' | 'in_progress' | 'completed' | 'postponed';

export type Goal = {
  id?: string;
  title: string;
  description: string;
  type: GoalType;
  targetDate: Timestamp;
  weekStart: Timestamp | null;
  month: number | null;
  year: number;
  relatedProjectId: string | null;
  relatedCustomerId: string | null;
  goalType: GoalActionType;
  status: GoalStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
