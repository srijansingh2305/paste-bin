// app/paste/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PasteData {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string | null;
  viewsRemaining: number | null;
}

export default function PastePage() {
  const params = useParams();
  const [paste, setPaste] = useState<PasteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPaste = async () => {
      try {
        const response = await fetch(`/api/paste/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch paste');
        }

        setPaste(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPaste();
  }, [params.id]);

  const handleCopy = async () => {
    if (paste) {
      await navigator.clipboard.writeText(paste.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading paste...</p>
        </div>
      </main>
    );
  }

  if (error || !paste) {
    return (
      <main className="min-h-screen p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || 'Paste not found'}</p>
          <Link 
            href="/"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Create a new paste
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-800"
        >
          ← Create new paste
        </Link>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopyUrl}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy URL'}
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy Content'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">Paste: {paste.id}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {new Date(paste.createdAt).toLocaleString()}
          </div>
          
          {paste.expiresAt && (
            <div>
              <span className="font-medium">Expires:</span>{' '}
              {new Date(paste.expiresAt).toLocaleString()}
            </div>
          )}
          
          {paste.viewsRemaining !== null && (
            <div>
              <span className="font-medium">Views Remaining:</span>{' '}
              {paste.viewsRemaining}
            </div>
          )}
        </div>

        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto border border-gray-200 whitespace-pre-wrap break-words">
          {paste.content}
        </pre>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>This paste will be automatically deleted after expiry.</p>
      </div>
    </main>
  );
}