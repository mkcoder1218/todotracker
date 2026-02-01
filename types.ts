export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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
  subtasks?: Subtask[];
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
