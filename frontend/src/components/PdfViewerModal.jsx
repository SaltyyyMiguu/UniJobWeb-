import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useTheme } from '../context/ThemeContext';
import { FileText, Download, X, Loader2, AlertTriangle } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// In-app PDF viewer — a small popout box (not a full-screen takeover) that
// renders the PDF itself via react-pdf/pdfjs canvas rendering. Mobile
// browsers generally can't render a PDF embedded in a plain <iframe> (many
// silently fall back to downloading it instead), so this renders pages onto
// a <canvas> ourselves, which works the same regardless of the device's
// native PDF support.
export default function PdfViewerModal({ url, title, onClose }) {
  const { c } = useTheme();
  const [numPages, setNumPages] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pageWidth, setPageWidth] = useState(320);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    const el = bodyRef.current;
    const measure = () => setPageWidth(Math.max(200, el.clientWidth - 24));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!url) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${(title || 'document').replace(/[\\/:*?"<>|]/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-panel" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <FileText size={16} style={{ color: c.red, flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: '700', color: c.txt1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title || 'Document'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button onClick={handleDownload} disabled={downloading} className="btn btn-outline btn-sm">
              {downloading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={13} />}
              Download
            </button>
            <button onClick={onClose} title="Close" className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>
        <div ref={bodyRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px', background: c.surface2 }}>
          {loadError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '40px 16px', textAlign: 'center' }}>
              <AlertTriangle size={22} style={{ color: '#EF4444' }} />
              <p style={{ fontSize: '12px', color: c.txt2, margin: 0 }}>Couldn't load this PDF. Try Download instead.</p>
            </div>
          ) : (
            <Document
              file={url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={() => setLoadError(true)}
              loading={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '40px 0', color: c.txt3, fontSize: '12px' }}>
                  <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading PDF…
                </div>
              }
            >
              {Array.from({ length: numPages || 0 }, (_, i) => (
                <div key={i} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                  <Page pageNumber={i + 1} width={pageWidth} />
                </div>
              ))}
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
