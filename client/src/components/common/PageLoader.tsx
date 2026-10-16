import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  message = 'Carregando página...',
  fullScreen = false,
}) => {
  return (
    <div
      role="status"
      aria-label={message}
      className={`flex flex-col items-center justify-center p-8 ${
        fullScreen ? 'min-h-screen bg-slate-50' : 'min-h-[50vh] w-full'
      }`}
    >
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-3" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
};
