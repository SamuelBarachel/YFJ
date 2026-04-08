import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Adding 'export default' so you can use it elsewhere
export default function ReportDisplay({ content }) {
  if (!content) return null; // Don't show anything if there's no report yet

  return (
    <div className="glass-panel p-6 mt-6 border border-white/10 rounded-3xl bg-white/5 backdrop-blur-md">
      <h4 className="text-[#9b72f3] font-bold mb-4 uppercase tracking-widest text-xs">
        AI Compiled Report
      </h4>
      <div className="prose prose-invert max-w-none text-gray-300">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}