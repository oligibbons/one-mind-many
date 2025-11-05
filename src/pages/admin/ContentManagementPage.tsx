// src/pages/admin/ContentManagementPage.tsx

import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Save, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import JSONEditor from 'react-json-editor-ajrm';
// @ts-ignore
import locale from 'react-json-editor-ajrm/locale/en';

export const ContentManagementPage: React.FC = () => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false); // Tracks if JSON editor is valid

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const response = await api.get('/admin/content');
        setContent(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load content.');
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    if (!content || isDirty) {
      setError('JSON is invalid, cannot save.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await api.put('/admin/content', content);
      // You might need to call the 'publish' endpoint as well
      // await api.post('/admin/content/publish');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save content.');
    }
    setIsSaving(false);
  };

  const handleJsonChange = (e: any) => {
    if (e.error) {
      setIsDirty(true);
      setError(`JSON Error: ${e.error.reason} on line ${e.error.line}`);
    } else {
      setIsDirty(false);
      setError(null);
      setContent(e.jsObject);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-5xl font-bold game-title">Content Management</h1>
        <Button onClick={handleSave} disabled={isDirty || isSaving || loading} className="game-button">
          <Save size={16} className="mr-2" />
          {isSaving ? 'Saving...' : 'Save & Publish Content'}
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 flex items-center rounded-md border border-red-700 bg-red-900/40 p-3 text-red-300">
          <AlertTriangle size={16} className="mr-2" />
          {error}
        </div>
      )}

      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <JSONEditor
              id="content-editor"
              placeholder={content}
              onChange={handleJsonChange}
              locale={locale}
              height="80vh"
              width="100%"
              theme="dark_vscode_tribute"
              colors={{
                primitive: '#E0B453',
                string: '#CE9178',
                number: '#B5CEA8',
                boolean: '#569CD6',
                background: '#1E1E1E',
                surface: '#252526',
                text: '#D4D4D4',
              }}
              style={{
                container: { borderRadius: '0.5rem' },
                outerBox: { borderRadius: '0.5rem' },
                contentBox: { borderRadius: '0.5rem' },
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};