/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Moon, Sun, Monitor, Trash2, Database, AlertCircle } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  onClearAllData: () => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  theme, 
  setTheme, 
  onClearAllData 
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Preferences & Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          
          {/* Appearance */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Appearance</h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === "light"
                    ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === "dark"
                    ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  theme === "system"
                    ? "bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400 font-bold border border-slate-200/50 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Monitor className="w-4 h-4" />
                System
              </button>
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data Management</h3>
            
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex gap-3 text-rose-800 dark:text-rose-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold">Clear Application Data</h4>
                  <p className="text-xs mt-1 text-rose-600 dark:text-rose-300">
                    This will permanently delete all your Notes, PDF metadata, and reset the cache. This cannot be undone.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (window.confirm("WARNING: Are you absolutely sure you want to delete all notes and documents? This is permanent.")) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 mt-1 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-200 dark:border-rose-500/30 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Data
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
