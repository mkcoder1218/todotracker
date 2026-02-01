import React, { useState } from "react";
import { Category } from "../types";
import { User } from "firebase/auth";
import {
  LayoutDashboard,
  CheckSquare,
  Plus,
  LogOut,
  X,
  CheckCircle,
} from "lucide-react";

interface SidebarProps {
  categories: Category[];
  onAddCategory: (name: string, color: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  user: User;
  onLogout: () => void;
  currentView: "tasks" | "statistics" | "completed";
  setCurrentView: (view: "tasks" | "statistics" | "completed") => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  onAddCategory,
  selectedCategoryId,
  setSelectedCategoryId,
  user,
  onLogout,
  currentView,
  setCurrentView,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6366f1");

  const handleAdd = () => {
    if (newCatName.trim()) {
      onAddCategory(newCatName, newCatColor);
      setNewCatName("");
      setShowAddCat(false);
    }
  };

  const colors = [
    "#6366f1",
    "#f43f5e",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#475569",
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static shadow-xl md:shadow-none
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              ZenTask AI
            </h2>
          </div>
          <button
            onClick={onMobileClose}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-8">
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
              Menu
            </p>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setCurrentView("tasks");
                  onMobileClose?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  currentView === "tasks"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CheckSquare className="h-5 w-5" />
                My Tasks
              </button>
              <button
                onClick={() => {
                  setCurrentView("completed");
                  onMobileClose?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  currentView === "completed"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CheckCircle className="h-5 w-5" />
                Completed
              </button>
              <button
                onClick={() => {
                  setCurrentView("statistics");
                  onMobileClose?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  currentView === "statistics"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                Statistics
              </button>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Categories
              </p>
              <button
                onClick={() => setShowAddCat(!showAddCat)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {showAddCat && (
              <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                <input
                  type="text"
                  placeholder="Category name..."
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  autoFocus
                />
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      className={`w-5 h-5 rounded-full ring-2 ring-offset-1 transition-all ${newCatColor === c ? "ring-slate-400" : "ring-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-medium shadow-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddCat(false)}
                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedCategoryId("all");
                  if (currentView !== "tasks") setCurrentView("tasks");
                  onMobileClose?.();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  selectedCategoryId === "all" && currentView === "tasks"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  All Categories
                </span>
              </button>

              {categories.map((cat) => (
                <div key={cat.id} className="group relative">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      if (currentView !== "tasks") setCurrentView("tasks");
                      onMobileClose?.();
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                      selectedCategoryId === cat.id && currentView === "tasks"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </button>
                  {/* Delete Button (Only visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Delete category "${cat.name}"? This will not delete tasks in it.`,
                        )
                      ) {
                        // Call the delete handler passed from App (we need to add this prop)
                        // For now, we'll dispatch a custom event or need to update the interface
                        const event = new CustomEvent("delete-category", {
                          detail: cat.id,
                        });
                        window.dispatchEvent(event);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Delete Category"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 mb-2">
            <img
              src={user.photoURL || "https://picsum.photos/40/40"}
              className="w-10 h-10 rounded-full border border-white shadow-sm"
              alt="User"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
