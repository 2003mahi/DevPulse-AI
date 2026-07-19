import { useQuery } from '@tanstack/react-query';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      throw new Error('GitHub rate limit reached — try again in a minute');
    }
    throw new Error('Failed to fetch from GitHub');
  }
  return res.json();
};

export const useGithubProfile = (username?: string | null) => 
  useQuery({
    queryKey: ['github-profile', username],
    queryFn: () => fetcher(`https://api.github.com/users/${username}`),
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 mins
  });

export const useGithubRepos = (username?: string | null) => 
  useQuery({
    queryKey: ['github-repos', username],
    queryFn: () => fetcher(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });

export const useGithubEvents = (username?: string | null) => 
  useQuery({
    queryKey: ['github-events', username],
    queryFn: () => fetcher(`https://api.github.com/users/${username}/events?per_page=10`),
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });

export const useGithubSearch = (query: string, page: number = 1) => 
  useQuery({
    queryKey: ['github-search', query, page],
    queryFn: () => fetcher(`https://api.github.com/search/users?q=${query}&per_page=10&page=${page}`),
    enabled: !!query,
  });
