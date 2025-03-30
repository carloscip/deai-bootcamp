'use client';

import { useState } from 'react';
import { extractCharacters } from './utils/characterExtractor';

export default function Home() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const characters = await extractCharacters(text);
      setResult(JSON.stringify(characters, null, 2));
    } catch (error) {
      console.error('Error processing file:', error);
      setResult('Error al procesar el archivo. Por favor, intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Extractor de Personajes</h1>
        
        <div className="mb-8">
          <label className="block mb-2">
            <span className="sr-only">Seleccionar archivo</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              disabled={isLoading}
            />
          </label>
        </div>

        <div className="relative">
          <textarea
            value={result}
            readOnly
            className="w-full h-96 p-4 border rounded-lg"
            placeholder="Los personajes extraídos aparecerán aquí..."
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
