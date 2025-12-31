'use client';

import { useState } from 'react';

interface StudyGuideDisplayProps {
  sourceId: string;
  sourceTitle: string;
}

export function StudyGuideDisplay({ sourceId, sourceTitle }: StudyGuideDisplayProps) {
  const [studyGuide, setStudyGuide] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateGuide = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/ai/study-guide/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate study guide');
      }

      const data = await response.json();
      setStudyGuide(data.studyGuide);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!studyGuide) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">📚 Study Guide</h2>
        <p className="text-gray-600 mb-6">
          Generate a comprehensive study guide for: <strong>{sourceTitle}</strong>
        </p>

        <button
          onClick={generateGuide}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Study Guide...
            </span>
          ) : (
            'Generate Study Guide'
          )}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">{studyGuide.title}</h1>
      <p className="text-gray-500 mb-6">Study Guide</p>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-3">📖 Overview</h2>
        <p className="text-gray-700 leading-relaxed">{studyGuide.overview}</p>
      </section>

      {/* Key Topics */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">🎯 Key Topics</h2>
        <div className="space-y-4">
          {studyGuide.keyTopics.map((topic: any, idx: number) => (
            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="text-lg font-semibold text-gray-900">{topic.topic}</h3>
              <p className="text-gray-700 mb-2">{topic.summary}</p>
              {topic.subtopics.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {topic.subtopics.map((sub: string, subIdx: number) => (
                    <li key={subIdx}>{sub}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Timeline (if available) */}
      {studyGuide.timeline && studyGuide.timeline.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📅 Timeline</h2>
          <div className="space-y-3">
            {studyGuide.timeline.map((event: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4">
                {event.date && <p className="text-sm font-medium text-blue-600 mb-1">{event.date}</p>}
                <h3 className="font-semibold text-gray-900">{event.event}</h3>
                <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                <p className="text-sm text-gray-500 italic mt-2">{event.significance}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vocabulary */}
      {studyGuide.vocabulary.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">📝 Key Vocabulary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studyGuide.vocabulary.map((term: any, idx: number) => (
              <div key={idx} className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">{term.term}</h3>
                <p className="text-sm text-gray-700 mt-1">{term.definition}</p>
                <p className="text-xs text-gray-500 italic mt-2">"{term.context}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Practice Questions */}
      {studyGuide.practiceQuestions.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">❓ Practice Questions</h2>
          <ol className="list-decimal list-inside space-y-2">
            {studyGuide.practiceQuestions.map((question: string, idx: number) => (
              <li key={idx} className="text-gray-700">{question}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Regenerate button */}
      <div className="mt-8 pt-6 border-t">
        <button
          onClick={generateGuide}
          disabled={isGenerating}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
        >
          Regenerate Study Guide
        </button>
      </div>
    </div>
  );
}
