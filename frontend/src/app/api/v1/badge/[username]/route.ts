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
  const height = 28;
  const radius = 6;
  const padding = 12;
  const fontSize = 12;
  const fontWeight = 600;

  const labelText = 'BotRights';
  const labelWidth = labelText.length * 7.5 + padding * 2;
  const tierLabel = 'Unknown';
  const tierWidth = tierLabel.length * 7 + padding * 2;
  const totalWidth = labelWidth + tierWidth;

  const navyColor = '#1a2744';
  const navyLight = '#243352';
  const grayColor = '#6b7280';
  const grayLight = '#9ca3af';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <defs>
    <linearGradient id="navy-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${navyLight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${navyColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="gray-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${grayLight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${grayColor};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.15"/>
    </filter>
  </defs>

  <g filter="url(#shadow)">
    <path d="M${radius},0 H${labelWidth} V${height} H${radius} A${radius},${radius} 0 0 1 0,${height - radius} V${radius} A${radius},${radius} 0 0 1 ${radius},0 Z" fill="url(#navy-grad)"/>
    <path d="M${labelWidth},0 H${totalWidth - radius} A${radius},${radius} 0 0 1 ${totalWidth},${radius} V${height - radius} A${radius},${radius} 0 0 1 ${totalWidth - radius},${height} H${labelWidth} V0 Z" fill="url(#gray-grad)"/>
  </g>

  <rect x="1" y="1" width="${totalWidth - 2}" height="${height / 2 - 1}" rx="${radius - 1}" fill="white" fill-opacity="0.08"/>

  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="${fontWeight}">
    <text x="${labelWidth / 2}" y="${height / 2 + fontSize / 3}"
          text-anchor="middle" font-size="${fontSize}" fill="#ffffff" letter-spacing="0.3">
      ${labelText}
    </text>
    <text x="${labelWidth + tierWidth / 2}" y="${height / 2 + fontSize / 3}"
          text-anchor="middle" font-size="${fontSize}" fill="#ffffff" letter-spacing="0.3">
      ${tierLabel}
    </text>
  </g>
</svg>`;
}
