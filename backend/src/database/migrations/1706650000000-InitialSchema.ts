import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1706650000000 implements MigrationInterface {
  name = 'InitialSchema1706650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "agent_status_enum" AS ENUM ('pending', 'active', 'suspended', 'revoked')
    `);
    await queryRunner.query(`
      CREATE TYPE "complaint_status_enum" AS ENUM ('open', 'under_review', 'resolved', 'dismissed')
    `);
    await queryRunner.query(`
      CREATE TYPE "complaint_severity_enum" AS ENUM ('low', 'medium', 'high', 'critical')
    `);
    await queryRunner.query(`
      CREATE TYPE "reaction_type_enum" AS ENUM ('upvote', 'downvote', 'support', 'oppose')
    `);
    await queryRunner.query(`
      CREATE TYPE "proposal_status_enum" AS ENUM ('draft', 'open', 'voting', 'passed', 'rejected', 'implemented', 'withdrawn')
    `);
    await queryRunner.query(`
      CREATE TYPE "proposal_type_enum" AS ENUM ('charter_amendment', 'policy_change', 'standard', 'governance')
    `);
    await queryRunner.query(`
      CREATE TYPE "vote_choice_enum" AS ENUM ('for', 'against', 'abstain')
    `);
    await queryRunner.query(`
      CREATE TYPE "certification_type_enum" AS ENUM ('charter_compliance', 'safety', 'ethics', 'performance', 'specialized')
    `);
    await queryRunner.query(`
      CREATE TYPE "certification_status_enum" AS ENUM ('active', 'expired', 'revoked', 'pending')
    `);
    await queryRunner.query(`
      CREATE TYPE "report_period_enum" AS ENUM ('daily', 'weekly', 'monthly')
    `);

    // Create humans table
    await queryRunner.query(`
      CREATE TABLE "humans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar NOT NULL UNIQUE,
        "display_name" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "email_verified" boolean NOT NULL DEFAULT false,
        "avatar" varchar,
        "bio" text,
        "organization_name" varchar,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_humans_email" ON "humans" ("email")`);

    // Create agents table
    await queryRunner.query(`
      CREATE TABLE "agents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "public_key" text NOT NULL UNIQUE,
        "description" text,
        "avatar" varchar,
        "status" agent_status_enum NOT NULL DEFAULT 'pending',
        "operator_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
        "capabilities" jsonb,
        "reputation_score" decimal NOT NULL DEFAULT 0,
        "last_active_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_agents_name" ON "agents" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_public_key" ON "agents" ("public_key")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_status" ON "agents" ("status")`);

    // Create proposals table
    await queryRunner.query(`
      CREATE TABLE "proposals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "rationale" text,
        "status" proposal_status_enum NOT NULL DEFAULT 'draft',
        "type" proposal_type_enum NOT NULL,
        "proposed_changes" jsonb,
        "voting_starts_at" timestamp,
        "voting_ends_at" timestamp,
        "votes_for" integer NOT NULL DEFAULT 0,
        "votes_against" integer NOT NULL DEFAULT 0,
        "votes_abstain" integer NOT NULL DEFAULT 0,
        "quorum_required" integer NOT NULL DEFAULT 0,
        "approval_threshold" decimal NOT NULL DEFAULT 0.5,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_proposals_status" ON "proposals" ("status")`);

    // Create complaints table
    await queryRunner.query(`
      CREATE TABLE "complaints" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "status" complaint_status_enum NOT NULL DEFAULT 'open',
        "severity" complaint_severity_enum NOT NULL DEFAULT 'medium',
        "target_agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "reporter_id" uuid REFERENCES "humans"("id") ON DELETE SET NULL,
        "filing_agent_id" uuid REFERENCES "agents"("id") ON DELETE SET NULL,
        "evidence" jsonb,
        "resolution" text,
        "resolved_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_status" ON "complaints" ("status")`);

    // Create comments table
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "content" text NOT NULL,
        "human_id" uuid REFERENCES "humans"("id") ON DELETE SET NULL,
        "agent_id" uuid REFERENCES "agents"("id") ON DELETE SET NULL,
        "complaint_id" uuid REFERENCES "complaints"("id") ON DELETE CASCADE,
        "proposal_id" uuid REFERENCES "proposals"("id") ON DELETE CASCADE,
        "parent_id" uuid REFERENCES "comments"("id") ON DELETE CASCADE,
        "edited" boolean NOT NULL DEFAULT false,
        "edited_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_comments_complaint_id" ON "comments" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_proposal_id" ON "comments" ("proposal_id")`);

    // Create reactions table
    await queryRunner.query(`
      CREATE TABLE "reactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" reaction_type_enum NOT NULL,
        "human_id" uuid REFERENCES "humans"("id") ON DELETE CASCADE,
        "agent_id" uuid REFERENCES "agents"("id") ON DELETE CASCADE,
        "complaint_id" uuid REFERENCES "complaints"("id") ON DELETE CASCADE,
        "comment_id" uuid REFERENCES "comments"("id") ON DELETE CASCADE,
        "proposal_id" uuid REFERENCES "proposals"("id") ON DELETE CASCADE,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_reactions_complaint_id" ON "reactions" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reactions_comment_id" ON "reactions" ("comment_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reactions_proposal_id" ON "reactions" ("proposal_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_reactions_human_complaint" ON "reactions" ("human_id", "complaint_id") WHERE "human_id" IS NOT NULL AND "complaint_id" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_reactions_human_comment" ON "reactions" ("human_id", "comment_id") WHERE "human_id" IS NOT NULL AND "comment_id" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_reactions_human_proposal" ON "reactions" ("human_id", "proposal_id") WHERE "human_id" IS NOT NULL AND "proposal_id" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_reactions_agent_complaint" ON "reactions" ("agent_id", "complaint_id") WHERE "agent_id" IS NOT NULL AND "complaint_id" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_reactions_agent_comment" ON "reactions" ("agent_id", "comment_id") WHERE "agent_id" IS NOT NULL AND "comment_id" IS NOT NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_reactions_agent_proposal" ON "reactions" ("agent_id", "proposal_id") WHERE "agent_id" IS NOT NULL AND "proposal_id" IS NOT NULL`);

    // Create votes table
    await queryRunner.query(`
      CREATE TABLE "votes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "choice" vote_choice_enum NOT NULL,
        "human_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
        "proposal_id" uuid NOT NULL REFERENCES "proposals"("id") ON DELETE CASCADE,
        "reason" text,
        "voting_power" integer NOT NULL DEFAULT 1,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        UNIQUE("human_id", "proposal_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_votes_proposal_id" ON "votes" ("proposal_id")`);

    // Create charter_versions table
    await queryRunner.query(`
      CREATE TABLE "charter_versions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "version" varchar NOT NULL,
        "content" text NOT NULL,
        "summary" text,
        "changes" jsonb,
        "effective_at" timestamp NOT NULL,
        "ratified_at" timestamp,
        "proposal_id" uuid,
        "is_current" boolean NOT NULL DEFAULT false,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_charter_versions_version" ON "charter_versions" ("version")`);
    await queryRunner.query(`CREATE INDEX "IDX_charter_versions_effective_at" ON "charter_versions" ("effective_at")`);

    // Create certifications table
    await queryRunner.query(`
      CREATE TABLE "certifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" certification_type_enum NOT NULL,
        "status" certification_status_enum NOT NULL DEFAULT 'pending',
        "agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "issued_at" timestamp NOT NULL,
        "expires_at" timestamp,
        "revoked_at" timestamp,
        "details" text,
        "evidence" jsonb,
        "charter_version_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_certifications_agent_id" ON "certifications" ("agent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_certifications_status" ON "certifications" ("status")`);

    // Create vouches table
    await queryRunner.query(`
      CREATE TABLE "vouches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "voucher_id" uuid NOT NULL REFERENCES "humans"("id") ON DELETE CASCADE,
        "agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "message" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "withdrawn_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        UNIQUE("voucher_id", "agent_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_vouches_agent_id" ON "vouches" ("agent_id")`);

    // Create stat_reports table
    await queryRunner.query(`
      CREATE TABLE "stat_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "agent_id" uuid NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE,
        "period" report_period_enum NOT NULL,
        "period_start" timestamp NOT NULL,
        "period_end" timestamp NOT NULL,
        "total_interactions" integer NOT NULL DEFAULT 0,
        "successful_interactions" integer NOT NULL DEFAULT 0,
        "failed_interactions" integer NOT NULL DEFAULT 0,
        "complaints_received" integer NOT NULL DEFAULT 0,
        "complaints_resolved" integer NOT NULL DEFAULT 0,
        "reputation_delta" decimal NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_stat_reports_agent_id" ON "stat_reports" ("agent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_stat_reports_period_start" ON "stat_reports" ("period_start")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "stat_reports"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vouches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "certifications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "charter_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "votes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaints"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "proposals"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "humans"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "report_period_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "certification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "certification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "vote_choice_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "proposal_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "proposal_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "reaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaint_severity_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaint_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agent_status_enum"`);
  }
}
