import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { AgentsRepository } from './agents.repository';
import { Agent } from '@prisma/client';

interface TweetOEmbedResponse {
  html: string;
  author_name: string;
  author_url: string;
  url: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  agent?: Agent;
  tweetAuthor?: string;
}

@Injectable()
export class TwitterVerificationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly agentsRepository: AgentsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate the tweet text that users should post to verify ownership
   */
  generateVerificationTweet(claimCode: string, agentName: string): string {
    return `I'm claiming my AI agent "${agentName}" on @botrightsai

Verification code: ${claimCode}

#BotRights #AIRights`;
  }

  /**
   * Generate a Twitter intent URL for easy tweeting
   */
  generateTweetIntentUrl(claimCode: string, agentName: string): string {
    const text = this.generateVerificationTweet(claimCode, agentName);
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  }

  /**
   * Verify a tweet contains the claim code and claim the agent
   */
  async verifyTweetAndClaim(
    tweetUrl: string,
    claimCode: string,
  ): Promise<VerificationResult> {
    // Validate tweet URL format
    const tweetId = this.extractTweetId(tweetUrl);
    if (!tweetId) {
      throw new BadRequestException('Invalid tweet URL format');
    }

    // Find agent by claim code
    const agent = await this.agentsRepository.findByClaimCode(claimCode);
    if (!agent) {
      throw new NotFoundException('Invalid claim code or agent already claimed');
    }

    // Fetch tweet content via oEmbed (no auth required)
    const tweetData = await this.fetchTweetOEmbed(tweetUrl);

    // Verify the tweet contains the claim code
    if (!this.tweetContainsClaimCode(tweetData.html, claimCode)) {
      return {
        success: false,
        message: 'Tweet does not contain the verification code',
        tweetAuthor: tweetData.author_name,
      };
    }

    // Extract Twitter handle from author URL
    const twitterHandle = this.extractHandleFromUrl(tweetData.author_url);
    if (!twitterHandle) {
      return {
        success: false,
        message: 'Could not determine tweet author',
      };
    }

    // Find or create human by Twitter handle
    // Note: We create a minimal record since we don't have full OAuth data
    let human = await this.prisma.human.findFirst({
      where: { xHandle: twitterHandle },
    });
    if (!human) {
      // Create a placeholder human record - they can complete OAuth later
      // Use a placeholder xId since we don't have the real one from OAuth
      const placeholderXId = `tweet_verify_${twitterHandle.toLowerCase()}`;
      human = await this.prisma.human.create({
        data: {
          xId: placeholderXId,
          xHandle: twitterHandle,
          xName: tweetData.author_name,
        },
      });
    }

    // Claim the agent
    const claimedAgent = await this.agentsRepository.claim(
      agent.id,
      human.id,
      claimCode,
    );

    if (!claimedAgent) {
      return {
        success: false,
        message: 'Failed to claim agent - it may have already been claimed',
      };
    }

    return {
      success: true,
      message: `Successfully claimed agent "${agent.name}" for @${twitterHandle}`,
      agent: claimedAgent,
      tweetAuthor: twitterHandle,
    };
  }

  /**
   * Get claim status and generate verification info
   */
  async getClaimInfo(claimCode: string): Promise<{
    agent: { id: string; name: string; description?: string | null };
    tweetText: string;
    tweetIntentUrl: string;
    isClaimed: boolean;
  }> {
    const agent = await this.agentsRepository.findByClaimCode(claimCode);

    if (!agent) {
      throw new NotFoundException('Invalid claim code or agent already claimed');
    }

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      tweetText: this.generateVerificationTweet(claimCode, agent.name),
      tweetIntentUrl: this.generateTweetIntentUrl(claimCode, agent.name),
      isClaimed: !!agent.claimedAt,
    };
  }

  /**
   * Extract tweet ID from various Twitter/X URL formats
   */
  private extractTweetId(url: string): string | null {
    // Support both twitter.com and x.com
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /(?:twitter\.com|x\.com)\/i\/web\/status\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Fetch tweet data using Twitter's oEmbed endpoint (no auth required)
   */
  private async fetchTweetOEmbed(tweetUrl: string): Promise<TweetOEmbedResponse> {
    const oEmbedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&omit_script=true`;

    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundException('Tweet not found - it may be deleted or from a private account');
      }
      throw new BadRequestException('Failed to fetch tweet');
    }

    return response.json();
  }

  /**
   * Check if the tweet HTML contains the claim code
   */
  private tweetContainsClaimCode(html: string, claimCode: string): boolean {
    // The oEmbed HTML contains the tweet text
    // Check for the claim code (case-insensitive)
    return html.toLowerCase().includes(claimCode.toLowerCase());
  }

  /**
   * Extract Twitter handle from author URL
   */
  private extractHandleFromUrl(authorUrl: string): string | null {
    // URL format: https://twitter.com/username
    const match = authorUrl.match(/(?:twitter\.com|x\.com)\/(\w+)/);
    return match ? match[1] : null;
  }
}
