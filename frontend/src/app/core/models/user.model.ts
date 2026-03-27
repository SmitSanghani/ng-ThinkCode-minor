export interface User {
    id: string;
    _id?: string;  // MongoDB sometimes returns _id directly
    username: string;
    email: string;
    role: 'student' | 'admin' | 'User';
    plan: 'Free' | 'Basic' | 'Premium';
    avatar?: string;
    paymentReturnUrl?: string;
}
