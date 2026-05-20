/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import PDFViewer from "./components/PDFViewer";
import NoteEditor from "./components/NoteEditor";
import SettingsModal from "./components/SettingsModal";
import Home from "./components/Home";
import { Note, SourceDoc, Workspace } from "./types";
import { 
  SYSTEM_TUTORIAL_PDF_BASE64, 
  INITIAL_PDF_DOC, 
  INITIAL_NOTES, 
  base64ToBlobUrl 
} from "./data/samples";
import { 
  Home as HomeIcon,
  BookOpen, 
  Split, 
  Edit3, 
  Eye
} from "lucide-react";

// Cache for blob URLs to persist across workspace switches within the same session
const sessionBlobCache = new Map<string, string>();

export default function App() {
  // APP STATE
  const [view, setView] = useState<"home" | "editor">("home");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // NOTES STATE (scoped to activeWorkspaceId)
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // PDF DOCS STATE (scoped to activeWorkspaceId)
  const [pdfDocs, setPdfDocs] = useState<SourceDoc[]>([]);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);

  // PDF ACTIVE VIEW STATE
  const [currentOpenPage, setCurrentOpenPage] = useState<number>(1);
  const [externalPageTrigger, setExternalPageTrigger] = useState<number | undefined>(undefined);

  // LAYOUT PANEL MODES
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

  // Load workspaces on startup
  useEffect(() => {
    const savedWorkspaces = localStorage.getItem("pdf_note_taker_workspaces");
    if (savedWorkspaces) {
      try {
        setWorkspaces(JSON.parse(savedWorkspaces));
      } catch (e) {
        console.error("Error parsing saved workspaces:", e);
      }
    } else {
      // Create a default workspace if none exist
      const defaultWs: Workspace = {
        id: `ws_${Date.now()}`,
        name: "Default Workspace",
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      setWorkspaces([defaultWs]);
      localStorage.setItem("pdf_note_taker_workspaces", JSON.stringify([defaultWs]));
    }
  }, []);

  // Sync Workspaces to LocalStorage
  const handleUpdateWorkspacesState = (updatedList: Workspace[]) => {
    setWorkspaces(updatedList);
    localStorage.setItem("pdf_note_taker_workspaces", JSON.stringify(updatedList));
  };

  // Launch workspace - Load its specific data
  const handleLaunchWorkspace = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    
    // Update last accessed
    const updatedWs = workspaces.map(ws => 
      ws.id === workspaceId ? { ...ws, lastAccessed: new Date().toISOString() } : ws
    );
    handleUpdateWorkspacesState(updatedWs);

    // Load Notes for this workspace
    const savedNotes = localStorage.getItem(`pdf_note_taker_notes_${workspaceId}`);
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
        if (parsedNotes.length > 0) setActiveNoteId(parsedNotes[0].id);
        else setActiveNoteId(null);
      } catch (e) {
        setNotes([]);
      }
    } else {
      setNotes([]);
      setActiveNoteId(null);
    }

    // Load PDF Docs for this workspace
    const savedPdfs = localStorage.getItem(`pdf_note_taker_docs_${workspaceId}`);
    const tutorialBlobUrl = base64ToBlobUrl(SYSTEM_TUTORIAL_PDF_BASE64);

    if (savedPdfs) {
      try {
        const parsedPdfs = JSON.parse(savedPdfs) as SourceDoc[];
        const hydratedPdfs = parsedPdfs.map(d => {
          if (d.id === INITIAL_PDF_DOC.id) {
            return { ...d, blobUrl: tutorialBlobUrl };
          }
          if (sessionBlobCache.has(d.id)) {
            return { ...d, blobUrl: sessionBlobCache.get(d.id) };
          }
          return d;
        });
        setPdfDocs(hydratedPdfs);
        if (hydratedPdfs.length > 0) setActivePdfId(hydratedPdfs[0].id);
        else setActivePdfId(null);
      } catch (e) {
        setPdfDocs([{ ...INITIAL_PDF_DOC, blobUrl: tutorialBlobUrl }]);
        setActivePdfId(INITIAL_PDF_DOC.id);
      }
    } else {
      // First time loading this workspace => give them the tutorial PDF
      setPdfDocs([{ ...INITIAL_PDF_DOC, blobUrl: tutorialBlobUrl }]);
      setActivePdfId(INITIAL_PDF_DOC.id);
    }

    setView("editor");
  };

  const handleCreateWorkspace = (name: string) => {
    const newWs: Workspace = {
      id: `ws_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };
    handleUpdateWorkspacesState([newWs, ...workspaces]);
  };

  const handleRenameWorkspace = (id: string, newName: string) => {
    const updated = workspaces.map(ws => ws.id === id ? { ...ws, name: newName } : ws);
    handleUpdateWorkspacesState(updated);
  };

  const handleDeleteWorkspace = (id: string) => {
    const updated = workspaces.filter(ws => ws.id !== id);
    handleUpdateWorkspacesState(updated);
    localStorage.removeItem(`pdf_note_taker_notes_${id}`);
    localStorage.removeItem(`pdf_note_taker_docs_${id}`);
  };

  // Sync Notes to LocalStorage on updates (scoped by workspace)
  const handleUpdateNotesState = (updatedList: Note[]) => {
    setNotes(updatedList);
    if (activeWorkspaceId) {
      localStorage.setItem(`pdf_note_taker_notes_${activeWorkspaceId}`, JSON.stringify(updatedList));
    }
  };

  // Sync PDFs to LocalStorage
  const handleUpdateDocsState = (updatedList: SourceDoc[]) => {
    setPdfDocs(updatedList);
    if (activeWorkspaceId) {
      const docsToSaveInCache = updatedList.map(d => ({
        ...d,
        blobUrl: undefined
      }));
      localStorage.setItem(`pdf_note_taker_docs_${activeWorkspaceId}`, JSON.stringify(docsToSaveInCache));
    }
  }

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

    const newDoc: SourceDoc = {
      id: `pdf_user_${Date.now()}`,
      name: file.name,
      blobUrl: localBlobUrl,
      fileSize: readableSize,
      totalPages: totalPages,
      uploadedAt: new Date().toISOString()
    };

    sessionBlobCache.set(newDoc.id, localBlobUrl);

    const updatedDocsList = [newDoc, ...pdfDocs];
    handleUpdateDocsState(updatedDocsList);

    // Instantly select loaded document as active file
    setActivePdfId(newDoc.id);
    setCurrentOpenPage(1);
    setExternalPageTrigger(1);
  };

  // Add Youtube Link
  const handleAddYoutube = (url: string) => {
    // Basic YouTube title extraction could be done via oembed, but for offline/sync we just use a default
    const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : "Unknown";
    
    const newDoc: SourceDoc = {
      id: `yt_${Date.now()}`,
      name: `YouTube Video (${videoId})`,
      type: "youtube",
      url: url,
      fileSize: "N/A",
      totalPages: 1,
      uploadedAt: new Date().toISOString()
    };

    const updatedDocsList = [newDoc, ...pdfDocs];
    handleUpdateDocsState(updatedDocsList);
    setActivePdfId(newDoc.id);
  };

  const handleRenamePdf = (id: string, newName: string) => {
    const updatedDocs = pdfDocs.map(doc => 
      doc.id === id ? { ...doc, name: newName } : doc
    );
    handleUpdateDocsState(updatedDocs);
  };

  // Delete uploaded PDF/Youtube file
  const handleDeletePdf = (id: string) => {
    const updatedDocsList = pdfDocs.filter(d => d.id !== id);
    handleUpdateDocsState(updatedDocsList);

    if (activePdfId === id) {
      setActivePdfId(updatedDocsList.length > 0 ? updatedDocsList[0].id : null);
    }
  };

  // Go to linked PDF page anchor reference clicked inside NoteEditor
  const handleGoToPdfPage = (pdfId: string, pageNumber: number) => {
    setActivePdfId(pdfId);
    setCurrentOpenPage(pageNumber);
    setExternalPageTrigger(pageNumber);
    
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
    // Clear all workspaces
    workspaces.forEach(ws => {
      localStorage.removeItem(`pdf_note_taker_notes_${ws.id}`);
      localStorage.removeItem(`pdf_note_taker_docs_${ws.id}`);
    });
    localStorage.removeItem("pdf_note_taker_workspaces");
    // Also remove old legacy keys if they exist just in case
    localStorage.removeItem("pdf_note_taker_notes");
    localStorage.removeItem("pdf_note_taker_docs");
    
    // Remake default workspace
    const defaultWs: Workspace = {
      id: `ws_${Date.now()}`,
      name: "Default Workspace",
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    };
    
    setWorkspaces([defaultWs]);
    localStorage.setItem("pdf_note_taker_workspaces", JSON.stringify([defaultWs]));
    setView("home");
    setActiveWorkspaceId(null);
  };

  const activeNote = notes.find(n => n.id === activeNoteId) || null;
  const currentWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name || "Workspace";

  return (
    <div className="h-full flex flex-col bg-slate-100 transition-colors duration-300">
      
      {view === "home" ? (
        <Home 
          workspaces={workspaces}
          onCreateWorkspace={handleCreateWorkspace}
          onLaunchWorkspace={handleLaunchWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <>
          {/* Top Split Workspace Layout Switcher control shelf */}
          <header className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView("home")}
                className="bg-indigo-50 hover:bg-indigo-100:bg-slate-600 border border-indigo-150 p-2 rounded-xl flex items-center justify-center transition-colors text-indigo-600"
                title="Back to Home Workspaces"
              >
                <HomeIcon className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">{currentWorkspaceName}</h2>
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
                    : "text-slate-600 hover:text-slate-900:text-slate-200"
                }`}
                title="Focus Reader (Maximize PDF)"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Focus Reader</span>
              </button>
              
              <button
                onClick={() => setLayoutMode("split")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  layoutMode === "split"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900:text-slate-200"
                }`}
                title="Split-Screen Workspace (Default)"
              >
                <Split className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split Screen</span>
              </button>

              <button
                onClick={() => setLayoutMode("editor")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  layoutMode === "editor"
                    ? "bg-white text-indigo-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900:text-slate-200"
                }`}
                title="Focus Writer (Maximize Notes)"
              >
                <Edit3 className="w-3.5 h-3.5" />
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
              onAddYoutube={handleAddYoutube}
              onRenamePdf={handleRenamePdf}
              onDeletePdf={handleDeletePdf}
              currentOpenPage={currentOpenPage}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />

            {/* Center Canvas Division (PDF Canvas + Markdown Editor) */}
            <div className="grow overflow-hidden flex p-1 gap-1 bg-slate-150/70 h-full">
              
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
        </>
      )}

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
