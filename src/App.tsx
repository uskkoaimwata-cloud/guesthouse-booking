import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking } from './types';
import BookingForm from './components/BookingForm';
import WorkflowDiagram from './components/WorkflowDiagram';
import AdminDashboard from './components/AdminDashboard';
import DatabaseView from './components/DatabaseView';
import {
  Home,
  BookOpen,
  LayoutDashboard,
  Database,
  Workflow,
  ArrowRight,
  Bed,
  Mail,
} from 'lucide-react';

type View = 'home' | 'booking' | 'workflow' | 'admin' | 'database';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [workflowStep, setWorkflowStep] = useState(0);
  const [latestBooking, setLatestBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (latestBooking) {
      setWorkflowStep(1);
      const timers = [
        setTimeout(() => setWorkflowStep(2), 1500),
        setTimeout(() => setWorkflowStep(3), 3000),
        setTimeout(() => setWorkflowStep(4), 4500),
      ];
      return () => timers.forEach(clearTimeout);
    }
  }, [latestBooking]);

  const handleBookingComplete = (booking: Booking) => {
    setLatestBooking(booking);
    setWorkflowStep(1);
  };

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home size={18} /> },
    { id: 'booking', label: 'Book Now', icon: <BookOpen size={18} /> },
    { id: 'workflow', label: 'Workflow', icon: <Workflow size={18} /> },
    { id: 'database', label: 'Database', icon: <Database size={18} /> },
    { id: 'admin', label: 'Admin Panel', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Bed size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-gray-800 hidden sm:block">GuestHouse</span>
            </div>
            <div className="flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === item.id
                      ? 'bg-amber-100 text-amber-800 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {item.icon}
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                  Guesthouse Booking <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">Workflow</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  A complete automated booking system — from guest reservation to owner notification and confirmation.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                  { step: '1', title: 'Guest Books', desc: 'Customer fills out the booking form with their details.', icon: '📝', bgColor: 'bg-blue-50' },
                  { step: '2', title: 'Saved to Database', desc: 'All booking details are automatically saved to the database.', icon: '💾', bgColor: 'bg-emerald-50' },
                  { step: '3', title: 'Owner Notified', desc: 'An email notification is sent to the business owner.', icon: '📧', bgColor: 'bg-amber-50' },
                  { step: '4', title: 'Confirmation Sent', desc: 'Owner reviews and sends a confirmation email to the guest.', icon: '✅', bgColor: 'bg-green-50' },
                ].map((item, index) => (
                  <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.1 }} className={`${item.bgColor} rounded-2xl p-6 border border-white shadow-sm`}>
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-gray-800 mb-2">Step {item.step}: {item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
              <div className="text-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">Ready to try the workflow?</h2>
                  <p className="text-gray-600 mb-6">Submit a test booking to see the complete workflow in action.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => setCurrentView('booking')} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25">
                      <BookOpen size={18} /> Make a Booking <ArrowRight size={16} />
                    </button>
                    <button onClick={() => setCurrentView('workflow')} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all">
                      <Workflow size={18} /> View Workflow
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <BookingForm onBookingComplete={handleBookingComplete} />
              {workflowStep > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                  <WorkflowDiagram currentStep={workflowStep} />
                </motion.div>
              )}
            </motion.div>
          )}

          {currentView === 'workflow' && (
            <motion.div key="workflow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <WorkflowDiagram currentStep={workflowStep} />
            </motion.div>
          )}

          {currentView === 'database' && (
            <motion.div key="database" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DatabaseView />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
                <p className="text-gray-500">Manage bookings, send notifications, and confirm reservations</p>
              </div>
              <AdminDashboard highlightBookingId={latestBooking?.id} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-amber-100 bg-white/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-gray-500">GuestHouse Booking System — Automated workflow: Booking → Database → Owner Email → Guest Confirmation</p>
      </div>
      </footer>
    </div>
  );
}
