-- Add ai_metadata column to job_applications table
ALTER TABLE job_applications
ADD COLUMN ai_metadata JSONB;

-- Add comment to explain the column
COMMENT ON COLUMN job_applications.ai_metadata IS 'Metadata from AI processing of job applications, including confidence scores and processing details'; 