/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Note, SourceDoc } from "../types";

// A 100% valid, self-contained 1-page PDF file that renders beautifully in PDF.js
export const SYSTEM_TUTORIAL_PDF_BASE64 = 
  "JVBERi0xLjQKJVRleHQgYmFzZWQgUERGIHNhbXBsZQoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYgoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2IKNCAgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCi9FbmNvZGluZyAvTWFpbkVuY29kaW5nCj4+CmVuZG9iCjUgMCBvYmoKPDwKL0xlbmd0aCAyNzAKPj4Kc3RyZWFtCkJVCi9GMSAxOCBUZgoxNCAwIDAgMTQgNTAgNzcwIFRkCihXZWxjb21lIHRvIFBERiBOb3RlIFRha2VyISkgVGoKMCAtMjUgVGQKL0YxIDEyIFRmCihUaGlzIGlzIGEgc2VsZi1jb250YWluZWQgc2FtcGxlIGRvY3VtZW50LCByZW5kZXJlZCB2aWEgb3VyIGNhbnZhcyBlbmdpbmUuKSBUagowIC0yMCBUZgooMS4gVXNlIHRoZSAiVGV4dCBJbnNwZWN0b3IiIHRhYiBvbiB0aGUgcmlnaHQgdG8gc2NhbiBhbmQgY29weSB0ZXh0IGZsYXdsZXNzbHkuKSBUagowIC0xNSBUZgooMi4gQ2xpY2sgIkFuY2hvciBOb3RlIiBvbiB0aGUgc2lkZWJhciB0byBsaW5rIHlvdXIgY3VycmVudCBub3RlIHRvIHRoaXMgcGFnZS4pIFRqCjAgLTE1IFRkCihXaGVuIHlvdSBmbGlwIHBhZ2VzLCBnb2luZyBiYWNrIHRvIHRoZSBub3RlIGxldHMgeW91IGp1bXAgYmFjayB3aXRoIDEtY2xpY2suKSBUagowIC0zMCBUZgovRjEgMTEgVGYKKFByZXNzdXJlLWZyZWUgYW5ub3RhdGlvbnMgZm9yIGxlY3R1cmVzLCByZXNlYXJjaCBwYXBlcnMsIGFuZCBzdHVkeSBndWlkZXMuKSBUagpFVAplbmRzdHJlYW0KZW5kb2IKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDA2OSAwMDAwMCBuIAowMDAwMDAwMTI2IDAwMDAwIG4gCjAwMDAwMDAyNTMgMDAwMDAgbiAKMDAwMDAwMDMzOCAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNjYwCiUlRU9GCg==";

export const INITIAL_PDF_DOC: SourceDoc = {
  id: "tutorial_manual",
  name: "Study_Guide_Welcome.pdf",
  fileSize: "0.6 KB",
  totalPages: 1,
  uploadedAt: new Date().toISOString()
};

export const INITIAL_NOTES: Note[] = [
  {
    id: "note_1",
    title: "Welcome to your active study guide",
    content: `# Welcome to PDF Note Taker! 🚀

This is a beautiful and highly integrated client-side note-taking application designed for side-by-side active reading.

## Core Visual Features:
- **Responsive Split Canvas Layout**: The window is split into a PDF Canvas Reader on the left, and a full Markdown text workspace on the right.
- **Auto-Saving Workspace**: Every stroke, word, and tag gets saved instantaneously in your browser's persistent cache.
- **Interactive Text Inspector**: Toggle the PDF tab to **"Text Inspector"** to read, search, and copy exact sentences extracted directly from the paper.

## Markdown Cheat Sheet:
- You can write headers, bold words like **this**, italicise *these*, or create inline code like \`const study = true;\`.
- Use bullet items to group core concepts:
  - Concept Alpha
  - Concept Beta

Click on the other note to see how page anchoring works!`,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    tags: ["welcome", "markdown", "tutorial"],
    isFavorite: true
  },
  {
    id: "note_2",
    title: "Key concepts on PDF Page 1",
    content: `# Key concepts extracted from Page 1

I uploaded the welcome PDF guide and linked this note directly to Page 1. 

Here are the details we scanned from the tutorial paper:
- We can click the "**Go to page**" anchor button above, and the PDF renderer will automatically jump back to Page 1 of \`Study_Guide_Welcome.pdf\`.
- This is super useful for annotating long textbooks, legal folders, or tech specs.

### Extracted Quote:
> "Pressure-free annotations for lectures, research papers, and study guides."

This note is locked and synchronized. We can add tags like \`#page1\` or \`#highlights\`.`,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    tags: ["page1", "annotations"],
    pdfId: "tutorial_manual",
    pdfName: "Study_Guide_Welcome.pdf",
    pdfPage: 1,
    isFavorite: false
  }
];

export function base64ToBlobUrl(base64: string, type: string = "application/pdf"): string {
  try {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error decoding base64 data to blob:", err);
    return "";
  }
}
