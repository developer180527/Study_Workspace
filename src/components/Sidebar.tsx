/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  FolderOpen, 
  BookOpen, 
  Tag, 
  Star, 
  Upload, 
  Download, 
  Check, 
  Trash2,
  Trash,
  X,
  FileDown,
  Link2,
  Settings
} from "lucide-react";
import { Note, PDFDoc, SearchFilters } from "../types";

interface SidebarProps {
  // Notes State
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onCreateNote: (pdfReference?: { pdfId: string; pageNumber: number; pdfName: string }) => void;
  
  // PDF State
  pdfDocs: PDFDoc[];
  activePdfId: string | null;
  onSelectPdf: (id: string | null) => void;
  onAddPdf: (file: File, totalPages: number) => void;
  onDeletePdf: (id: string) => void;

  // Selected Page indicator (to bind currently opened page to a new note)
  currentOpenPage?: number;

  // Settings
  onOpenSettings: () => void;
}

export default function Sidebar({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  pdfDocs,
  activePdfId,
  onSelectPdf,
  onAddPdf,
  onDeletePdf,
  currentOpenPage,
  onOpenSettings
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"library" | "notes">("library");
  const [noteSearch, setNoteSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<PDFDoc | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePdf = pdfDocs.find(d => d.id === activePdfId);

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noteSearch.toLowerCase());
    
    const matchesTag = !selectedTag || n.tags.includes(selectedTag);
    const matchesFavorite = !onlyFavorites || n.isFavorite;
    
    return matchesSearch && matchesTag && matchesFavorite;
  });

  // Handle drag-and-drop upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processUploadedFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadError("Only standard .pdf document formats are accepted.");
      setIsDragging(false);
      return;
    }

    setUploadError(null);
    setIsDragging(false);

    try {
      // Direct load via local object url to extract PDF pages dynamic counts
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        throw new Error("PDF renderer engine not available yet");
      }

      const fileUrl = URL.createObjectURL(file);
      const loadingTask = pdfjsLib.getDocument(fileUrl);
      const pdfDoc = await loadingTask.promise;
      const pages = pdfDoc.numPages;

      onAddPdf(file, pages);
    } catch (err) {
      console.error("Error reading uploaded PDF details:", err);
      // Fallback with page set to 1 if parsing fails
      onAddPdf(file, 1);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Export functions
  const exportAllNotesAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pdf_study_notes_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const compileNotesAsMarkdown = () => {
    let markdown = `# Study Notes & Annotations\nExported on: ${new Date().toLocaleDateString()}\n\n`;
    
    notes.forEach(n => {
      markdown += `## ${n.title || "Untitled Study Note"}\n`;
      markdown += `*Created: ${new Date(n.createdAt).toLocaleDateString()} | Modified: ${new Date(n.updatedAt).toLocaleDateString()}*\n`;
      if (n.tags.length > 0) {
        markdown += `*Tags: ${n.tags.map(t => `#${t}`).join(', ')}*\n`;
      }
      if (n.pdfName) {
        markdown += `*Linked Reference: ${n.pdfName} (Page: ${n.pdfPage || 1})*\n`;
      }
      markdown += `\n${n.content}\n\n`;
      markdown += `---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pdf_study_notes_${new Date().toISOString().slice(0,10)}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col h-full shrink-0">
      
      {/* App Branding Header Title */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">PDF Note Taker</h1>
            <p className="text-[10px] text-slate-500 font-medium">Study. Annotate. Organise.</p>
          </div>
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          title="Settings & System Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Workspace Navigation Tabs */}
      <div className="flex p-2 bg-slate-50 border-b border-slate-200 font-medium text-xs text-slate-650">
        <button
          onClick={() => setActiveTab("library")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "library"
              ? "bg-white text-indigo-700 font-bold shadow-xs border border-slate-200/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>My PDFs ({pdfDocs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "notes"
              ? "bg-white text-indigo-700 font-bold shadow-xs border border-slate-200/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>My Notes ({notes.length})</span>
        </button>
      </div>

      {/* Tab Panel 1: Document Library & Upload */}
      {activeTab === "library" && (
        <div className="grow overflow-hidden flex flex-col">
          
          {/* Uploader section */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 shrink-0">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging 
                  ? "border-indigo-600 bg-indigo-50/50" 
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="application/pdf"
                className="hidden"
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">Upload PDF File</p>
              <p className="text-[10px] text-slate-400 mt-1">Drag & drop or browse device</p>
            </div>
            
            {uploadError && (
              <p className="text-[10px] text-rose-600 font-medium mt-2 text-center flex items-center justify-center gap-1">
                <span className="w-1 h-1 rounded-full bg-rose-600"></span> {uploadError}
              </p>
            )}
          </div>

          {/* Documents ListView */}
          <div className="grow overflow-auto p-3 flex flex-col gap-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1 py-1">Document Registry</h3>
            {pdfDocs.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <FileText className="w-8 h-8 opacity-40 mx-auto mb-1.5" />
                <p className="text-xs">No PDFs saved.</p>
              </div>
            ) : (
              pdfDocs.map(doc => {
                const isSelected = activePdfId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectPdf(doc.id)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all relative group flex flex-col ${
                      isSelected
                        ? "border-indigo-250 bg-indigo-50 text-indigo-900 shadow-2xs"
                        : "border-slate-150 hover:bg-slate-50 bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="grow min-w-0 pr-4">
                        <h4 className="text-xs font-bold truncate pr-3" title={doc.name}>
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
                          <span>{doc.totalPages} pages</span>
                          <span>•</span>
                          <span>{doc.fileSize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete PDF helper button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPdfToDelete(doc);
                      }}
                      className="absolute right-2 top-2 p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 rounded-md transition-opacity"
                      title="Delete source PDF"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab Panel 2: Notes Explorer Panel */}
      {activeTab === "notes" && (
        <div className="grow overflow-hidden flex flex-col">
          
          {/* Notes Query Filter Search */}
          <div className="p-3 border-b border-slate-150 bg-slate-50/50 flex flex-col gap-2 shrink-0">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search study titles, text..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 bg-white rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
              {noteSearch && (
                <button 
                  onClick={() => setNoteSearch("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Favorites checkbox filter */}
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyFavorites}
                onChange={(e) => setOnlyFavorites(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
              Show starred study points only
            </label>

            {/* Tags Cloud Filter list */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pt-1 pr-1 border-t border-slate-100">
                {allTags.map(tag => {
                  const isTagSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isTagSelected ? null : tag)}
                      className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full border transition-all ${
                        isTagSelected
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-500 border-slate-200 hover:border-slate-350 hover:bg-slate-50"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Notes Activator bar */}
          <div className="p-2 border-b border-slate-100 flex gap-1 bg-white shrink-0">
            <button
              onClick={() => onCreateNote()}
              className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              New Study Note
            </button>

            {activePdfId && (
              <button
                onClick={() => onCreateNote({
                  pdfId: activePdfId,
                  pdfName: activePdf?.name || "Document",
                  pageNumber: currentOpenPage || 1
                })}
                className="py-1.5 px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg border border-indigo-200/50 flex items-center gap-1 transition-all"
                title={`Create Note anchored to current visual view context (Page ${currentOpenPage || 1})`}
              >
                <Link2 className="w-3.5 h-3.5" />
                Anchor Note
              </button>
            )}
          </div>

          {/* Notes ListView card stack */}
          <div className="grow overflow-auto p-3 flex flex-col gap-2">
            {filteredNotes.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <FileText className="w-8 h-8 opacity-30 mx-auto mb-1.5" />
                <p className="text-xs font-medium">No notebook search matches.</p>
                <p className="text-[10px] mt-1 text-slate-400 font-light">Create a general note or link references inside a PDF.</p>
              </div>
            ) : (
              filteredNotes.map(n => {
                const isActive = activeNoteId === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => onSelectNote(n.id)}
                    className={`p-3 rounded-xl border cursor-pointer hover:shadow-xs transition-all flex flex-col relative group ${
                      isActive
                        ? "border-indigo-250 bg-indigo-50/50 text-indigo-900 shadow-2xs"
                        : "border-slate-150 hover:bg-slate-50 bg-white text-slate-700"
                    }`}
                  >
                    {/* Note title / star option */}
                    <div className="flex items-start justify-between gap-2.5">
                      <h4 className="text-xs font-bold truncate pr-4" title={n.title}>
                        {n.title || <span className="text-slate-400 font-normal italic">Untitled Note</span>}
                      </h4>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          n.isFavorite = !n.isFavorite;
                          // Trigger update of state
                          onSelectNote(n.id);
                        }}
                        className="p-0.5 rounded-full text-amber-400 hover:bg-slate-100"
                        title={n.isFavorite ? "Unstar Note" : "Star study point"}
                      >
                        <Star className={`w-3.5 h-3.5 ${n.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                      </button>
                    </div>

                    {/* Excerpt Body Preview */}
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 select-none">
                      {n.content || <em className="italic text-slate-300">Empty comment canvas...</em>}
                    </p>

                    {/* Metadata tags, connected pages */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      
                      {/* PDF Anchored Indicators */}
                      {n.pdfId && n.pdfPage && (
                        <span className="bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold flex items-center gap-0.5">
                          <Link2 className="w-2.5 h-2.5" />
                          <span>Page {n.pdfPage}</span>
                        </span>
                      )}

                      {/* Tag indicators */}
                      {n.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-slate-100 text-slate-500 rounded text-[9px] px-1 py-0.25 font-mono">
                          #{tag}
                        </span>
                      ))}
                      {n.tags.length > 2 && (
                        <span className="text-[9px] text-slate-400 font-mono">+{n.tags.length - 2} more</span>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Explorer Backup and Export footer controls */}
          <div className="bg-slate-50 border-t border-slate-150 p-2.5 flex items-center justify-between shrink-0 font-medium text-[10px]">
            <span className="text-slate-400 font-mono">Backup Study Core:</span>
            
            <div className="flex gap-1.5">
              <button
                onClick={exportAllNotesAsJSON}
                className="py-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-lg flex items-center gap-1 transition-all"
                title="Backup full library state as raw JSON bundle"
              >
                <Download className="w-3 h-3 text-slate-505" />
                Raw JSON
              </button>
              <button
                onClick={compileNotesAsMarkdown}
                className="py-1 px-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg flex items-center gap-1 transition-all"
                title="Compile and download all study guides in human-readable Markdown format"
              >
                <FileDown className="w-3 h-3" />
                Markdown compile
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Delete PDF Confirmation Modal */}
      {pdfToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white  rounded-2xl shadow-xl w-full max-w-sm border border-slate-200  overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100  flex items-center justify-between bg-slate-50 ">
              <h2 className="text-base font-bold text-slate-800 ">Delete Document</h2>
              <button 
                onClick={() => setPdfToDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200   transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm text-slate-600 ">
                Are you sure you want to remove <span className="font-bold text-slate-800 ">{pdfToDelete.name}</span> from your library?
              </p>
              <p className="text-xs text-rose-500 font-medium">
                Note: This will not delete any annotations or notes that you anchors to this document.
              </p>
              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setPdfToDelete(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700   transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeletePdf(pdfToDelete.id);
                    setPdfToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
                >
                  Delete PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
