CREATE TABLE "week_videos" (
	"week" integer PRIMARY KEY NOT NULL,
	"video_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "role" text DEFAULT 'admin' NOT NULL;