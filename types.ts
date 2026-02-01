
export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  completed: boolean;
  dueDate: string; // ISO string
  estimatedMinutes: number;
  actualMinutes: number;
  reminderSent: boolean;
  userId: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
