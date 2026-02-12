'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi, bookingsApi, insuranceRequestsApi, generalRequestsApi } from "@/lib/api";
import { Booking, GeneralRequest, InsuranceRequest } from "@/lib/types";
import { 
  Calendar, 
  ShieldCheck as ShieldCheckIcon, 
  MessageSquare, 
  IndianRupee, 
  Users, 
  Clock, 
  CheckCircle, 
  Activity 
} from "lucide-react";
import RequestStatusChart from "@/components/dashboard/request-status-chart";
import CombinedTrendChart from "@/app/dashboard/combined-trend-chart"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalInsuranceRequests: number;
  pendingInsuranceRequests: number;
  totalCarRequests: number;
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to format date
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [insuranceRequests, setInsuranceRequests] = useState<InsuranceRequest[]>([]);
  const [generalRequests, setGeneralRequests] = useState<GeneralRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('📊 Fetching dashboard data from backend...');
        
        // Fetch all data in parallel
        const [statsResponse, bookingsResponse, insuranceResponse, requestsResponse] = await Promise.all([
          dashboardApi.getStats(),
          bookingsApi.getAll(),
          insuranceRequestsApi.getAll(),
          generalRequestsApi.getAll()
        ]);

        if (statsResponse.success && statsResponse.data) setStats(statsResponse.data);
        if (bookingsResponse.success && bookingsResponse.data) setBookings(bookingsResponse.data.bookings || []);
        if (insuranceResponse.success && insuranceResponse.data) setInsuranceRequests(insuranceResponse.data.requests || []);
        if (requestsResponse.success && requestsResponse.data) setGeneralRequests(requestsResponse.data.requests || []);

        if (!statsResponse.success) setError('Failed to load dashboard statistics');

      } catch (err) {
        console.error('❌ Failed to fetch dashboard data:', err);
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error || 'Failed to load dashboard data'}</div>
      </div>
    );
  }

  // --- CALCULATIONS ---
  const totalAllRequests = stats.totalBookings + stats.totalInsuranceRequests + stats.totalCarRequests;
  // Calculate unique customers based on unique phone numbers in bookings
  const totalCustomers = new Set(bookings.map(b => b.phone)).size;

  // Combine and sort recent activity (Last 5 requests)
  const recentActivity = [
    ...bookings.map(b => ({ ...b, type: 'Booking', label: 'Booking', statusColor: 'default' })),
    ...insuranceRequests.map(i => ({ ...i, type: 'Insurance', label: 'Insurance', statusColor: 'secondary' })),
    ...generalRequests.map(g => ({ ...g, type: 'General', label: 'Request', statusColor: 'outline' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      
      {/* --- STATS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-md">
              <IndianRupee className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total earnings from bookings</p>
          </CardContent>
        </Card>

        {/* 2. Total Customers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-md">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>

        {/* 3. Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-md">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Bookings waiting for action</p>
          </CardContent>
        </Card>

        {/* 4. Completed Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-md">
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">Successfully fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* --- SECONDARY STATS GRID --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total All Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total All Requests</CardTitle>
            <div className="p-2 bg-yellow-500/10 rounded-md">
              <MessageSquare className="h-4 w-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllRequests}</div>
            <p className="text-xs text-muted-foreground">Combined bookings & inquiries</p>
          </CardContent>
        </Card>
        
        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <div className="p-2 bg-primary/10 rounded-md">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All-time booking records</p>
          </CardContent>
        </Card>

        {/* Total Insurance Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insurance</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-md">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInsuranceRequests}</div>
            <p className="text-xs text-muted-foreground">All-time insurance requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        {/* Trend Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Last 10 Days Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <CombinedTrendChart 
              bookings={bookings}
              insuranceRequests={insuranceRequests}
              generalRequests={generalRequests}
            />
          </CardContent>
        </Card>

        {/* Request Status Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Request Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestStatusChart 
              bookings={bookings}
              insuranceRequests={insuranceRequests} 
              generalRequests={generalRequests} 
            />
          </CardContent>
        </Card>
      </div>

      {/* --- NEW SECTION: RECENT 5 REQUESTS --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((item: any) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <Badge variant={item.type === 'Booking' ? 'default' : (item.type === 'Insurance' ? 'secondary' : 'outline')}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.brand} {item.model}</div>
                    <div className="text-xs text-muted-foreground">{item.phone}</div>
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">{item.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.totalPrice ? formatCurrency(item.totalPrice) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}