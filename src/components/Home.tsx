import React, { useState } from "react";
import { Plus, Settings, FileText, ChevronRight, BookOpen, Trash2, Edit2, Play, Home as HomeIcon } from "lucide-react";
import { Workspace } from "../types";

interface HomeProps {
  workspaces: Workspace[];
  onCreateWorkspace: (name: string) => void;
  onLaunchWorkspace: (id: string) => void;
  onRenameWorkspace: (id: string, newName: string) => void;
  onDeleteWorkspace: (id: string) => void;
  onOpenSettings: () => void;
}

export default function Home({
  workspaces,
  onCreateWorkspace,
  onLaunchWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
  onOpenSettings
}: HomeProps) {
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    onCreateWorkspace(newWorkspaceName.trim());
    setNewWorkspaceName("");
  };

  const handleSaveRename = (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    onRenameWorkspace(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50  overflow-y-auto">
      {/* Header */}
      <header className="bg-white  border-b border-slate-200  px-8 py-5 flex items-center justify-between shrink-0 top-0 sticky z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <HomeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 ">Workspaces</h1>
            <p className="text-xs text-slate-500 ">Manage your study environments</p>
          </div>
        </div>

        <button 
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl text-slate-500 bg-slate-100 hover:bg-slate-200    transition-colors"
          title="Global Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="p-8 max-w-6xl mx-auto w-full">
        
        {/* Create new Workspace section */}
        <section className="mb-10 bg-white  p-6 rounded-2xl border border-slate-200  shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500  mb-4">Create New Workspace</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. Physics 101, Fall Semester, Research Project..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="flex-1 bg-slate-50  border border-slate-200  rounded-xl px-4 py-3 text-slate-800  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
            <button
              type="submit"
              disabled={!newWorkspaceName.trim()}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create
            </button>
          </form>
        </section>

        {/* Workspace Grid */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500  mb-4">Your Workspaces</h2>
          
          {workspaces.length === 0 ? (
            <div className="bg-slate-100/50  border border-dashed border-slate-300  rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 ">No workspaces yet</h3>
              <p className="text-slate-500  mt-1 max-w-sm mx-auto">Create your first workspace above to start reading PDFs and taking notes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workspaces.map((ws) => (
                <div 
                  key={ws.id}
                  className="group bg-white  border border-slate-200  rounded-2xl overflow-hidden hover:shadow-lg hover:border-indigo-300  transition-all cursor-pointer flex flex-col"
                  onDoubleClick={() => onLaunchWorkspace(ws.id)}
                >
                  <div className="p-5 grow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="bg-indigo-50  p-2 rounded-lg">
                        <BookOpen className="w-5 h-5 text-indigo-600 " />
                      </div>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(ws.id);
                            setEditName(ws.name);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600  bg-slate-50  rounded-md transition-colors"
                          title="Rename workspace"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm(`Delete workspace "${ws.name}"? This removes all notes and documents inside it permanently.`)) {
                              onDeleteWorkspace(ws.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600  bg-slate-50  rounded-md transition-colors"
                          title="Delete workspace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {editingId === ws.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleSaveRename(ws.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(ws.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full text-lg font-bold text-slate-800  bg-slate-50  border-b-2 border-indigo-500 focus:outline-none p-1 -ml-1 rounded-t-sm mb-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="text-lg font-bold text-slate-800  mb-1">{ws.name}</h3>
                    )}
                    
                    <p className="text-xs text-slate-500 ">
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="bg-slate-50  p-4 border-t border-slate-100  flex justify-between items-center group/btn" onClick={() => onLaunchWorkspace(ws.id)}>
                    <span className="text-sm font-semibold text-slate-600  group-hover/btn:text-indigo-600  flex items-center gap-1.5 transition-colors">
                      <Play className="w-4 h-4 fill-current" /> Enter Workspace
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover/btn:text-indigo-500 transition-transform group-hover/btn:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
