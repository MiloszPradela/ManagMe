import type { User } from './User';
import type { Project } from './Project';
import type { Milestone } from './Milestone'; 

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: 'do zrobienia' | 'w trakcie' | 'zakończone';
    priority: 'niski' | 'średni' | 'wysoki';
    deadline?: string | null;
    project: Project | string;
    assignedTo?: User | string;
    milestones?: Milestone[]; 
    createdAt?: string;
    updatedAt?: string;
}
