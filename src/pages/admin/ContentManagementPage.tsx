// src/pages/admin/ContentManagementPage.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';

export const ContentManagementPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <Button
        as={Link}
        to="/admin"
        variant="outline"
        className="mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Admin
      </Button>

      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white">Content Management</h1>
      </div>
      
      <Card className="border-gray-700 bg-gray-800 text-gray-200 opacity-60">
        <CardHeader>
          <CardTitle className="text-orange-400">Manage Game Content (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This section will be used to manage the text and effects for:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-400">
            <li>NPCs (e.g., Gossip Karen)</li>
            <li>Objects (e.g., The Rubber Duck)</li>
            <li>Complications (e.g., Pigeon Barrage)</li>
          </ul>
          <p className="text-gray-300">
            For now, this content is hard-coded in{' '}
            <code className="rounded-md bg-gray-900 p-1 text-xs text-orange-300">
              server/data/gameData.ts
            </code>.
          </p>
          <Button disabled>
            <Edit size={16} className="mr-2" />
            Edit Content (Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};