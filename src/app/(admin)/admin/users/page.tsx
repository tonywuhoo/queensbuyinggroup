"use client";

import { useState, useEffect } from "react";
import { Search, User, Mail, ChevronRight, Building, CreditCard, Copy, Star, Phone } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  vendorId: string;
  vendorNumber: number;
  createdAt: string;
  // Business info
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Bank info
  bankName?: string;
  bankRouting?: string;
  bankAccount?: string;
  accountingNotes?: string;
  // Discord
  isExclusiveMember?: boolean;
  discordUsername?: string;
  stats: {
    commitments: number;
    trackings: number;
    labelRequests: number;
    invoicesReceived: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower) ||
      user.vendorId.toLowerCase().includes(searchLower)
    );
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch (e) {
      console.error('Error updating user:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-queens-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
        <p className="text-slate-500 text-sm">{users.length} registered vendors</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or vendor ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-queens-purple/20 focus:border-queens-purple"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid gap-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Avatar & Info */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-queens-purple/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-queens-purple font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {user.firstName} {user.lastName}
                    </h3>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {user.vendorId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-center py-3 sm:py-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
                <div>
                  <p className="text-lg font-bold text-slate-900">{user.stats?.commitments || 0}</p>
                  <p className="text-xs text-slate-500">Commits</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">{user.stats?.invoicesReceived || 0}</p>
                  <p className="text-xs text-slate-500">Fulfilled</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="SELLER">Seller</option>
                  <option value="ADMIN">Admin</option>
                  <option value="WORKER">Worker</option>
                </select>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="p-2 rounded-lg bg-slate-100 hover:bg-queens-purple hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No users found{search && ` matching "${search}"`}</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedUser(null)}>
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-queens-purple/10 flex items-center justify-center">
                  <span className="text-queens-purple font-bold text-xl">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {selectedUser.firstName} {selectedUser.lastName}
                    {selectedUser.isExclusiveMember && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                        <Star className="w-3 h-3" />
                        VIP
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-sm text-slate-500">{selectedUser.phone}</p>}
                  <p className="text-sm font-mono text-queens-purple">{selectedUser.vendorId}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Statistics */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-slate-900">{selectedUser.stats?.commitments || 0}</p>
                    <p className="text-xs text-slate-500">Total Commitments</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{selectedUser.stats?.invoicesReceived || 0}</p>
                    <p className="text-xs text-slate-500">Fulfilled</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.stats?.trackings || 0}</p>
                    <p className="text-xs text-slate-500">Trackings</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-yellow-600">{selectedUser.stats?.labelRequests || 0}</p>
                    <p className="text-xs text-slate-500">Label Requests</p>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              {(selectedUser.companyName || selectedUser.address) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900">Business Info</h3>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    {selectedUser.companyName && (
                      <p className="font-medium text-slate-900 mb-1">{selectedUser.companyName}</p>
                    )}
                    {selectedUser.address && (
                      <div className="text-sm text-slate-600">
                        <p>{selectedUser.address}</p>
                        {(selectedUser.city || selectedUser.state || selectedUser.zipCode) && (
                          <p>{selectedUser.city}{selectedUser.city && selectedUser.state ? ', ' : ''}{selectedUser.state} {selectedUser.zipCode}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Info */}
              {(selectedUser.bankName || selectedUser.bankRouting || selectedUser.bankAccount) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900">Payment Info</h3>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    {selectedUser.bankName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank:</span>
                        <span className="font-medium text-slate-900">{selectedUser.bankName}</span>
                      </div>
                    )}
                    {selectedUser.bankRouting && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Routing:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900">{selectedUser.bankRouting}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(selectedUser.bankRouting!)} 
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedUser.bankAccount && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Account:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900">{selectedUser.bankAccount}</span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(selectedUser.bankAccount!)} 
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedUser.accountingNotes && (
                      <div className="pt-2 mt-2 border-t border-slate-200">
                        <span className="text-slate-500">Notes:</span>
                        <p className="text-slate-700 mt-1">{selectedUser.accountingNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No info message */}
              {!selectedUser.companyName && !selectedUser.address && !selectedUser.bankName && (
                <div className="bg-slate-50 rounded-lg p-4 text-center text-slate-500 text-sm">
                  No business or payment info on file
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
                <a
                  href={`/admin/commitments?search=${selectedUser.vendorId}`}
                  className="flex-1 px-4 py-2 rounded-lg bg-queens-purple text-white hover:bg-queens-purple/90 transition-colors text-center"
                >
                  View Commitments
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
