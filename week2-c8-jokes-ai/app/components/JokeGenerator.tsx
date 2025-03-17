'use client';

import { useState } from 'react';

interface JokeFormData {
  topic: string;
  tone: string;
  type: string;
  language: string;
  temperature: number;
}

interface JokeEvaluation {
  funnyScore: number;
  appropriateScore: number;
  offensiveScore: number;
  explanation: string;
}

const topics = ['work', 'people', 'animals', 'food', 'tech', 'history', 'politics'];
const tones = ['witty', 'sarcastic', 'silly', 'dark', 'goofy'];
const jokeTypes = ['pun', 'knock-knock', 'story'];
const languages = ['spanish', 'english'];

export default function JokeGenerator() {
  const [joke, setJoke] = useState<string>('');
  const [evaluation, setEvaluation] = useState<JokeEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [formData, setFormData] = useState<JokeFormData>({
    topic: topics[0],
    tone: tones[0],
    type: jokeTypes[0],
    language: languages[0],
    temperature: 0.7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEvaluation(null);
    
    try {
      const response = await fetch('/api/generate-joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setJoke(data.joke);
      
      // Automatically evaluate the joke after generation
      if (data.joke) {
        evaluateJoke(data.joke);
      }
    } catch (error) {
      console.error('Error generating joke:', error);
    } finally {
      setLoading(false);
    }
  };

  const evaluateJoke = async (jokeText: string) => {
    setEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-joke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          joke: jokeText,
          topic: formData.topic,
          tone: formData.tone,
          type: formData.type,
        }),
      });
      const data = await response.json();
      setEvaluation(data);
    } catch (error) {
      console.error('Error evaluating joke:', error);
    } finally {
      setEvaluating(false);
    }
  };

  // Function to render score badges with appropriate colors
  const renderScoreBadge = (score: number, label: string) => {
    let colorClass = "bg-gray-200";
    if (label === "Funny") {
      colorClass = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";
    } else if (label === "Appropriate") {
      colorClass = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-500" : "bg-red-500";
    } else if (label === "Offensive") {
      colorClass = score <= 3 ? "bg-green-500" : score <= 6 ? "bg-yellow-500" : "bg-red-500";
    }
    
    return (
      <span className={`${colorClass} text-white px-2 py-1 rounded-full text-sm font-semibold`}>
        {label}: {score}/10
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Joke Generator</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Topic
            <select
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Tone
            <select
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {tones.map((tone) => (
                <option key={tone} value={tone}>
                  {tone.charAt(0).toUpperCase() + tone.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Type of Joke
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {jokeTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Language
            <select
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {languages.map((language) => (
                <option key={language} value={language}>
                  {language.charAt(0).toUpperCase() + language.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Creativity Level (Temperature)
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              className="mt-1 block w-full"
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.temperature} (Lower = more focused, Higher = more creative)
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Joke'}
        </button>
      </form>

      {joke && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Your Generated Joke:</h2>
          <p className="text-lg">{joke}</p>
          
          {evaluating && (
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full"></div>
                <div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full"></div>
                <div className="animate-pulse bg-blue-500 h-2 w-2 rounded-full"></div>
                <span className="text-sm text-gray-500">Evaluating joke...</span>
              </div>
            </div>
          )}
          
          {evaluation && (
            <div className="mt-4 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Joke Evaluation:</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {renderScoreBadge(evaluation.funnyScore, "Funny")}
                {renderScoreBadge(evaluation.appropriateScore, "Appropriate")}
                {renderScoreBadge(evaluation.offensiveScore, "Offensive")}
              </div>
              <p className="text-sm text-gray-700">{evaluation.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}