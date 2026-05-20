/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
  BookOpen
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

  // Sync state with incoming note
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setSaveStatus("idle");
    } else {
      setTitle("");
      setContent("");
    }
  }, [note?.id]);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(title, val);
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

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("note-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const txt = textarea.value;

    const selectedText = txt.substring(start, end);
    const replacement = prefix + selectedText + suffix;

    const newContent = txt.substring(0, start) + replacement + txt.substring(end);
    setContent(newContent);
    triggerAutoSave(title, newContent);

    // Focus back and highlight inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
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

  // Simple, robust Markdown-to-HTML parser using regex replacement to prevent external dependencies and HMR warnings
  const parseMarkdown = (txt: string) => {
    if (!txt.trim()) return "<p class='text-slate-400 italic'>Type content in Edit mode to view formatting preview...</p>";
    
    let html = txt
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-slate-800 mt-3 mb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-slate-800 mt-4 mb-1.5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-slate-900 mt-5 mb-2">$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-slate-300 pl-3 italic text-slate-600 my-2">$1</blockquote>');

    // Code Blocks
    html = html.replace(/```([\s\S]*?)```/gm, '<pre class="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs overflow-x-auto my-3">$1</pre>');

    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-rose-600 px-1 py-0.5 rounded font-mono text-xs font-semibold">$1</code>');

    // Bold & Italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

    // Bullet points (simple match)
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700">$1</li>');
    html = html.replace(/^\s*\*\s+(.*$)/gim, '<li class="ml-4 list-disc text-slate-700">$1</li>');

    // Ordered points
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 list-decimal text-slate-700">$1</li>');

    // Break lines to <br /> unless it's a list item
    html = html.split('\n').map(line => {
      if (line.includes('<li') || line.includes('<h') || line.includes('<pre') || line.includes('<block') || line.trim() === '') {
        return line;
      }
      return line + '<br/>';
    }).join('\n');

    return html;
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
                : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
            }`}
            title="Markdown Cheat Sheet"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Toggle buttons for Edit / Preview */}
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold select-none">
            <button
              onClick={() => { setEditMode("edit"); setShowMarkdownHint(false); }}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all ${
                editMode === "edit"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Pencil className="w-3 h-3 text-indigo-500" />
              Write
            </button>
            <button
              onClick={() => setEditMode("preview")}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all ${
                editMode === "preview"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3 h-3 text-indigo-500" />
              Preview
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
          <div className="col-span-2 text-[10px] text-amber-600 text-right mt-1">Markdown previews update and compile automatically.</div>
        </div>
      )}

      {/* Editor Main Canvas */}
      <div className="grow overflow-hidden flex flex-col p-4 bg-white relative">
        {editMode === "edit" ? (
          <div className="flex flex-col h-full gap-3">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Give your study note reference a title..."
              value={title}
              onChange={handleTitleChange}
              className="w-full text-base font-semibold text-slate-800 placeholder-slate-400 border-none p-1 focus:outline-hidden ring-0 bg-transparent"
            />
            <hr className="border-slate-100" />
            
            {/* Short markdown insert cheatsheet buttons */}
            <div className="flex flex-wrap gap-1.5 shrink-0">
              <button 
                onClick={() => insertMarkdown("# ")} 
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600"
              >
                H1
              </button>
              <button 
                onClick={() => insertMarkdown("## ")} 
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600"
              >
                H2
              </button>
              <button 
                onClick={() => insertMarkdown("**", "**")} 
                className="px-2 py-1 text-[11px] font-bold bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600"
              >
                Bold
              </button>
              <button 
                onClick={() => insertMarkdown("*", "*")} 
                className="px-2 py-1 text-[11px] font-medium italic bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600"
              >
                Italics
              </button>
              <button 
                onClick={() => insertMarkdown("- ")} 
                className="px-2 py-1 text-[11px] font-medium bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600"
              >
                Bullet List
              </button>
              <button 
                onClick={() => insertMarkdown("`", "`")} 
                className="px-2 py-1 text-[11px] font-mono bg-slate-100 rounded-md hover:bg-slate-200 text-slate-600"
              >
                Inline Code
              </button>
            </div>

            {/* Note Canvas text area */}
            <textarea
              id="note-textarea"
              placeholder="Capture paragraphs, transcribe annotations, draft outlines, or bullet points here..."
              value={content}
              onChange={handleContentChange}
              className="w-full grow resize-none border-none p-1 focus:outline-hidden ring-0 text-sm leading-relaxed text-slate-700 placeholder-slate-300 font-sans"
            />
          </div>
        ) : (
          /* Markdown Live view rendering */
          <div className="h-full overflow-auto pr-1">
            <h1 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-2 mb-3">
              {title || <span className="text-slate-300 font-normal italic">Untitled Note</span>}
            </h1>
            <div 
              className="markdown-body text-sm leading-relaxed text-slate-700"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
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
