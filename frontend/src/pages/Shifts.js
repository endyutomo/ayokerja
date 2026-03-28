import React, { useState, useEffect } from 'react';
import { shiftService } from '../services/api';
import { toast } from 'react-toastify';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';

import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Schedule from '@mui/icons-material/Schedule';

const Shifts = () => {
  const [loading, setLoading] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    workHours: 8,
    isOvernight: false,
  });

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await shiftService.getAll();
      setShifts(response.data.data);
    } catch (error) {
      toast.error('Failed to load shifts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      setSelectedShift(shift);
      setFormData({
        name: shift.name,
        code: shift.code || '',
        startTime: shift.start_time.substring(0, 5),
        endTime: shift.end_time.substring(0, 5),
        breakStart: shift.break_start ? shift.break_start.substring(0, 5) : '',
        breakEnd: shift.break_end ? shift.break_end.substring(0, 5) : '',
        workHours: shift.work_hours || 8,
        isOvernight: shift.is_overnight || false,
      });
    } else {
      setSelectedShift(null);
      setFormData({
        name: '',
        code: '',
        startTime: '09:00',
        endTime: '18:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        workHours: 8,
        isOvernight: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedShift(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedShift) {
        await shiftService.update(selectedShift.id, formData);
        toast.success('Shift updated successfully');
      } else {
        await shiftService.create(formData);
        toast.success('Shift created successfully');
      }
      handleCloseDialog();
      fetchShifts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await shiftService.delete(id);
        toast.success('Shift deleted successfully');
        fetchShifts();
      } catch (error) {
        toast.error('Failed to delete shift');
      }
    }
  };

  const calculateWorkHours = (start, end, breakStart, breakEnd) => {
    const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);
    let endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);
    
    // Handle overnight shifts
    if (formData.isOvernight || endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    
    let workMinutes = endMinutes - startMinutes;
    
    // Subtract break time
    if (breakStart && breakEnd) {
      const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1]);
      const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1]);
      workMinutes -= (breakEndMinutes - breakStartMinutes);
    }
    
    return (workMinutes / 60).toFixed(2);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Shifts
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Shift
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shift</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Break</TableCell>
                <TableCell>Work Hours</TableCell>
                <TableCell>Overnight</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'primary.lighter',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <Schedule />
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {shift.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{shift.code || '-'}</TableCell>
                  <TableCell>{shift.start_time.substring(0, 5)}</TableCell>
                  <TableCell>{shift.end_time.substring(0, 5)}</TableCell>
                  <TableCell>
                    {shift.break_start && shift.break_end
                      ? `${shift.break_start.substring(0, 5)} - ${shift.break_end.substring(0, 5)}`
                      : '-'}
                  </TableCell>
                  <TableCell>{shift.work_hours || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={shift.is_overnight ? 'Yes' : 'No'}
                      color={shift.is_overnight ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(shift)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(shift.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedShift ? 'Edit Shift' : 'Add Shift'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shift Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Shift Code"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Work Hours"
                type="number"
                value={formData.workHours}
                onChange={(e) => setFormData((prev) => ({ ...prev, workHours: e.target.value }))}
                InputProps={{ inputProps: { step: 0.5, min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Break Start"
                type="time"
                value={formData.breakStart}
                onChange={(e) => setFormData((prev) => ({ ...prev, breakStart: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Break End"
                type="time"
                value={formData.breakEnd}
                onChange={(e) => setFormData((prev) => ({ ...prev, breakEnd: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isOvernight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isOvernight: e.target.checked }))}
                  />
                }
                label="Overnight Shift"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedShift ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Shifts;
