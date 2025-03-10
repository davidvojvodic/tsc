// app/(public)/posts/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RichTextContent } from "@/components/rich-text-content";

interface PostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: {
      slug: params.slug,
      published: true,
    },
    include: {
      cover: true,
    },
  });

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.content.substring(0, 160).replace(/<[^>]*>/g, ''),
    openGraph: post.cover ? {
      images: [{ url: post.cover.url }],
    } : undefined,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await prisma.post.findUnique({
    where: {
      slug: params.slug,
      published: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      cover: true,
      categories: true,
      tags: true,
      quizzes: {
        include: {
          teacher: true,
        },
      },
      Project: {
        include: {
          heroImage: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <Container>
      <article className="py-10 max-w-4xl mx-auto">
        {/* Post Header */}
        <div className="mb-8">
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((category) => (
              <Badge key={category.id} variant="outline">
                {category.name}
              </Badge>
            ))}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          
          {/* Meta information */}
          <div className="flex items-center gap-4 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              {post.author?.image ? (
                <Image
                  src={post.author.image}
                  alt={post.author.name || "Author"}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted" />
              )}
              <span>{post.author?.name || "Unknown"}</span>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <span>
              {post.publishedAt 
                ? format(new Date(post.publishedAt), "MMMM d, yyyy") 
                : format(new Date(post.createdAt), "MMMM d, yyyy")}
            </span>
          </div>
          
          {/* Cover image */}
          {post.cover && (
            <div className="relative h-[400px] w-full mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.cover.url}
                alt={post.cover.alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <RichTextContent content={post.content} />
        </div>
        
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold mb-2">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Related Project */}
        {post.Project && (
          <div className="mt-10 p-6 border rounded-lg bg-muted/30">
            <h3 className="text-xl font-semibold mb-4">Related Project</h3>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {post.Project.heroImage && (
                <div className="relative w-full md:w-48 h-32 rounded-md overflow-hidden">
                  <Image
                    src={post.Project.heroImage.url}
                    alt={post.Project.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h4 className="text-lg font-medium">{post.Project.name}</h4>
                <p className="text-muted-foreground mb-3 line-clamp-2">
                  {post.Project.description?.substring(0, 150).replace(/<[^>]*>/g, '') || ""}
                </p>
                <Link 
                  href={`/projects/${post.Project.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View Project
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Related Quizzes */}
        {post.quizzes.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4">Related Quizzes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.quizzes.map((quiz) => (
                <Link 
                  key={quiz.id} 
                  href={`/quizzes/${quiz.id}`}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <h4 className="font-medium mb-1">{quiz.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {quiz.description || "Take this quiz to test your knowledge."}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    By {quiz.teacher.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </Container>
  );
}