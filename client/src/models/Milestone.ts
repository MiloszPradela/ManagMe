import type { User } from './User';
import type { Project } from './Project'; 

export type Priority = 'niski' | 'średni' | 'wysoki';
export type MilestoneStatus = 'todo' | 'doing' | 'done';

export interface Milestone {
    _id: string;
    name: string;
    description?: string;
    priority: Priority;
    story: string | Project;
    estimatedTime: number;
    status: MilestoneStatus;
    createdAt: string;
    startDate?: string;
    endDate?: string;
    assignedTo?: string | User;
}
