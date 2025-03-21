import { useState, useEffect } from 'react';
import { Plus, Calendar, CalendarDays, Download, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Expenditure {
  id: number;
  name: string;
  amount: string | number;
  date: string;
}

interface MonthlyTotal {
  month: string;
  total: string | number;
}

const Expenditures = () => {
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [filteredExpenditures, setFilteredExpenditures] = useState<Expenditure[]>([]);
  const [filterTotal, setFilterTotal] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenditures = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/expenditures');
      console.log('Expenditures response:', response.data);
      
      setExpenditures(response.data.expenditures || []);
      setMonthlyTotals(response.data.monthlyTotals || []);
      setCurrentMonthTotal(Number(response.data.currentMonthTotal) || 0);
      
      // By default, show only current month's expenditures
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthExpenditures = (response.data.expenditures || []).filter(
        (exp: Expenditure) => exp.date.startsWith(currentMonth)
      );
      setFilteredExpenditures(currentMonthExpenditures);
    } catch (error) {
      console.error('Error fetching expenditures:', error);
      toast.error('Failed to fetch expenditures');
    }
  };

  useEffect(() => {
    fetchExpenditures();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/expenditures', formData);
      toast.success('Expenditure added successfully');
      setShowAddModal(false);
      setFormData({
        name: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchExpenditures();
    } catch (error) {
      console.error('Error adding expenditure:', error);
      toast.error('Failed to add expenditure');
    }
  };

  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    setSelectedMonth('');
    
    if (date) {
      const filtered = expenditures.filter(exp => exp.date === date);
      setFilteredExpenditures(filtered);
      const total = filtered.reduce((sum, exp) => sum + Number(exp.amount), 0);
      setFilterTotal(total);
    } else {
      // Reset to current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthExpenditures = expenditures.filter(
        exp => exp.date.startsWith(currentMonth)
      );
      setFilteredExpenditures(currentMonthExpenditures);
      setFilterTotal(0);
    }
  };

  const handleMonthFilter = (month: string) => {
    setSelectedMonth(month);
    setSelectedDate('');
    
    if (month) {
      const filtered = expenditures.filter(exp => exp.date.startsWith(month));
      setFilteredExpenditures(filtered);
      const total = filtered.reduce((sum, exp) => sum + Number(exp.amount), 0);
      setFilterTotal(total);
    } else {
      // Reset to current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentMonthExpenditures = expenditures.filter(
        exp => exp.date.startsWith(currentMonth)
      );
      setFilteredExpenditures(currentMonthExpenditures);
      setFilterTotal(0);
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();
      const title = selectedMonth 
        ? `Expenditures for ${new Date(selectedMonth + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })}`
        : selectedDate
        ? `Expenditures for ${new Date(selectedDate).toLocaleDateString()}`
        : `Current Month's Expenditures`;

      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 15);

      // Calculate total
      const total = filteredExpenditures.reduce((sum, exp) => sum + Number(exp.amount), 0);

      // Add total
      doc.setFontSize(12);
      const formattedTotal = String(total.toFixed(2)).replace(/[^\d.-]/g, '');
      doc.text(`Total: ₹${formattedTotal}`, 14, 25);

      // Create table data
      const tableData = filteredExpenditures.map(exp => [
        new Date(exp.date).toLocaleDateString(),
        exp.name,
        `₹${String(Number(exp.amount).toFixed(2)).replace(/[^\d.-]/g, '')}`
      ]);

      // Add table
      autoTable(doc, {
        startY: 30,
        head: [['Date', 'Description', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 }
      });

      // Save PDF
      const fileName = selectedMonth 
        ? `expenditures_${selectedMonth}.pdf`
        : selectedDate
        ? `expenditures_${selectedDate}.pdf`
        : `expenditures_current_month.pdf`;
      
      doc.save(fileName);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDeleteAll = async () => {
    if (!selectedMonth && !selectedDate) {
      toast.error('Please select a month or date first');
      return;
    }

    if (!window.confirm('Are you sure you want to delete all filtered expenditures? This cannot be undone.')) {
      return;
    }

    try {
      let startDate, endDate;

      if (selectedMonth) {
        startDate = `${selectedMonth}-01`;
        const nextMonth = new Date(selectedMonth + '-01');
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        endDate = nextMonth.toISOString().split('T')[0];
      } else if (selectedDate) {
        startDate = selectedDate;
        endDate = selectedDate;
      }

      await axios.delete('http://localhost:5000/api/expenditures/bulk', {
        data: { startDate, endDate }
      });

      toast.success('All filtered expenditures deleted successfully');
      fetchExpenditures(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete expenditures');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Expenditures</h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add Expenditure
            </button>
            {(selectedMonth || selectedDate) && filteredExpenditures.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Current Month or Filtered Total */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            {selectedDate
              ? 'Selected Date Total'
              : selectedMonth
              ? `${new Date(selectedMonth + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' })} Total`
              : "Current Month's Total"}
          </h2>
          <div className="text-xl sm:text-2xl font-bold text-blue-600">
            ₹{(selectedDate || selectedMonth ? filterTotal : currentMonthTotal).toFixed(2)}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Filter Expenses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                By Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <CalendarDays className="w-4 h-4" />
                By Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => handleMonthFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          {filteredExpenditures.length > 0 && (
            <div className="mt-4">
              <button
                onClick={downloadPDF}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Download PDF
              </button>
            </div>
          )}
        </div>

        {/* Expenditures List */}
        <div className="bg-white rounded-lg shadow-md divide-y">
          {filteredExpenditures.map((expenditure) => (
            <div
              key={expenditure.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{expenditure.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(expenditure.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-medium text-gray-900 text-sm sm:text-base">₹{Number(expenditure.amount).toFixed(2)}</span>
              </div>
            </div>
          ))}
          {filteredExpenditures.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {selectedDate || selectedMonth
                  ? 'No expenses found for selected period'
                  : 'No expenses found for current month'}
              </p>
            </div>
          )}
        </div>

        {/* Add Expenditure Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md rounded-lg">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Add New Expense</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expense Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Water Bill"
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 2000"
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    Add Expense
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

export default Expenditures; 