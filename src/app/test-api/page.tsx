'use client';

import { useEffect, useState } from 'react';

export default function TestApiPage() {
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // Test the API URL configuration
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://drvyn-backend.vercel.app';
    setApiUrl(url);
    
    console.log('Test page - API URL:', url);
    console.log('Test page - Environment variable:', process.env.NEXT_PUBLIC_API_BASE_URL);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Configuration Test</h1>
      <div className="space-y-4">
        <div>
          <strong>API Base URL:</strong> {apiUrl}
        </div>
        <div>
          <strong>Environment Variable:</strong> {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}
        </div>
        <div>
          <strong>Full Login URL:</strong> {apiUrl}/admin/login
        </div>
      </div>
    </div>
  );
}

