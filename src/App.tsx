/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PDFViewer from "./components/PDFViewer";
import NoteEditor from "./components/NoteEditor";
import SettingsModal from "./components/SettingsModal";
import { Note, PDFDoc } from "./types";
import { 
  SYSTEM_TUTORIAL_PDF_BASE64, 
  INITIAL_PDF_DOC, 
  INITIAL_NOTES, 
  base64ToBlobUrl 
} from "./data/samples";
import { 
  BookOpen, 
  Sparkles, 
  Split, 
  Maximize2, 
  Edit3, 
  Layers, 
  Eye, 
  FileText 
} from "lucide-react";

export default function App() {
  // NOTES STATE
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // PDF DOCS STATE
  const [pdfDocs, setPdfDocs] = useState<PDFDoc[]>([]);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);

  // PDF ACTIVE VIEW STATE
  const [currentOpenPage, setCurrentOpenPage] = useState<number>(1);
  const [externalPageTrigger, setExternalPageTrigger] = useState<number | undefined>(undefined);

  // LAYOUT PANEL MODES
  // "split" = Both PDF and Editor, "pdf" = Maximize PDF viewer, "editor" = Maximize note editor
  const [layoutMode, setLayoutMode] = useState<"split" | "pdf" | "editor">("split");

  // SETTINGS & MODALS
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  // Load theme and listen to system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("pdf_note_taker_theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pdf_note_taker_theme", theme);
    const appliesDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (appliesDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Load state on startup
  useEffect(() => {
    // 1. Load Notes
    const savedNotes = localStorage.getItem("pdf_note_taker_notes");
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Error parsing saved notes:", e);
        setNotes(INITIAL_NOTES);
      }
    } else {
      setNotes(INITIAL_NOTES);
    }

    // 2. Load PDF Docs
    const savedPdfs = localStorage.getItem("pdf_note_taker_docs");
    const tutorialBlobUrl = base64ToBlobUrl(SYSTEM_TUTORIAL_PDF_BASE64);

    if (savedPdfs) {
      try {
        const parsedPdfs = JSON.parse(savedPdfs) as PDFDoc[];
        // Restore blobURL for the tutorial manual if it hasn't been deleted by the user
        const hydratedPdfs = parsedPdfs.map(d => 
          d.id === INITIAL_PDF_DOC.id ? { ...d, blobUrl: tutorialBlobUrl } : d
        );
        setPdfDocs(hydratedPdfs);
        if (hydratedPdfs.length > 0) setActivePdfId(hydratedPdfs[0].id);
      } catch (e) {
        console.error("Error parsing saved PDF registry:", e);
        setPdfDocs([{ ...INITIAL_PDF_DOC, blobUrl: tutorialBlobUrl }]);
        setActivePdfId(INITIAL_PDF_DOC.id);
      }
    } else {
      setPdfDocs([{ ...INITIAL_PDF_DOC, blobUrl: tutorialBlobUrl }]);
      setActivePdfId(INITIAL_PDF_DOC.id);
    }

    // Set first note as active initially
    setActiveNoteId(INITIAL_NOTES[0].id);
  }, []);

  // Sync Notes to LocalStorage on updates
  const handleUpdateNotesState = (updatedList: Note[]) => {
    setNotes(updatedList);
    localStorage.setItem("pdf_note_taker_notes", JSON.stringify(updatedList));
  };

  // Create a note
  const handleCreateNote = (pdfReference?: { pdfId: string; pageNumber: number; pdfName: string }) => {
    const timestamp = new Date().toISOString();
    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: pdfReference 
        ? `Annotation: ${pdfReference.pdfName} (P.${pdfReference.pageNumber})` 
        : `New Study Note (${new Date().toLocaleDateString()})`,
      content: pdfReference 
        ? `## Extracted Reference\nAnnotations concerning and citing page ${pdfReference.pageNumber} in \`${pdfReference.pdfName}\`.\n\nType comments here...`
        : `# Study Note\nStart writing summaries, questions, or definitions...`,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: pdfReference ? ["annotations", "citation"] : ["study"],
      pdfId: pdfReference?.pdfId,
      pdfPage: pdfReference?.pageNumber,
      pdfName: pdfReference?.pdfName,
      isFavorite: false
    };

    const newNotesList = [newNote, ...notes];
    handleUpdateNotesState(newNotesList);
    setActiveNoteId(newNote.id);
    
    // Switch to split-screen to assure editor is visible if they were reading in maximized pdf mode
    if (layoutMode === "pdf") {
      setLayoutMode("split");
    }
  };

  // Save/Update note
  const handleUpdateNote = (updatedNote: Note) => {
    const newList = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    handleUpdateNotesState(newList);
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    const newList = notes.filter(n => n.id !== id);
    handleUpdateNotesState(newList);
    
    // Decopulate selection
    if (activeNoteId === id) {
      setActiveNoteId(newList.length > 0 ? newList[0].id : null);
    }
  };

  // Create Note directly from Text OCR Inspector selections
  const handleCreateNoteFromText = (selectedText: string, page: number) => {
    const activePdf = pdfDocs.find(d => d.id === activePdfId);
    const pdfName = activePdf?.name || "Document";
    
    const timestamp = new Date().toISOString();
    const cleanExcerpt = selectedText.length > 300 
      ? selectedText.slice(0, 300) + "..." 
      : selectedText;

    const newNote: Note = {
      id: `note_${Date.now()}`,
      title: `Excerpt from P.${page}`,
      content: `## Extracted Quote from Page ${page}\n\n> "${cleanExcerpt}"\n\n### Annotation / Commentary:\nAdd your critique, study tags, or review notes here...`,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: ["excerpt", "quote"],
      pdfId: activePdfId || undefined,
      pdfName: pdfName,
      pdfPage: page,
      isFavorite: false
    };

    const newNotesList = [newNote, ...notes];
    handleUpdateNotesState(newNotesList);
    setActiveNoteId(newNote.id);
    
    // Return back view to split to let them edit instantly
    if (layoutMode === "pdf") {
      setLayoutMode("split");
    }
  };

  // Open PDF file
  const handleSelectPdf = (id: string | null) => {
    setActivePdfId(id);
    setCurrentOpenPage(1);
    setExternalPageTrigger(1);
  };

  // Add / Upload PDF file from sidebar uploader UI
  const handleAddPdf = (file: File, totalPages: number) => {
    const localBlobUrl = URL.createObjectURL(file);
    const sizeInKb = (file.size / 1024).toFixed(1);
    const readableSize = parseFloat(sizeInKb) > 1000 
      ? (parseFloat(sizeInKb) / 1024).toFixed(1) + " MB" 
      : sizeInKb + " KB";

    const newDoc: PDFDoc = {
      id: `pdf_user_${Date.now()}`,
      name: file.name,
      blobUrl: localBlobUrl,
      fileSize: readableSize,
      totalPages: totalPages,
      uploadedAt: new Date().toISOString()
    };

    const updatedDocsList = [newDoc, ...pdfDocs];
    setPdfDocs(updatedDocsList);
    
    // Save metadata to localStorage
    const docsToSaveInCache = updatedDocsList.map(d => ({
      ...d,
      blobUrl: undefined // Clear ephemeral blob Urls for persistent localStorage
    }));
    localStorage.setItem("pdf_note_taker_docs", JSON.stringify(docsToSaveInCache));

    // Instantly select loaded document as active file
    setActivePdfId(newDoc.id);
    setCurrentOpenPage(1);
    setExternalPageTrigger(1);
  };

  // Delete uploaded PDF file
  const handleDeletePdf = (id: string) => {
    const updatedDocsList = pdfDocs.filter(d => d.id !== id);
    setPdfDocs(updatedDocsList);
    
    const docsToSaveInCache = updatedDocsList.map(d => ({
      ...d,
      blobUrl: undefined
    }));
    localStorage.setItem("pdf_note_taker_docs", JSON.stringify(docsToSaveInCache));

    if (activePdfId === id) {
      setActivePdfId(updatedDocsList.length > 0 ? updatedDocsList[0].id : null);
    }
  };

  // Go to linked PDF page anchor reference clicked inside NoteEditor
  const handleGoToPdfPage = (pdfId: string, pageNumber: number) => {
    setActivePdfId(pdfId);
    setCurrentOpenPage(pageNumber);
    setExternalPageTrigger(pageNumber);
    
    // Ensure reader area is visible
    if (layoutMode === "editor") {
      setLayoutMode("split");
    }
  };

  // Track page change within PDFViewer to associate with new note creations
  const handlePageScrollChange = (page: number) => {
    setCurrentOpenPage(page);
    setExternalPageTrigger(undefined);
  };

  const handleClearAllData = () => {
    localStorage.removeItem("pdf_note_taker_notes");
    localStorage.removeItem("pdf_note_taker_docs");
    setNotes([]);
    setPdfDocs([{
      ...INITIAL_PDF_DOC,
      blobUrl: base64ToBlobUrl(SYSTEM_TUTORIAL_PDF_BASE64)
    }]);
    setActiveNoteId(null);
    setActivePdfId(INITIAL_PDF_DOC.id);
  };

  const activeNote = notes.find(n => n.id === activeNoteId) || null;

  return (
    <div className="h-full flex flex-col bg-slate-100 transition-colors duration-300">
      
      {/* Top Split Workspace Layout Switcher control shelf */}
      <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-150 p-2 rounded-xl flex items-center justify-center animate-fade-in shadow-2xs">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Study Workspace</h2>
            <p className="text-[10px] text-slate-400 font-medium">Side-by-side reading, formatting, and anchoring</p>
          </div>
        </div>

        {/* Triple Layout selector buttons (Focus Reader, Focus Writer, Split View) */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-medium border border-slate-200 shadow-3xs select-none">
          <button
            onClick={() => setLayoutMode("pdf")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              layoutMode === "pdf"
                ? "bg-white text-indigo-700 shadow-2xs font-bold"
                : "text-slate-650 hover:text-slate-900"
            }`}
            title="Focus Reader (Maximize PDF)"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Focus Reader</span>
          </button>
          
          <button
            onClick={() => setLayoutMode("split")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              layoutMode === "split"
                ? "bg-white text-indigo-700 shadow-2xs font-bold"
                : "text-slate-650 hover:text-slate-900"
            }`}
            title="Split-Screen Workspace (Default)"
          >
            <Split className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Split Screen</span>
          </button>

          <button
            onClick={() => setLayoutMode("editor")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              layoutMode === "editor"
                ? "bg-white text-indigo-700 shadow-2xs font-bold"
                : "text-slate-650 hover:text-slate-900"
            }`}
            title="Focus Writer (Maximize Notes)"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Focus Writer</span>
          </button>
        </div>
      </header>

      {/* Main app floor */}
      <div className="grow overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Library & Notes Directories Sidebar */}
        <Sidebar
          notes={notes}
          activeNoteId={activeNoteId}
          onSelectNote={setActiveNoteId}
          onCreateNote={handleCreateNote}
          pdfDocs={pdfDocs}
          activePdfId={activePdfId}
          onSelectPdf={handleSelectPdf}
          onAddPdf={handleAddPdf}
          onDeletePdf={handleDeletePdf}
          currentOpenPage={currentOpenPage}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Center Canvas Division (PDF Canvas + Markdown Editor) */}
        <div className="grow overflow-hidden flex p-4 gap-4 bg-slate-150/70 h-full">
          
          {/* Section A: PDF Canvas Viewer */}
          <div 
            className={`h-full transition-all duration-300 ${
              layoutMode === "pdf" ? "w-full block" :
              layoutMode === "split" ? "w-full md:w-1/2 block" :
              "hidden"
            }`}
          >
            <PDFViewer
              activeDoc={pdfDocs.find(d => d.id === activePdfId) || null}
              onPageChange={handlePageScrollChange}
              externalPage={externalPageTrigger}
              onCreateNoteFromText={handleCreateNoteFromText}
            />
          </div>

          {/* Section B: Markdown Note Editor workspace */}
          <div 
            className={`h-full transition-all duration-300 ${
              layoutMode === "editor" ? "w-full block" :
              layoutMode === "split" ? "w-full md:w-1/2 block" :
              "hidden"
            }`}
          >
            <NoteEditor
              note={activeNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onGoToPdfPage={handleGoToPdfPage}
            />
          </div>

        </div>

      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        onClearAllData={handleClearAllData}
      />

    </div>
  );
}
