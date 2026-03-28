import React, { useState, useEffect } from 'react';
import { deviceService } from '../services/api';
import { toast } from 'react-toastify';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';

import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Refresh from '@mui/icons-material/Refresh';
import Usb from '@mui/icons-material/Usb';
import WifiOff from '@mui/icons-material/WifiOff';

const Devices = () => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, limit: 20, total: 0 });
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    deviceId: '',
    serialNumber: '',
    model: '',
    manufacturer: '',
    ipAddress: '',
    port: 4370,
    location: '',
  });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page + 1, limit: pagination.limit };
      const response = await deviceService.getAll(params);
      setDevices(response.data.data);
      setPagination((prev) => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      toast.error('Failed to load devices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await deviceService.getStatistics();
      setStats(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [pagination.page, pagination.limit]);

  const handleOpenDialog = (device = null) => {
    if (device) {
      setSelectedDevice(device);
      setFormData({
        name: device.name,
        deviceId: device.device_id,
        serialNumber: device.serial_number || '',
        model: device.model || '',
        manufacturer: device.manufacturer || '',
        ipAddress: device.ip_address || '',
        port: device.port || 4370,
        location: device.location || '',
      });
    } else {
      setSelectedDevice(null);
      setFormData({
        name: '',
        deviceId: '',
        serialNumber: '',
        model: '',
        manufacturer: '',
        ipAddress: '',
        port: 4370,
        location: '',
      });
    }
    setDeviceDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDeviceDialogOpen(false);
    setSelectedDevice(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedDevice) {
        await deviceService.update(selectedDevice.id, formData);
        toast.success('Device updated successfully');
      } else {
        await deviceService.create(formData);
        toast.success('Device created successfully');
      }
      handleCloseDialog();
      fetchDevices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deviceService.delete(id);
        toast.success('Device deleted successfully');
        fetchDevices();
      } catch (error) {
        toast.error('Failed to delete device');
      }
    }
  };

  const handleTestConnection = async (id) => {
    try {
      await deviceService.testConnection(id);
      toast.success('Connection test successful');
    } catch (error) {
      toast.error('Connection test failed');
    }
  };

  const handleRestart = async (id) => {
    if (window.confirm('Are you sure you want to restart this device?')) {
      try {
        await deviceService.restart(id);
        toast.success('Restart command sent');
      } catch (error) {
        toast.error('Failed to restart device');
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Devices
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Add Device
        </Button>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Total Devices
              </Typography>
              <Typography variant="h3" fontWeight="bold">
                {stats?.total_devices || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Online
              </Typography>
              <Typography variant="h3" color="success.main" fontWeight="bold">
                {stats?.online_devices || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                Offline
              </Typography>
              <Typography variant="h3" color="error.main" fontWeight="bold">
                {stats?.offline_devices || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Devices Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Device ID</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Connection</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: device.status === 'online' ? 'success.lighter' : 'grey.200',
                          color: device.status === 'online' ? 'success.main' : 'grey.600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        {device.status === 'online' ? <Usb /> : <WifiOff />}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {device.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {device.model || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{device.device_id}</TableCell>
                  <TableCell>{device.ip_address || '-'}</TableCell>
                  <TableCell>{device.location || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={device.status}
                      color={device.status === 'online' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {device.last_connection
                      ? new Date(device.last_connection).toLocaleString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(device)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleTestConnection(device.id)}>
                      <Refresh fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleRestart(device.id)}>
                      <Usb fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(device.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
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

      {/* Add/Edit Device Dialog */}
      <Dialog open={deviceDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDevice ? 'Edit Device' : 'Add New Device'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Device Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Device ID"
                value={formData.deviceId}
                onChange={(e) => setFormData((prev) => ({ ...prev, deviceId: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={formData.serialNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IP Address"
                value={formData.ipAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, ipAddress: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Port"
                type="number"
                value={formData.port}
                onChange={(e) => setFormData((prev) => ({ ...prev, port: parseInt(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedDevice ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Devices;
