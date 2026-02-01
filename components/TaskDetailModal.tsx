import React from "react";
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
} from "lucide-react";
import { clsx } from "clsx";

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
  if (!task) return null;

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  // Calculate deadline
  let deadline = null;
  if (dueDate) {
    const d = new Date(dueDate);
    d.setMinutes(d.getMinutes() + (task.estimatedMinutes || 30));
    deadline = d;
  }

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
          "fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-3">
              Task Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Title & Status */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1
                className={clsx(
                  "text-3xl font-bold text-slate-900 leading-tight",
                  task.completed && "line-through text-slate-400",
                )}
              >
                {task.title}
              </h1>
              <div
                className={clsx(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border",
                  task.completed
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-slate-100 text-slate-600 border-slate-200",
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
            <div className="prose prose-slate prose-sm max-w-none bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600">
              <p className="whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Meta Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-1">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                Start Time
              </span>
              <div className="flex items-center gap-2 text-indigo-900 font-medium">
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
            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 flex flex-col gap-1">
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wider">
                Deadline
              </span>
              <div className="flex items-center gap-2 text-orange-900 font-medium">
                <Clock className="h-4 w-4" />
                {deadline
                  ? deadline.toLocaleTimeString([], {
                      timeStyle: "short",
                      hour12: true,
                    })
                  : "-"}
                <span className="text-xs text-orange-600/70 font-normal">
                  ({task.estimatedMinutes}m est.)
                </span>
              </div>
            </div>
          </div>

          {/* Dependencies */}
          {(task.dependencyId || linkedTask) && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase">
                  Linked Dependency
                </p>
                <p className="text-sm font-semibold text-slate-700">
                  {task.dependencyType === "sequential"
                    ? "Starts after:"
                    : "Runs with:"}{" "}
                  <span className="text-indigo-600">
                    {linkedTask?.title || "Unknown Task"}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                Subtasks
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-normal">
                  {task.subtasks.filter((s) => s.completed).length}/
                  {task.subtasks.length}
                </span>
              </h3>
              <div className="space-y-2">
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300" />
                    )}
                    <span
                      className={clsx(
                        "text-sm",
                        sub.completed
                          ? "text-slate-400 line-through"
                          : "text-slate-700",
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
        <div className="p-6 border-t border-slate-100 bg-white flex gap-4">
          <button
            onClick={() => onDelete(task.id)}
            className="px-6 py-3 border border-red-100 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-2xl transition-all text-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            onClick={() => onEdit(task)}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm flex items-center justify-center gap-2"
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
