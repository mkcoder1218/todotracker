
import React, { useState } from 'react';
import { Category } from '../types';
import { User } from 'firebase/auth';

interface SidebarProps {
  categories: Category[];
  onAddCategory: (name: string, color: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, 
  onAddCategory, 
  selectedCategoryId, 
  setSelectedCategoryId, 
  user,
  onLogout 
}) => {
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');

  const handleAdd = () => {
    if (newCatName.trim()) {
      onAddCategory(newCatName, newCatColor);
      setNewCatName('');
      setShowAddCat(false);
    }
  };

  const colors = [
    '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#475569'
  ];

  return (
    <aside className="w-72 flex flex-col bg-slate-50 p-6 h-full border-r border-slate-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">ZenTask AI</h2>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto">
        <section>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 ml-2">Quick Access</p>
          <button 
            onClick={() => setSelectedCategoryId('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              selectedCategoryId === 'all' 
                ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            All Tasks
          </button>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4 ml-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Categories</p>
            <button 
              onClick={() => setShowAddCat(!showAddCat)}
              className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-400 hover:text-indigo-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {showAddCat && (
            <div className="mb-4 p-3 bg-white rounded-xl shadow-sm border border-slate-100 space-y-3">
              <input 
                type="text" 
                placeholder="Category name..."
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button 
                    key={c}
                    onClick={() => setNewCatColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${newCatColor === c ? 'border-slate-800' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleAdd}
                  className="flex-1 bg-indigo-600 text-white text-xs py-2 rounded-lg font-medium"
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  selectedCategoryId === cat.id 
                    ? 'bg-white shadow-sm ring-1 ring-slate-100 text-slate-900 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <img src={user.photoURL || 'https://picsum.photos/40/40'} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-sm font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
