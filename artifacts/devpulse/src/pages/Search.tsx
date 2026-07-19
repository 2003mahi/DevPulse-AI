import React, { useState, useEffect } from 'react';
import { useGithubSearch } from '@/services/github';
import { useAddFavorite, useGetFavorites, useRemoveFavorite, getGetFavoritesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search as SearchIcon, Users, Bookmark, BookOpen, ExternalLink, X, UserPlus, Heart } from 'lucide-react';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading: isSearchLoading, error: searchError } = useGithubSearch(debouncedQuery, page);
  const { data: favorites, isLoading: isFavoritesLoading } = useGetFavorites({ query: { queryKey: getGetFavoritesQueryKey() } });
  
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleToggleFavorite = (user: any) => {
    const isSaved = favorites?.some(f => f.githubLogin === user.login);
    
    if (isSaved) {
      removeFavorite.mutate({ githubLogin: user.login }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
          toast({ title: "Removed from favorites", description: `${user.login} removed.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not remove favorite", variant: "destructive" });
        }
      });
    } else {
      addFavorite.mutate({
        data: {
          githubLogin: user.login,
          avatarUrl: user.avatar_url,
          name: user.name || user.login,
          bio: user.bio,
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
          toast({ title: "Added to favorites", description: `${user.login} saved.` });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not save favorite", variant: "destructive" });
        }
      });
    }
  };

  const isRateLimit = (searchError as Error)?.message?.includes('rate limit');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Developer Search</h1>
        <p className="text-muted-foreground">Find and track other developers on GitHub.</p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          className="pl-10 h-12 text-lg shadow-sm border-primary/20 focus-visible:ring-primary/50" 
          placeholder="Search by username or name..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
            onClick={() => setQuery('')}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isRateLimit ? (
        <Card className="border-destructive/20 bg-destructive/5 max-w-2xl mx-auto">
          <CardContent className="p-6 text-center text-destructive">
            GitHub rate limit reached. Please try again in a minute.
          </CardContent>
        </Card>
      ) : debouncedQuery ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Results for "{debouncedQuery}"
            <Badge variant="secondary" className="font-normal text-xs">{searchResults?.total_count || 0}</Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isSearchLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : searchResults?.items?.length ? (
              searchResults.items.map((user: any) => {
                const isSaved = favorites?.some(f => f.githubLogin === user.login);
                
                return (
                  <Card key={user.id} className="flex flex-col hover:border-primary/50 transition-colors">
                    <CardContent className="p-6 flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12 border border-border">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.login.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-bold truncate text-primary">
                          <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                            {user.login} <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        </h3>
                        {/* We don't get full profile details from search endpoint, so we show what we have */}
                        <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-2">
                           <Badge variant="outline" className="text-[10px] font-normal px-1 py-0 h-4">User</Badge>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end">
                      <Button 
                        variant={isSaved ? "secondary" : "outline"} 
                        size="sm" 
                        className={`gap-1 w-full sm:w-auto ${isSaved ? "text-primary bg-primary/10 border-primary/20 hover:bg-primary/20" : ""}`}
                        onClick={() => handleToggleFavorite(user)}
                        disabled={addFavorite.isPending || removeFavorite.isPending}
                      >
                        {isSaved ? (
                          <><Heart className="w-4 h-4 fill-primary" /> Saved</>
                        ) : (
                          <><UserPlus className="w-4 h-4" /> Save</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                No developers found matching "{debouncedQuery}"
              </div>
            )}
          </div>

          {searchResults?.total_count > 10 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button 
                variant="outline" 
                disabled={page === 1 || isSearchLoading}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                disabled={page * 10 >= Math.min(searchResults.total_count, 1000) || isSearchLoading}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground flex flex-col items-center max-w-sm mx-auto">
           <Users className="w-16 h-16 opacity-10 mb-6 text-primary" />
           <h3 className="text-xl font-medium text-foreground mb-2">Find Developers</h3>
           <p>Search for GitHub users to view their activity and save them to your favorites for quick access.</p>
        </div>
      )}

      {/* Saved Favorites Section */}
      <div className="pt-10 mt-10 border-t border-border">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" /> Saved Favorites
        </h2>
        
        {isFavoritesLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
           </div>
        ) : favorites?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((fav) => (
              <Card key={fav.id} className="flex items-center p-4 gap-3 group relative overflow-hidden">
                <Avatar className="w-10 h-10 border border-border shrink-0">
                  <AvatarImage src={fav.avatarUrl} />
                  <AvatarFallback>{fav.githubLogin.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm truncate">
                    <a href={`https://github.com/${fav.githubLogin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {fav.githubLogin}
                    </a>
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{fav.name || "GitHub User"}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => {
                    removeFavorite.mutate({ githubLogin: fav.githubLogin }, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
                        toast({ title: "Removed from favorites", description: `${fav.githubLogin} removed.` });
                      }
                    });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/30 rounded-xl border border-dashed border-border/50">
            <Heart className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-muted-foreground">You haven't saved any developers yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
