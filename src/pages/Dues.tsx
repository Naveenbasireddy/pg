import { useState, useEffect } from 'react';
import { MessageSquare, Check, Phone } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

interface Due {
  id: number;
  tenant_id: number;
  name: string;
  phone: string;
  room_number: number;
  amount: number;
  due_date: string;
  status: 'paid' | 'unpaid';
}

const Dues = () => {
  const [dues, setDues] = useState<Due[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDues = async () => {
    try {
      console.log('Fetching unpaid dues from frontend...');
      const response = await axios.get('http://localhost:5000/api/dues');
      console.log('Received dues:', response.data);
      setDues(response.data);
    } catch (error) {
      console.error('Error fetching dues:', error);
      if (axios.isAxiosError(error)) {
        toast.error(`Failed to fetch dues: ${error.response?.data?.message || error.message}`);
      } else {
        toast.error('Failed to fetch dues. Please check if the server is running.');
      }
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const handleWhatsApp = async (id: number) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/dues/whatsapp/${id}`);
      window.open(response.data.whatsappLink, '_blank');
    } catch (error) {
      console.error('Error generating WhatsApp link:', error);
      toast.error('Failed to generate WhatsApp link');
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      setLoading(true);
      // Send the current date as paid_date to ensure consistent monthly due dates
      const paidDate = new Date().toISOString().split('T')[0];
      await axios.post(`http://localhost:5000/api/dues/mark-paid/${id}`, { paid_date: paidDate });
      toast.success('Payment marked as paid');
      // Immediately update the local state by removing the paid due from the unpaid list
      setDues(prevDues => prevDues.filter(due => due.id !== id));
    } catch (error) {
      console.error('Error marking due as paid:', error);
      toast.error('Failed to mark payment as paid');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCall = (phone: string) => {
    // Format phone number (ensure it has country code)
    let formattedNumber = phone.replace(/\D/g, '');
    if (!formattedNumber.startsWith('91')) {
      formattedNumber = '91' + formattedNumber;
    }
    // Create tel: link and open it
    window.location.href = `tel:+${formattedNumber}`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Rent Dues</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dues.map((due) => (
                  <tr 
                    key={due.id} 
                    className={`hover:bg-gray-50 transition-colors ${due.status === 'paid' ? 'bg-gray-50' : ''}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{due.name}</div>
                          <div className="text-sm text-gray-500">{due.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Room {due.room_number}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(due.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{due.amount}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        due.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {due.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-3">
                        {due.status === 'unpaid' && (
                          <>
                            <button
                              onClick={() => handleWhatsApp(due.id)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageSquare className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleMarkPaid(due.id)}
                              disabled={loading}
                              className={`text-blue-600 hover:text-blue-900 transition-colors ${
                                loading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              title="Mark as Paid"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handlePhoneCall(due.phone)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dues.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No unpaid dues found</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dues;