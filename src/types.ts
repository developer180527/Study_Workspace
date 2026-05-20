/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  lastAccessed: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  pdfId?: string;      // ID of the linked PDF document
  pdfPage?: number;    // Linked page number in the PDF
  pdfName?: string;    // Human-readable source PDF name
  isFavorite?: boolean;
}

export interface SourceDoc {
  id: string;
  name: string;
  type?: "pdf" | "youtube"; // Defaults to pdf for legacy
  url?: string;        // For sample documents / youtube URL
  blobUrl?: string;    // Local object URL for uploaded files
  fileSize: string;    // Optional/N/A for youtube
  totalPages: number;  // Optional/N/A for youtube
  uploadedAt: string;
}

export interface SearchFilters {
  query: string;
  selectedTag: string | null;
  onlyFavorites: boolean;
  linkedPdfId: string | null;
}
