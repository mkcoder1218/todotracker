import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  auth,
  db,
  loginWithGoogle,
  logout,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  isFirebaseConfigured,
} from "./services/firebase";
import { Category, Task } from "./types";
import Sidebar from "./components/Sidebar";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import Login from "./components/Login";
import { AppSkeleton } from "./components/AppSkeleton";
import { Menu } from "lucide-react";
import Statistics from "./components/Statistics";

// ... (existing imports)

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if initial Firestore data has loaded
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [currentView, setCurrentView] = useState<"tasks" | "statistics">(
    "tasks",
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser: User | null) => {
      setUser(currentUser);
      setLoading(false);
      // If no user, we are 'loaded' (show login)
      // If user exists, we wait for dataLoaded
      if (!currentUser) setDataLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const tasksRef = collection(db, "tasks");
    const tasksQuery = query(tasksRef, where("userId", "==", user.uid));

    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot: any) => {
        const taskData = snapshot.docs.map(
          (doc: any) => ({ id: doc.id, ...doc.data() }) as Task,
        );
        taskData.sort(
          (a: Task, b: Task) => (b.createdAt || 0) - (a.createdAt || 0),
        );
        setTasks(taskData);
        setDataLoaded(true); // Data has arrived
      },
      (error: any) => {
        console.error("Error fetching tasks:", error);
        setDataLoaded(true); // Even on error, stop loading
      },
    );

    const categoriesRef = collection(db, "categories");
    const categoriesQuery = query(
      categoriesRef,
      where("userId", "==", user.uid),
    );

    const unsubCats = onSnapshot(categoriesQuery, (snapshot: any) => {
      const catData = snapshot.docs.map(
        (doc: any) => ({ id: doc.id, ...doc.data() }) as Category,
      );
      setCategories(catData);
    });

    return () => {
      unsubTasks();
      unsubCats();
    };
  }, [user]);

  const handleAddTask = async (taskData: Partial<Task>) => {
    if (!user) return;
    try {
      console.log("Attempting to add task:", taskData);
      await addDoc(collection(db, "tasks"), {
        ...taskData,
        userId: user.uid,
        completed: false,
        reminderSent: false,
        createdAt: Date.now(),
        actualMinutes: 0,
      });
      console.log("Task added successfully");
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
      alert(
        "Failed to add task. Please check your internet connection or try again.",
      );
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), updates);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleAddCategory = async (name: string, color: string) => {
    if (!user) return;
    try {
      console.log("Attempting to add category:", name);
      await addDoc(collection(db, "categories"), {
        name,
        color,
        userId: user.uid,
      });
      console.log("Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      alert(
        "Failed to add category. Please check your internet connection or try again.",
      );
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, "categories", categoryId));
      if (selectedCategoryId === categoryId) setSelectedCategoryId("all");
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  useEffect(() => {
    const handleCategoryDeleteEvent = (e: any) => {
      handleDeleteCategory(e.detail);
    };
    window.addEventListener("delete-category", handleCategoryDeleteEvent);
    return () =>
      window.removeEventListener("delete-category", handleCategoryDeleteEvent);
  }, [user, selectedCategoryId]);

  const filteredTasks =
    selectedCategoryId === "all"
      ? tasks
      : tasks.filter((t) => t.categoryId === selectedCategoryId);

  // Show Skeleton if Auth is loading OR (User is logged in but Data hasn't arrived yet)
  if (loading || (user && !dataLoaded)) {
    return <AppSkeleton />;
  }

  if (!user) {
    return <Login onLogin={loginWithGoogle} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        categories={categories}
        onAddCategory={handleAddCategory}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        user={user}
        onLogout={logout}
        currentView={currentView}
        setCurrentView={setCurrentView}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white shadow-xl md:m-2 md:rounded-3xl overflow-hidden relative">
        {!isFirebaseConfigured && (
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm border border-amber-200">
              Demo Mode
            </span>
          </div>
        )}

        <header className="p-4 md:p-6 flex justify-between items-center border-b border-slate-100 bg-white z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">
                {currentView === "tasks" ? "My Workspace" : "Dashboard"}
              </h1>
              {currentView === "tasks" && (
                <p className="text-slate-500 text-xs md:text-sm hidden md:block">
                  {tasks.filter((t) => !t.completed).length} pending tasks for
                  today
                </p>
              )}
            </div>
          </div>

          {currentView === "tasks" && (
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 text-sm font-medium active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden md:inline">Add Task</span>
              <span className="md:hidden">Add</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-slate-50/50">
          {currentView === "tasks" ? (
            <TaskList
              tasks={filteredTasks}
              categories={categories}
              onToggleTask={(id, completed) =>
                handleUpdateTask(id, { completed })
              }
              onDeleteTask={handleDeleteTask}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          ) : (
            <Statistics tasks={tasks} categories={categories} />
          )}
        </div>
      </main>

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={
            editingTask
              ? (data) => handleUpdateTask(editingTask.id, data)
              : handleAddTask
          }
          categories={categories}
          initialData={editingTask}
          existingTasks={tasks}
        />
      )}
    </div>
  );
};

export default App;
