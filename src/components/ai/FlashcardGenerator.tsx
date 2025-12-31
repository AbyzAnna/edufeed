'use client';

import { useState } from 'react';
import { useFlashcardGeneration } from '@/hooks/useAIGeneration';

interface FlashcardGeneratorProps {
  sourceId: string;
  onGenerated?: (deckId: string) => void;
}

export function FlashcardGenerator({ sourceId, onGenerated }: FlashcardGeneratorProps) {
  const { generateFlashcards, isGenerating, error } = useFlashcardGeneration();
  const [count, setCount] = useState(20);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    try {
      setSuccess(false);

      const response = await fetch('/api/ai/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId,
          count,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const data = await response.json();
      setSuccess(true);

      if (onGenerated && data.deck?.id) {
        setTimeout(() => onGenerated(data.deck.id), 1500);
      }
    } catch (err) {
      console.error('Flashcard generation error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">🃏 Generate Flashcards</h3>

      <div className="space-y-4">
        {/* Count selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Cards
          </label>
          <input
            type="number"
            min="5"
            max="50"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
        </div>

        {/* Difficulty selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                  difficulty === level
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isGenerating}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating {count} cards...
            </span>
          ) : (
            `Generate ${count} Flashcards`
          )}
        </button>

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-600 font-medium">
              ✅ Flashcards generated successfully!
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500">
          AI will generate flashcards based on the content of your document.
          Higher difficulty means more complex questions.
        </p>
      </div>
    </div>
  );
}
