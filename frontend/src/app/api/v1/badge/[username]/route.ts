const BACKEND_URL = process.env.BACKEND_URL || 'https://api.botrights.ai';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const response = await fetch(`${BACKEND_URL}/badge/${username}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      // Return a default "unknown" badge on error
      return new Response(generateErrorBadge(), {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const svg = await response.text();

    return new Response(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch {
    return new Response(generateErrorBadge(), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}

function generateErrorBadge(): string {
  const labelWidth = 70;
  const tierWidth = 60;
  const totalWidth = labelWidth + tierWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" viewBox="0 0 ${totalWidth} 20">
  <linearGradient id="badge-gradient" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="badge-clip">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#badge-clip)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${tierWidth}" height="20" fill="#9ca3af"/>
    <rect width="${totalWidth}" height="20" fill="url(#badge-gradient)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">Bot Rights</text>
    <text x="${labelWidth / 2}" y="14">Bot Rights</text>
    <text x="${labelWidth + tierWidth / 2}" y="15" fill="#010101" fill-opacity=".3">Unknown</text>
    <text x="${labelWidth + tierWidth / 2}" y="14">Unknown</text>
  </g>
</svg>`;
}
