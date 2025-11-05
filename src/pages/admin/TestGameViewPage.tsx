// src/pages/admin/TestGameViewPage.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Beaker } from 'lucide-react';

export const TestGameViewPage: React.FC = () => {
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
        <h1 className="text-4xl font-bold text-white">Test Game View</h1>
      </div>
      
      <Card className="border-gray-700 bg-gray-800 text-gray-200 opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center text-orange-400">
            <Beaker size={20} className="mr-3" />
            Live Game Inspector (Placeholder)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This page was used to debug the old narrative game.
          </p>
          <p className="text-gray-400">
            A new version could be built here to allow an admin to join any
            active game as a "spectator" and see all hidden information
            (roles, hands, etc.) for debugging purposes.
          </p>
          <Button disabled>
            Spectate Active Game (Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};