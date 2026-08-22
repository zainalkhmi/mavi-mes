/**
 * Report Designer Wrapper - Handles pdfme loading issues
 */

import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';

const ReportDesignerFallback = () => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-950">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText size={32} className="text-gray-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-200 mb-2">Report Designer</h2>
        <p className="text-gray-500 mb-6">
          Loading the PDF report designer...
        </p>
        {hasError ? (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle size={18} />
              <span className="font-medium">Failed to load Report Designer</span>
            </div>
            <p className="text-sm text-gray-400">
              There was an error loading the pdfme library. This can happen after updates.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <RefreshCw size={18} className="animate-spin" />
            <span>Loading...</span>
          </div>
        )}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
          >
            Retry Loading
          </button>
          {retryCount > 2 && (
            <p className="text-xs text-gray-600">
              Try stopping the dev server and running `npm run dev` again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDesignerFallback;
