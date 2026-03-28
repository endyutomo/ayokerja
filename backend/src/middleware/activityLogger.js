const pool = require('../config/database');

const activityLogger = (action) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = async function(data) {
      // Log activity after response
      try {
        await pool.query(`
          INSERT INTO activity_logs (company_id, user_id, action, entity_type, entity_id, description, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          req.user?.company_id || null,
          req.user?.id || null,
          action,
          req.params.entityType || null,
          req.params.id || null,
          `${action} - ${req.method} ${req.originalUrl}`,
          req.ip,
          req.get('user-agent'),
        ]);
      } catch (error) {
        console.error('Activity logging error:', error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

const logActivity = async (companyId, userId, action, entityType, entityId, description, metadata = {}) => {
  try {
    await pool.query(`
      INSERT INTO activity_logs (company_id, user_id, action, entity_type, entity_id, description, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [companyId, userId, action, entityType, entityId, description, JSON.stringify(metadata)]);
  } catch (error) {
    console.error('Activity logging error:', error);
  }
};

module.exports = { activityLogger, logActivity };
