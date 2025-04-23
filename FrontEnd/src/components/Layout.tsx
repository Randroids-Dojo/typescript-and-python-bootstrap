import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from '@/components/ui/sonner';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background antialiased">
      <Header />
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 max-w-7xl w-full mx-auto">
        <div className="container mx-auto transition-all duration-200 ease-in-out">
          <Outlet />
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}