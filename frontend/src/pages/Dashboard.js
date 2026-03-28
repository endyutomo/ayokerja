import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import socketService from '../services/socket';
import { toast } from 'react-toastify';

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';

import People from '@mui/icons-material/People';
import Badge from '@mui/icons-material/Badge';
import CheckCircle from '@mui/icons-material/CheckCircle';
import AccessTime from '@mui/icons-material/AccessTime';
import DevicesOther from '@mui/icons-material/DevicesOther';
import BeachAccess from '@mui/icons-material/BeachAccess';
import Warning from '@mui/icons-material/Warning';
import TrendingUp from '@mui/icons-material/TrendingUp';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const StatCard = ({ title, value, icon, color, subtext }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            {value}
          </Typography>
          {subtext && (
            <Typography variant="caption" color="text.secondary">
              {subtext}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${color}.lighter`,
            color: `${color}.main`,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, weeklyRes, deptRes] = await Promise.all([
        dashboardService.getStatistics(),
        dashboardService.getWeeklyChart(4),
        dashboardService.getDepartmentAttendance(),
      ]);

      setStats(statsRes.data.data);
      setWeeklyData(weeklyRes.data.data.reverse());
      setDepartmentData(deptRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for real-time updates
    const unsubscribe = socketService.onAttendanceUpdate((data) => {
      console.log('Real-time update:', data);
      fetchDashboardData();
    });

    return () => unsubscribe();
  }, []);

  const COLORS = ['#1976d2', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Welcome back! Here's what's happening today.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Employees"
            value={stats?.employees?.total_employees || 0}
            icon={<People fontSize="large" />}
            color="primary"
            subtext={`${stats?.employees?.new_employees_this_month || 0} new this month`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Present Today"
            value={stats?.attendance?.present_today || 0}
            icon={<Badge fontSize="large" />}
            color="success"
            subtext={`${stats?.attendance?.late_today || 0} late arrivals`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Devices"
            value={`${stats?.devices?.online_devices || 0}/${stats?.devices?.total_devices || 0}`}
            icon={<DevicesOther fontSize="large" />}
            color="info"
            subtext={`${stats?.devices?.offline_devices || 0} offline`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="On Leave"
            value={stats?.leaves?.on_leave_today || 0}
            icon={<BeachAccess fontSize="large" />}
            color="warning"
            subtext={`${stats?.leaves?.pending_leaves || 0} pending requests`}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Weekly Attendance Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Attendance Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week_start" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                  <Legend />
                  <Line type="monotone" dataKey="present_count" stroke="#1976d2" name="Present" strokeWidth={2} />
                  <Line type="monotone" dataKey="absent_count" stroke="#f44336" name="Absent" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Attendance */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Department Attendance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage?.toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="attendance_percentage"
                    nameKey="name"
                  >
                    {departmentData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Recent Check-ins
              </Typography>
              <Box sx={{ mt: 2 }}>
                {stats?.recentActivity?.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((record) => (
                    <Box
                      key={record.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        py: 1.5,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        {record.full_name?.charAt(0) || record.employee_number?.charAt(0)}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {record.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.employee_number}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" color="success.main">
                          {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.status}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    No attendance records for today
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
