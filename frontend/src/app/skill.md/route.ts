import { SKILL_MARKDOWN } from '@/lib/skill-content';

export async function GET() {
  return new Response(SKILL_MARKDOWN, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
