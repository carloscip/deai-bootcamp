'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { useCharacters } from '../context/CharacterContext';

interface Character {
  name: string;
  description: string;
  personality: string;
}

export default function CharacterExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { characters, setCharacters } = useCharacters();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/plain') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a .txt file');
      setFile(null);
    }
  };

  const extractCharacters = async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract-characters', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract characters');
      }

      const data = await response.json();
      setCharacters(data.characters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="w-full"
        />
        <Button
          onClick={extractCharacters}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? 'Extracting...' : 'Extract Characters'}
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {characters.length > 0 && (
        <div className="bg-white/100 backdrop-blur-sm rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold">Extracted Characters</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Personality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {characters.map((character, index) => (
                <TableRow key={index}>
                  <TableCell>{character.name}</TableCell>
                  <TableCell>{character.description}</TableCell>
                  <TableCell>{character.personality}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
} 