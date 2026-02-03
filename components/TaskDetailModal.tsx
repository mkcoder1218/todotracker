import React, { useState, useEffect } from "react";
import { Task, Category } from "../types";
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Link as LinkIcon,
  Edit,
  Trash2,
  Share2,
} from "lucide-react";
import { clsx } from "clsx";
import {
  createTaskEvent,
  signInToGoogleCalendar,
} from "../services/calendarService";
import { updateDoc, doc, db } from "../services/firebase";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  category?: Category;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  linkedTask?: Task; // If we want to show dependency name
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  category,
  onEdit,
  onDelete,
  linkedTask,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  // Local state for optimistic UI updates
  const [localSubtasks, setLocalSubtasks] = useState(task?.subtasks || []);

  // Sync local state when task prop changes (from Firestore)
  useEffect(() => {
    if (task?.subtasks) {
      setLocalSubtasks(task.subtasks);
    }
  }, [task?.subtasks]);

  if (!task) return null;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  // Calculate deadline
  let deadline = null;
  if (dueDate) {
    const d = new Date(dueDate);
    d.setMinutes(d.getMinutes() + (task.estimatedMinutes || 30));
    deadline = d;
  }

  const handleAddToCalendar = async () => {
    try {
      setIsSyncing(true);
      const token = await signInToGoogleCalendar();
      const result = await createTaskEvent(task, token);
      if (result && result.id) {
        await updateDoc(doc(db, "tasks", task.id), {
          googleEventId: result.id,
        });
      }
      alert("Task added to Google Calendar!");
    } catch (error: any) {
      alert(error.message || "Failed to sync");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTransfer = async () => {
    const targetUid = prompt("Enter the User ID to transfer this task to:");
    if (!targetUid) return;

    if (
      confirm(
        "Are you sure? You will lose access to this task once transferred.",
      )
    ) {
      try {
        await updateDoc(doc(db, "tasks", task.id), { userId: targetUid });
        onClose();
        alert("Task transferred successfully!");
      } catch (e) {
        console.error(e);
        alert("Failed to transfer task.");
      }
    }
  };

  return (
    <>
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />
      <div
        className={clsx(
          "fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col border-l border-slate-200 dark:border-slate-800",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10 transition-colors">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              Task Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {/* Title & Status */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1
                className={clsx(
                  "text-3xl font-bold text-slate-900 dark:text-white leading-tight",
                  task.completed &&
                    "line-through text-slate-400 dark:text-slate-600",
                )}
              >
                {task.title}
              </h1>
              <div
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                  task.completed
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
                )}
              >
                {task.completed ? "Completed" : "Pending"}
              </div>
            </div>
            {category && (
              <div
                className="mt-3 inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${category.color}15`,
                  color: category.color,
                  border: `1px solid ${category.color}30`,
                }}
              >
                {category.name}
              </div>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div className="prose prose-slate prose-sm max-w-none bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <p className="whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 flex flex-col gap-1">
              <span className="text-xs font-semibold text-indigo-400 dark:text-indigo-300 uppercase tracking-wider">
                Start Time
              </span>
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 font-medium">
                <Calendar className="h-4 w-4" />
                {dueDate
                  ? dueDate.toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                      hour12: true,
                    })
                  : "Not scheduled"}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 flex flex-col gap-1">
              <span className="text-xs font-semibold text-orange-400 dark:text-orange-300 uppercase tracking-wider">
                Deadline
              </span>
              <div className="flex items-center gap-2 text-orange-900 dark:text-orange-100 font-medium">
                <Clock className="h-4 w-4" />
                {deadline
                  ? deadline.toLocaleTimeString([], {
                      timeStyle: "short",
                      hour12: true,
                    })
                  : "-"}
                <span className="text-xs text-orange-600/70 dark:text-orange-400/70 font-normal">
                  ({task.estimatedMinutes}m est.)
                </span>
              </div>
            </div>
          </div>

          {/* Dependencies */}
          {(task.dependencyId || linkedTask) && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                  Linked Dependency
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {task.dependencyType === "sequential"
                    ? "Starts after:"
                    : "Runs with:"}{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {linkedTask?.title || "Unknown Task"}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Subtasks */}
          {localSubtasks && localSubtasks.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                Subtasks
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-xs font-normal">
                  {localSubtasks.filter((s) => s.completed).length}/
                  {localSubtasks.length}
                </span>
              </h3>
              <div className="space-y-2">
                {localSubtasks.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={async () => {
                      // Optimistically update local state immediately for instant feedback
                      const updatedSubtasks = localSubtasks.map((s) =>
                        s.id === sub.id ? { ...s, completed: !s.completed } : s,
                      );
                      setLocalSubtasks(updatedSubtasks);

                      // Update Firestore in the background
                      try {
                        await updateDoc(doc(db, "tasks", task.id), {
                          subtasks: updatedSubtasks,
                        });
                      } catch (error) {
                        console.error("Error updating subtask:", error);
                        // Revert on error
                        setLocalSubtasks(localSubtasks);
                      }
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                    )}
                    <span
                      className={clsx(
                        "text-sm",
                        sub.completed
                          ? "text-slate-400 dark:text-slate-600 line-through"
                          : "text-slate-700 dark:text-slate-300",
                      )}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4 transition-colors">
          <button
            onClick={() => onDelete(task.id)}
            title="Delete Task"
            className="p-3 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 font-bold rounded-2xl transition-all text-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleTransfer}
            title="Transfer to another user"
            className="p-3 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 font-bold rounded-2xl transition-all text-sm flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={handleAddToCalendar}
            disabled={isSyncing || !task.dueDate}
            className="px-6 py-3 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 font-bold rounded-2xl transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <span className="animate-spin">⌛</span>
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            <span className="hidden md:inline">Sync GCal</span>
          </button>

          <button
            onClick={() => onEdit(task)}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Edit className="h-4 w-4" />
            Edit Task
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskDetailModal;
