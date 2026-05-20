/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Trash2, 
  Tag, 
  X, 
  Plus, 
  Link2, 
  Link2Off,
  Eye, 
  Pencil, 
  Save, 
  CheckCircle,
  FileCheck,
  Globe,
  CornerDownRight,
  HelpCircle,
  BookOpen,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo
} from "lucide-react";
import { Note } from "../types";

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (updatedNote: Note) => void;
  onDeleteNote: (id: string) => void;
  onGoToPdfPage?: (pdfId: string, pageNumber: number) => void;
}

export default function NoteEditor({ 
  note, 
  onUpdateNote, 
  onDeleteNote, 
  onGoToPdfPage 
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editMode, setEditMode] = useState<"edit" | "preview">("edit");
  const [saveStatus, setSaveStatus] = useState<"synchronized" | "saving" | "idle">("idle");
  const [showMarkdownHint, setShowMarkdownHint] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save typing for editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      triggerAutoSave(title, html);
    },
  });

  // Sync state with incoming note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus("idle");
      
      if (editor && !editor.isDestroyed && editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content, false);
      }
    } else {
      setTitle("");
      setContent("");
      if (editor && !editor.isDestroyed) {
        editor.commands.setContent('', false);
      }
    }
  }, [note?.id, editor]);

  // Handle auto-saving on edit
  const triggerAutoSave = (updatedTitle: string, updatedContent: string) => {
    if (!note) return;
    
    setSaveStatus("saving");
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onUpdateNote({
        ...note,
        title: updatedTitle,
        content: updatedContent,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus("synchronized");
      // Fade status back to idle after 2 sec
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600); // 600ms debounce
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutoSave(val, content);
  };

  const addingTag = () => {
    if (!note || !newTag.trim()) return;
    const cleanTag = newTag.trim().toLowerCase();
    
    if (!note.tags.includes(cleanTag)) {
      const updatedTags = [...note.tags, cleanTag];
      onUpdateNote({
        ...note,
        tags: updatedTags,
        updatedAt: new Date().toISOString()
      });
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    if (!note) return;
    const updatedTags = note.tags.filter(t => t !== tagToRemove);
    onUpdateNote({
      ...note,
      tags: updatedTags,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSeverLink = () => {
    if (!note) return;
    onUpdateNote({
      ...note,
      pdfId: undefined,
      pdfName: undefined,
      pdfPage: undefined,
      updatedAt: new Date().toISOString()
    });
  };

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
        <div className="bg-slate-50 p-4 rounded-full mb-3">
          <BookOpen className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">No Active Note</h3>
        <p className="max-w-xs text-xs text-slate-400">
          Select an existing note from the list, or click <strong className="font-semibold text-indigo-600">"+ Note"</strong> in the panel to begin capturing thoughts.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      
      {/* Editor Controls Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
        
        {/* Save Status / Linked Indicators */}
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 block animate-ping"></span>
              Drafting...
            </span>
          )}
          {saveStatus === "synchronized" && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Auto-saved
            </span>
          )}
          {saveStatus === "idle" && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <FileCheck className="w-3.5 h-3.5" />
              Saved to browser cache
            </span>
          )}
        </div>

        {/* View Toggle and Actions */}
        <div className="flex items-center gap-2">
          
          {/* Helper Markdown Hint trigger */}
          <button
            onClick={() => setShowMarkdownHint(!showMarkdownHint)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showMarkdownHint 
                ? "bg-amber-50 text-amber-600 border-amber-200" 
                : "bg-white  text-slate-400  border-slate-200  hover:text-slate-600"
            }`}
            title="Formatting Shortcuts"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Toggle buttons for Edit / Preview (now full screen / reading mode) */}
          <div className="flex bg-slate-200/80  p-0.5 rounded-lg text-xs font-semibold select-none">
            <button
              onClick={() => { setEditMode("edit"); setShowMarkdownHint(false); }}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all ${
                editMode === "edit"
                  ? "bg-white  text-slate-900  shadow-xs"
                  : "text-slate-600  hover:text-slate-900"
              }`}
            >
              <Pencil className="w-3 h-3 text-indigo-500" />
              Write
            </button>
            <button
              onClick={() => setEditMode("preview")}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all ${
                editMode === "preview"
                  ? "bg-white  text-slate-900  shadow-xs"
                  : "text-slate-600  hover:text-slate-900"
              }`}
            >
              <Eye className="w-3 h-3 text-indigo-500" />
              Read
            </button>
          </div>

          <span className="w-px h-5 bg-slate-200"></span>

          {/* Danger delete control */}
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to permanently delete "${note.title || "Untitled note"}"?`)) {
                onDeleteNote(note.id);
              }
            }}
            className="p-1.5 rounded-lg text-rose-500 bg-white border border-rose-100 hover:bg-rose-50 transition-colors shadow-xs"
            title="Delete Note"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* PDF Anchor Bar (If note has a link to an active PDF) */}
      {note.pdfId && note.pdfPage && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2 text-indigo-900">
            <Link2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate max-w-[250px] sm:max-w-xs block">
              Anchored to <strong className="font-semibold">{note.pdfName || "Document"}</strong>
            </span>
            <span className="bg-indigo-200/60 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              Page {note.pdfPage}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onGoToPdfPage && (
              <button
                onClick={() => onGoToPdfPage(note.pdfId!, note.pdfPage!)}
                className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.75 rounded-md hover:bg-indigo-100 border border-indigo-250 transition-all flex items-center gap-0.5"
              >
                <CornerDownRight className="w-3 h-3" />
                Go to page
              </button>
            )}

            <button
              onClick={handleSeverLink}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded-md"
              title="Break anchor relationship"
            >
              <Link2Off className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Markdown Help Card overlay */}
      {showMarkdownHint && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 grid grid-cols-2 text-xs text-amber-900 gap-y-1.5 gap-x-4 animate-fade-in shrink-0">
          <div><strong className="font-semibold"># Headers</strong>: Type <code className="bg-amber-100/60 px-1 rounded"># Title</code></div>
          <div><strong className="font-semibold">Bullet Points</strong>: Type <code className="bg-amber-100/60 px-1 rounded">- item</code></div>
          <div><strong className="font-semibold">Bold</strong>: Wrap <code className="bg-amber-100/60 px-1 rounded">**word**</code></div>
          <div><strong className="font-semibold">Italic</strong>: Wrap <code className="bg-amber-100/60 px-1 rounded">*word*</code></div>
          <div><strong className="font-semibold">Highlights</strong>: Wrap code in backticks <code className="bg-amber-100/60 px-1 rounded">`code`</code></div>
            <div className="col-span-2 text-[10px] text-amber-600 text-right mt-1">Shortcuts work instantly in the editor!</div>
        </div>
      )}

      {/* Editor Main Canvas */}
      <div className="grow overflow-hidden flex flex-col p-4 bg-white  relative">
        {editMode === "edit" ? (
          <div className="flex flex-col h-full gap-3">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Give your study note reference a title..."
              value={title}
              onChange={handleTitleChange}
              className="w-full text-base font-semibold text-slate-800  placeholder-slate-400  border-none p-1 focus:outline-none ring-0 bg-transparent"
            />
            <hr className="border-slate-100 " />
            
            {/* TipTap Menu Bar */}
            {editor && (
              <div className="flex flex-wrap gap-1.5 shrink-0 mb-1 border-b border-slate-100  pb-2">
                <button 
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200  my-auto mx-1" />
                <button 
                  onClick={() => editor.chain().focus().toggleBold().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => editor.chain().focus().toggleItalic().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => editor.chain().focus().toggleStrike().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('strike') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200  my-auto mx-1" />
                <button 
                  onClick={() => editor.chain().focus().toggleBulletList().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200  my-auto mx-1" />
                <button 
                  onClick={() => editor.chain().focus().toggleBlockquote().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('blockquote') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => editor.chain().focus().toggleCode().run()} 
                  className={`p-1.5 rounded-md transition-colors ${editor.isActive('code') ? 'bg-indigo-50  text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                  title="Inline Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <div className="flex-grow"></div>
                <button 
                  onClick={() => editor.chain().focus().undo().run()} 
                  className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Undo"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => editor.chain().focus().redo().run()} 
                  className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                  title="Redo"
                >
                  <Redo className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* TipTap Base */}
            <div className="w-full grow overflow-auto p-1 text-sm leading-relaxed text-slate-700  font-sans focus-within:outline-none">
              <EditorContent editor={editor} className="h-full" />
            </div>
          </div>
        ) : (
          /* Read View */
          <div className="h-full overflow-auto pr-1 text-slate-800 ">
            <h1 className="text-xl font-bold border-b border-slate-100  pb-2 mb-3">
              {title || <span className="text-slate-400 font-normal italic">Untitled Note</span>}
            </h1>
            {editor ? (
              <div 
                className="ProseMirror" 
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            ) : (
              <p className="text-slate-400 italic">Nothing to see here...</p>
            )}
          </div>
        )}
      </div>

      {/* Editor Tags Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Tag className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px]">Tags:</span>
          </div>

          {/* Current tags list */}
          {note.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {note.tags.map(tag => (
                <span 
                  key={tag}
                  className="inline-flex items-center gap-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
                >
                  #{tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="p-0.5 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-700 font-bold ml-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">No tags added</span>
          )}

          {/* Add a Tag form controls */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-1 ml-auto max-w-[140px] focus-within:ring-1 focus-within:ring-indigo-500">
            <input
              type="text"
              placeholder="+ Add Tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addingTag();
                }
              }}
              className="w-full text-xs text-slate-700 focus:outline-hidden pl-1 placeholder-slate-400"
            />
            <button
              onClick={addingTag}
              className="p-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
