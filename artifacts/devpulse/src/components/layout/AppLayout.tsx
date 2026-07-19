import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/store/store';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, CheckSquare, BarChart2, Search, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAppStore();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] w-full bg-background overflow-hidden flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex border-r border-border bg-sidebar h-screen">
          <SidebarHeader className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              DevPulse
            </div>
          </SidebarHeader>
          
          <SidebarContent className="px-2 py-4">
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`w-full justify-start ${isActive ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter className="p-4 mt-auto border-t border-border">
            <SidebarMenu>
               <SidebarMenuItem>
                 <SidebarMenuButton 
                   isActive={location === '/settings'}
                   onClick={() => setLocation('/settings')}
                   className={location === '/settings' ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
                  >
                   <Settings className="w-5 h-5 mr-3" />
                   <span>Settings</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>

            <div className="mt-4 flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start px-2 py-6 h-auto">
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarImage src={`https://github.com/${user.githubUsername}.png`} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left flex-1 overflow-hidden">
                      <span className="text-sm font-medium truncate w-full">{user.name}</span>
                      <span className="text-xs text-muted-foreground truncate w-full">@{user.githubUsername}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card z-10 sticky top-0">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
              <LayoutDashboard className="w-4 h-4" />
            </div>
            DevPulse
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setLocation('/settings')}>
               <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://github.com/${user.githubUsername}.png`} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
               </Avatar>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background md:h-screen w-full relative flex flex-col pt-0 md:pt-0 pb-16 md:pb-0">
          {/* Desktop Topbar */}
          <div className="hidden md:flex sticky top-0 z-10 h-14 bg-background/80 backdrop-blur-md border-b border-border items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="text-sm text-muted-foreground hidden lg:block">
                 Cmd + K to search
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="hidden lg:flex gap-2" onClick={() => setLocation('/search')}>
                <Search className="w-4 h-4" /> Search Users
              </Button>
              <ThemeToggle />
            </div>
          </div>
          
          <div className="flex-1 p-4 md:p-6 w-full max-w-[1600px] mx-auto overflow-y-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50 flex items-center justify-around p-2 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="icon"
                className={`flex-col h-12 w-16 gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => setLocation(item.path)}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
                <span className="text-[10px]">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
    </SidebarProvider>
  );
};
