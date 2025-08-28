// client/src/services/ApiService.ts
import type { User, UserWithTaskCount } from '../models/User';
import type { Project } from '../models/Project';
import type { Task } from '../models/Task';
import type { Milestone } from '../models/Milestone';

const API_BASE_URL = 'http://localhost:3000/api';

type ProjectPayload = {
    name: string;
    description: string;
    status: 'w trakcie' | 'zakończony' | 'planowany';
    deadline: string | null;
    team: string[];
};

interface LoginResponse {
    token: string;
    user: { id: string; imie: string; rola: string; };
}

class ApiService {
    private getToken(): string | null {
        return localStorage.getItem('token');
    }

    private getAuthHeaders(): HeadersInit {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    private async handleResponse(response: Response) {
        if (!response.ok) {
            let errorMsg = 'Wystąpił błąd';
            try {
                const errorData = await response.json();
                errorMsg = errorData.msg || errorData.message || 'Błąd serwera';
            } catch {}
            throw new Error(errorMsg);
        }
        return response.status === 204 ? null : response.json();
    }

    private async request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: object | FormData): Promise<T> {
        const headers = this.getAuthHeaders();
        const config: RequestInit = { method, headers };

        if (body) {
            if (body instanceof FormData) {
                config.body = body;
            } else {
                (headers as Record<string, string>)['Content-Type'] = 'application/json';
                config.body = JSON.stringify(body);
            }
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        return this.handleResponse(response);
    }

    // --- Metody publiczne ---
    async login(login: string, haslo: string): Promise<LoginResponse> { return this.request('POST', '/auth/login', { login, password: haslo }); }
    async register(data: Record<string, string>): Promise<{ msg: string }> { return this.request('POST', '/auth/register', data); }
    async forgotPassword(login: string): Promise<{ msg: string }> { return this.request('POST', '/auth/password/forgot', { login }); }
    async resetPassword(token: string, password: string): Promise<{ msg: string }> { return this.request('POST', '/auth/password/reset', { token, password }); }

    // --- Metody użytkownika (ME) ---
    async getMe(): Promise<User> { return this.request('GET', '/auth/me'); }
    async saveMySettings(settings: { language: 'pl' | 'en' }): Promise<{ msg: string }> { return this.request('PUT', '/auth/me/settings', settings); }
    async updateMyProfile(data: { imie: string; nazwisko: string }): Promise<User> { return this.request('PUT', '/auth/me/profile', data); }
    async uploadAvatar(file: File): Promise<User> {
        const formData = new FormData();
        formData.append('avatar', file);
        return this.request('POST', '/auth/me/avatar', formData);
    }
    async deleteMe(): Promise<{ msg: string }> { return this.request('DELETE', '/auth/me'); }

    // --- Metody użytkowników (ogólne) ---
    async getUsers(): Promise<UserWithTaskCount[]> { return this.request('GET', '/users'); }
    async getUserById(id: string): Promise<User & { projects: Project[] }> { return this.request('GET', `/users/${id}`); }
    async updateUserRole(userId: string, rola: string): Promise<User> { return this.request('PUT', `/users/${userId}/role`, { rola }); }
    async deleteUser(userId: string): Promise<{ msg: string }> { return this.request('DELETE', `/users/${userId}`); }

    // --- Metody dla Projektów ---
    async getProjects(): Promise<Project[]> { return this.request('GET', '/projects'); }
    async getProjectById(projectId: string): Promise<Project> { return this.request('GET', `/projects/${projectId}`); }
    async addProject(data: ProjectPayload): Promise<Project> { return this.request('POST', '/projects', data); }
    async updateProject(projectData: Partial<ProjectPayload> & { id: string }): Promise<Project> { return this.request('PUT', `/projects/${projectData.id}`, projectData); }
    async deleteProject(projectId: string): Promise<void> { return this.request('DELETE', `/projects/${projectId}`); }

    // --- Metody dla Zadań ---
    async getTasks(projectId?: string): Promise<Task[]> {
        const endpoint = projectId ? `/tasks?projectId=${projectId}` : '/tasks';
        return this.request('GET', endpoint);
    }
    async getTaskById(taskId: string): Promise<Task> { return this.request('GET', `/tasks/${taskId}`); }
    async addTask(data: Partial<Task>): Promise<Task> { return this.request('POST', '/tasks', data); }
    async updateTask(taskData: Partial<Task> & { _id: string }): Promise<Task> { return this.request('PUT', `/tasks/${taskData._id}`, taskData); }
    async deleteTask(taskId: string): Promise<void> { return this.request('DELETE', `/tasks/${taskId}`); }
    
    // --- Metody dla Kamieni Milowych ---
    async getMilestones(): Promise<Milestone[]> { return this.request('GET', '/milestones'); }
    async getMilestone(id: string): Promise<Milestone> { return this.request('GET', `/milestones/${id}`); }
    async getMilestonesForTask(taskId: string): Promise<Milestone[]> { return this.request('GET', `/tasks/${taskId}/milestones`); }
    async createMilestone(data: Partial<Milestone>): Promise<Milestone> { return this.request('POST', '/milestones', data); }
    async createMilestoneForTask(data: Partial<Milestone> & { taskId: string }): Promise<Milestone> {
        const { taskId, ...milestoneData } = data;
        return this.request('POST', `/tasks/${taskId}/milestones`, milestoneData);
    }
    async updateMilestone(id: string, data: Partial<Milestone>): Promise<Milestone> { return this.request('PUT', `/milestones/${id}`, data); }
    async assignMilestone(id: string, userId: string): Promise<Milestone> { return this.updateMilestone(id, { assignedTo: userId, status: 'doing', startDate: new Date().toISOString() }); }
    async completeMilestone(id: string): Promise<Milestone> { return this.updateMilestone(id, { status: 'done', endDate: new Date().toISOString() }); }
    async deleteMilestone(id: string): Promise<void> { return this.request('DELETE', `/milestones/${id}`); }
    async unlinkMilestoneFromTask(taskId: string, milestoneId: string): Promise<void> { return this.request('DELETE', `/tasks/${taskId}/milestones/${milestoneId}`); }
}

export const api = new ApiService();
