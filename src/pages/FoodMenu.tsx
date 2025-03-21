import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';

interface MenuItem {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

const FoodMenu = () => {
  const [menu, setMenu] = useState<MenuItem[]>([
    { day: 'Monday', breakfast: '', lunch: '', dinner: '' },
    { day: 'Tuesday', breakfast: '', lunch: '', dinner: '' },
    { day: 'Wednesday', breakfast: '', lunch: '', dinner: '' },
    { day: 'Thursday', breakfast: '', lunch: '', dinner: '' },
    { day: 'Friday', breakfast: '', lunch: '', dinner: '' },
    { day: 'Saturday', breakfast: '', lunch: '', dinner: '' },
    { day: 'Sunday', breakfast: '', lunch: '', dinner: '' },
  ]);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu');
      if (response.data.length > 0) {
        setMenu(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch menu');
    }
  };

  const handleMenuChange = (
    day: string,
    meal: 'breakfast' | 'lunch' | 'dinner',
    value: string
  ) => {
    setMenu((prev) =>
      prev.map((item) =>
        item.day === day ? { ...item, [meal]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/menu', { menu });
      toast.success('Menu updated successfully');
    } catch (error) {
      toast.error('Failed to update menu');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Food Menu</h1>
          <button
            onClick={handleSubmit}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Save className="w-5 h-5 mr-2" />
            Save Menu
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Breakfast
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lunch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dinner
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menu.map((item) => (
                <tr key={item.day}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {item.day}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={item.breakfast}
                      onChange={(e) =>
                        handleMenuChange(item.day, 'breakfast', e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Enter breakfast menu"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={item.lunch}
                      onChange={(e) =>
                        handleMenuChange(item.day, 'lunch', e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Enter lunch menu"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={item.dinner}
                      onChange={(e) =>
                        handleMenuChange(item.day, 'dinner', e.target.value)
                      }
                      className="w-full px-2 py-1 border rounded"
                      placeholder="Enter dinner menu"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default FoodMenu;