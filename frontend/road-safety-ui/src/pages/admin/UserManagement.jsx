import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

export const UserManagement = () => {
    // Mock data - replace with API call later
    const [users, setUsers] = useState([
        {
            id: 1,
            name: 'John Anderson',
            email: 'john.anderson@example.com',
            role: 'Admin',
            status: 'Active',
            lastLogin: '2 hours ago',
            joinDate: 'Jan 15, 2024',
        },
        {
            id: 2,
            name: 'Sarah Mitchell',
            email: 'sarah.mitchell@example.com',
            role: 'Operator',
            status: 'Active',
            lastLogin: '30 minutes ago',
            joinDate: 'Jan 20, 2024',
        },
        {
            id: 3,
            name: 'Michael Chen',
            email: 'michael.chen@example.com',
            role: 'Operator',
            status: 'Active',
            lastLogin: '1 hour ago',
            joinDate: 'Jan 18, 2024',
        },
        {
            id: 4,
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@example.com',
            role: 'Analyst',
            status: 'Inactive',
            lastLogin: '5 days ago',
            joinDate: 'Jan 10, 2024',
        },
        {
            id: 5,
            name: 'David Thompson',
            email: 'david.thompson@example.com',
            role: 'Operator',
            status: 'Active',
            lastLogin: '45 minutes ago',
            joinDate: 'Jan 22, 2024',
        },
        {
            id: 6,
            name: 'Lisa Park',
            email: 'lisa.park@example.com',
            role: 'Analyst',
            status: 'Active',
            lastLogin: '3 hours ago',
            joinDate: 'Jan 12, 2024',
        },
    ]);

    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    const toggleUserSelection = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleAllSelection = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map(u => u.id)));
        }
    };

    const handleInviteNewOperator = () => {
        if (inviteEmail.trim()) {
            // In a real app, this would call an API endpoint
            const newUser = {
                id: users.length + 1,
                name: 'New Operator',
                email: inviteEmail,
                role: 'Operator',
                status: 'Pending',
                lastLogin: 'Never',
                joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            };
            setUsers([...users, newUser]);
            setInviteEmail('');
            setShowInviteModal(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'Admin':
                return 'bg-red-500/20 text-red-300 border-red-500/30';
            case 'Operator':
                return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'Analyst':
                return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'Inactive':
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
            case 'Pending':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
            default:
                return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
        }
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-500';
            case 'Inactive':
                return 'bg-slate-500';
            case 'Pending':
                return 'bg-yellow-500';
            default:
                return 'bg-slate-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">User Management</h1>
                    <p className="text-slate-400">Manage system access and operator permissions</p>
                </div>
                <Button
                    onClick={() => setShowInviteModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-amber-500/50"
                >
                    + Invite New Operator
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-sm mb-2">Total Users</p>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-sm mb-2">Active Users</p>
                    <p className="text-3xl font-bold text-green-400">{users.filter(u => u.status === 'Active').length}</p>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-sm mb-2">Admins</p>
                    <p className="text-3xl font-bold text-red-400">{users.filter(u => u.role === 'Admin').length}</p>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700 p-4">
                    <p className="text-slate-400 text-sm mb-2">Pending Invites</p>
                    <p className="text-3xl font-bold text-yellow-400">{users.filter(u => u.status === 'Pending').length}</p>
                </Card>
            </div>

            {/* User Management Tools */}
            <div className="flex gap-2">
                {selectedUsers.size > 0 && (
                    <>
                        <Button variant="outline" size="sm" className="border-amber-500/30 text-slate-300">
                            Change Role ({selectedUsers.size})
                        </Button>
                        <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-900/20">
                            Deactivate ({selectedUsers.size})
                        </Button>
                    </>
                )}
            </div>

            {/* Users Table */}
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-700 bg-slate-900/50 hover:bg-slate-900/50">
                                <TableHead className="w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.size === users.length && users.length > 0}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                                    />
                                </TableHead>
                                <TableHead className="text-slate-300">Name</TableHead>
                                <TableHead className="text-slate-300">Email</TableHead>
                                <TableHead className="text-slate-300">Role</TableHead>
                                <TableHead className="text-slate-300">Status</TableHead>
                                <TableHead className="text-slate-300">Last Login</TableHead>
                                <TableHead className="text-slate-300 text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="border-slate-700 hover:bg-slate-700/30 transition-colors">
                                    <TableCell>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user.id)}
                                            onChange={() => toggleUserSelection(user.id)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                                        />
                                    </TableCell>
                                    <TableCell className="text-white font-medium">{user.name}</TableCell>
                                    <TableCell className="text-slate-300">{user.email}</TableCell>
                                    <TableCell>
                                        <Badge className={`${getRoleColor(user.role)} border`}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${getStatusDot(user.status)}`}></span>
                                            <Badge className={`${getStatusColor(user.status)} border`}>
                                                {user.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-400 text-sm">{user.lastLogin}</TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100 h-8">
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="bg-slate-800 border-slate-700 w-96 p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Invite New Operator</h2>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="operator@example.com"
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 mb-4 focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteEmail('');
                                }}
                                className="border-slate-600 text-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleInviteNewOperator}
                                className="bg-amber-500 hover:bg-amber-600 text-white"
                                disabled={!inviteEmail.trim()}
                            >
                                Send Invite
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
