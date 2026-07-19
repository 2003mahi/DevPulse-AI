import React from 'react';
import { useAppStore } from '@/store/store';
import { useGithubProfile, useGithubRepos, useGithubEvents } from '@/services/github';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Github, 
  Users, 
  Star, 
  GitFork, 
  Activity, 
  BookOpen, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Dashboard() {
  const { user } = useAppStore();
  const username = user?.githubUsername;

  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGithubProfile(username);
  const { data: repos, isLoading: isReposLoading, error: reposError } = useGithubRepos(username);
  const { data: events, isLoading: isEventsLoading } = useGithubEvents(username);

  const calculateLanguageStats = () => {
    if (!repos) return [];
    
    const langs: Record<string, number> = {};
    repos.forEach((repo: any) => {
      if (repo.language) {
        langs[repo.language] = (langs[repo.language] || 0) + 1;
      }
    });

    return Object.entries(langs)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
  };

  const languageData = calculateLanguageStats();

  const totalStars = repos?.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0) || 0;

  if (profileError || reposError) {
    const isRateLimit = (profileError as Error)?.message?.includes('rate limit') || (reposError as Error)?.message?.includes('rate limit');
    
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">Could not load GitHub data</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {isRateLimit 
            ? "GitHub rate limit reached. Since DevPulse uses public unauthenticated APIs, this can happen quickly. Please try again in a few minutes."
            : "There was an error fetching data from GitHub. Please check if the username is correct in your settings."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}. Here's what's happening.</p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <a href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer">
            <Github className="w-4 h-4" />
            View GitHub
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-primary/20 bg-gradient-to-b from-card to-card/50 shadow-md">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
            {isProfileLoading ? (
              <>
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-bold text-xl">{profile?.name || username}</h3>
                  <p className="text-muted-foreground text-sm">@{profile?.login}</p>
                </div>
                {profile?.bio && (
                  <p className="text-sm px-2 text-center text-muted-foreground line-clamp-3">
                    {profile.bio}
                  </p>
                )}
                <div className="flex gap-4 pt-2">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{profile?.followers || 0}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> Followers
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">{profile?.following || 0}</span>
                    <span className="text-xs text-muted-foreground">Following</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats & Charts */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Public Repos</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isProfileLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{profile?.public_repos || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="hover-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stars</CardTitle>
              <Star className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isReposLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{totalStars}</div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Language Dist</CardTitle>
              <Activity className="w-4 h-4 text-chart-1" />
            </CardHeader>
            <CardContent className="h-[80px] flex items-center justify-center p-0">
              {isReposLoading ? (
                <Skeleton className="h-full w-full rounded-none" />
              ) : languageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={languageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3 border-border overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Recent Repositories
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isReposLoading ? (
                <div className="divide-y divide-border">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 flex justify-between items-center">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-60" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : repos?.length ? (
                <div className="divide-y divide-border">
                  {repos.map((repo: any) => (
                    <a 
                      key={repo.id} 
                      href={repo.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/50 transition-colors block group"
                    >
                      <div className="space-y-1 mb-2 sm:mb-0 max-w-[70%]">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-primary group-hover:underline truncate">
                            {repo.name}
                          </h4>
                          {repo.private && <Badge variant="outline" className="text-[10px] h-5">Private</Badge>}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-chart-1" />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" /> {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" /> {repo.forks_count}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(repo.updated_at), { addSuffix: true })}
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No public repositories found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-chart-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest events from your GitHub feed</CardDescription>
        </CardHeader>
        <CardContent>
          {isEventsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full max-w-md" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : events?.length ? (
            <div className="space-y-6">
              {events.slice(0, 8).map((event: any) => {
                let icon = <Activity className="w-4 h-4 text-muted-foreground" />;
                let text = "did something";
                
                switch(event.type) {
                  case 'PushEvent':
                    icon = <GitFork className="w-4 h-4 text-chart-1" />;
                    text = `pushed ${event.payload.commits?.length || 0} commits to`;
                    break;
                  case 'CreateEvent':
                    icon = <BookOpen className="w-4 h-4 text-chart-2" />;
                    text = `created ${event.payload.ref_type}`;
                    break;
                  case 'WatchEvent':
                    icon = <Star className="w-4 h-4 text-amber-500" />;
                    text = "starred";
                    break;
                  case 'ForkEvent':
                    icon = <GitFork className="w-4 h-4 text-chart-3" />;
                    text = "forked";
                    break;
                  case 'IssuesEvent':
                    icon = <AlertCircle className="w-4 h-4 text-chart-4" />;
                    text = `${event.payload.action} an issue in`;
                    break;
                }

                return (
                  <div key={event.id} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5 shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium text-foreground">{event.actor.display_login}</span>
                        {' '}
                        <span className="text-muted-foreground">{text}</span>
                        {' '}
                        <a href={`https://github.com/${event.repo.name}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                          {event.repo.name}
                        </a>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
               <Activity className="w-12 h-12 text-muted-foreground/30 mb-2" />
               <p>No recent activity found.</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
