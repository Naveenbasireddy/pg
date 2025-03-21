import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import FoodMenu from './pages/FoodMenu';
import Dues from './pages/Dues';
import Expenditures from './pages/Expenditures';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/tenants" element={<PrivateRoute><Tenants /></PrivateRoute>} />
            <Route path="/food-menu" element={<PrivateRoute><FoodMenu /></PrivateRoute>} />
            <Route path="/dues" element={<PrivateRoute><Dues /></PrivateRoute>} />
            <Route path="/expenditures" element={<PrivateRoute><Expenditures /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;