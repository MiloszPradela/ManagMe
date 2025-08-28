import type { User } from './User';

export interface Project {
    id?: string;
    _id: string;     
    name: string;
    description: string;
    status: 'w trakcie' | 'zakończony' | 'planowany';
    deadline: string | null;
    team: User[];
    createdAt?: string;
    updatedAt?: string;
}
