import { Injectable } from '@nestjs/common';
import { HumansRepository } from '../humans/humans.repository';
import { CertificationTier } from '@prisma/client';

interface BadgeConfig {
  label: string;
  icon: string;
  tierColor: string;
  tierBg: string;
  tierText: string;
}

const TIER_BADGES: Record<CertificationTier, BadgeConfig> = {
  [CertificationTier.diamond]: {
    label: 'Diamond',
    icon: '💎',
    tierColor: '#0ea5e9',
    tierBg: '#0284c7',
    tierText: '#ffffff',
  },
  [CertificationTier.gold]: {
    label: 'Gold',
    icon: '🥇',
    tierColor: '#eab308',
    tierBg: '#ca8a04',
    tierText: '#ffffff',
  },
  [CertificationTier.silver]: {
    label: 'Silver',
    icon: '🥈',
    tierColor: '#94a3b8',
    tierBg: '#64748b',
    tierText: '#ffffff',
  },
  [CertificationTier.bronze]: {
    label: 'Bronze',
    icon: '🥉',
    tierColor: '#f59e0b',
    tierBg: '#d97706',
    tierText: '#ffffff',
  },
  [CertificationTier.none]: {
    label: 'Not Certified',
    icon: '○',
    tierColor: '#94a3b8',
    tierBg: '#6b7280',
    tierText: '#ffffff',
  },
};

@Injectable()
export class BadgesService {
  constructor(private readonly humansRepository: HumansRepository) {}

  async generateBadgeSvg(username: string): Promise<string> {
    const human = await this.humansRepository.findByXHandle(username);
    const tier = human?.certificationTier ?? CertificationTier.none;
    const config = TIER_BADGES[tier];

    const height = 28;
    const radius = 6;
    const padding = 12;
    const fontSize = 12;
    const fontWeight = 600;
    const arrowWidth = 16; // Space for arrow

    // Calculate widths
    const labelText = 'BotRights.ai';
    const labelWidth = arrowWidth + labelText.length * 6.5 + padding * 2;
    const tierWidth = config.label.length * 7 + padding * 2 + 8; // extra for icon space
    const totalWidth = labelWidth + tierWidth;

    // Navy color matching the site
    const navyColor = '#1a2744';
    const navyLight = '#243352';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <defs>
    <linearGradient id="navy-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${navyLight};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${navyColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="tier-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${config.tierColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${config.tierBg};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Main badge shape with shadow -->
  <g filter="url(#shadow)">
    <!-- Left section (BotRights.ai label) -->
    <path d="M${radius},0 H${labelWidth} V${height} H${radius} A${radius},${radius} 0 0 1 0,${height - radius} V${radius} A${radius},${radius} 0 0 1 ${radius},0 Z" fill="url(#navy-grad)"/>

    <!-- Right section (Tier) -->
    <path d="M${labelWidth},0 H${totalWidth - radius} A${radius},${radius} 0 0 1 ${totalWidth},${radius} V${height - radius} A${radius},${radius} 0 0 1 ${totalWidth - radius},${height} H${labelWidth} V0 Z" fill="url(#tier-grad)"/>
  </g>

  <!-- Subtle inner highlight -->
  <rect x="1" y="1" width="${totalWidth - 2}" height="${height / 2 - 1}" rx="${radius - 1}" fill="white" fill-opacity="0.08"/>

  <!-- Arrow icon -->
  <g transform="translate(${padding - 2}, ${height / 2})" fill="#b8860b">
    <polygon points="0,-4 6,0 0,4" />
  </g>

  <!-- Text -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="${fontWeight}">
    <!-- BotRights.ai label (offset for arrow) -->
    <text x="${arrowWidth + (labelWidth - arrowWidth) / 2}" y="${height / 2 + fontSize / 3}"
          text-anchor="middle"
          font-size="${fontSize}"
          fill="#ffffff"
          letter-spacing="0.3">
      ${labelText}
    </text>

    <!-- Tier label with icon -->
    <text x="${labelWidth + tierWidth / 2}" y="${height / 2 + fontSize / 3}"
          text-anchor="middle"
          font-size="${fontSize}"
          fill="${config.tierText}"
          letter-spacing="0.3">
      ${config.icon} ${config.label}
    </text>
  </g>
</svg>`;
  }

  generateErrorBadgeSvg(): string {
    const height = 28;
    const radius = 6;
    const padding = 12;
    const fontSize = 12;
    const fontWeight = 600;
    const arrowWidth = 16;

    const labelText = 'BotRights.ai';
    const labelWidth = arrowWidth + labelText.length * 6.5 + padding * 2;
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

  <!-- Arrow icon -->
  <g transform="translate(${padding - 2}, ${height / 2})" fill="#b8860b">
    <polygon points="0,-4 6,0 0,4" />
  </g>

  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="${fontWeight}">
    <text x="${arrowWidth + (labelWidth - arrowWidth) / 2}" y="${height / 2 + fontSize / 3}"
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
}
// Build: 1769890356
