export interface User {
    id: string;
    username: string;
    email: string;
    role: 'student' | 'admin';
    avatar?: string;
}
