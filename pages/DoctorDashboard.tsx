import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { Appointment, AppointmentStatus, UserRole, User } from '../types';
import { Calendar, CheckCircle, XCircle, Clock, User as UserIcon, Bell, Mail, Phone, Plus, X, Loader2 } from 'lucide-react';

const AVAILABLE_TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export const DoctorDashboard: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);
  const [savingSlots, setSavingSlots] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const fetchAppointments = () => {
    if (user) {
      mockBackend.getAppointments(user.id, UserRole.DOCTOR).then(data => {
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
    if (user?.availability) {
      setAvailability(user.availability);
    }
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await mockBackend.updateAppointmentStatus(id, status);
    fetchAppointments();
  };

  const toggleAvailability = async (time: string) => {
    const newAvailability = availability.includes(time)
      ? availability.filter(t => t !== time)
      : [...availability, time].sort();
    
    setAvailability(newAvailability);
    setSavingSlots(true);
    // Simulate API Delay
    await new Promise(r => setTimeout(r, 500));
    await updateProfile({ availability: newAvailability });
    setSavingSlots(false);
  };

  const handleViewPatient = async (patientId: string) => {
    setLoadingPatient(true);
    // Open modal immediately to show loading state if needed, or wait
    try {
      const patient = await mockBackend.getUserById(patientId);
      if (patient) {
        setSelectedPatient(patient);
      } else {
        // Fallback for ad-hoc users
        setSelectedPatient({
            id: patientId,
            name: 'Guest Patient',
            email: 'N/A',
            role: UserRole.PATIENT
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPatient(false);
    }
  };

  const pendingCount = appointments.filter(a => a.status === AppointmentStatus.PENDING).length;

  return (
    <div className="space-y-8 relative">
      <div className="animate-slide-up" style={{animationDelay: '0ms'}}>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        <p className="text-slate-500">Manage your schedule and patient requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Stats & Availability */}
        <div className="lg:col-span-1 space-y-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          {/* Pending Stats */}
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

           {/* Confirmed Stats */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-500 text-sm font-medium uppercase mb-2">Confirmed Today</h3>
            <div className="text-3xl font-bold text-green-600">
              {appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length}
            </div>
          </div>

          {/* Availability Management */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-blue-600" /> My Schedule
              </h3>
              {savingSlots && <Loader2 size={16} className="animate-spin text-blue-600" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TIME_SLOTS.map(time => {
                const isActive = availability.includes(time);
                return (
                  <button
                    key={time}
                    onClick={() => toggleAvailability(time)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isActive 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-4 italic">
              Tap slots to toggle availability for patients.
            </p>
          </div>
        </div>

        {/* Right Column: Appointment List */}
        <div className="lg:col-span-3 animate-slide-up" style={{animationDelay: '200ms'}}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-900">Appointment Requests</h2>
              {pendingCount > 0 && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  {pendingCount} New
                </span>
              )}
            </div>
            
            {appointments.length === 0 ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                   <Calendar size={24} className="text-slate-300" />
                </div>
                <p>No appointments found.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <div key={appt.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${appt.status === AppointmentStatus.PENDING ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-start gap-4">
                      <button 
                         onClick={() => handleViewPatient(appt.patientId)}
                         className="w-10 h-10 rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-600 transition-colors flex items-center justify-center text-slate-500 shrink-0 overflow-hidden"
                         title="View Patient Details"
                      >
                         <UserIcon size={20} />
                      </button>
                      <div>
                        <h4 
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => handleViewPatient(appt.patientId)}
                        >
                          {appt.patientName}
                        </h4>
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

      {/* Patient Details Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedPatient(null)}>
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up relative" onClick={e => e.stopPropagation()}>
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 border border-slate-200 shadow-sm overflow-hidden">
                          {selectedPatient.image ? (
                             <img src={selectedPatient.image} alt={selectedPatient.name} className="w-full h-full object-cover" />
                          ) : (
                             <UserIcon size={32} />
                          )}
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h3>
                          <span className="text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Patient</span>
                      </div>
                  </div>
                  <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                  </button>
              </div>
              <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Mail className="text-slate-400" size={20} />
                      <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Email</p>
                          <p className="text-slate-900 font-medium">{selectedPatient.email}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <Phone className="text-slate-400" size={20} />
                      <div>
                          <p className="text-xs text-slate-500 uppercase font-bold">Phone</p>
                          <p className="text-slate-900 font-medium">{selectedPatient.phone || 'Not Provided'}</p>
                      </div>
                  </div>
              </div>
              <div className="p-6 pt-0">
                  <button 
                      onClick={() => setSelectedPatient(null)}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                      Close Details
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};