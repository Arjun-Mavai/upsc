'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { toggleBlogPremium, getBlogs } from '@/actions/blog-actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

interface AdminBlogsClientProps {
  initialBlogs: any[];
  initialPagination: any;
}

export default function AdminBlogsClient({
  initialBlogs,
  initialPagination,
}: AdminBlogsClientProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState(initialBlogs);
  const [pagination, setPagination] = useState(initialPagination);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch data when Page or Search changes
  const fetchData = (page: number, search: string) => {
    startTransition(async () => {
      const result = await getBlogs({ page, limit: 10, search, isAdmin: true });
      setBlogs(result.blogs);
      setPagination(result.pagination);
    });
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(pagination.total / pagination.limit)) return;
    fetchData(newPage, searchQuery);
  };

  const handleTogglePremium = async (blogId: string, currentStatus: boolean) => {
    setLoadingId(blogId);
    try {
      const newStatus = !currentStatus; // Toggle
      const result = await toggleBlogPremium(blogId, newStatus);

      if (result.success) {
        // Optimistic update
        setBlogs(blogs.map((b: any) => (b.id === blogId ? { ...b, isPremium: newStatus } : b)));
        toast.success(`Blog marked as ${newStatus ? 'Premium' : 'Free'}`);
      } else {
        toast.error(result.error || 'Failed to update blog');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoadingId(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold tracking-tight">Blog Management</h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search blogs..."
            className="bg-white pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="flex items-center justify-between text-base font-semibold text-slate-700">
            <span>All Blogs</span>
            <span className="text-sm font-normal text-slate-500">Total: {pagination.total}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="min-h-[400px] rounded-md border-0">
            {isPending ? (
              <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                        No blogs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    blogs.map((blog: any) => (
                      <TableRow key={blog.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span className="line-clamp-1 text-slate-900">{blog.title}</span>
                            <span className="font-mono text-xs text-slate-500">{blog.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-slate-600 capitalize">
                            {blog.category?.replace(/_/g, ' ') || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {blog.unitId ? (
                            <Badge className="border-indigo-200 bg-indigo-100 text-indigo-700 capitalize hover:bg-indigo-100">
                              {blog.unitId.replace('unit_', 'Unit ')}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-500">
                            {format(new Date(blog.createdAt), 'MMM d, yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={blog.isPremium !== false} // Default true if undefined
                              onCheckedChange={() =>
                                handleTogglePremium(blog.id, blog.isPremium !== false)
                              }
                              disabled={loadingId === blog.id}
                            />
                            <span
                              className={`text-xs font-bold ${blog.isPremium !== false ? 'text-amber-600' : 'text-emerald-600'}`}
                            >
                              {blog.isPremium !== false ? 'PREMIUM' : 'FREE'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blogs/${blog.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4 text-slate-500" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>

        {/* Pagination Footer */}
        <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="text-xs text-slate-500">
            Page {pagination.page} of {totalPages || 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasMore || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
