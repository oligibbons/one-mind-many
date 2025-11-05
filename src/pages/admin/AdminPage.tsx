// src/pages/admin/AdminPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Shield, Users, BarChart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AdminPage: React.FC = ()_ => {
  const { profile } = useAuth();

  return (
    <div className="mx-auto w-full max-w-4xl p-8">
      <h1 className="mb-2 text-5xl font-bold game-title">Admin Dashboard</h1>
      <p className="mb-8 text-xl text-gray-300">
        Welcome, <span className="text-brand-orange">{profile?.username}</span>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminNavCard
          to="/admin/scenarios"
          icon={Shield}
          title="Scenarios"
          description="Create, edit, and publish game scenarios."
        />
        <AdminNavCard
          to="/admin/users"
          icon={Users}
          title="Users"
          description="Manage players and admin roles."
        />
        <AdminNavCard
          to="/admin/games"
          icon={BarChart}
          title="Active Games"
          description="Monitor and manage active games."
        />
      </div>
    </div>
  );
};

// --- Reusable Nav Card ---
interface AdminNavCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const AdminNavCard: React.FC<AdminNavCardProps> = ({ to, icon: Icon, title, description }) => (
  <Link to={to} className="block group">
    <Card className="game-card h-full transition-all duration-200 group-hover:border-brand-orange group-hover:bg-brand-navy/60 group-hover:-translate-y-1">
      <CardHeader className="flex-row items-center gap-4">
        <Icon className="h-10 w-10 text-brand-orange" />
        <CardTitle className="text-2xl text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400">{description}</p>
      </CardContent>
    </Card>
  </Link>
);