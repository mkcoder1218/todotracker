import React, { useState, useEffect } from "react";
import { Task, Category, Subtask } from "../types";
import { getSmartTaskBreakdown } from "../services/geminiService";
import {
  Plus,
  X,
  ListTodo,
  Sparkles,
  Link as LinkIcon,
  Clock,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  categories: Category[];
  initialData?: Task | null;
  existingTasks?: Task[];
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
  existingTasks = [],
}) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || categories[0]?.id || "",
  );
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialData?.estimatedMinutes || 30,
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    initialData?.subtasks || [],
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // New state for dependencies
  const [linkedTaskId, setLinkedTaskId] = useState(
    initialData?.dependencyId || "",
  );
  const [linkType, setLinkType] = useState<"sequential" | "parallel">(
    initialData?.dependencyType || "sequential",
  );

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategoryId(initialData.categoryId);
      setDueDate(initialData.dueDate);
      setEstimatedMinutes(initialData.estimatedMinutes);
      setSubtasks(initialData.subtasks || []);
      setLinkedTaskId(initialData.dependencyId || "");
      setLinkType(initialData.dependencyType || "sequential");
    } else {
      // Reset form when opening new task
      if (isOpen) {
        setTitle("");
        setDescription("");
        setCategoryId(categories[0]?.id || "");
        setDueDate("");
        setEstimatedMinutes(30);
        setSubtasks([]);
        setLinkedTaskId("");
        setLinkType("sequential");
      }
    }
  }, [initialData, isOpen, categories]);

  // Auto-schedule logic
  useEffect(() => {
    if (!linkedTaskId || !existingTasks) return;

    const parent = existingTasks.find((t) => t.id === linkedTaskId);
    if (!parent || !parent.dueDate) return;

    const parentDate = new Date(parent.dueDate);
    if (isNaN(parentDate.getTime())) return;

    // Create a new date object to avoid mutating
    let newDate = new Date(parentDate.getTime());

    if (linkType === "sequential") {
      // Add parent's duration to its start time
      newDate.setMinutes(
        newDate.getMinutes() + (parent.estimatedMinutes || 30),
      );
    }
    // If parallel, it starts at the same time (newDate is already parentDate)

    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const pad = (n: number) => (n < 10 ? "0" + n : n);
    const localIso = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}`;

    setDueDate(localIso);
  }, [linkedTaskId, linkType, existingTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      categoryId,
      dueDate,
      estimatedMinutes,
      subtasks,
      dependencyId: linkedTaskId,
      dependencyType: linkType,
    });
  };

  const handleAddSubtask = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    e?.preventDefault(); // Prevent form submission

    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        { id: uuidv4(), title: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask("");
    }
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAiBreakdown = async () => {
    if (!title.trim()) return;
    setIsAiLoading(true);
    const result = await getSmartTaskBreakdown(title, description);
    if (result) {
      const breakdownSubtasks: Subtask[] = result.subtasks.map((s: any) => ({
        id: uuidv4(),
        title: `${s.title} (${s.estimatedMinutes}m)`,
        completed: false,
      }));

      setSubtasks((prev) => [...prev, ...breakdownSubtasks]);
      const totalEst = result.subtasks.reduce(
        (acc: number, s: any) => acc + s.estimatedMinutes,
        0,
      );
      setEstimatedMinutes(totalEst);
    }
    setIsAiLoading(false);
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
          "fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {initialData ? "Edit Task" : "New Task"}
              </h2>
              <p className="text-sm text-slate-500">
                {initialData
                  ? "Make changes to your task"
                  : "Create a new task for your workspace"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <form id="task-form" onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Title & Description
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all mb-4 text-lg font-medium"
                    placeholder="Task title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className="relative">
                    <textarea
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all h-32 resize-none"
                      placeholder="Add descriptions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAiBreakdown}
                      disabled={isAiLoading || !title}
                      className="absolute bottom-3 right-3 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                      {isAiLoading ? (
                        <Sparkles className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      {isAiLoading ? "Analyzing..." : "AI Breakdown"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Subtasks
                    </label>
                    <span className="text-xs text-slate-400 font-medium">
                      {subtasks.filter((s) => s.completed).length}/
                      {subtasks.length} completed
                    </span>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                        placeholder="Add a subtask..."
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={handleAddSubtask}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSubtask()}
                        className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    {subtasks.length > 0 ? (
                      <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {subtasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl text-sm group hover:shadow-sm transition-all"
                          >
                            <span className="truncate flex-1 mr-2 text-slate-700">
                              {task.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSubtask(task.id)}
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        No subtasks yet. Add one or rely on AI!
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="md:col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      Link to another task
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <select
                          className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                          value={linkedTaskId}
                          onChange={(e) => setLinkedTaskId(e.target.value)}
                        >
                          <option value="">No link (Independent)</option>
                          {existingTasks
                            .filter((t) => t.id !== initialData?.id)
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title} (
                                {t.dueDate
                                  ? new Date(t.dueDate).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "No date"}
                                )
                              </option>
                            ))}
                        </select>
                      </div>
                      {linkedTaskId && (
                        <div className="flex bg-white rounded-xl border border-indigo-200 p-1">
                          <button
                            type="button"
                            onClick={() => setLinkType("sequential")}
                            className={clsx(
                              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                              linkType === "sequential"
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-slate-500 hover:bg-slate-50",
                            )}
                          >
                            After (Sequential)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLinkType("parallel")}
                            className={clsx(
                              "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                              linkType === "parallel"
                                ? "bg-indigo-100 text-indigo-700"
                                : "text-slate-500 hover:bg-slate-50",
                            )}
                          >
                            With (Parallel)
                          </button>
                        </div>
                      )}
                    </div>
                    {linkedTaskId && (
                      <p className="text-xs text-indigo-600/80 mt-2 ml-1">
                        {linkType === "sequential"
                          ? "This task will start when the linked task ends."
                          : "This task will happen at the same time."}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      Due Date/Time
                      {linkedTaskId && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                          Auto-Set
                        </span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!!linkedTaskId}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Estimated Time (minutes)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    value={estimatedMinutes}
                    onChange={(e) =>
                      setEstimatedMinutes(Number(e.target.value))
                    }
                  />
                  <div className="mt-2 flex gap-2">
                    {[15, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEstimatedMinutes(m)}
                        className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200"
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="task-form"
                className="flex-1 px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-sm active:scale-[0.98]"
              >
                {initialData ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;
