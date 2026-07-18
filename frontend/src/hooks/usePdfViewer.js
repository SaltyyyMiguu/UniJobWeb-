import { useState } from 'react';

// Shared "view a PDF" behavior for every resume/offer-letter link in the
// app: on mobile, open the in-app PdfViewerModal instead of navigating away
// to a new tab (which is a much heavier interruption on a phone than on
// desktop); on desktop, keep the existing new-tab behavior exactly as-is.
export function usePdfViewer() {
  const [viewer, setViewer] = useState(null); // { url, title } | null

  const openPdf = (url, title) => {
    if (window.innerWidth <= 768) {
      setViewer({ url, title });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const closePdf = () => setViewer(null);

  return { viewerUrl: viewer?.url ?? null, viewerTitle: viewer?.title ?? null, openPdf, closePdf };
}
