export interface User {
    id?: string;     
    _id: string;     
    imie: string;
    nazwisko?: string;
    login: string;
    rola: 'admin' | 'devops' | 'developer' | 'readonly' | 'guest';
    language?: 'pl' | 'en';
    avatarUrl?: string; 
}
export type UserWithTaskCount = User & {
    taskCount: number;
};