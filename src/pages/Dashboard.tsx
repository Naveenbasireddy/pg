import { useState, useEffect } from 'react';
import { Users, Home, CreditCard, DollarSign } from 'lucide-react';
import axios from 'axios';
import Layout from '../components/Layout';

interface DashboardStats {
  totalTenants: number;
  occupiedRooms: number;
  pendingDues: number;
  currentMonthExpenses: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 0,
    occupiedRooms: 0,
    pendingDues: 0,
    currentMonthExpenses: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await axios.get('http://localhost:5000/api/tenants/stats');
        const duesRes = await axios.get('http://localhost:5000/api/dues');
        const expensesRes = await axios.get('http://localhost:5000/api/expenditures');
        
        setStats({
          totalTenants: statsRes.data.totalTenants,
          occupiedRooms: statsRes.data.occupiedRooms,
          pendingDues: duesRes.data.length,
          currentMonthExpenses: expensesRes.data.currentMonthTotal || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Tenants',
      value: stats.totalTenants,
      icon: Users,
      color: 'bg-blue-500',
      description: 'Total number of tenants currently staying'
    },
    {
      title: 'Rooms Occupied',
      value: stats.occupiedRooms,
      icon: Home,
      color: 'bg-green-500',
      description: 'Number of rooms currently occupied'
    },
    {
      title: 'Pending Dues',
      value: stats.pendingDues,
      icon: CreditCard,
      color: 'bg-red-500',
      description: 'Number of pending rent payments'
    },
    {
      title: 'Current Month Expenses',
      value: `₹${Number(stats.currentMonthExpenses).toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      description: 'Total expenses for the current month'
    },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className={`${card.color} p-3`}>
                  <div className="flex items-center justify-between">
                    <Icon className="w-6 h-6 text-white opacity-80" />
                    <span className="text-xs font-medium text-white">{card.title}</span>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-xl font-bold text-white">{card.value}</h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.href = '/tenants'}
                className="p-3 bg-blue-50 rounded-lg text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                Tenants
              </button>
              <button 
                onClick={() => window.location.href = '/dues'}
                className="p-3 bg-red-50 rounded-lg text-red-700 text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Dues
              </button>
              <button 
                onClick={() => window.location.href = '/food-menu'}
                className="p-3 bg-green-50 rounded-lg text-green-700 text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Menu
              </button>
              <button 
                onClick={() => window.location.href = '/expenditures'}
                className="p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm font-medium hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Expenses
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Database Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm text-gray-800">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;