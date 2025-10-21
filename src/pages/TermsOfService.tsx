import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function TermsOfService() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/terms-of-service.md')
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error('Failed to load terms of service:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
