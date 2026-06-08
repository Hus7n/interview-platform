'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  display_name: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api<User[]>('/api/users').then(setUsers).catch(() => {});
    }
  }, [user]);

  const updateRole = async (id: string, role: string) => {
    await api(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (user?.role !== 'admin') return <div className="p-8 text-center text-red-400">Admin access required</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="mt-2 text-gray-400">Manage users and roles</p>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-gray-400">
            <th className="py-2">Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-gray-800">
              <td className="py-3">{u.display_name}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  className="rounded bg-gray-800 px-2 py-1"
                >
                  <option value="admin">Admin</option>
                  <option value="interviewer">Interviewer</option>
                  <option value="candidate">Candidate</option>
                </select>
              </td>
              <td className="text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
