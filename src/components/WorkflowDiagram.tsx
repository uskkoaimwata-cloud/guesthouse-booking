import { motion } from 'framer-motion';
import { UserPlus, Database, Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface WorkflowDiagramProps {
  currentStep: number;
}

const steps = [
  { id: 1, title: 'Customer Books', description: 'Guest fills in the booking form', icon: 'UserPlus' },
  { id: 2, title: 'Save to Database', description: 'Details saved to spreadsheet/database', icon: 'Database' },
  { id: 3, title: 'Notify Owner', description: 'Email sent to business owner', icon: 'Mail' },
  { id: 4, title: 'Confirm Guest', description: 'Owner sends confirmation to guest', icon: 'CheckCircle' },
];

const iconMap: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus size={28} />,
  Database: <Database size={28} />,
  Mail: <Mail size={28} />,
  CheckCircle: <CheckCircle size={28} />,
};

export default function WorkflowDiagram({ currentStep }: WorkflowDiagramProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Booking Workflow</h2>
        <p className="text-gray-500">Automated process from booking to confirmation</p>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex items-center flex-col md:flex-row flex-1">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.1 }}
                className={`flex flex-col items-center p-4 rounded-xl transition-all duration-500 ${
                  status === 'completed' ? 'bg-green-50 border-2 border-green-300' :
                  status === 'active' ? 'bg-amber-50 border-2 border-amber-400 shadow-lg shadow-amber-100' :
                  'bg-gray-50 border-2 border-gray-200'
                }`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                  status === 'completed' ? 'bg-green-500 text-white' :
                  status === 'active' ? 'bg-amber-500 text-white animate-pulse' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {status === 'completed' ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : iconMap[step.icon]}
                </div>
                <h3 className={`font-semibold text-sm text-center ${
                  status === 'completed' ? 'text-green-700' : status === 'active' ? 'text-amber-700' : 'text-gray-500'
                }`}>{step.title}</h3>
                <p className="text-xs text-gray-400 text-center mt-1 max-w-[140px]">{step.description}</p>
              </motion.div>
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center mx-2">
                  <ArrowRight size={24} className={status === 'completed' ? 'text-green-500' : 'text-gray-300'} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {currentStep > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm text-amber-700 font-medium">
              {currentStep <= 4 ? `Step ${currentStep} of 4: ${steps[currentStep - 1].title}` : 'Workflow Complete!'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
