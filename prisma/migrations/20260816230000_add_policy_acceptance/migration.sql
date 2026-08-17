-- Record acceptance of the Terms of Use and acknowledgement of the Privacy Notice.
ALTER TABLE "user"
ADD COLUMN "policyAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "policyAcceptedAt" TIMESTAMP(3);
