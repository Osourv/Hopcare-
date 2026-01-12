import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { Appointment, AppointmentStatus, UserRole } from '../types';
import { Calendar, CheckCircle, XCircle, Clock, User, Bell } from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = () => {
    if (user) {
      mockBackend.getAppointments(user.id, UserRole.DOCTOR).then(data => {
        // Only update state if data is different to avoid unnecessary re-renders (simple check)
        setAppointments(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
          return prev;
        });
      });
    }
  };

  useEffect(() => {
    // 1. Fetch immediately
    fetchAppointments();

    // 2. Set up Auto-Refresh (Polling) every 3 seconds
    // This allows the doctor to see new bookings appear in "Real Time"
    const interval = setInterval(() => {
      fetchAppointments();
    }, 3000);

    return () => clearInterval(interval);
  }, [user]);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await mockBackend.updateAppointmentStatus(id, status);
    fetchAppointments(); // Update UI immediately
  };

  const pendingCount = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;

  return (
    <div className="space-y-8">
      <div className="animate-slide-up" style={{animationDelay: '0ms'}}>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        <p className="text-slate-500">Manage your schedule and patient requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4 animate-slide-up" style={{animationDelay: '100ms'}}>
          <div className={`p-6 rounded-2xl border shadow-sm transition-all ${pendingCount > 0 ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-sm font-medium uppercase ${pendingCount > 0 ? 'text-blue-700' : 'text-slate-500'}`}>Pending Requests</h3>
              {pendingCount > 0 && <Bell className="text-blue-600 animate-bounce" size={18} />}
            </div>
            <div className={`text-3xl font-bold ${pendingCount > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
              {pendingCount}
            </div>
            {pendingCount > 0 && <p className="text-xs text-blue-600 mt-1 font-medium">Action required</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium uppercase mb-2">Confirmed Today</h3>
            <div className="text-3xl font-bold text-green-600">
              {appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length}
            </div>
          </div>
        </div>

        {/* Appointment List */}
        <div className="lg:col-span-3 animate-slide-up" style={{animationDelay: '200ms'}}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">Appointment Requests</h2>
              {pendingCount > 0 && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  {pendingCount} New
                </span>
              )}
            </div>
            
            {appointments.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No appointments found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <div key={appt.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${appt.status === AppointmentStatus.PENDING ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{appt.patientName}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={14} /> {appt.date}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> {appt.time}</span>
                        </div>
                        {appt.notes && (
                           <p className="mt-2 text-sm text-slate-600 bg-white border border-slate-200 p-2 rounded shadow-sm">
                             <span className="font-semibold text-slate-800">Note:</span> {appt.notes}
                           </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-4 md:mt-0">
                      {appt.status === AppointmentStatus.PENDING ? (
                        <>
                          <button 
                            onClick={() => handleStatusChange(appt.id, AppointmentStatus.CONFIRMED)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 w-full sm:w-auto"
                          >
                            <CheckCircle size={18} /> Confirm
                          </button>
                          <button 
                            onClick={() => handleStatusChange(appt.id, AppointmentStatus.CANCELLED)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors w-full sm:w-auto"
                          >
                            <XCircle size={18} /> Decline
                          </button>
                        </>
                      ) : (
                        <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase w-full sm:w-auto text-center ${
                          appt.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' :
                          appt.status === AppointmentStatus.CANCELLED ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {appt.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};