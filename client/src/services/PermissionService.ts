export const ROLES = {
    ADMIN: 'admin',
    DEVOPS: 'devops',
    DEVELOPER: 'developer',
    READONLY: 'readonly', 
};

class PermissionService {
    private getRole(): string | null {
        return localStorage.getItem('userRole');
    }

    public isAdmin(): boolean {
        return this.getRole() === ROLES.ADMIN;
    }
    
    public canEdit(): boolean {
        const userRole = this.getRole();
        return [ROLES.ADMIN, ROLES.DEVOPS, ROLES.DEVELOPER].includes(userRole || '');
    }
}

export const permissionService = new PermissionService();
