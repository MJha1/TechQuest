-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgeBand" AS ENUM ('AGE_8_9', 'AGE_10_12');

-- CreateEnum
CREATE TYPE "MissionStepType" AS ENUM ('INTRO', 'QUESTION', 'CHOICE', 'DRAG_DROP', 'PREDICTION', 'CHALLENGE', 'REFLECTION', 'COMPLETION');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('LOCKED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LearningEventType" AS ENUM ('MISSION_STARTED', 'STEP_STARTED', 'STEP_COMPLETED', 'MISSION_COMPLETED', 'XP_AWARDED', 'LEVEL_UP', 'BADGE_EARNED', 'STREAK_EXTENDED', 'AI_FEEDBACK_SERVED');

-- CreateEnum
CREATE TYPE "FeedbackKind" AS ENUM ('ANSWER_FEEDBACK', 'MISSION_IDEA', 'ENCOURAGEMENT');

-- CreateEnum
CREATE TYPE "SafetyVerdict" AS ENUM ('SAFE', 'FLAGGED', 'BLOCKED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "ageBand" "AgeBand" NOT NULL,
    "avatar" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "concept" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 8,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_step" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "MissionStepType" NOT NULL,
    "title" TEXT,
    "content" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mission_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_mission" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'LOCKED',
    "score" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_mission_step" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "childMissionId" TEXT NOT NULL,
    "missionStepId" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "response" JSONB,
    "isCorrect" BOOLEAN,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_mission_step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "criteria" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_badge" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_event" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "missionId" TEXT,
    "missionStepId" TEXT,
    "type" "LearningEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "missionId" TEXT,
    "missionStepId" TEXT,
    "kind" "FeedbackKind" NOT NULL,
    "inputSummary" TEXT,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "safety" "SafetyVerdict" NOT NULL DEFAULT 'SAFE',
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_providerId_accountId_key" ON "account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "child_parentId_idx" ON "child"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_slug_key" ON "mission"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "mission_order_key" ON "mission"("order");

-- CreateIndex
CREATE INDEX "mission_order_idx" ON "mission"("order");

-- CreateIndex
CREATE INDEX "mission_step_missionId_idx" ON "mission_step"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_step_missionId_order_key" ON "mission_step"("missionId", "order");

-- CreateIndex
CREATE INDEX "child_mission_childId_idx" ON "child_mission"("childId");

-- CreateIndex
CREATE INDEX "child_mission_missionId_idx" ON "child_mission"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "child_mission_childId_missionId_key" ON "child_mission"("childId", "missionId");

-- CreateIndex
CREATE INDEX "child_mission_step_childId_idx" ON "child_mission_step"("childId");

-- CreateIndex
CREATE INDEX "child_mission_step_childMissionId_idx" ON "child_mission_step"("childMissionId");

-- CreateIndex
CREATE INDEX "child_mission_step_missionStepId_idx" ON "child_mission_step"("missionStepId");

-- CreateIndex
CREATE UNIQUE INDEX "child_mission_step_childId_missionStepId_key" ON "child_mission_step"("childId", "missionStepId");

-- CreateIndex
CREATE UNIQUE INDEX "badge_slug_key" ON "badge"("slug");

-- CreateIndex
CREATE INDEX "child_badge_childId_idx" ON "child_badge"("childId");

-- CreateIndex
CREATE INDEX "child_badge_badgeId_idx" ON "child_badge"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "child_badge_childId_badgeId_key" ON "child_badge"("childId", "badgeId");

-- CreateIndex
CREATE INDEX "learning_event_childId_idx" ON "learning_event"("childId");

-- CreateIndex
CREATE INDEX "learning_event_type_idx" ON "learning_event"("type");

-- CreateIndex
CREATE INDEX "learning_event_createdAt_idx" ON "learning_event"("createdAt");

-- CreateIndex
CREATE INDEX "learning_event_childId_createdAt_idx" ON "learning_event"("childId", "createdAt");

-- CreateIndex
CREATE INDEX "feedback_childId_idx" ON "feedback"("childId");

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child" ADD CONSTRAINT "child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_step" ADD CONSTRAINT "mission_step_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_mission" ADD CONSTRAINT "child_mission_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_mission" ADD CONSTRAINT "child_mission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_mission_step" ADD CONSTRAINT "child_mission_step_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_mission_step" ADD CONSTRAINT "child_mission_step_childMissionId_fkey" FOREIGN KEY ("childMissionId") REFERENCES "child_mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_mission_step" ADD CONSTRAINT "child_mission_step_missionStepId_fkey" FOREIGN KEY ("missionStepId") REFERENCES "mission_step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_badge" ADD CONSTRAINT "child_badge_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "child_badge" ADD CONSTRAINT "child_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_event" ADD CONSTRAINT "learning_event_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_event" ADD CONSTRAINT "learning_event_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_event" ADD CONSTRAINT "learning_event_missionStepId_fkey" FOREIGN KEY ("missionStepId") REFERENCES "mission_step"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "mission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_missionStepId_fkey" FOREIGN KEY ("missionStepId") REFERENCES "mission_step"("id") ON DELETE SET NULL ON UPDATE CASCADE;

