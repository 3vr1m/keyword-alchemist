const { v4: uuidv4 } = require('uuid');

class KeyGenerator {
  // Generate access key in format: KWA-XXXXXXXXX (9 characters)
  // Uses alphanumeric chars + hyphens for complexity: e.g., KWA-A8K-9M2-7J
  generateAccessKey() {
    const prefix = 'KWA';
    
    // Generate 9 complex characters with mix of numbers, letters, and hyphens
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0,O,I,1
    let randomPart = '';
    
    // Generate in pattern: XXX-XXX-XX (3-3-2 with hyphens for readability)
    for (let i = 0; i < 9; i++) {
      if (i === 3 || i === 6) {
        randomPart += '-';
      }
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${prefix}-${randomPart}`;
  }

  // Generate unique key (check against database)
  async generateUniqueKey(database) {
    let key;
    let exists = true;
    
    while (exists) {
      key = this.generateAccessKey();
      const existing = await database.getAccessKey(key);
      exists = !!existing;
    }
    
    return key;
  }

  // Credit amounts by plan
  getCreditsForPlan(plan) {
    const credits = {
      basic: 10,
      blogger: 50,
      pro: 240
    };
    
    return credits[plan] || 0;
  }
}

module.exports = new KeyGenerator();
