'use client';

import { useEffect, useRef, useState } from 'react';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  className?: string;
}

export default function QRCodeGenerator({ url, size = 128, className = '' }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !url) return;

      setIsGenerating(true);
      
      try {
        // Simple QR code generation using canvas
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Set background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Generate simple QR pattern (simplified version)
        const cellSize = Math.floor(size / 21); // 21x21 grid
        ctx.fillStyle = '#000000';
        
        // Draw border
        for (let i = 0; i < 21; i++) {
          for (let j = 0; j < 21; j++) {
            // Simple pattern - in a real implementation, use a QR library
            if ((i < 7 && j < 7) || (i < 7 && j > 13) || (i > 13 && j < 7)) {
              // Position markers
              if ((i === 0 || i === 6 || j === 0 || j === 6) || 
                  (i === 2 && j === 2) || (i === 2 && j === 4) || (i === 4 && j === 2) || (i === 4 && j === 4)) {
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
              }
            } else {
              // Data area - simple pattern based on URL hash
              const shouldFill = (i * 21 + j) % 3 === (url.length % 3);
              if (shouldFill) {
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateQRCode();
  }, [url, size]);

  const downloadQRCode = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `mark6-share-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="border border-gray-200 rounded-lg"
        />
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-sm text-gray-600">Generating...</div>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex gap-2">
        <button
          onClick={downloadQRCode}
          disabled={isGenerating}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
        >
          Download QR
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
        >
          Copy Link
        </button>
      </div>
    </div>
  );
}