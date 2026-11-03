import { db } from './database';
import { Business, BusinessMember, BusinessOnboardingData, BusinessRole } from '../../domain/models/business';

export class DexieBusinessRepository {
  /**
   * Create a new business and assign the creating user as 'owner'
   */
  async createBusiness(
    data: BusinessOnboardingData,
    userId: string
  ): Promise<{ business: Business; member: BusinessMember }> {
    const now = new Date().toISOString();
    const businessId = crypto.randomUUID();
    const memberId = crypto.randomUUID();

    const business: Business = {
      id: businessId,
      name: data.name.trim(),
      type: data.type,
      category: data.category,
      currencyCode: data.currencyCode || 'TZS',
      location: data.location?.trim(),
      address: data.address?.trim(),
      financialYearStart: data.financialYearStart || '01-01',
      accountingPreferences: data.accountingPreferences || { basis: 'cash', vatRegistered: false },
      createdAt: now,
      updatedAt: now,
    };

    const member: BusinessMember = {
      id: memberId,
      businessId,
      userId,
      role: 'owner',
      permissions: ['all'],
      createdAt: now,
      updatedAt: now,
    };

    await db.transaction('rw', [db.businesses, db.businessMembers], async () => {
      await db.businesses.put(business);
      await db.businessMembers.put(member);
    });

    return { business, member };
  }

  /**
   * Get all businesses that a user has membership in
   */
  async getBusinessesByUserId(userId: string): Promise<Business[]> {
    const memberships = await db.businessMembers.where('userId').equals(userId).toArray();
    if (memberships.length === 0) return [];

    const businessIds = memberships.map((m) => m.businessId);
    const businesses = await db.businesses.where('id').anyOf(businessIds).toArray();
    return businesses;
  }

  /**
   * Get a single business by ID
   */
  async getBusinessById(id: string): Promise<Business | null> {
    const business = await db.businesses.get(id);
    return business || null;
  }

  /**
   * Get the role of a user in a specific business
   */
  async getUserRole(businessId: string, userId: string): Promise<BusinessRole | null> {
    const member = await db.businessMembers
      .where('[businessId+userId]')
      .equals([businessId, userId])
      .first();
    return member ? member.role : null;
  }

  /**
   * Get all members belonging to a business
   */
  async getMembers(businessId: string): Promise<BusinessMember[]> {
    return await db.businessMembers.where('businessId').equals(businessId).toArray();
  }

  /**
   * Update business details
   */
  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    const existing = await db.businesses.get(id);
    if (!existing) throw new Error(`Business with ID ${id} not found.`);

    const updated: Business = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.businesses.put(updated);
    return updated;
  }

  /**
   * Delete a business and its memberships
   */
  async deleteBusiness(id: string): Promise<void> {
    await db.transaction('rw', [db.businesses, db.businessMembers, db.books, db.transactions, db.inventoryItems], async () => {
      await db.businesses.delete(id);
      await db.businessMembers.where('businessId').equals(id).delete();
      await db.books.where('businessId').equals(id).delete();
      await db.transactions.where('businessId').equals(id).delete();
      await db.inventoryItems.where('businessId').equals(id).delete();
    });
  }
}
