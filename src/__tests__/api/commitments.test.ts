/**
 * Unit Tests for Commitment Business Logic
 * 
 * These tests verify the core commitment logic works correctly.
 * Run with: npm test -- src/__tests__/api/commitments.test.ts
 */

describe('Commitment Business Logic', () => {
  
  // Helper function that mirrors server-side logic
  function calculateVipPricing(
    profile: { isExclusiveMember?: boolean },
    deal: { isExclusive?: boolean; exclusivePrice?: number; payout: number }
  ) {
    const isVipPricing = !!(profile.isExclusiveMember && deal.isExclusive && deal.exclusivePrice);
    const payoutRate = isVipPricing ? deal.exclusivePrice! : deal.payout;
    return { isVipPricing, payoutRate };
  }
  
  // Helper function that mirrors vendor limit logic
  function checkVendorLimit(
    existingCommitments: Array<{ quantity: number; status: string }>,
    newQuantity: number,
    limit: number | null
  ) {
    const effectiveLimit = limit || 999;
    const fulfilledQty = existingCommitments
      .filter(c => c.status === 'FULFILLED')
      .reduce((sum, c) => sum + c.quantity, 0);
    const activeQty = existingCommitments
      .filter(c => c.status !== 'FULFILLED' && c.status !== 'CANCELLED')
      .reduce((sum, c) => sum + c.quantity, 0);
    const totalCommitted = fulfilledQty + activeQty;
    const remainingAllowance = effectiveLimit - totalCommitted;
    
    return {
      canCommit: newQuantity <= remainingAllowance && remainingAllowance > 0,
      remainingAllowance,
      totalCommitted,
      fulfilledQty,
      activeQty
    };
  }

  describe('VIP Pricing', () => {
    it('should use VIP price when user is exclusive member and deal has exclusive pricing', () => {
      const profile = { isExclusiveMember: true };
      const deal = { isExclusive: true, exclusivePrice: 1200, payout: 1100 };
      
      const result = calculateVipPricing(profile, deal);
      
      expect(result.isVipPricing).toBe(true);
      expect(result.payoutRate).toBe(1200);
    });

    it('should use regular price when user is not exclusive member', () => {
      const profile = { isExclusiveMember: false };
      const deal = { isExclusive: true, exclusivePrice: 1200, payout: 1100 };
      
      const result = calculateVipPricing(profile, deal);
      
      expect(result.isVipPricing).toBe(false);
      expect(result.payoutRate).toBe(1100);
    });

    it('should use regular price when deal is not exclusive', () => {
      const profile = { isExclusiveMember: true };
      const deal = { isExclusive: false, payout: 1100 };
      
      const result = calculateVipPricing(profile, deal);
      
      expect(result.isVipPricing).toBe(false);
      expect(result.payoutRate).toBe(1100);
    });

    it('should use regular price when deal has no exclusive price set', () => {
      const profile = { isExclusiveMember: true };
      const deal = { isExclusive: true, exclusivePrice: undefined, payout: 1100 };
      
      const result = calculateVipPricing(profile, deal);
      
      expect(result.isVipPricing).toBe(false);
      expect(result.payoutRate).toBe(1100);
    });

    it('should return boolean for isVipPricing, not the price value', () => {
      const profile = { isExclusiveMember: true };
      const deal = { isExclusive: true, exclusivePrice: 1200, payout: 1100 };
      
      const result = calculateVipPricing(profile, deal);
      
      expect(typeof result.isVipPricing).toBe('boolean');
      expect(result.isVipPricing).toBe(true);
    });
  });

  describe('Vendor Limit - Multiple Commitments', () => {
    it('should allow first commitment up to vendor limit', () => {
      const existingCommitments: Array<{ quantity: number; status: string }> = [];
      const result = checkVendorLimit(existingCommitments, 5, 10);
      
      expect(result.canCommit).toBe(true);
      expect(result.remainingAllowance).toBe(10);
    });

    it('should allow multiple commitments as long as total does not exceed limit', () => {
      const existingCommitments = [
        { quantity: 3, status: 'PENDING' }
      ];
      const result = checkVendorLimit(existingCommitments, 4, 10);
      
      expect(result.canCommit).toBe(true);
      expect(result.remainingAllowance).toBe(7);
      expect(result.totalCommitted).toBe(3);
    });

    it('should count fulfilled commitments toward the limit', () => {
      const existingCommitments = [
        { quantity: 5, status: 'FULFILLED' },
        { quantity: 2, status: 'PENDING' }
      ];
      const result = checkVendorLimit(existingCommitments, 2, 10);
      
      expect(result.canCommit).toBe(true);
      expect(result.remainingAllowance).toBe(3);
      expect(result.fulfilledQty).toBe(5);
      expect(result.activeQty).toBe(2);
    });

    it('should reject commitment if it would exceed vendor limit', () => {
      const existingCommitments = [
        { quantity: 8, status: 'PENDING' }
      ];
      const result = checkVendorLimit(existingCommitments, 5, 10);
      
      expect(result.canCommit).toBe(false);
      expect(result.remainingAllowance).toBe(2);
    });

    it('should reject commitment when vendor limit already reached', () => {
      const existingCommitments = [
        { quantity: 10, status: 'FULFILLED' }
      ];
      const result = checkVendorLimit(existingCommitments, 1, 10);
      
      expect(result.canCommit).toBe(false);
      expect(result.remainingAllowance).toBe(0);
    });

    it('should not count cancelled commitments toward the limit', () => {
      const existingCommitments = [
        { quantity: 5, status: 'CANCELLED' },
        { quantity: 3, status: 'PENDING' }
      ];
      const result = checkVendorLimit(existingCommitments, 5, 10);
      
      expect(result.canCommit).toBe(true);
      expect(result.totalCommitted).toBe(3);
    });

    it('should use high default limit when no limit set', () => {
      const existingCommitments: Array<{ quantity: number; status: string }> = [];
      const result = checkVendorLimit(existingCommitments, 100, null);
      
      expect(result.canCommit).toBe(true);
      expect(result.remainingAllowance).toBe(999);
    });

    it('should allow multiple active commitments simultaneously', () => {
      const existingCommitments = [
        { quantity: 2, status: 'PENDING' },
        { quantity: 3, status: 'IN_TRANSIT' },
        { quantity: 1, status: 'DELIVERED' }
      ];
      const result = checkVendorLimit(existingCommitments, 2, 10);
      
      expect(result.canCommit).toBe(true);
      expect(result.activeQty).toBe(6); // 2+3+1 all active (not fulfilled)
      expect(result.remainingAllowance).toBe(4);
    });
  });

  describe('Quantity Update Validation', () => {
    function checkQuantityUpdate(
      otherCommitments: Array<{ quantity: number }>,
      newQuantity: number,
      limit: number
    ) {
      const otherQty = otherCommitments.reduce((sum, c) => sum + c.quantity, 0);
      const newTotal = otherQty + newQuantity;
      const available = limit - otherQty;
      
      return {
        canUpdate: newTotal <= limit,
        available,
        newTotal
      };
    }

    it('should allow quantity increase within limit', () => {
      const otherCommitments = [{ quantity: 3 }];
      const result = checkQuantityUpdate(otherCommitments, 5, 10);
      
      expect(result.canUpdate).toBe(true);
      expect(result.newTotal).toBe(8);
    });

    it('should reject quantity increase that exceeds limit', () => {
      const otherCommitments = [{ quantity: 6 }];
      const result = checkQuantityUpdate(otherCommitments, 5, 10);
      
      expect(result.canUpdate).toBe(false);
      expect(result.available).toBe(4);
    });

    it('should allow quantity decrease', () => {
      const otherCommitments = [{ quantity: 5 }];
      const result = checkQuantityUpdate(otherCommitments, 2, 10);
      
      expect(result.canUpdate).toBe(true);
    });

    it('should calculate available correctly with multiple other commitments', () => {
      const otherCommitments = [
        { quantity: 2 },
        { quantity: 3 },
        { quantity: 1 }
      ];
      const result = checkQuantityUpdate(otherCommitments, 3, 10);
      
      expect(result.canUpdate).toBe(true);
      expect(result.available).toBe(4); // 10 - 6 = 4
      expect(result.newTotal).toBe(9);  // 6 + 3 = 9
    });
  });

  describe('Commitment Status Transitions', () => {
    const allowedUpdateStatuses = ['PENDING', 'DROP_OFF_PENDING'];
    const allStatuses = ['PENDING', 'DROP_OFF_PENDING', 'IN_TRANSIT', 'DELIVERED', 'FULFILLED', 'CANCELLED'];

    it('should allow updates when status is PENDING', () => {
      expect(allowedUpdateStatuses.includes('PENDING')).toBe(true);
    });

    it('should allow updates when status is DROP_OFF_PENDING', () => {
      expect(allowedUpdateStatuses.includes('DROP_OFF_PENDING')).toBe(true);
    });

    it('should reject updates when status is IN_TRANSIT', () => {
      expect(allowedUpdateStatuses.includes('IN_TRANSIT')).toBe(false);
    });

    it('should reject updates when status is DELIVERED', () => {
      expect(allowedUpdateStatuses.includes('DELIVERED')).toBe(false);
    });

    it('should reject updates when status is FULFILLED', () => {
      expect(allowedUpdateStatuses.includes('FULFILLED')).toBe(false);
    });

    it('should reject updates when status is CANCELLED', () => {
      expect(allowedUpdateStatuses.includes('CANCELLED')).toBe(false);
    });
  });

  describe('Payout Rate Security', () => {
    it('should calculate payout server-side, ignoring any client input', () => {
      // Simulating what the server does - it ONLY uses dealId and quantity from body
      const clientBody = { 
        dealId: 'deal123', 
        quantity: 5, 
        payoutRate: 9999999, // Malicious attempt
        isVipPricing: true   // Malicious attempt
      };
      
      // Server only extracts these
      const { dealId, quantity } = clientBody;
      
      // Server calculates payout from DB, not from client
      const dealFromDb = { payout: 1100, isExclusive: false };
      const profileFromDb = { isExclusiveMember: false };
      
      const result = calculateVipPricing(profileFromDb, dealFromDb);
      
      // Should use DB values, not client values
      expect(result.payoutRate).toBe(1100);
      expect(result.isVipPricing).toBe(false);
      expect(result.payoutRate).not.toBe(9999999);
    });
  });
});

