export interface User {
    id: string;
    username: string;
    email: string;
    role: 'student' | 'admin' | 'User';
    plan: 'Free' | 'Basic' | 'Premium';
    avatar?: string;
}
