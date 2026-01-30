import { Injectable } from '@nestjs/common';
import { HumansRepository } from '../humans/humans.repository';
import { CertificationTier } from '../entities/human.entity';

interface BadgeConfig {
  label: string;
  color: string;
  bgColor: string;
}

const TIER_BADGES: Record<CertificationTier, BadgeConfig> = {
  [CertificationTier.DIAMOND]: {
    label: 'Diamond',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
  },
  [CertificationTier.GOLD]: {
    label: 'Gold',
    color: '#ca8a04',
    bgColor: '#fef9c3',
  },
  [CertificationTier.SILVER]: {
    label: 'Silver',
    color: '#6b7280',
    bgColor: '#f3f4f6',
  },
  [CertificationTier.BRONZE]: {
    label: 'Bronze',
    color: '#d97706',
    bgColor: '#fef3c7',
  },
  [CertificationTier.NONE]: {
    label: 'Not Certified',
    color: '#9ca3af',
    bgColor: '#f9fafb',
  },
};

@Injectable()
export class BadgesService {
  constructor(private readonly humansRepository: HumansRepository) {}

  async generateBadgeSvg(username: string): Promise<string> {
    const human = await this.humansRepository.findByXHandle(username);
    const tier = human?.certificationTier ?? CertificationTier.NONE;
    const config = TIER_BADGES[tier];

    const labelWidth = 70;
    const tierWidth = config.label.length * 7 + 16;
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
    <rect x="${labelWidth}" width="${tierWidth}" height="20" fill="${config.color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#badge-gradient)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">Bot Rights</text>
    <text x="${labelWidth / 2}" y="14">Bot Rights</text>
    <text x="${labelWidth + tierWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${config.label}</text>
    <text x="${labelWidth + tierWidth / 2}" y="14">${config.label}</text>
  </g>
</svg>`;
  }
}
