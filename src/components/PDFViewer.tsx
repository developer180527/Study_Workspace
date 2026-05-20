/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  Loader2, 
  AlertCircle, 
  Search, 
  Copy, 
  PlusCircle,
  Sparkles,
  Layers,
  FolderOpen
} from "lucide-react";
import { PDFDoc } from "../types";

interface PDFViewerProps {
  activeDoc: PDFDoc | null;
  onPageChange?: (page: number) => void;
  externalPage?: number;
  onCreateNoteFromText?: (text: string, page: number) => void;
}

export default function PDFViewer({ 
  activeDoc, 
  onPageChange, 
  externalPage, 
  onCreateNoteFromText 
}: PDFViewerProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.25);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [textSearchQuery, setTextSearchQuery] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"document" | "scanner">("document");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentRenderTask = useRef<any>(null);

  // Sync with external page changes (e.g. clicking a note linked to page X)
  useEffect(() => {
    if (externalPage && externalPage !== pageNumber && externalPage <= numPages && externalPage >= 1) {
      setPageNumber(externalPage);
    }
  }, [externalPage, numPages]);

  // Load PDF Document
  useEffect(() => {
    if (!activeDoc) {
      setPdf(null);
      setNumPages(0);
      setPageNumber(1);
      setExtractedText("");
      return;
    }

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setExtractedText("");

      // Ensure PDF.js is loaded
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        setError("PDF.js library could not be loaded. Please reload the page.");
        setLoading(false);
        return;
      }

      try {
        const sourceUrl = activeDoc.blobUrl || activeDoc.url;
        if (!sourceUrl) {
          setError("Original browser local file link broken. Please re-upload this document.");
          setLoading(false);
          return;
        }

        const loadingTask = pdfjsLib.getDocument(sourceUrl);
        const pdfDoc = await loadingTask.promise;
        
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setPageNumber(1);
        
        if (onPageChange) {
          onPageChange(1);
        }
      } catch (err: any) {
        console.error("Error loading PDF document:", err);
        setError(`Failed to read PDF file: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [activeDoc]);

  // Render Page on Canvas
  useEffect(() => {
    if (!pdf) return;

    let active = true;
    let renderTask: any = null;

    const renderPage = async () => {
      try {
        setPageLoading(true);
        const page = await pdf.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        // Calculate viewport at current zoom factor
        const viewport = page.getViewport({ scale: zoom });
        
        // Use device pixel ratio for sharp rendering on high-DPI screens
        const dpr = window.devicePixelRatio || 1;
        canvas.height = viewport.height * dpr;
        canvas.width = viewport.width * dpr;
        
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;
        
        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Cancel previous task if one is currently rendering
        if (currentRenderTask.current) {
          currentRenderTask.current.cancel();
        }

        renderTask = page.render(renderContext);
        currentRenderTask.current = renderTask;

        await renderTask.promise;
        currentRenderTask.current = null;

        // Process Text Extractor (OCR-like text layer parsing)
        const textContent = await page.getTextContent();
        if (active) {
          const textItems = textContent.items.map((item: any) => item.str).join(" ");
          setExtractedText(textItems.trim());
        }

        setPageLoading(false);
      } catch (err: any) {
        if (err.name === "RenderingCancelledException" || err.message?.includes("cancelled")) {
          // Normal flow when switching pages rapidly
          return;
        }
        console.error("Error rendering PDF canvas page:", err);
        if (active) {
          setPageLoading(false);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdf, pageNumber, zoom]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > numPages) return;
    setPageNumber(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handleZoom = (factor: number) => {
    if (factor === 0) {
      setZoom(1.25); // Fit reset
    } else {
      setZoom(prev => Math.min(3.0, Math.max(0.5, prev + factor)));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Inline filter for text highlights in scanner tab
  const getHighlightedText = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const parts = text.split(new RegExp(`(${search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-medium px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!activeDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        <div className="bg-white p-4 rounded-full shadow-xs mb-4">
          <FileText className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-800 mb-1">No Active Document</h3>
        <p className="max-w-md text-sm text-slate-500 mb-6">
          Select a PDF from the library on the left, or upload a new file to start annotating and linking notes.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-lg">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="max-w-[180px] sm:max-w-xs">
            <h4 className="text-sm font-semibold text-slate-900 truncate" title={activeDoc.name}>
              {activeDoc.name}
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              Page {pageNumber} of {numPages} • {activeDoc.fileSize}
            </p>
          </div>
        </div>

        {/* Dynamic tab to switch view modes */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab("document")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "document" 
                ? "bg-white text-indigo-700 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            PDF Page Canvas
          </button>
          <button
            onClick={() => setActiveTab("scanner")}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
              activeTab === "scanner" 
                ? "bg-white text-indigo-700 shadow-xs" 
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Text Inspector
          </button>
        </div>
      </div>

      {/* PDF Action Control Bar (Zoom / Pagination) */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 text-slate-700">
        
        {/* Pagination */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handlePageChange(pageNumber - 1)}
            disabled={pageNumber <= 1 || pageLoading}
            className="p-1 px-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  handlePageChange(val);
                }
              }}
              className="w-10 text-center font-semibold text-sm bg-white border border-slate-300 rounded-md py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              title="Enter Page Number"
            />
            <span className="text-xs text-slate-500 font-medium">/ {numPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(pageNumber + 1)}
            disabled={pageNumber >= numPages || pageLoading}
            className="p-1 px-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-bold select-none text-slate-500 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => handleZoom(0.25)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleZoom(0)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grow overflow-auto relative flex justify-center bg-slate-200">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 z-40">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
            <span className="text-sm text-slate-600 font-medium">Opening document stream...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 top-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 z-40">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Could Not Open PDF</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Page loading indicator */}
        {pageLoading && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-xs py-1 px-2.5 rounded-full shadow-md text-xs font-medium text-slate-600 flex items-center gap-1.5 z-30 ring-1 ring-black/5 animate-fade-in">
            <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
            <span>Rendering Page {pageNumber}...</span>
          </div>
        )}

        {/* Tab 1: PDF Viewer Canvas */}
        <div 
          className={`p-6 min-h-full flex items-start justify-center ${activeTab === "document" ? "block" : "hidden"}`}
          style={{ cursor: pageLoading ? "wait" : "default" }}
        >
          <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-300">
            <canvas 
              id={`pdf-canvas-${activeDoc.id}`}
              ref={canvasRef} 
              className="max-w-full block" 
            />
          </div>
        </div>

        {/* Tab 2: Text Inspector / Search Extraction */}
        <div className={`p-6 w-full max-w-4xl h-full flex flex-col justify-between ${activeTab === "scanner" ? "flex" : "hidden"}`}>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
            
            {/* Inner Header with Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-md">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-800">Page text OCR layer</h5>
                  <p className="text-[10px] text-slate-500">Live extracted selectable content on page {pageNumber}</p>
                </div>
              </div>

              {/* Text Search */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter keyterms on page..."
                  value={textSearchQuery}
                  onChange={(e) => setTextSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Extracted Text Board */}
            <div className="p-5 grow overflow-auto bg-white text-sm leading-relaxed text-slate-700 whitespace-pre-wrap select-all selection:bg-indigo-100 selection:text-indigo-900 font-sans">
              {extractedText ? (
                getHighlightedText(extractedText, textSearchQuery)
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">No selectable text found on page {pageNumber}.</p>
                  <p className="text-[10px] mt-1 text-slate-400">This might be a scanned image-only PDF.</p>
                </div>
              )}
            </div>

            {/* Footer Workspace Action panel */}
            {extractedText && (
              <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-500">
                  Tip: Highlight text to copy, or use buttons below to convert to notes.
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(extractedText)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copySuccess ? "Copied!" : "Copy Page"}
                  </button>

                  {onCreateNoteFromText && (
                    <button
                      onClick={() => onCreateNoteFromText(extractedText, pageNumber)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Create Note
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
