/**
 * Unified blog posting for Blirt and PrintBooth Pro.
 * Both sites use Supabase but with slightly different schemas.
 */
import { createClient } from "@supabase/supabase-js";

function getBlirtClient() {
  const url = process.env.BLIRT_SUPABASE_URL?.trim();
  const key = process.env.BLIRT_SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) throw new Error("Missing Blirt Supabase credentials");
  return createClient(url, key);
}

function getPrintboothClient() {
  const url = process.env.PRINTBOOTH_SUPABASE_URL?.trim();
  const key = process.env.PRINTBOOTH_SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) throw new Error("Missing PrintBooth Supabase credentials");
  return createClient(url, key);
}

export type BlogPost = {
  title: string;
  excerpt: string;
  body: string;
  tags?: string[];
};

export type BlogTarget = "blirt" | "printbooth";

export async function saveBlogPost(
  target: BlogTarget,
  post: BlogPost,
  publish: boolean = false,
): Promise<{ id: string }> {
  if (target === "blirt") {
    const client = getBlirtClient();
    const { data, error } = await client
      .from("blog_posts")
      .insert({
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        is_published: publish,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id as string };
  } else {
    const client = getPrintboothClient();
    const { data, error } = await client
      .from("blog_posts")
      .insert({
        title: post.title,
        excerpt: post.excerpt,
        content: post.body,
        is_published: publish,
        published_at: new Date().toISOString(),
        tags: post.tags ?? [],
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id as string };
  }
}

/**
 * Publish an existing draft blog post.
 */
export async function publishBlogPost(
  target: BlogTarget,
  id: string,
): Promise<void> {
  const client = target === "blirt" ? getBlirtClient() : getPrintboothClient();
  const { error } = await client
    .from("blog_posts")
    .update({ is_published: true, published_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Generate a slug from a title.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
