import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-hooks';
import { Session } from '@/lib/auth';
import { cn } from '@/lib/utils';

// Skeleton loader component
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulseSlow rounded-md bg-primary/10", className)}
      {...props}
    />
  );
}

export function Dashboard() {
  const { user, isAuthenticated, isLoading, logout, sessions, revokeSession, refreshSessions } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      navigate('/login');
    } else if (isAuthenticated) {
      refreshSessions();
    }
  }, [isAuthenticated, isLoading, navigate, refreshSessions]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const handleRevokeSession = async (sessionId: string) => {
    await revokeSession(sessionId);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j}>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-6 w-40" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-36" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If not loading but no user is found
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Active Sessions</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refreshSessions()}
              className="h-8 w-8 p-0 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span className="sr-only">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <p className="text-muted-foreground mb-2">No active sessions found</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refreshSessions()}
                  className="mt-2"
                >
                  Refresh Sessions
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session: Session) => (
                  <div key={session.id} className="flex items-center justify-between border-b pb-4 hover:bg-muted/5 p-2 rounded-md transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full h-2 w-2 bg-green-500"></div>
                        <p className="font-medium">{session.device || 'Unknown Device'}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
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