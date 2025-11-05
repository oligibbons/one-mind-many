// src/pages/admin/UserManagementPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AlertCircle, User, Shield, UserX, UserCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'; // Assuming you have a Select component
import { useDebounce } from '../../hooks/useDebounce'; // We'll create this simple hook next

interface Profile {
  id: string;
  username: string;
  created_at: string;
  is_admin: boolean;
  avatar_url: string | null;
  status: 'Online' | 'Offline' | 'Banned';
}

interface UserData {
  users: Profile[];
  total: number;
  page: number;
  totalPages: number;
}

export const UserManagementPage: React.FC = () => {
  const [data, setData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  
  const debouncedSearch = useDebounce(search, 300);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: debouncedSearch,
        role,
        status,
      });
      const response = await api.get(`/admin/users?${params.toString()}`);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users.');
    }
    setIsLoading(false);
  }, [page, debouncedSearch, role, status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'Online' | 'Offline' | 'Banned') => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };
  
  const handleDelete = async (userId: string, username: string) => {
     if (window.confirm(`Are you sure you want to PERMANENTLY delete ${username}? This is irreversible.`)) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <h1 className="mb-6 text-5xl font-bold game-title">User Management</h1>

      {/* Filter Bar */}
      <Card className="game-card mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="role-filter">Role</Label>
            {/* Assuming you have a <Select> component. If not, replace with <select> */}
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role-filter" className="w-full md:w-40">
                <SelectValue placeholder="Filter by role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status-filter">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status-filter" className="w-full md:w-40">
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-red-700 bg-red-900/30 p-3 text-red-300">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="game-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-brand-navy/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400"><LoadingSpinner /></td></tr>
                ) : !data || data.users.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">No users found.</td></tr>
                ) : (
                  data.users.map((profile) => (
                    <tr key={profile.id} className="hover:bg-brand-navy/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.username} className="h-10 w-10 rounded-full" />
                          ) : (
                            <User className="h-10 w-10 rounded-full bg-brand-navy p-2 text-gray-400" />
                          )}
                          <div className="font-medium text-brand-cream">{profile.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {profile.is_admin ? (
                          <Button size="sm" variant="outline" className="text-yellow-400 border-yellow-600" onClick={() => handleRoleChange(profile.id, 'user')}>
                            <Shield className="h-4 w-4 mr-1.5" /> Admin
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-gray-400" onClick={() => handleRoleChange(profile.id, 'admin')}>
                            <User className="h-4 w-4 mr-1.5" /> User
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {profile.status === 'Banned' ? (
                          <Button size="sm" variant="outline" className="text-red-400 border-red-600" onClick={() => handleStatusChange(profile.id, 'Offline')}>
                            <UserX className="h-4 w-4 mr-1.5" /> Banned
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-green-400 border-green-600" onClick={() => handleStatusChange(profile.id, 'Banned')}>
                            <UserCheck className="h-4 w-4 mr-1.5" /> Active
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {format(new Date(profile.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(profile.id, profile.username)}
                          title="Delete User"
                          className="text-red-400 hover:bg-red-900/50 hover:text-red-300"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            className="btn-secondary"
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            className="btn-secondary"
            onClick={() => setPage(p => p + 1)}
            disabled={page === data.totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

// --- NEW: useDebounce hook ---
// Create a new file for this at 'src/hooks/useDebounce.ts'
// or just include it here if you prefer
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}