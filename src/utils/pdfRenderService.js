/**
 * pdfRenderService.js
 * =========================================================================
 * Client-Side JavaScript / Node.js PDF Renderer for CAD & Blueprint Viewers
 * Renders vector PDF blueprints directly into high-res Canvas/PNG data URLs
 * eliminating any requirement for external Python servers.
 * =========================================================================
 */

import * as pdfjsLib from 'pdfjs-dist';

// Use bundled worker from pdfjs-dist
if (typeof window !== 'undefined') {
    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();
    } catch {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
    }
}

/**
 * Converts PDF (Data URL, Uint8Array, or ArrayBuffer) directly to high-res PNG Data URL
 * @param {string|ArrayBuffer|Uint8Array} pdfInput
 * @param {number} scale - Default 2.5 for razor-sharp blueprint rendering
 * @returns {Promise<string>} PNG Data URL
 */
export async function convertPdfToImageDataUrl(pdfInput, scale = 2.5) {
    if (!pdfInput) throw new Error('PDF input is empty');

    try {
        let loadingTask;

        if (typeof pdfInput === 'string' && pdfInput.startsWith('data:')) {
            // Parse Base64 Data URL
            const base64Index = pdfInput.indexOf(',');
            const base64Data = base64Index !== -1 ? pdfInput.slice(base64Index + 1) : pdfInput;
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({ data: bytes });
        } else if (typeof pdfInput === 'string') {
            loadingTask = pdfjsLib.getDocument(pdfInput);
        } else {
            loadingTask = pdfjsLib.getDocument({ data: pdfInput });
        }

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

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
