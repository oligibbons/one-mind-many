// src/pages/admin/RulesManagementPage.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ArrowLeft, GitBranch } from 'lucide-react';

const RulesManagementPage: React.FC = () => {
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
        <h1 className="text-4xl font-bold text-white">Rules & Balance</h1>
      </div>
      
      <Card className="border-gray-700 bg-gray-800 text-gray-200 opacity-60">
        <CardHeader>
          <CardTitle className="text-orange-400">Game Balancing (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            This section will be used to tweak game balance variables, such as:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-400">
            <li>VP awarded for main and sub-goals</li>
            <li>Complication trigger chance (currently 20%)</li>
            <li>Card counts in the master deck</li>
          </ul>
          <p className="text-gray-300">
            For now, these rules are hard-coded in{' '}
            <code className="rounded-md bg-gray-900 p-1 text-xs text-orange-300">
              server/services/GameEngine.ts
            </code>{' '}
            and{' '}
            <code className="rounded-md bg-gray-900 p-1 text-xs text-orange-300">
              server/data/gameData.ts
            </code>.
          </p>
          <Button disabled>
            <GitBranch size={16} className="mr-2" />
            Modify Rules (Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RulesManagementPage;