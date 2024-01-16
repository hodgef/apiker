export interface User {
    id: string;
    email: string;
    role?: string;
    password: string;
    createdAt: number;
    updatedAt: number;
}