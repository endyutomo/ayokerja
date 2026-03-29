const { supabase } = require('../utils/supabaseClient');
const { logActivity } = require('../middleware/activityLogger');

// Get all ${file}s
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('${file}s')
      .select('*')
      .eq('company_id', req.user.company_id)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Get ${file}s error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ${file}s.' });
  }
};

// Get ${file} by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('${file}s')
      .select('*')
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: '${file} not found.' });
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get ${file} by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to get ${file}.' });
  }
};

// Create ${file}
exports.create = async (req, res) => {
  try {
    const data = { ...req.body, company_id: req.user.company_id };
    const { data: result, error } = await supabase
      .from('${file}s')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    await logActivity(req.user.company_id, req.user.id, 'CREATE_${file}'.toUpperCase(), '${file}', result.id, 'Created ${file}');
    res.status(201).json({ success: true, message: '${file} created successfully.', data: result });
  } catch (error) {
    console.error('Create ${file} error:', error);
    res.status(500).json({ success: false, message: 'Failed to create ${file}.' });
  }
};

// Update ${file}
exports.update = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('${file}s')
      .update(req.body)
      .eq('id', id)
      .eq('company_id', req.user.company_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: '${file} not found.' });
    }
    await logActivity(req.user.company_id, req.user.id, 'UPDATE_${file}'.toUpperCase(), '${file}', id, 'Updated ${file}');
    res.json({ success: true, message: '${file} updated successfully.', data });
  } catch (error) {
    console.error('Update ${file} error:', error);
    res.status(500).json({ success: false, message: 'Failed to update ${file}.' });
  }
};

// Delete ${file}
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from('${file}s').delete().eq('id', id).eq('company_id', req.user.company_id);
    await logActivity(req.user.company_id, req.user.id, 'DELETE_${file}'.toUpperCase(), '${file}', id, 'Deleted ${file}');
    res.json({ success: true, message: '${file} deleted successfully.' });
  } catch (error) {
    console.error('Delete ${file} error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete ${file}.' });
  }
};
