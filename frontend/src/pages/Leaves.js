import React, { useState, useEffect } from 'react';
import { leaveService, employeeService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';

import Add from '@mui/icons-material/Add';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import BeachAccess from '@mui/icons-material/BeachAccess';

const Leaves = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveTypeId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    totalDays: 1,
    reason: '',
  });

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const status = tabValue === 0 ? 'pending' : tabValue === 1 ? 'approved' : '';
      const params = {
        page: pagination.page + 1,
        limit: pagination.limit,
        status: status || undefined,
      };
      const response = await leaveService.getAll(params);
      setLeaveRequests(response.data.data);
      setPagination((prev) => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      toast.error('Failed to load leave requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await leaveService.getLeaveTypes();
      setLeaveTypes(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ limit: 1000 });
      setEmployees(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
    fetchEmployees();
  }, [tabValue, pagination.page, pagination.limit]);

  const handleOpenDialog = () => {
    setFormData({
      employeeId: '',
      leaveTypeId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      totalDays: 1,
      reason: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    try {
      await leaveService.create(formData);
      toast.success('Leave request created successfully');
      handleCloseDialog();
      fetchLeaveRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      await leaveService.approve(id);
      toast.success('Leave request approved');
      fetchLeaveRequests();
    } catch (error) {
      toast.error('Failed to approve leave request');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await leaveService.reject(id, { rejectionReason: reason });
        toast.success('Leave request rejected');
        fetchLeaveRequests();
      } catch (error) {
        toast.error('Failed to reject leave request');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Leave Management
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenDialog}>
          Request Leave
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="All" />
        </Tabs>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Days</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {request.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.employee_number}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BeachAccess fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      {request.leave_type_name || '-'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.start_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.end_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{request.total_days}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.submitted_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <>
                        <IconButton size="small" onClick={() => handleApprove(request.id)}>
                          <CheckCircle fontSize="small" color="success" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleReject(request.id)}>
                          <Cancel fontSize="small" color="error" />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={(e, newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
          onRowsPerPageChange={(e) =>
            setPagination((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 0 }))
          }
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>

      {/* Add Leave Request Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Employee"
                value={formData.employeeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                required
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_number})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Leave Type"
                value={formData.leaveTypeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, leaveTypeId: e.target.value }))}
                required
              >
                {leaveTypes.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name} ({type.quota_days} days)
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => {
                  const startDate = e.target.value;
                  const totalDays = calculateDays(startDate, formData.endDate);
                  setFormData((prev) => ({ ...prev, startDate, totalDays }));
                }}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => {
                  const endDate = e.target.value;
                  const totalDays = calculateDays(formData.startDate, endDate);
                  setFormData((prev) => ({ ...prev, endDate, totalDays }));
                }}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Days"
                type="number"
                value={formData.totalDays}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Leaves;
