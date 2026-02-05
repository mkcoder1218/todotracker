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
  isFirebaseConfigured,
} from "./services/firebase";
import { Category, Task } from "./types";
import Sidebar from "./components/Sidebar";
import TaskList from "./components/TaskList";
import TaskModal from "./components/TaskModal";
import Login from "./components/Login";
import { AppSkeleton } from "./components/AppSkeleton";
import { Menu, Shuffle, Calendar, Share2, AlarmClock } from "lucide-react";
import { DropResult } from "@hello-pangea/dnd";
import Statistics from "./components/Statistics";
import TaskDetailModal from "./components/TaskDetailModal";
import {
  createTaskEvent,
  deleteTaskEvent,
  signInToGoogleCalendar,
} from "./services/calendarService";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if initial Firestore data has loaded
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [currentView, setCurrentView] = useState<
    "tasks" | "statistics" | "completed"
  >("tasks");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // New State for Sort/Shuffle
  const [sortBy, setSortBy] = useState<
    "default" | "dueDate" | "priority" | "alpha"
  >("default");

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
        // Initial default sort
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
      const newTaskRef = await addDoc(collection(db, "tasks"), {
        ...taskData,
        userId: user.uid,
        completed: false,
        reminderSent: false,
        createdAt: Date.now(),
        actualMinutes: 0,
      });

      // Auto-sync to Google Calendar if due date exists ("on create link")
      if (taskData.dueDate) {
        try {
          console.log("Auto-syncing to Google Calendar...");
          const token = await signInToGoogleCalendar();
          // We need to construct the full task object for the sync function
          // We use the ID from the new doc
          const newTaskObj: Task = {
            id: newTaskRef.id,
            ...taskData,
            userId: user.uid,
            completed: false,
            reminderSent: false,
            createdAt: Date.now(),
            actualMinutes: 0,
          } as Task;

          const eventResult = await createTaskEvent(newTaskObj, token);
          if (eventResult && eventResult.id) {
            await updateDoc(newTaskRef, { googleEventId: eventResult.id });
            console.log("Auto-synced successfully, Event ID:", eventResult.id);
          }
        } catch (syncError) {
          console.error("Auto-sync failed:", syncError);
          // We don't block the UI for this, just log it.
        }
      }

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
      // Check if we are marking as completed ("donot show on link")
      if (updates.completed === true) {
        const currentTask = tasks.find((t) => t.id === taskId);
        if (currentTask && currentTask.googleEventId) {
          try {
            console.log("Task completed, removing from Google Calendar...");
            // Attempt to delete
            const token = await signInToGoogleCalendar();
            await deleteTaskEvent(currentTask.googleEventId, token);

            // Remove the ID from our local/firestore record
            // casting updates to any to allow googleEventId assignment if not in Partial<Task>
            (updates as any).googleEventId = null;

            console.log("Removed from calendar successfully");
          } catch (delError) {
            console.error(
              "Failed to remove completed task from calendar",
              delError,
            );
          }
        }
      }

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

  // Independent Alarm System (Browser Notifications)
  useEffect(() => {
    if (!user || !tasks || tasks.length === 0) return;

    // Request permission once if not denied
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkReminders = setInterval(() => {
      const now = Date.now();
      tasks.forEach((task) => {
        if (!task.completed && !task.reminderSent && task.dueDate) {
          const dueTime = new Date(task.dueDate).getTime();
          // Trigger if due time is reached (or within the last minute to avoid missed ticks)
          // We check if it is NOW or slightly in the past (to catch up)
          if (dueTime <= now) {
            // Fire Notification
            if (Notification.permission === "granted") {
              new Notification(`Task Due: ${task.title}`, {
                body: "Your task is due now! (Independent Alarm)",
                icon: "/vite.svg", // Optional
              });
              // Play a simple beep if possible (or just rely on system notification sound)
              // const audio = new Audio('/alarm.mp3'); audio.play().catch(e => {});
            }

            // Update DB to prevent duplicate alarms
            updateDoc(doc(db, "tasks", task.id), { reminderSent: true });
          }
        }
      });
    }, 60000); // Check every minute or 30s

    return () => clearInterval(checkReminders);
  }, [user, tasks]);

  // ... existing code ...
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    // Filter tasks that are pending, have a due date, and haven't been synced yet
    const tasksToSync = tasks.filter(
      (t) => !t.completed && t.dueDate && !t.googleEventId,
    );

    if (tasksToSync.length === 0) {
      alert(
        "No new tasks to sync! (Only pending tasks with due dates are synced)",
      );
      return;
    }

    if (!confirm(`Sync ${tasksToSync.length} tasks to Google Calendar?`)) {
      return;
    }

    setIsSyncing(true);

    let accessToken: string;
    try {
      // Authenticate ONCE before the loop to avoid "popup blocked" errors
      accessToken = await signInToGoogleCalendar();
    } catch (authError) {
      console.error("Authentication failed or cancelled:", authError);
      alert("Sync cancelled: Google Calendar sign-in failed.");
      setIsSyncing(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      for (const task of tasksToSync) {
        try {
          const result = await createTaskEvent(task, accessToken);
          if (result && result.id) {
            await updateDoc(doc(db, "tasks", task.id), {
              googleEventId: result.id,
            });
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to sync task ${task.title}`, error);
          failCount++;
        }
      }
      alert(
        `Sync Complete!\nSuccessfully added: ${successCount}\nFailed: ${failCount}`,
      );
    } catch (error) {
      console.error("Global sync error", error);
      alert("An error occurred during sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkTransfer = async () => {
    // We transfer the tasks CURRENTLY VISIBLE in the list (filteredTasks)
    // This allows the user to filter by category/etc and then transfer just those.
    const tasksToTransfer = filteredTasks;

    if (tasksToTransfer.length === 0) {
      alert("No tasks available to transfer.");
      return;
    }

    const targetUid = prompt(
      `Enter User ID to transfer ${tasksToTransfer.length} tasks to:`,
    );
    if (!targetUid) return;

    if (
      !confirm(
        `Are you sure you want to transfer ${tasksToTransfer.length} tasks? You will lose access to them.`,
      )
    ) {
      return;
    }

    // Batch update
    try {
      await Promise.all(
        tasksToTransfer.map((t) =>
          updateDoc(doc(db, "tasks", t.id), { userId: targetUid }),
        ),
      );
      alert("Bulk transfer complete!");
    } catch (e) {
      console.error(e);
      alert("Failed to transfer some tasks.");
    }
  };

  const handleShuffle = () => {
    if (sortBy === "priority") {
      setSortBy("default");
    } else {
      setSortBy("priority");
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Create a copy of the current visible tasks
    const currentTasks = [...filteredTasks];
    const [reorderedItem] = currentTasks.splice(sourceIndex, 1);
    currentTasks.splice(destinationIndex, 0, reorderedItem);

    // Optimistically update the UI is tricky because 'tasks' is the source of truth
    // and filteredTasks is derived.
    // We will just update Firestore and let the snapshot listener update the UI.
    // To make it smooth, we could update local state key, but let's rely on FS for now since it's fast.

    // Calculate new orders.
    // Simple strategy: Re-index the entire filtered list with spacing
    // If we are viewing a subset (Category A), we re-index them 0, 1, 2...
    // which might overlap with Category B's tasks order 0, 1, 2.
    // To avoid collision, we should perhaps use a large timestamp or float,
    // but for a simple personal app, simple re-indexing of the *modified* items is okay?
    // Actually, if we use a global order field, reordering a subset changes their relative order.
    // Let's just update the `order` field for ALL visible tasks to match their new visual index.

    // Note: This overrides previous global orderings for these tasks, which is expected.
    // Using a large gap (e.g. index * 1000) allows inserting later without rewrite,
    // but a full rewrite of 50 items is cheap.

    const updates = currentTasks.map((task, index) => ({
      id: task.id,
      order: index,
    }));

    // Batch update to Firestore
    try {
      // We use Promise.all for parallel updates.
      // In a real app we'd use a WriteBatch.
      await Promise.all(
        updates.map((u) =>
          updateDoc(doc(db, "tasks", u.id), { order: u.order }),
        ),
      );
    } catch (error) {
      console.error("Failed to reorder tasks", error);
    }
  };

  const filteredTasks = tasks
    .filter((t) => {
      // 1. Filter by category
      if (selectedCategoryId !== "all" && t.categoryId !== selectedCategoryId) {
        return false;
      }
      // 2. Filter by view (completed vs pending)
      if (currentView === "tasks") {
        return !t.completed;
      }
      if (currentView === "completed") {
        return t.completed;
      }
      return true; // For statistics (though it uses raw tasks prop)
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return (
            (a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999) -
            (b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999)
          );
        case "alpha":
          return a.title.localeCompare(b.title);
        case "priority":
          // Smart Sort: Overdue first, then by due date, then by estimated time (quickest first)
          const now = Date.now();
          const aDue = a.dueDate
            ? new Date(a.dueDate).getTime()
            : 9999999999999;
          const bDue = b.dueDate
            ? new Date(b.dueDate).getTime()
            : 9999999999999;

          // If one is overdue and other isn't
          const aOverdue = aDue < now;
          const bOverdue = bDue < now;
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;

          // If multiple overdue, sort by date descending (most overdue)
          if (aOverdue && bOverdue) return aDue - bDue;

          // Otherwise sort by due date imminent
          if (aDue !== bDue) return aDue - bDue;

          // Tie break: shortest task first (Quick Win)
          return (a.estimatedMinutes || 0) - (b.estimatedMinutes || 0);
        default:
          // Default is 'order' asc.
          // If order is undefined, fallback to createdAt desc (newest first)
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          // If timestamps equal, fallback?
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

  // Show Skeleton if Auth is loading OR (User is logged in but Data hasn't arrived yet)
  if (loading || (user && !dataLoaded)) {
    return <AppSkeleton />;
  }

  if (!user) {
    return <Login onLogin={loginWithGoogle} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
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

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 shadow-xl md:m-2 md:rounded-3xl overflow-hidden relative border border-slate-200 dark:border-slate-800 transition-all duration-200">
        {!isFirebaseConfigured && (
          <div className="absolute top-4 right-4 z-10 hidden md:block">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm border border-amber-200 dark:border-amber-700/50">
              Demo Mode
            </span>
          </div>
        )}

        <header className="p-4 md:p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                {currentView === "tasks"
                  ? "My Workspace"
                  : currentView === "completed"
                    ? "Completed Tasks"
                    : "Dashboard"}
              </h1>
              {currentView !== "statistics" && (
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm hidden md:block">
                  {filteredTasks.length}{" "}
                  {currentView === "completed"
                    ? "completed tasks"
                    : "pending tasks"}
                </p>
              )}
            </div>
          </div>

          {currentView === "tasks" && (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <select
                  className="bg-transparent border-none text-xs font-semibold text-slate-600 dark:text-slate-300 focus:ring-0 cursor-pointer pl-2 pr-8"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="default">Manual</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Smart Priority</option>
                  <option value="alpha">A-Z</option>
                </select>
              </div>

              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                title="Sync Tasks to Device Alarms"
                className="p-2 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-800 text-rose-600 dark:text-rose-400 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <span className="animate-spin block">⌛</span>
                ) : (
                  <AlarmClock className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                title="Sync pending tasks to Google Calendar"
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <span className="animate-spin block">⌛</span>
                ) : (
                  <Calendar className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={handleBulkTransfer}
                title="Transfer visible tasks to another user"
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>

              <button
                onClick={handleShuffle}
                title="Smart Shuffle: Prioritize Overdue & Quick Wins"
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
              >
                <Shuffle className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all flex items-center gap-2 text-sm font-medium active:scale-95 ease-in-out"
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
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth bg-slate-50/50 dark:bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {currentView !== "statistics" ? (
            <TaskList
              tasks={filteredTasks}
              categories={categories}
              onToggleTask={(id, completed) =>
                handleUpdateTask(id, { completed })
              }
              onDeleteTask={handleDeleteTask}
              onEditTask={(task) => {
                setViewingTask(task);
              }}
              onDragEnd={sortBy === "default" ? handleDragEnd : undefined}
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

      <TaskDetailModal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
        category={categories.find((c) => c.id === viewingTask?.categoryId)}
        onEdit={(task) => {
          setViewingTask(null);
          setEditingTask(task);
          setIsTaskModalOpen(true);
        }}
        onDelete={(taskId) => {
          handleDeleteTask(taskId);
          setViewingTask(null);
        }}
        linkedTask={
          viewingTask?.dependencyId
            ? tasks.find((t) => t.id === viewingTask.dependencyId)
            : undefined
        }
      />
    </div>
  );
};

export default App;
