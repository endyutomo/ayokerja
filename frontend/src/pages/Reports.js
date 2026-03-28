import React, { useState } from 'react';
import { reportService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';

import Download from '@mui/icons-material/Download';
import Assessment from '@mui/icons-material/Assessment';
import FileCopy from '@mui/icons-material/FileCopy';

const Reports = () => {
  const [reportType, setReportType] = useState('attendance');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    employeeId: '',
    departmentId: '',
    status: '',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      const params = { ...filters };

      switch (reportType) {
        case 'attendance':
          response = await reportService.getAttendanceReport(params);
          break;
        case 'employee-summary':
          response = await reportService.getEmployeeSummaryReport(params);
          break;
        case 'late':
          response = await reportService.getLateReport(params);
          break;
        case 'overtime':
          response = await reportService.getOvertimeReport(params);
          break;
        case 'leave':
          response = await reportService.getLeaveReport(params);
          break;
        default:
          throw new Error('Invalid report type');
      }

      setReportData(response.data);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.data) return;

    const headers = Object.keys(reportData.data[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.data.map((row) =>
        headers.map((header) => `"${row[header] || ''}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const renderTable = () => {
    if (!reportData || !reportData.data) return null;

    const data = reportData.data;

    switch (reportType) {
      case 'attendance':
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell>Check Out</TableCell>
                  <TableCell>Work Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{format(new Date(row.attendance_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.department_name || '-'}</TableCell>
                    <TableCell>{row.check_in_time ? format(new Date(row.check_in_time), 'HH:mm') : '-'}</TableCell>
                    <TableCell>{row.check_out_time ? format(new Date(row.check_out_time), 'HH:mm') : '-'}</TableCell>
                    <TableCell>{row.work_hours || '-'}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'employee-summary':
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Present</TableCell>
                  <TableCell>Late</TableCell>
                  <TableCell>Absent</TableCell>
                  <TableCell>Work Hours</TableCell>
                  <TableCell>Overtime</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.department_name || '-'}</TableCell>
                    <TableCell>{row.present_days || 0}</TableCell>
                    <TableCell>{row.late_days || 0}</TableCell>
                    <TableCell>{row.absent_days || 0}</TableCell>
                    <TableCell>{row.total_work_hours || 0}</TableCell>
                    <TableCell>{row.total_overtime_hours || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'late':
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Late Count</TableCell>
                  <TableCell>Total Late (min)</TableCell>
                  <TableCell>Avg Late (min)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.department_name || '-'}</TableCell>
                    <TableCell>{row.late_count}</TableCell>
                    <TableCell>{row.total_late_minutes}</TableCell>
                    <TableCell>{Math.round(row.avg_late_minutes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'overtime':
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>OT Days</TableCell>
                  <TableCell>Total OT Hours</TableCell>
                  <TableCell>Avg OT Hours</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.department_name || '-'}</TableCell>
                    <TableCell>{row.overtime_days}</TableCell>
                    <TableCell>{row.total_overtime_hours?.toFixed(2)}</TableCell>
                    <TableCell>{row.avg_overtime_hours?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      case 'leave':
        return (
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
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.leave_type_name || '-'}</TableCell>
                    <TableCell>{format(new Date(row.start_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(row.end_date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{row.total_days}</TableCell>
                    <TableCell>{row.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Generate and export various attendance and HR reports
      </Typography>

      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Configuration
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Report Type"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <MenuItem value="attendance">Attendance Report</MenuItem>
                    <MenuItem value="employee-summary">Employee Summary</MenuItem>
                    <MenuItem value="late">Late Arrivals Report</MenuItem>
                    <MenuItem value="overtime">Overtime Report</MenuItem>
                    <MenuItem value="leave">Leave Report</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Assessment />}
                    onClick={generateReport}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                  </Button>
                </Grid>
                {reportData && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportToCSV}
                    >
                      Export to CSV
                    </Button>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Report Results */}
        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {reportType.replace('-', ' ').toUpperCase()} REPORT
                </Typography>
                {reportData && (
                  <Typography variant="body2" color="text.secondary">
                    {reportData.meta?.totalRecords || reportData.data?.length || 0} records
                  </Typography>
                )}
              </Box>
              {reportData ? (
                renderTable()
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                  }}
                >
                  <FileCopy sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Select report parameters and click "Generate Report" to view results
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;
