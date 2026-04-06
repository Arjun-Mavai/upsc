import { getBlogBySlug, getCachedBlogs } from '@/services/blog-service';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogContentRenderer from './BlogContentRenderer';
import { verifyAuth } from '@/lib/auth';
import { canAccessBlog } from '@/lib/access-control';
import Script from 'next/script';

// ISR: Revalidate every 7 days
export const revalidate = 604800;
export const dynamicParams = true; // Allow on-demand ISR for new blogs

export async function generateStaticParams() {
  const blogs = await getCachedBlogs();
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return { title: 'Not Found' };

  const title = `${blog.title} | UPSC 2026`;
  const description =
    blog.description || 'UPSC Study Material, Test Series, and Analytics - Mindful UPSC';
  const url = `/blogs/${slug}`;
  // Use specific blog image if available, otherwise use the new generic OG image
  const images = blog.imageUrl
    ? [{ url: blog.imageUrl }]
    : [
        {
          url: '/images/mppsc-blog-og.png',
          width: 1200,
          height: 630,
          alt: 'UPSC Blogs - Civil Services Examination 2026',
        },
      ];

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://upsc.zenscroll.app'),
    title,
    description,
    keywords: [
      'UPSC',
      'UPSC 2026',
      'UPSC Test Series',
      'Best Test Series',
      'UPSC Notification',
      'IAS',
      'Civil Services',
      blog.category,
      'UPSC Mains',
      'UPSC Prelims',
      'UPSC Syllabus',
      'UPSC Exam Date',
      'UPSC Result',
      'UPSC Cut Off',
      'UPSC Previous Year Papers',
      'UPSC Books',
      'UPSC Notes',
      'UPSC Online Coaching',

      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
      'upsc online coaching',
      'upsc online classes',
      'upsc online preparation',
      'upsc online study material',
      'upsc online test series',
    ],
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: 'Mindful UPSC',
      locale: 'en_IN',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // 🔒 ACCESS CONTROL Logic
  // Server-Side check using cookies (No client spinner)
  let hasAccess = blog.isFreeAccess === true;

  if (!hasAccess) {
    const user = await verifyAuth();
    hasAccess = canAccessBlog(blog, user);
  }

  // If locked, strip sensitive content to prevent inspection hacks
  const isLocked = !hasAccess;
  const safeBlog = isLocked
    ? {
        ...blog,
        content: [], // Remove actual content
        // Ensure we keeping metadata for Hero/SEO
      }
    : blog;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://upsc.zenscroll.app';
  // Use specific blog image if available, otherwise use the new generic OG image
  const finalImageUrl = blog.imageUrl || `${baseUrl}/images/upsc-blog-og.png`;

  // JSON-LD Article schema — helps Google show rich results for blog posts
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.description || '',
    image: [finalImageUrl],
    url: `${baseUrl}/blogs/${slug}`,
    datePublished: blog.createdAt || new Date().toISOString(),
    dateModified: blog.updatedAt || blog.createdAt || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'Mindful UPSC',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mindful UPSC',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.png`,
      },
      url: baseUrl,
    },
    keywords: [
      'UPSC',
      'UPSC Test Series',
      'Best Test Series',
      blog.category,
      'UPSC Preparation',
    ].join(', '),
  };

  return (
    <>
      <Script
        id="article-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <BlogContentRenderer blog={safeBlog} isLocked={isLocked} />
    </>
  );
}
