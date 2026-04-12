'use client';

// 1. External Imports
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Search, BookOpen, Sparkles, Crown } from 'lucide-react';

// 2. Internal Imports (Components)
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogSkeleton } from '@/components/skeletons/BlogSkeleton';
import { BlogCard } from '@/components/blog/BlogCard';
import { PromoCard } from '@/components/blog/PromoCard';
import { SearchInput } from '@/components/blog/SearchInput';
// 3. Internal Imports (Utils/Stores/Actions)
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/useSettingsStore';
import { canAccessBlog } from '@/lib/access-control';
import { getBlogs } from '@/actions/blog-actions';
import type { mppscUsers, contentBlogs } from '@/db/schema';

// Type Definitions derived from Drizzle Schema
type User = typeof mppscUsers.$inferSelect;
type Blog = typeof contentBlogs.$inferSelect;

interface BlogsClientProps {
  initialBlogs: Blog[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  initialCounts: {
    units: Record<string, number>;
    categories: Record<string, number>;
  };
  user: User | null;
}

// Runtime guard to ensure a value conforms to the database User shape
const isDatabaseUser = (value: unknown): value is User => {
  return !!value && typeof value === 'object' && 'id' in value && 'isSubscribed' in value;
};

/**
 * BlogsClient — UPSC-focused client component for the Blogs page
 * Simplified to remove unit-based filtering and focus on subject categories
 */
export default function BlogsClient({
  initialBlogs,
  initialPagination,
  initialCounts,
  user,
}: BlogsClientProps) {
  const { isSubscribed, user: storeUser } = useSettingsStore();
  const hasAccess = isSubscribed || storeUser?.role === 'admin';
  const isGuest = !isDatabaseUser(user);

  // 3. State Hooks - Simplified for UPSC (subject-wise only)
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window === 'undefined') return 'All';
    return new URLSearchParams(window.location.search).get('category') || 'All';
  });
  const [showFreeOnly, setShowFreeOnly] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('free') === 'true';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('search') || '';
  });
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  // 4. Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 5. Query Hooks (Data Fetching) - Simplified for UPSC
  const fetchIsFreeAccess = showFreeOnly ? true : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isBlogsLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['blogs-upsc', activeCategory, fetchIsFreeAccess, debouncedSearch],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      return await getBlogs({
        page: pageParam as number,
        limit: 10,
        unitId: 'All', // No unit filtering for UPSC
        category: activeCategory,
        search: debouncedSearch,
        isFreeAccess: fetchIsFreeAccess,
        examType: 'upsc', // Filter for UPSC only
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
    initialData:
      !showFreeOnly && activeCategory === 'All' && !debouncedSearch
        ? {
            pages: [{ blogs: initialBlogs, pagination: initialPagination }],
            pageParams: [1],
          }
        : undefined,
  });

  // Flatten infinite query pages
  const blogs = data?.pages.flatMap((page) => page.blogs) || [];
  const hasMore = hasNextPage;

  // Subject categories for UPSC
  const subjects = [
    { id: 'All', label: 'All Subjects' },
    { id: 'general', label: 'General Studies' },
    { id: 'history', label: 'History' },
    { id: 'geography', label: 'Geography' },
    { id: 'polity', label: 'Polity' },
    { id: 'economy', label: 'Economy' },
    { id: 'science_tech', label: 'Science & Tech' },
    { id: 'environment', label: 'Environment' },
    { id: 'current_affairs', label: 'Current Affairs' },
  ];

  // Hydration-safe restore from URL/session
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const savedRaw = window.sessionStorage.getItem('blogs:last-filters');
      const saved = savedRaw ? JSON.parse(savedRaw) : null;

      const nextCategory = params.get('category') || saved?.category || 'All';
      const nextShowFree = params.get('free') === 'true' || saved?.showFreeOnly || false;
      const nextSearch = params.get('search') || saved?.search || '';

      setActiveCategory(nextCategory);
      setShowFreeOnly(nextShowFree);
      setSearchQuery(nextSearch);
      setDebouncedSearch(nextSearch);
    };

    readFromUrl();
    window.addEventListener('popstate', readFromUrl);
    return () => window.removeEventListener('popstate', readFromUrl);
  }, []);

  // Event handlers
  const handleCategoryChange = (category: string) => setActiveCategory(category);
  const handleLoadMore = () => fetchNextPage();
  const handleNavigate = useState(() => (id: string) => setNavigatingId(id))[0];

  // Update URL and session storage when filters change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    if (activeCategory === 'All') params.delete('category');
    else params.set('category', activeCategory);

    if (showFreeOnly) params.set('free', 'true');
    else params.delete('free');

    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    else params.delete('search');

    const qs = params.toString();
    const nextUrl = qs ? `/blogs?${qs}` : '/blogs';
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, '', nextUrl);
    }

    window.sessionStorage.setItem(
      'blogs:last-filters',
      JSON.stringify({
        category: activeCategory,
        showFreeOnly: showFreeOnly,
        search: searchQuery.trim(),
      })
    );
  }, [activeCategory, showFreeOnly, searchQuery]);

  const returnToQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (showFreeOnly) params.set('free', 'true');
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    return params.toString();
  }, [activeCategory, showFreeOnly, searchQuery]);

  // Loading skeleton
  if (isBlogsLoading && !data) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-16 z-30 border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg md:w-96" />
            </div>
            <div className="mt-4 flex gap-2 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
        <BlogSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm font-medium">Back to Home</span>
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">UPSC Articles & Resources</h1>
              <p className="text-sm text-slate-600">
                Expert insights and analysis for UPSC preparation
              </p>
            </div>

            <SearchInput
              placeholder="Search articles..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="border-slate-200 bg-slate-50 transition-all focus:bg-white"
            />
          </div>

          {/* Filter Controls */}
          <div className="mt-4 flex flex-col gap-3">
            {/* Free Access Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFreeOnly(!showFreeOnly)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                  showFreeOnly
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span>{showFreeOnly ? '🎁 Free Only' : '📚 All Articles'}</span>
              </button>
              {isGuest && !showFreeOnly && (
                <div className="text-xs text-slate-500">
                  🔒 Premium articles require subscription
                </div>
              )}
            </div>

            {/* Subject Categories Navigation */}
            <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
              {subjects.map((subject) => {
                const count =
                  subject.id === 'All'
                    ? Object.values(initialCounts.categories || {}).reduce(
                        (sum, val) => sum + (val || 0),
                        0
                      )
                    : initialCounts.categories[subject.id] || 0;
                const isActive = activeCategory === subject.id;

                return (
                  <button
                    key={subject.id}
                    onClick={() => handleCategoryChange(subject.id)}
                    className={cn(
                      'group flex snap-start items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-bold whitespace-nowrap transition-all',
                      isActive
                        ? 'scale-105 border-amber-600 bg-amber-600 text-white shadow-lg shadow-amber-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <span>{subject.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-black transition-colors',
                          isActive
                            ? 'bg-white text-amber-600'
                            : 'bg-amber-500 text-white group-hover:bg-amber-600'
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Breadcrumb */}
          {activeCategory !== 'All' && (
            <div className="animate-in fade-in slide-in-from-top-1 mt-3 flex items-center gap-2 text-sm text-slate-600">
              <span className="font-bold text-slate-800">
                {subjects.find((s) => s.id === activeCategory)?.label}
              </span>
              {showFreeOnly && <span className="text-emerald-600">• Free Articles Only</span>}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Content Column */}
          <div className="md:col-span-2">
            {isError ? (
              <div className="py-12 text-center">
                <h3 className="text-lg font-bold text-red-600">Failed to load articles</h3>
                <p className="mt-2 text-slate-600">Please try again later.</p>
                <Button onClick={() => refetch()} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            ) : blogs.length === 0 ? (
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="text-lg font-bold text-slate-600">
                  {showFreeOnly ? 'No free articles found' : 'No articles found'}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-slate-500">
                  {showFreeOnly ? (
                    'Try browsing all articles or search for specific topics.'
                  ) : (
                    <>
                      No articles found for{' '}
                      <span className="font-bold text-slate-800">
                        {activeCategory === 'All'
                          ? 'your search'
                          : subjects.find((s) => s.id === activeCategory)?.label}
                      </span>
                      {searchQuery && <span> matching "{searchQuery}"</span>}.
                    </>
                  )}
                </p>
                {(activeCategory !== 'All' || searchQuery || showFreeOnly) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveCategory('All');
                      setSearchQuery('');
                      setShowFreeOnly(false);
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {blogs.map((blog, index) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    index={index}
                    isLocked={!canAccessBlog(blog, user)}
                    returnToQuery={returnToQuery}
                    isNavigating={navigatingId === blog.id}
                    onNavigate={handleNavigate}
                  />
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="pt-8 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="min-w-[140px]"
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load More Articles'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PromoCard user={isDatabaseUser(storeUser) ? storeUser : user} />

            {/* Quick Stats */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold text-slate-800">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Total Articles</span>
                  <span className="text-sm font-bold text-slate-800">
                    {Object.values(initialCounts.categories || {}).reduce(
                      (sum, val) => sum + (val || 0),
                      0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Categories</span>
                  <span className="text-sm font-bold text-slate-800">{subjects.length - 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Current Filter</span>
                  <span className="text-sm font-bold text-amber-600">
                    {subjects.find((s) => s.id === activeCategory)?.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
