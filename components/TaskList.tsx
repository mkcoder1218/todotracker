import React from "react";
import { Task, Category } from "../types";
import {
  Clock,
  Calendar,
  CheckSquare,
  MoreVertical,
  Trash2,
  Edit2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface TaskListProps {
  tasks: Task[];
  categories: Category[];
  onToggleTask: (id: string, completed: boolean) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDragEnd?: (result: DropResult) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  categories,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onDragEnd,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-slate-300 dark:text-slate-600"
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
        <p className="font-medium text-lg">No tasks found.</p>
        <p className="text-sm">Time to relax or create a new one!</p>
      </div>
    );
  }

  const content = (
    <Droppable droppableId="tasks-grid" direction="horizontal">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="flex flex-wrap gap-6 pb-20"
        >
          {tasks.map((task, index) => {
            const cat = categories.find((c) => c.id === task.categoryId);
            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            const isOverdue =
              dueDate && dueDate < new Date() && !task.completed;
            const subtasksTotal = task.subtasks?.length || 0;
            const subtasksCompleted =
              task.subtasks?.filter((s) => s.completed).length || 0;
            const progress =
              subtasksTotal > 0 ? (subtasksCompleted / subtasksTotal) * 100 : 0;

            return (
              <Draggable
                key={task.id}
                draggableId={task.id}
                index={index}
                isDragDisabled={!onDragEnd}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                      group relative flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden
                      ${task.completed ? "opacity-60 dark:opacity-50 grayscale-[0.5]" : ""}
                      ${snapshot.isDragging ? "shadow-2xl ring-2 ring-indigo-500 rotate-2 z-50 scale-105" : "hover:-translate-y-1"}
                      w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] xl:w-[calc(25%-1.125rem)]
                    `}
                    style={{ ...provided.draggableProps.style }}
                  >
                    {/* Status Strip */}
                    <div
                      className={`absolute top-0 left-0 w-1.5 h-full transition-colors ${task.completed ? "bg-indigo-500" : isOverdue ? "bg-red-500" : "bg-indigo-500"}`}
                    />

                    <div className="p-5 flex-1 flex flex-col gap-3">
                      {/* Header: Category, DragHandle & Actions */}
                      <div className="flex justify-between items-start">
                        {cat ? (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
                            style={{
                              backgroundColor: `${cat.color}15`,
                              color: cat.color,
                              borderColor: `${cat.color}30`,
                            }}
                          >
                            {cat.name}
                          </span>
                        ) : (
                          <div className="h-6" />
                        )}

                        <div className="flex items-center gap-1">
                          {/* Drag Handle visible on hover or always if mobile */}
                          {onDragEnd && (
                            <div
                              {...provided.dragHandleProps}
                              className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                          )}

                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div
                        className="cursor-pointer"
                        onClick={() => onEditTask(task)}
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTask(task.id, !task.completed);
                            }}
                            className={`mt-0.5 min-w-[1.25rem] h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              task.completed
                                ? "bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500"
                                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400"
                            }`}
                          >
                            {task.completed && (
                              <CheckSquare
                                className="w-3.5 h-3.5 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </button>
                          <h3
                            className={`font-bold text-slate-800 dark:text-slate-100 leading-tight ${task.completed ? "line-through text-slate-400 dark:text-slate-500" : ""}`}
                          >
                            {task.title}
                          </h3>
                        </div>

                        {task.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pl-8">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Progress Bar (if subtasks) */}
                      {subtasksTotal > 0 && (
                        <div className="mt-2 pl-8">
                          <div className="flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Information */}
                    <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        {dueDate && (
                          <div
                            className={`flex items-center gap-1.5 ${isOverdue ? "text-red-500 font-semibold" : ""}`}
                          >
                            {isOverdue ? (
                              <AlertCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Calendar className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {dueDate.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        {task.estimatedMinutes > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{task.estimatedMinutes}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            );
          })}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  if (onDragEnd) {
    return <DragDropContext onDragEnd={onDragEnd}>{content}</DragDropContext>;
  }

  return content;
};

export default TaskList;
