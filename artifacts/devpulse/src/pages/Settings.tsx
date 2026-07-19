import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/store';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Github, Save, LogOut, Trash2, Moon, Sun, Monitor } from 'lucide-react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  githubUsername: z.string().min(1, { message: 'GitHub username is required.' }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Settings() {
  const { user, updateUser, logout } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      githubUsername: user?.githubUsername || '',
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      if (user) {
        updateUser({
          ...user,
          name: data.name,
          githubUsername: data.githubUsername,
        });
      }
      setIsSaving(false);
      toast({
        title: "Profile updated",
        description: "Your settings have been saved successfully.",
      });
    }, 600);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    setLocation('/login');
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all local data? This will log you out.")) {
      logout();
      toast({
        title: "Data cleared",
        description: "All local data has been removed.",
      });
      setLocation('/login');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and GitHub connection.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-6">
                <Avatar className="w-20 h-20 border shadow-sm">
                  <AvatarImage src={`https://github.com/${user?.githubUsername}.png`} />
                  <AvatarFallback className="text-2xl">{user?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{user?.name}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="githubUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Username</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input className="pl-9" placeholder="octocat" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          This is used to fetch your public repositories and activity feed.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSaving} className="mt-4 gap-2">
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how DevPulse looks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover-elevate transition-all">
                <div className="space-y-0.5">
                  <label className="text-base font-medium leading-none">Dark Mode</label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={theme === 'light' ? 'default' : 'outline'} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="w-4 h-4" /> Light
                  </Button>
                  <Button 
                    variant={theme === 'dark' ? 'default' : 'outline'} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'outline'} 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="w-4 h-4" /> System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Log Out</h4>
                <p className="text-xs text-muted-foreground">Sign out of your current session.</p>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" /> Log out
                </Button>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <h4 className="text-sm font-medium">Clear Data</h4>
                <p className="text-xs text-muted-foreground">Remove all locally stored settings and session data.</p>
                <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleClearData}>
                  <Trash2 className="w-4 h-4" /> Clear local data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
