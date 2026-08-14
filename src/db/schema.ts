import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const transcripts = sqliteTable('transcripts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: text('video_id').notNull().unique(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  thumbnail: text('thumbnail').notNull(),
  language: text('language').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
