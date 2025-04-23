import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export function Dashboard() {
  const { user, isAuthenticated, logout, sessions, revokeSession, refreshSessions } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      refreshSessions();
    }
  }, [isAuthenticated, navigate, refreshSessions]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const handleRevokeSession = async (sessionId: string) => {
    await revokeSession(sessionId);
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="container py-10">
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Log Out
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p>{user.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p>{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p>{user.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Account ID</p>
                  <p>{user.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Active Sessions</p>
                  <p>{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" className="justify-start">Security Settings</Button>
                <Button variant="outline" className="justify-start">Profile Settings</Button>
                <Button variant="outline" className="justify-start">Notifications</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground">No active sessions found.</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{session.device || 'Unknown Device'}</p>
                      <p className="text-sm text-muted-foreground">
                        Last active: {new Date(session.lastActive).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">IP: {session.ip}</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}