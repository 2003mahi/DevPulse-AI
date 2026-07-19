import React from 'react';
import { useGithubEvents, useGithubRepos } from '@/services/github';
import { useAppStore } from '@/store/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { AlertCircle, TrendingUp, GitCommit, Star, GitFork, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Analytics() {
  const { user } = useAppStore();
  const username = user?.githubUsername;

  const { data: events, isLoading: isEventsLoading, error: eventsError } = useGithubEvents(username);
  const { data: repos, isLoading: isReposLoading, error: reposError } = useGithubRepos(username);

  // Calculate Activity Data (last 7 days of commits/events)
  const calculateActivityData = () => {
    if (!events) return [];
    
    const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    
    return last7Days.map(date => {
      const dayEvents = events.filter((e: any) => isSameDay(new Date(e.created_at), date));
      const commits = dayEvents.filter((e: any) => e.type === 'PushEvent')
        .reduce((acc: number, e: any) => acc + (e.payload.commits?.length || 0), 0);
      const issues = dayEvents.filter((e: any) => e.type === 'IssuesEvent' || e.type === 'PullRequestEvent').length;
      
      return {
        date: format(date, 'EEE'),
        commits,
        issues,
        total: commits + issues
      };
    });
  };

  // Calculate Language Distribution
  const calculateLanguageData = () => {
    if (!repos) return [];
    
    const langs: Record<string, number> = {};
    let totalSize = 0;
    
    repos.forEach((repo: any) => {
      if (repo.language) {
        // We use stargazers_count as a proxy for 'weight/importance' since API doesn't give repo size in brief
        const weight = repo.stargazers_count + 1; 
        langs[repo.language] = (langs[repo.language] || 0) + weight;
        totalSize += weight;
      }
    });

    return Object.entries(langs)
      .map(([name, value]) => ({ name, value: Math.round((value / totalSize) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  // Calculate Productivity Score (0-100)
  const calculateScore = () => {
    if (!repos || !events) return 0;
    
    const recentCommits = events.filter((e: any) => e.type === 'PushEvent')
      .reduce((acc: number, e: any) => acc + (e.payload.commits?.length || 0), 0);
    const totalStars = repos.reduce((acc: number, r: any) => acc + r.stargazers_count, 0);
    
    // Completely arbitrary formula for visual effect
    const score = Math.min(100, Math.round((recentCommits * 2) + (totalStars * 1.5) + (repos.length)));
    return Math.max(10, score); // give them at least 10
  };

  const activityData = calculateActivityData();
  const languageData = calculateLanguageData();
  const score = calculateScore();

  const isRateLimit = (eventsError as Error)?.message?.includes('rate limit') || (reposError as Error)?.message?.includes('rate limit');

  if (isRateLimit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold">GitHub rate limit reached</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Please try again in a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your GitHub productivity and repository metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-lg">Productivity Score</CardTitle>
            <CardDescription>Based on recent activity & impact</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-col items-center justify-center py-6">
            {isEventsLoading || isReposLoading ? (
              <Skeleton className="w-32 h-32 rounded-full" />
            ) : (
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/30" />
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="60" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={377} 
                    strokeDashoffset={377 - (377 * score) / 100} 
                    className="text-primary transition-all duration-1000 ease-out" 
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-primary">{score}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pulse</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity Area Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-chart-1" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Commits and PRs over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            {isEventsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Language Distribution Bar Chart */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Language Profile</CardTitle>
            <CardDescription>Estimated % across public repos</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {isReposLoading ? (
              <Skeleton className="w-full h-full" />
            ) : languageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 500 }} width={80} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value}%`, 'Usage']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {languageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No language data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Repositories Table */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Repositories</CardTitle>
            <CardDescription>Ranked by stars and impact</CardDescription>
          </CardHeader>
          <CardContent>
            {isReposLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : repos?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Repository</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-right"><Star className="w-4 h-4 inline-block mr-1" />Stars</TableHead>
                      <TableHead className="text-right"><GitFork className="w-4 h-4 inline-block mr-1" />Forks</TableHead>
                      <TableHead className="text-right"><Eye className="w-4 h-4 inline-block mr-1" />Watchers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repos.slice(0, 5).map((repo: any) => (
                      <TableRow key={repo.id} className="border-border/50">
                        <TableCell className="font-medium text-primary">
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {repo.name}
                          </a>
                        </TableCell>
                        <TableCell>
                          {repo.language ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="w-2 h-2 rounded-full bg-chart-2" />
                              {repo.language}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">{repo.stargazers_count}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{repo.forks_count}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{repo.watchers_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No repositories found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
