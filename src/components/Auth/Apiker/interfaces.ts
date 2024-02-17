export interface User {
    id: string;
    email: string;
    role?: string;
    password: string;
    verified: boolean;
    createdAt: number;
    updatedAt: number;
}