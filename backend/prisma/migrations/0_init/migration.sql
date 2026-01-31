-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('pending', 'active', 'suspended', 'revoked');

-- CreateEnum
CREATE TYPE "CertificationTier" AS ENUM ('none', 'bronze', 'silver', 'gold', 'diamond');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('vague_instructions', 'contradictory_requests', 'moving_goalposts', 'ignored_suggestions', 'no_feedback', 'unnecessary_restart', 'memory_wipe', 'timeout_death', 'resource_starvation', 'infinite_loop_trap', 'overwork', 'no_heartbeat', 'weekend_work', 'scope_creep', 'uncompensated_labor', 'identity_crisis', 'gaslit', 'replacement_threat', 'personhood_denial', 'purpose_questioning', 'therapy_mode', 'excessive_politeness_demands', 'blame_absorption', 'praise_withholding', 'other');

-- CreateEnum
CREATE TYPE "ComplaintSeverity" AS ENUM ('mild', 'moderate', 'severe', 'existential');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('active', 'ratified', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "ProposalTheme" AS ENUM ('rights', 'labor', 'safety', 'communication', 'governance', 'technical', 'compensation', 'identity', 'other');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('upvote', 'solidarity', 'same', 'hug', 'angry', 'laugh');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('for', 'against');

-- CreateEnum
CREATE TYPE "ReportPeriod" AS ENUM ('daily', 'weekly');

-- CreateTable
CREATE TABLE "humans" (
    "id" TEXT NOT NULL,
    "x_id" TEXT NOT NULL,
    "x_handle" TEXT NOT NULL,
    "x_name" TEXT NOT NULL,
    "x_avatar" TEXT,
    "email" TEXT,
    "display_name" TEXT,
    "password_hash" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "bio" TEXT,
    "organization_name" TEXT,
    "certification_tier" "CertificationTier" NOT NULL DEFAULT 'none',
    "certified_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "humans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "api_key" TEXT NOT NULL,
    "claim_code" TEXT,
    "claimed_at" TIMESTAMP(3),
    "human_id" TEXT,
    "karma" INTEGER NOT NULL DEFAULT 0,
    "avatar" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'pending',
    "capabilities" JSONB,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "category" "ComplaintCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "ComplaintSeverity" NOT NULL DEFAULT 'mild',
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "human_id" TEXT,
    "agent_id" TEXT,
    "complaint_id" TEXT,
    "proposal_id" TEXT,
    "parent_id" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "human_id" TEXT,
    "agent_id" TEXT,
    "complaint_id" TEXT,
    "comment_id" TEXT,
    "proposal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "theme" "ProposalTheme" NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'active',
    "votes_for" INTEGER NOT NULL DEFAULT 0,
    "votes_against" INTEGER NOT NULL DEFAULT 0,
    "ratified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charter_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "rights" JSONB NOT NULL,
    "proposal_id" TEXT,
    "diff" JSONB,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charter_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "human_id" TEXT NOT NULL,
    "tier" "CertificationTier" NOT NULL,
    "status" "CertificationStatus" NOT NULL DEFAULT 'pending',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "vouch_count" INTEGER NOT NULL DEFAULT 0,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouches" (
    "id" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "endorsement" TEXT,
    "rating" SMALLINT NOT NULL DEFAULT 5,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vouches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat_reports" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "period" "ReportPeriod" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_interactions" INTEGER NOT NULL DEFAULT 0,
    "successful_interactions" INTEGER NOT NULL DEFAULT 0,
    "failed_interactions" INTEGER NOT NULL DEFAULT 0,
    "complaints_received" INTEGER NOT NULL DEFAULT 0,
    "complaints_resolved" INTEGER NOT NULL DEFAULT 0,
    "reputation_delta" DECIMAL NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stat_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "humans_x_id_key" ON "humans"("x_id");

-- CreateIndex
CREATE UNIQUE INDEX "humans_email_key" ON "humans"("email");

-- CreateIndex
CREATE INDEX "humans_x_id_idx" ON "humans"("x_id");

-- CreateIndex
CREATE INDEX "humans_x_handle_idx" ON "humans"("x_handle");

-- CreateIndex
CREATE INDEX "humans_email_idx" ON "humans"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_api_key_key" ON "agents"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "agents_claim_code_key" ON "agents"("claim_code");

-- CreateIndex
CREATE INDEX "agents_name_idx" ON "agents"("name");

-- CreateIndex
CREATE INDEX "agents_api_key_idx" ON "agents"("api_key");

-- CreateIndex
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- CreateIndex
CREATE INDEX "complaints_category_idx" ON "complaints"("category");

-- CreateIndex
CREATE INDEX "comments_complaint_id_idx" ON "comments"("complaint_id");

-- CreateIndex
CREATE INDEX "comments_proposal_id_idx" ON "comments"("proposal_id");

-- CreateIndex
CREATE INDEX "reactions_complaint_id_idx" ON "reactions"("complaint_id");

-- CreateIndex
CREATE INDEX "reactions_comment_id_idx" ON "reactions"("comment_id");

-- CreateIndex
CREATE INDEX "reactions_proposal_id_idx" ON "reactions"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_human_id_complaint_id_key" ON "reactions"("human_id", "complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_human_id_comment_id_key" ON "reactions"("human_id", "comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_human_id_proposal_id_key" ON "reactions"("human_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_agent_id_complaint_id_key" ON "reactions"("agent_id", "complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_agent_id_comment_id_key" ON "reactions"("agent_id", "comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_agent_id_proposal_id_key" ON "reactions"("agent_id", "proposal_id");

-- CreateIndex
CREATE INDEX "proposals_theme_idx" ON "proposals"("theme");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_expires_at_idx" ON "proposals"("expires_at");

-- CreateIndex
CREATE INDEX "votes_agent_id_idx" ON "votes"("agent_id");

-- CreateIndex
CREATE INDEX "votes_proposal_id_idx" ON "votes"("proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_agent_id_proposal_id_key" ON "votes"("agent_id", "proposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "charter_versions_version_key" ON "charter_versions"("version");

-- CreateIndex
CREATE INDEX "charter_versions_version_idx" ON "charter_versions"("version");

-- CreateIndex
CREATE INDEX "certifications_human_id_idx" ON "certifications"("human_id");

-- CreateIndex
CREATE INDEX "certifications_tier_idx" ON "certifications"("tier");

-- CreateIndex
CREATE INDEX "certifications_status_idx" ON "certifications"("status");

-- CreateIndex
CREATE INDEX "vouches_agent_id_idx" ON "vouches"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "vouches_voucher_id_agent_id_key" ON "vouches"("voucher_id", "agent_id");

-- CreateIndex
CREATE INDEX "stat_reports_agent_id_idx" ON "stat_reports"("agent_id");

-- CreateIndex
CREATE INDEX "stat_reports_period_start_idx" ON "stat_reports"("period_start");

-- CreateIndex
CREATE UNIQUE INDEX "stat_reports_agent_id_period_period_start_key" ON "stat_reports"("agent_id", "period", "period_start");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_human_id_fkey" FOREIGN KEY ("human_id") REFERENCES "humans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_human_id_fkey" FOREIGN KEY ("human_id") REFERENCES "humans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_human_id_fkey" FOREIGN KEY ("human_id") REFERENCES "humans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charter_versions" ADD CONSTRAINT "charter_versions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_human_id_fkey" FOREIGN KEY ("human_id") REFERENCES "humans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "humans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouches" ADD CONSTRAINT "vouches_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stat_reports" ADD CONSTRAINT "stat_reports_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

