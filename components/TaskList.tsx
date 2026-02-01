import React from "react";
import { Task, Category } from "../types";

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  onToggleTask: (id: string, completed: boolean) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  categories,
  onToggleTask,
  onDeleteTask,
  onEditTask,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <p className="font-medium">
          No tasks found. Time to relax or create one!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const cat = categories.find((c) => c.id === task.categoryId);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && !task.completed;

        return (
          <div
            key={task.id}
            className={`group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md transition-all ${task.completed ? "opacity-60" : ""}`}
          >
            <button
              onClick={() => onToggleTask(task.id, !task.completed)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? "bg-indigo-600 border-indigo-600"
                  : "border-slate-300 hover:border-indigo-400"
              }`}
            >
              {task.completed && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0" onClick={() => onEditTask(task)}>
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold text-slate-800 truncate ${task.completed ? "line-through" : ""}`}
                >
                  {task.title}
                </h3>
                {cat && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                    }}
                  >
                    {cat.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                {dueDate && (
                  <div
                    className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {dueDate.toLocaleDateString()}{" "}
                    {dueDate.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                )}
                {task.estimatedMinutes > 0 && (
                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {task.estimatedMinutes}m est.
                  </div>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                    <span className="font-medium text-slate-700">
                      {task.subtasks.filter((s) => s.completed).length}/
                      {task.subtasks.length}
                    </span>
                    <span>subtasks</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEditTask(task)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
