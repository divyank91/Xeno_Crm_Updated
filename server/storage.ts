import { 
  users, customers, orders, campaigns, communicationLogs,
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Order, type InsertOrder,
  type Campaign, type InsertCampaign, type CampaignWithStats,
  type CommunicationLog, type InsertCommunicationLog,
  type SegmentRule
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gt, lt, gte, lte, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customers
  getCustomers(limit?: number, offset?: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomersBySegmentRules(rules: SegmentRule[]): Promise<Customer[]>;
  getAudienceSize(rules: SegmentRule[]): Promise<number>;

  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;

  // Campaigns
  getCampaigns(userId: number): Promise<CampaignWithStats[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignStatus(id: number, status: string): Promise<void>;

  // Communication Logs
  createCommunicationLog(log: InsertCommunicationLog): Promise<CommunicationLog>;
  updateCommunicationLogStatus(id: number, status: string, failureReason?: string): Promise<void>;
  getCommunicationLogsByCampaign(campaignId: number): Promise<CommunicationLog[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCustomers(limit = 100, offset = 0): Promise<Customer[]> {
    return await db.select().from(customers).limit(limit).offset(offset);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async getCustomersBySegmentRules(rules: SegmentRule[]): Promise<Customer[]> {
    if (rules.length === 0) return [];

    const conditions = this.buildSegmentConditions(rules);
    return await db.select().from(customers).where(conditions);
  }

  async getAudienceSize(rules: SegmentRule[]): Promise<number> {
    if (rules.length === 0) return 0;

    const conditions = this.buildSegmentConditions(rules);
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(conditions);
    
    return result?.count || 0;
  }

  private buildSegmentConditions(rules: SegmentRule[]) {
    const conditions = rules.map(rule => {
      const { field, operator, value } = rule;
      
      let column;
      switch (field) {
        case 'totalSpent':
          column = customers.totalSpent;
          break;
        case 'visitCount':
          column = customers.visitCount;
          break;
        case 'lastVisit':
          column = customers.lastVisit;
          break;
        case 'status':
          column = customers.status;
          break;
        case 'location':
          column = customers.location;
          break;
        case 'emailVerified':
          column = customers.emailVerified;
          break;
        default:
          column = customers.totalSpent;
      }

      switch (operator) {
        case 'gt':
        case 'greater_than':
          return gt(column, value);
        case 'lt':
        case 'less_than':
          return lt(column, value);
        case 'gte':
        case 'greater_than_equal':
          return gte(column, value);
        case 'lte':
        case 'less_than_equal':
          return lte(column, value);
        case 'eq':
        case 'equals':
          return eq(column, value);
        default:
          return eq(column, value);
      }
    });

    // For simplicity, we'll use AND logic between all conditions
    // In a more complex implementation, we'd parse the logic operators
    return and(...conditions);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    
    // Update customer's total spent and visit count
    await db
      .update(customers)
      .set({
        totalSpent: sql`${customers.totalSpent} + ${insertOrder.amount}`,
        visitCount: sql`${customers.visitCount} + 1`,
        lastVisit: new Date()
      })
      .where(eq(customers.id, insertOrder.customerId));

    return order;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId));
  }

  async getCampaigns(userId: number): Promise<CampaignWithStats[]> {
    const campaignStats = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        rules: campaigns.rules,
        message: campaigns.message,
        audienceSize: campaigns.audienceSize,
        status: campaigns.status,
        scheduledAt: campaigns.scheduledAt,
        createdBy: campaigns.createdBy,
        createdAt: campaigns.createdAt,
        sentCount: sql<number>`COUNT(CASE WHEN ${communicationLogs.status} = 'sent' THEN 1 END)`,
        failedCount: sql<number>`COUNT(CASE WHEN ${communicationLogs.status} = 'failed' THEN 1 END)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${communicationLogs.status} = 'pending' THEN 1 END)`,
      })
      .from(campaigns)
      .leftJoin(communicationLogs, eq(campaigns.id, communicationLogs.campaignId))
      .where(eq(campaigns.createdBy, userId))
      .groupBy(campaigns.id)
      .orderBy(desc(campaigns.createdAt));

    return campaignStats;
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaignStatus(id: number, status: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ status })
      .where(eq(campaigns.id, id));
  }

  async createCommunicationLog(insertLog: InsertCommunicationLog): Promise<CommunicationLog> {
    const [log] = await db.insert(communicationLogs).values(insertLog).returning();
    return log;
  }

  async updateCommunicationLogStatus(id: number, status: string, failureReason?: string): Promise<void> {
    const updateData: any = { status };
    if (status === 'sent') {
      updateData.sentAt = new Date();
    }
    if (failureReason) {
      updateData.failureReason = failureReason;
    }

    await db
      .update(communicationLogs)
      .set(updateData)
      .where(eq(communicationLogs.id, id));
  }

  async getCommunicationLogsByCampaign(campaignId: number): Promise<CommunicationLog[]> {
    return await db
      .select()
      .from(communicationLogs)
      .where(eq(communicationLogs.campaignId, campaignId));
  }
}

export const storage = new DatabaseStorage();
