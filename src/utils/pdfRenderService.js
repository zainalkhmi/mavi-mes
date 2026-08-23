/**
 * pdfRenderService.js
 * =========================================================================
 * Client-Side JavaScript / Node.js PDF Renderer for CAD & Blueprint Viewers
 * Renders vector PDF blueprints directly into high-res Canvas/PNG data URLs
 * eliminating any requirement for external Python servers.
 * =========================================================================
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdfjs worker for Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/build/pdf.worker.min.mjs`;
}

/**
 * Converts PDF (Data URL, Blob, Uint8Array, or ArrayBuffer) directly to high-res PNG Data URL
 * @param {string|ArrayBuffer|Uint8Array|Blob} pdfInput
 * @param {number} scale - Default 2.5 for razor-sharp blueprint rendering
 * @returns {Promise<string>} PNG Data URL
 */
export async function convertPdfToImageDataUrl(pdfInput, scale = 2.5) {
    if (!pdfInput) throw new Error('PDF input is empty');

    try {
        let pdfData;

        if (pdfInput instanceof Uint8Array) {
            pdfData = pdfInput;
        } else if (pdfInput instanceof ArrayBuffer) {
            pdfData = new Uint8Array(pdfInput);
        } else if (typeof pdfInput === 'string' && (pdfInput.startsWith('data:') || pdfInput.startsWith('blob:') || pdfInput.startsWith('http'))) {
            const res = await fetch(pdfInput);
            const buf = await res.arrayBuffer();
            pdfData = new Uint8Array(buf);
        } else if (typeof pdfInput === 'string') {
            // Assume raw base64 string
            const base64Data = pdfInput.includes(',') ? pdfInput.split(',')[1] : pdfInput;
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            pdfData = bytes;
        } else {
            throw new Error('Unsupported PDF input type');
        }

        const loadingTask = pdfjsLib.getDocument({
            data: pdfData,
            cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/cmaps/`,
            cMapPacked: true,
            standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/standard_fonts/`
        });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);

        // Fill white background for technical drawings
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        return canvas.toDataURL('image/png', 0.95);
    } catch (err) {
        console.error('[pdfRenderService] PDF rendering error:', err);
        throw err;
    }
}
