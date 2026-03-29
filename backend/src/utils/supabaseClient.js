const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to convert SQL-like queries to Supabase queries
const supabaseQuery = {
  // SELECT with filters
  select: async (table, columns = '*', options = {}) => {
    let query = supabase.from(table).select(columns);
    
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options.order) {
      query = query.order(options.order.column, { 
        ascending: options.order.ascending !== false 
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.relations) {
      // Relations are handled in the select string
    }
    
    return query;
  },
  
  // INSERT
  insert: async (table, data) => {
    return supabase.from(table).insert(data).select().single();
  },
  
  // UPDATE
  update: async (table, data, filters) => {
    let query = supabase.from(table).update(data);
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    return query.select().single();
  },
  
  // DELETE
  delete: async (table, filters) => {
    let query = supabase.from(table).delete();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    return query;
  },
  
  // COUNT
  count: async (table, filters = {}) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true });
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { count } = await query;
    return count || 0;
  },
};

module.exports = { supabase, supabaseQuery };
