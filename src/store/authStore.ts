import { User } from '../types';

// ─── Auth Store ───
// Simple in-memory auth state with seed users.
// Will be replaced with real auth when backend is ready.

const SEED_USERS: User[] = [
    { id: 'u1', name: 'admin', password: 'admin123', isAdmin: true },
    { id: 'u2', name: 'user', password: 'user123', isAdmin: false },
];

let users: User[] = [...SEED_USERS];
let currentUser: User | null = null;

export function getUsers(): User[] {
    return users;
}

export function getCurrentUser(): User | null {
    return currentUser;
}

export function login(name: string, password: string): User | null {
    const found = users.find(
        (u) => u.name.toLowerCase() === name.toLowerCase() && u.password === password
    );
    if (found) {
        currentUser = found;
        return found;
    }
    return null;
}

export function logout(): void {
    currentUser = null;
}

export function registerUser(name: string, password: string, isAdmin: boolean = false): User {
    const newUser: User = {
        id: `u${Date.now()}`,
        name,
        password,
        isAdmin,
    };
    users.push(newUser);
    return newUser;
}
