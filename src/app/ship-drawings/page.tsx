'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ZoomIn, ZoomOut, RotateCcw, Home as HomeIcon, Plus, Minus, RefreshCw, Zap } from 'lucide-react';
import { wifiService } from '../../lib/wifiService';
import { getBrowserClient } from '../../lib/supabaseClient';

// Add type declaration for PDF.js on window object
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// This is our Ship Drawings page with PDF viewer functionality
export default function ShipDrawingsPage() {
  const searchParams = useSearchParams();
  // State variables for PDF viewer
  const [pdfDocs, setPdfDocs] = useState<string[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(2.0); // Start with 200% zoom for better visibility
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomPercent, setZoomPercent] = useState<number>(200);
  const [wifiOfflineData, setWifiOfflineData] = useState<Array<{dk: string, ap_name: string, device_name: string, user: string}>>([]);
  const [wifiLoading, setWifiLoading] = useState<boolean>(false);
  const [cabinOfflineData, setCabinOfflineData] = useState<Array<{dk: string, wifi: number, phone: number, tv: number, total: number}>>([]);
  const [cabinLoading, setCabinLoading] = useState<boolean>(false);
  const [viewType, setViewType] = useState<'wifi-public' | 'cabin-view' | null>(null);
  const [debug, setDebug] = useState<string>('');

  // Use refs for panning state to avoid re-renders during pan operations
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const translateXRef = useRef<number>(0);
  const translateYRef = useRef<number>(0);

  // Refs for canvas and PDF rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperDivRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const pageRenderingRef = useRef<boolean>(false);
  const pageNumRef = useRef<number>(1);
  const pageNumPendingRef = useRef<number | null>(null);

  // Load available PDF list based on selected view type
  useEffect(() => {
    // Only proceed if a view type is selected
    if (!viewType) {
      setPdfDocs([]);
      setSelectedPdf('');
      return;
    }
    
    // Reset any errors when changing view type
    setError(null);
    
    if (viewType === 'wifi-public') {
      // List of available PDFs from the public/pdfs folder for WiFi Public view
      const availablePdfs = [
        'DK_00.pdf', 'DK_01.pdf', 'DK_02.pdf', 'DK_03.pdf',
        'DK_04.pdf', 'DK_05.pdf', 'DK_06.pdf', 'DK_07.pdf',
        'DK_08.pdf', 'DK_09.pdf', 'DK_10.pdf', 'DK_11.pdf',
        'DK_12.pdf', 'DK_14.pdf', 'DK_15.pdf', 'DK_16.pdf',
        'DK_17.pdf', 'DK_18.pdf', 'DK_19.pdf', 'DK_20.pdf',
        'DK_TT.pdf', 'DK_TW.pdf'
      ];
      
      setPdfDocs(availablePdfs);
      // Don't auto-select a PDF, let user choose
      setSelectedPdf('');
    } else if (viewType === 'cabin-view') {
      // List of available PDFs for Cabin View
      const cabinPdfs = [
        'DK_00_TW.pdf', 'DK_01_02.pdf', 'DK_03_04.pdf', 
        'DK_05_06.pdf', 'DK_07_08.pdf', 'DK_09_10.pdf', 
        'DK_11_12.pdf', 'DK_14_15.pdf', 'DK_16_17.pdf'
      ];
      
      setPdfDocs(cabinPdfs);
      // Don't auto-select a PDF, let user choose
      setSelectedPdf('');
    }
  }, [viewType]);

  // Load WiFi offline data only when a view type is selected AND user is authenticated
  useEffect(() => {
    if (!viewType) return;
    
    const fetchOfflineData = async () => {
      setWifiLoading(true);
      setCabinLoading(true);
      try {
        // Ensure we are authenticated before issuing any REST queries
        const client = getBrowserClient();
        if (!client) {
          console.warn('[ShipDrawings] No Supabase client, skipping data fetch');
          setWifiLoading(false);
          setCabinLoading(false);
          return;
        }
        // Poll briefly for an active session to avoid INITIAL_SESSION fetches
        const deadline = Date.now() + 2000;
        let sessionReady = false;
        while (Date.now() < deadline) {
          const { data: { session } } = await client.auth.getSession();
          if (session?.access_token) { sessionReady = true; break; }
          await new Promise(r => setTimeout(r, 100));
        }
        if (!sessionReady) {
          console.warn('[ShipDrawings] No active session after wait; skipping data fetch');
          setWifiLoading(false);
          setCabinLoading(false);
          return;
        }
        // Fetch public WiFi offline data for WIFI Public view
        const publicData = await wifiService.getPublicWifiOfflineData();
        setWifiOfflineData(publicData);
        
        // Fetch cabin offline data from all three tables (WiFi, PBX, TV)
        const cabinRawData = await wifiService.getCabinOfflineData();
        
        // Process cabin data (group by DK and device type)
        const cabinData: {[key: string]: {wifi: number, phone: number, tv: number, total: number}} = {};
        
        // Initialize the data structure
        cabinRawData.forEach(item => {
          const dk = item.dk;
          if (!cabinData[dk]) {
            cabinData[dk] = { wifi: 0, phone: 0, tv: 0, total: 0 };
          }
          
          // Count by device type
          if (item.device_type === 'wifi') {
            cabinData[dk].wifi += 1;
          } else if (item.device_type === 'pbx') {
            cabinData[dk].phone += 1;
          } else if (item.device_type === 'tv') {
            cabinData[dk].tv += 1;
          }
          
          // Increment total count
          cabinData[dk].total += 1;
        });
        
        // Convert to array format for the table
        const cabinOffline = Object.entries(cabinData).map(([dk, counts]) => ({
          dk,
          wifi: counts.wifi,
          phone: counts.phone,
          tv: counts.tv,
          total: counts.total
        }));
        
        // Sort by DK number
        cabinOffline.sort((a, b) => {
          const dkA = parseInt(a.dk.replace('DK', ''));
          const dkB = parseInt(b.dk.replace('DK', ''));
          return dkA - dkB;
        });
        
        setCabinOfflineData(cabinOffline);
      } catch (error) {
        console.error('Error fetching WiFi offline data:', error);
        setWifiOfflineData([]);
        setCabinOfflineData([]);
      } finally {
        setWifiLoading(false);
        setCabinLoading(false);
      }
    };

    fetchOfflineData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchOfflineData, 300000);
    
    return () => clearInterval(interval);
  }, [viewType]);

  // Function to get the correct PDF path based on view type
  const getPdfPath = (pdfName: string) => {
    if (viewType === 'wifi-public') {
      return `/pdfs/${pdfName}`;
    } else {
      // For cabin view, use the PDFs from the public folder
      // We need to use a path that's accessible via the web server
      return `/pdfs/cabin/${pdfName}`;
    }
  };

  // Load PDF.js library dynamically to avoid SSR issues in Next.js
  useEffect(() => {
    // Load PDF.js library dynamically
    const loadPdfLibrary = async () => {
      try {
        // Import the main library
        const pdfjs = await import('pdfjs-dist');
        
        // Set the worker source to the local file we copied to public/
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

        // iOS Safari reliability tweaks (avoid streaming/range requests)
        try {
          // @ts-ignore
          pdfjs.disableStream = true;
          // @ts-ignore
          pdfjs.disableRange = true;
        } catch {}
        
        // Add to window object for easier access
        // @ts-ignore
        window.pdfjsLib = pdfjs;
        console.log('PDF.js library loaded successfully with version:', pdfjs.version);
      } catch (err) {
        console.error('Error loading PDF.js library:', err);
        setError('Failed to load PDF viewer library: ' + (err instanceof Error ? err.message : String(err)));
        setDebug((d) => d + `lib: ${(err as any)?.message || String(err)}\n`);
      }
    };

    loadPdfLibrary();
  }, []);

  // Effect to load the selected PDF
  useEffect(() => {
    if (!selectedPdf || typeof window === 'undefined' || !window.pdfjsLib) return;
    
    // Reset any previous errors
    setError(null);
    
    const loadSelectedPdf = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (pdfDocRef.current) {
          pdfDocRef.current.destroy();
          pdfDocRef.current = null;
        }
        
        // Get the correct path based on view type
        const pdfPath = getPdfPath(selectedPdf);
        console.log('Loading PDF from:', pdfPath);
        setDebug((d) => d + `select: ${pdfPath}\n`);

        // Probe the PDF URL (non-blocking): some CDNs return 404 to HEAD on iOS
        // Use GET with a small Range to avoid full download; proceed regardless of result
        try {
          const probe = await fetch(pdfPath, { method: 'GET', headers: { Range: 'bytes=0-0' }, cache: 'no-store' });
          setDebug((d) => d + `probe: ${probe.status} ${probe.headers.get('content-type') || ''}\n`);
        } catch (e: any) {
          setDebug((d) => d + `probe_err: ${e?.message || String(e)}\n`);
          // Continue to attempt loading via PDF.js
        }
        
        // Prefer fetching the PDF ourselves for iOS reliability, then pass ArrayBuffer to PDF.js
        let pdfDoc: any = null;
        try {
          const resp = await fetch(pdfPath, { cache: 'no-store' });
          setDebug((d) => d + `fetch: ${resp.status} ${resp.headers.get('content-type') || ''}\n`);
          if (!resp.ok) {
            throw new Error(`fetch failed status=${resp.status}`);
          }
          const ab = await resp.arrayBuffer();
          const loadingTask = window.pdfjsLib.getDocument({ data: ab, disableStream: true, disableRange: true, disableAutoFetch: true });
          pdfDoc = await loadingTask.promise;
        } catch (fetchErr: any) {
          setDebug((d) => d + `fetch_err: ${fetchErr?.message || String(fetchErr)}\n`);
          // Fallback: let PDF.js fetch by URL
          const loadingTask = window.pdfjsLib.getDocument({ url: pdfPath, disableStream: true, disableRange: true, disableAutoFetch: true });
          pdfDoc = await loadingTask.promise;
        }
        
        // Store the PDF document in the ref
        pdfDocRef.current = pdfDoc;
        
        // Reset page number
        pageNumRef.current = 1;
        
        // Fit PDF to page on initial load and get the calculated scale
        const calculatedScale = await fitToPage();
        
        // Render the first page with the fitted scale immediately
        await renderPage(1, calculatedScale);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(`Failed to load PDF: ${selectedPdf}. ${err instanceof Error ? err.message : String(err)}`);
        setDebug((d) => d + `load_err: ${(err as any)?.message || String(err)}\n`);
      } finally {
        setLoading(false);
      }
    };
    
    loadSelectedPdf();
  }, [selectedPdf]);

  // Function to render a specific page
  const renderPage = async (pageNum: number, useScale?: number) => {
    if (pageRenderingRef.current) {
      pageNumPendingRef.current = pageNum;
      return;
    }
    
    pageRenderingRef.current = true;
    setError(null); // Clear any previous errors
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Cannot render PDF in server-side environment');
      }
      
      const canvas = canvasRef.current;
      if (!canvas || !pdfDocRef.current) {
        throw new Error('Canvas or PDF document reference not available');
      }
      
      // Validate canvas is still in DOM and accessible
      if (!canvas.isConnected || !document.contains(canvas)) {
        console.warn('Canvas element is not connected to DOM, skipping render');
        pageRenderingRef.current = false;
        return;
      }
      
      // Get the page first
      const page = await pdfDocRef.current.getPage(pageNum);
      
      // Force a reflow before working with canvas
      document.body.offsetHeight;
      
      // Set explicit dimensions on the canvas
      const currentScale = useScale !== undefined ? useScale : scale;
      const viewport = page.getViewport({ scale: currentScale });
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Validate canvas dimensions are reasonable
      const targetWidth = Math.floor(viewport.width * pixelRatio);
      const targetHeight = Math.floor(viewport.height * pixelRatio);
      
      if (targetWidth <= 0 || targetHeight <= 0 || targetWidth > 32767 || targetHeight > 32767) {
        throw new Error(`Invalid canvas dimensions: ${targetWidth}x${targetHeight}`);
      }
      
      // Set display size (css pixels)
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      
      // Set actual size in memory (scaled to device)
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      console.log('Canvas size set:', canvas.width, 'x', canvas.height);
      console.log('Canvas element exists:', !!canvas);
      console.log('Canvas connected to DOM:', canvas.isConnected);
      
      // Give browser more time to update canvas
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simple context acquisition - revert to working version
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Could not get canvas 2D context');
        setError('Unable to initialize PDF viewer. Please refresh the page.');
        pageRenderingRef.current = false;
        return;
      }
      
      // Reset the canvas and clear it
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set up the render context
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      // Apply transform to wrapper div, not the canvas (this is key to proper rendering)
      if (wrapperDivRef.current) {
        wrapperDivRef.current.style.transform = `translate(${translateXRef.current}px, ${translateYRef.current}px)`;
      }

      // Render the page
      const renderTask = page.render(renderContext);
      
      // Update page number and wait for render to complete
      pageNumRef.current = pageNum;
      await renderTask.promise;
      
      // Check if there's a pending page
      if (pageNumPendingRef.current !== null && pageNumPendingRef.current !== pageNum) {
        const pendingPage = pageNumPendingRef.current;
        pageNumPendingRef.current = null;
        renderPage(pendingPage);
      } else {
        pageRenderingRef.current = false;
      }
    } catch (err) {
      console.error('Failed to render PDF page:', err);
      setError('Failed to render PDF page: ' + (err instanceof Error ? err.message : String(err)));
      setDebug((d) => d + `render_err: ${(err as any)?.message || String(err)}\n`);
      pageRenderingRef.current = false;
    }
  };

  // Zoom in/out functions
  const zoomIn = () => {
    const newScale = scale * 1.2;
    setScale(newScale);
    setZoomPercent(Math.round(newScale * 100));
    
    // Re-render with new scale only if canvas and PDF are available
    if (pageNumRef.current && canvasRef.current && pdfDocRef.current) {
      renderPage(pageNumRef.current);
    }
  };

  const zoomOut = () => {
    const newScale = scale / 1.2;
    setScale(newScale);
    setZoomPercent(Math.round(newScale * 100));
    
    // Re-render with new scale only if canvas and PDF are available
    if (pageNumRef.current && canvasRef.current && pdfDocRef.current) {
      renderPage(pageNumRef.current);
    }
  };

  // Function to fit PDF to page using direct viewport calculation
  const fitToPage = async () => {
    if (!pdfDocRef.current) return;
    
    try {
      // Get the first page to calculate dimensions
      const page = await pdfDocRef.current.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Use direct viewport calculation - more reliable than container measurement
      // Account for sidebar (188px) and padding
      const availableWidth = window.innerWidth - 240; // Sidebar + padding
      const availableHeight = window.innerHeight - 140; // Header + padding
      
      console.log('Fit to page - Available space:', availableWidth, 'x', availableHeight);
      console.log('Fit to page - PDF dimensions:', viewport.width, 'x', viewport.height);
      
      // Calculate scale to fit both width and height
      const scaleX = availableWidth / viewport.width;
      const scaleY = availableHeight / viewport.height;
      
      // For wide drawings, prefer width-based scaling with some height tolerance
      const aspectRatio = viewport.width / viewport.height;
      let optimalScale;
      
      if (aspectRatio > 2.5) {
        // Very wide drawing - prioritize width fit but ensure height isn't too small
        optimalScale = Math.min(scaleX, scaleY * 1.2, 1.5); // Allow 20% height overflow, cap at 150%
      } else {
        // Normal aspect ratio - use standard fit
        optimalScale = Math.min(scaleX, scaleY, 1.5); // Cap at 150% max
      }
      
      // Ensure reasonable scale bounds
      const finalScale = Math.max(Math.min(optimalScale, 1.5), 0.3);
      
      console.log('Fit to page - Scale calculations: scaleX =', scaleX, ', scaleY =', scaleY);
      console.log('Fit to page - Final scale:', finalScale);
      
      // Set the calculated scale
      setScale(finalScale);
      setZoomPercent(Math.round(finalScale * 100));
      
      // Reset position to center and ensure proper positioning
      translateXRef.current = 0;
      translateYRef.current = 0;
      
      if (wrapperDivRef.current) {
        wrapperDivRef.current.style.transform = 'translate(0px, 0px)';
        // Ensure the wrapper is properly positioned
        wrapperDivRef.current.style.left = '0px';
        wrapperDivRef.current.style.top = '0px';
      }
      
      console.log('Fit to page SUCCESS - Final scale applied:', finalScale);
    
    // Return the calculated scale so it can be used immediately
    return finalScale;
    
  } catch (err) {
    console.error('Error calculating fit-to-page scale:', err);
    // Fallback to a reasonable default scale
    setScale(0.8);
    setZoomPercent(80);
    return 0.8;
  }
};

  const resetZoom = () => {
    // Reset zoom to default
    setScale(1.0);
    setZoomPercent(100);
    
    // Reset position
    translateXRef.current = 0;
    translateYRef.current = 0;
    
    if (wrapperDivRef.current) {
      wrapperDivRef.current.style.transform = 'translate(0px, 0px)';
    }
    
    // Re-render only if canvas and PDF are available
    if (pageNumRef.current && canvasRef.current && pdfDocRef.current) {
      renderPage(pageNumRef.current);
    }
  };
  
  // Function to display error on canvas
  const showPDFError = (pdfName: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;
    
    // Clear canvas
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw error text
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.fillText(`Failed to load PDF: ${pdfName}`, 50, 200);
  };

  // Pan functionality with improved responsiveness using refs
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    // Set initial position
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    
    // Change cursor to grabbing
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'grabbing';
    }
    
    console.log('Mouse down at:', e.clientX, e.clientY);
  };

  // Use a wrapper div ref to directly manipulate the DOM for smoother panning
  // handleMouseMove function
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default browser behavior
    e.stopPropagation(); // Stop event bubbling
    
    // Calculate the movement delta
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    
    // Update the translation values directly in refs
    const newTranslateX = translateXRef.current + dx;
    const newTranslateY = translateYRef.current + dy;
    
    // Store the new translation values
    translateXRef.current = newTranslateX;
    translateYRef.current = newTranslateY;
    
    // Apply transform directly to DOM for immediate response (no React re-render)
    if (wrapperDivRef.current) {
      wrapperDivRef.current.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px)`;
    }
    
    // Update current position refs for the next move
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop event bubbling
    
    setIsDragging(false);
    
    // Cursor should be grab when not dragging
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'grab';
      // No need to parse transform values since we've been tracking them in refs
      console.log('Final position saved:', translateXRef.current, translateYRef.current);
    }
  };
  
  // Handle mouse leave as mouse up
  const handleMouseLeave = (e: React.MouseEvent) => {
    console.log('Mouse leave');
    if (isDragging) {
      handleMouseUp(e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 px-4 py-3 relative sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-slate-400 hover:text-white">
            <HomeIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">
              <span className="text-green-500">Beaty</span>
              <span className="text-orange-500">.pro</span>
            </span>
          </div>
        </div>
        
        <div className="absolute top-1/2 transform -translate-y-1/2" style={{ left: 'calc(50% + 64px)' }}>
          <h1 className="text-xl font-semibold text-white">Ship Drawings</h1>
        </div>

        {searchParams?.get('debug') === '1' && (
          <div className="mt-3 text-xs text-slate-400 whitespace-pre-wrap break-words text-left max-w-3xl mx-auto">
            <div className="font-semibold text-slate-300">Debug</div>
            <pre className="overflow-auto max-h-40">{debug}</pre>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-100 mb-4 text-center">D.1401</h2>
          
          {/* Drawing type selection dropdown */}
          <div className="mb-4">
            <label htmlFor="drawing-type-select" className="block text-sm font-medium text-slate-300 mb-1 text-center">
              Select Drawing Type:
            </label>
            <select
              id="drawing-type-select"
              className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-center"
              value={viewType || ''}
              onChange={(e) => setViewType(e.target.value as 'wifi-public' | 'cabin-view')}
            >
              <option value="">-- Select Drawing Type --</option>
              <option value="wifi-public">WIFI Public</option>
              <option value="cabin-view">Cabin View</option>
            </select>
          </div>
          
          {/* PDF selection dropdown - Only show when view type is selected */}
          {viewType && (
            <div className="mb-4">
              <label htmlFor="pdf-select" className="block text-sm font-medium text-slate-300 mb-1 text-center">
                Select Deck Drawing:
              </label>
              <select
                id="pdf-select"
                className="w-full bg-slate-700 border border-slate-600 text-slate-100 rounded px-3 py-2 text-center"
                value={selectedPdf}
                onChange={(e) => setSelectedPdf(e.target.value)}
              >
                <option value="">-- Select Deck --</option>
                {pdfDocs.map((pdf) => (
                  <option key={pdf} value={pdf}>
                    {pdf.replace('.pdf', '')}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Zoom controls */}
          {viewType && (
            <div className="mb-4">
              <h3 className="text-md font-medium text-slate-300 mb-2 text-center">Zoom Controls</h3>
              <div className="flex space-x-2 flex-wrap justify-center">
                <button 
                  onClick={zoomIn} 
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  <span>In</span>
                </button>
                <button 
                  onClick={zoomOut} 
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 px-3 py-2 rounded flex items-center"
                >
                  <Minus size={16} className="mr-1" />
                  <span>Out</span>
                </button>
                <button 
                  onClick={() => { fitToPage(); setTimeout(() => renderPage(pageNumRef.current), 100); }} 
                  className="bg-teal-600 hover:bg-teal-500 text-slate-100 px-3 py-2 rounded flex items-center"
                >
                  <ZoomIn size={16} className="mr-1" />
                  <span>Fit</span>
                </button>
              </div>
              <div className="mt-2 text-center text-slate-300">
                Zoom: {Math.round(scale * 100)}%
              </div>
            </div>
          )}
          
          {/* Public WiFi Offline Table - Only show for WiFi Public view */}
          {viewType === 'wifi-public' && (
            <div className="mb-4">
              <h3 className="text-md font-medium text-slate-300 mb-2 text-center">Public WiFi Offline</h3>
            {wifiLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={16} className="animate-spin text-blue-500 mr-2" />
                <span className="text-slate-400 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="bg-slate-700 rounded border border-slate-600 max-h-64 overflow-y-auto">
                {wifiOfflineData.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-600 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-center text-slate-200 font-medium">DK</th>
                        <th className="px-2 py-1 text-center text-slate-200 font-medium">AP Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wifiOfflineData.map((item, index) => (
                        <tr key={index} className="border-t border-slate-600 hover:bg-slate-600">
                          <td className="px-2 py-1 text-center text-slate-300">{item.dk}</td>
                          <td className="px-2 py-1 text-center text-slate-300 truncate flash-offline font-bold" title={item.ap_name}>{item.ap_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-3 text-center text-slate-400 text-sm">
                    No offline WiFi devices found
                  </div>
                )}
              </div>
            )}
            </div>
          )}
          
          {/* Cabin View Offline Table - Only show for Cabin View */}
          {viewType === 'cabin-view' && (
            <div className="mb-4">
              <h3 className="text-md font-medium text-slate-300 mb-2 text-center">Cabin Offline Devices</h3>
            {cabinLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={16} className="animate-spin text-blue-500 mr-2" />
                <span className="text-slate-400 text-sm">Loading...</span>
              </div>
            ) : (
              <div className="bg-slate-700 rounded border border-slate-600 max-h-64 overflow-y-auto">
                {cabinOfflineData.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-600 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-center text-slate-200 font-medium">DK</th>
                        <th className="px-2 py-1 text-center text-blue-400 font-medium">WIFI</th>
                        <th className="px-2 py-1 text-center text-green-400 font-medium">PBX</th>
                        <th className="px-2 py-1 text-center text-purple-400 font-medium">TV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cabinOfflineData.map((item, index) => (
                        <tr key={index} className="border-t border-slate-600 hover:bg-slate-600">
                          <td className="px-2 py-1 text-center text-slate-300">{item.dk}</td>
                          <td className="px-2 py-1 text-center text-slate-300">
                            <span className={item.wifi > 0 ? "text-red-500 flash-offline font-bold" : "text-slate-300"}>{item.wifi}</span>
                          </td>
                          <td className="px-2 py-1 text-center text-slate-300">
                            <span className={item.phone > 0 ? "text-red-500 flash-offline font-bold" : "text-slate-300"}>{item.phone}</span>
                          </td>
                          <td className="px-2 py-1 text-center text-slate-300">
                            <span className={item.tv > 0 ? "text-red-500 flash-offline font-bold" : "text-slate-300"}>{item.tv}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-3 text-center text-slate-400 text-sm">
                    No offline WiFi devices found
                  </div>
                )}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Main PDF viewer area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {loading && (
            <div className="absolute inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-10">
              <RefreshCw size={48} className="animate-spin text-blue-500" />
              <span className="ml-2 text-slate-100">Loading PDF...</span>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-10">
              <div className="bg-red-900 text-white p-4 rounded shadow-lg max-w-lg">
                <h3 className="text-lg font-semibold mb-2">PDF Viewer Error</h3>
                <p className="mb-4">{error}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh Page
                  </button>
                  <button 
                    onClick={() => setError(null)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex-1 relative overflow-hidden">
            {/* Welcome message when no selections made */}
            {(!viewType || !selectedPdf) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-slate-300 max-w-md mx-auto px-6">
                  <div className="text-6xl mb-4">🚢</div>
                  <h2 className="text-2xl font-bold mb-4">Ship Drawings Viewer</h2>
                  <p className="text-lg mb-2">
                    {!viewType 
                      ? "Please select a drawing type to get started" 
                      : "Please select a deck drawing to view"
                    }
                  </p>
                  <p className="text-sm text-slate-400">
                    Choose from WIFI Public or Cabin View, then select a specific deck drawing to display.
                  </p>
                </div>
              </div>
            )}
            
            {/* PDF Canvas - Only show when both selections are made */}
            {viewType && selectedPdf && (
              <div
                ref={wrapperDivRef}
                className="absolute inset-0 flex items-center justify-center overflow-visible"
                style={{ transform: `translate(${translateXRef.current || 0}px, ${translateYRef.current || 0}px)` }}
              >
                <canvas 
                  ref={canvasRef} 
                  className=""
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
