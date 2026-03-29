const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const activityLogger = (action) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;

    res.json = async function(data) {
      // Log activity after response
      try {
        await supabase.from('activity_logs').insert({
          company_id: req.user?.company_id || null,
          user_id: req.user?.id || null,
          action: action,
          entity_type: req.params.entityType || null,
          entity_id: req.params.id || null,
          description: `${action} - ${req.method} ${req.originalUrl}`,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
        });
      } catch (error) {
        console.error('Activity logging error:', error.message);
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

const logActivity = async (companyId, userId, action, entityType, entityId, description, metadata = {}) => {
  try {
    await supabase.from('activity_logs').insert({
      company_id: companyId,
      user_id: userId,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      description: description,
      metadata: metadata,
    });
  } catch (error) {
    console.error('Activity logging error:', error.message);
  }
};

module.exports = { activityLogger, logActivity };
