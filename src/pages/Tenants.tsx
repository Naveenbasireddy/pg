import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

interface Tenant {
  id: number;
  name: string;
  phone: string;
  joining_date: string;
  room_number: number;
  rent_amount: number;
}

const Tenants = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joiningDate: '',
    roomNumber: '',
    rentAmount: '',
    addressProof: null as File | null,
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tenants');
      setTenants(response.data);
    } catch (error) {
      toast.error('Failed to fetch tenants');
    }
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/tenants/search?query=${searchQuery}`);
      setTenants(response.data);
    } catch (error) {
      toast.error('Failed to search tenants');
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          formDataObj.append(key, value);
        }
      });

      await axios.post('http://localhost:5000/api/tenants', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Tenant added successfully');
      setShowAddModal(false);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to add tenant');
    }
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    try {
      await axios.put(`http://localhost:5000/api/tenants/${selectedTenant.id}`, {
        name: formData.name,
        phone: formData.phone,
        roomNumber: formData.roomNumber,
      });
      toast.success('Tenant updated successfully');
      setShowEditModal(false);
      fetchTenants();
    } catch (error) {
      toast.error('Failed to update tenant');
    }
  };

  const handleDeleteTenant = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this tenant?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/tenants/${id}`);
      toast.success('Tenant removed successfully');
      fetchTenants();
    } catch (error) {
      toast.error('Failed to remove tenant');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Tenants</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Tenant
          </button>
        </div>

        <div className="flex mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or room number"
              className="w-full px-4 py-2 border rounded-md pr-10"
            />
            <Search
              className="absolute right-3 top-2.5 text-gray-400 cursor-pointer"
              onClick={handleSearch}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joining Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{tenant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tenant.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tenant.room_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(tenant.joining_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">₹{tenant.rent_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setFormData({
                            ...formData,
                            name: tenant.name,
                            phone: tenant.phone,
                            roomNumber: tenant.room_number.toString(),
                          });
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Tenant Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Add New Tenant</h2>
              <form onSubmit={handleAddTenant}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Room Number"
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Rent Amount"
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                  />
                  <input
                    type="file"
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, addressProof: e.target.files?.[0] || null })}
                  />
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Add Tenant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Tenant Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Edit Tenant</h2>
              <form onSubmit={handleEditTenant}>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Room Number"
                    value={formData.roomNumber}
                    required
                    className="w-full px-4 py-2 border rounded"
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  />
                </div>
                <div className="flex justify-end mt-6 space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Update Tenant
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Tenants;