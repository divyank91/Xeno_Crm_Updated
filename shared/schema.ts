import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0"),
  visitCount: integer("visit_count").default(0),
  lastVisit: timestamp("last_visit"),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
  status: text("status").default("active"), // active, inactive, vip
  location: text("location"),
  emailVerified: boolean("email_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // pending, completed, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  rules: jsonb("rules").notNull(), // Store segment rules as JSON
  message: text("message").notNull(),
  audienceSize: integer("audience_size").notNull(),
  status: text("status").default("draft"), // draft, scheduled, sending, completed
  scheduledAt: timestamp("scheduled_at"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communicationLogs = pgTable("communication_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  message: text("message").notNull(),
  status: text("status").default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  communicationLogs: many(communicationLogs),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  communicationLogs: many(communicationLogs),
}));

export const communicationLogsRelations = relations(communicationLogs, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [communicationLogs.campaignId],
    references: [campaigns.id],
  }),
  customer: one(customers, {
    fields: [communicationLogs.customerId],
    references: [customers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertCommunicationLogSchema = createInsertSchema(communicationLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type CommunicationLog = typeof communicationLogs.$inferSelect;
export type InsertCommunicationLog = z.infer<typeof insertCommunicationLogSchema>;

// Additional types for API responses
export type CampaignWithStats = Campaign & {
  sentCount: number;
  failedCount: number;
  pendingCount: number;
};

export type SegmentRule = {
  field: string;
  operator: string;
  value: string | number;
  logic?: "AND" | "OR";
};
