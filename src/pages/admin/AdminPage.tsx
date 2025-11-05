// src/pages/admin/AdminPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Users, FileJson, LayoutDashboard } from 'lucide-react';

export const AdminPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-8 text-4xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* --- NEW: Link to Scenario Manager --- */}
        <Link to="/admin/scenarios">
          <Card className="transform border-gray-700 bg-gray-800 text-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-orange-400">
                Scenario Manager
              </CardTitle>
              <FileJson className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                Create, edit, and publish game scenarios.
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Link to User Management */}
        <Link to="/admin/users">
          <Card className="transform border-gray-700 bg-gray-800 text-gray-200 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-500/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium text-orange-400">
                User Management
              </CardTitle>
              <Users className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300">
                View and manage all registered players.
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Placeholder for Game Management */}
        <Card className="border-gray-700 bg-gray-800 text-gray-200 opacity-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-500">
              Active Game Viewer
            </CardTitle>
            <LayoutDashboard className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              (Coming Soon) View active games, stats, or spectate.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};