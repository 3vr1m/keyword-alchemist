const { v4: uuidv4 } = require('uuid');

class KeyGenerator {
  // Generate access key in format: KWA-XXXXXX
  generateAccessKey() {
    const prefix = 'KWA';
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
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
