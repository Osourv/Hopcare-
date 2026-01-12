import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/mockBackend';
import { Appointment, AiRecord, AppointmentStatus, UserRole } from '../types';
import { Calendar, Clock, MapPin, Activity, BrainCircuit, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [aiHistory, setAiHistory] = useState<AiRecord[]>([]);

  useEffect(() => {
    if (user) {
      mockBackend.getAppointments(user.id, UserRole.PATIENT).then(setAppointments);
      mockBackend.getAiHistory().then(setAiHistory);
    }
  }, [user]);

  const upcomingAppointments = appointments.filter(a => a.status !== AppointmentStatus.CANCELLED && a.status !== AppointmentStatus.COMPLETED);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up" style={{animationDelay: '0ms'}}>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Good Morning, {user?.name.split(' ')[0]}</h1>
          <p className="text-slate-500">Here's your health overview for today.</p>
        </div>
        <Link to="/book-appointment" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 w-fit">
          <Calendar size={18} /> Book Appointment
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{animationDelay: '100ms'}}>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg transform transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="bg-white/20 p-2 rounded-lg w-10 h-10" />
            <span className="font-semibold text-white/90">Upcoming</span>
          </div>
          <div className="text-3xl font-bold">{upcomingAppointments.length}</div>
          <div className="text-sm text-blue-100 mt-1">Appointments scheduled</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transform transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit className="text-purple-500 bg-purple-50 p-2 rounded-lg w-10 h-10" />
            <span className="font-semibold text-slate-700">AI Checks</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{aiHistory.length}</div>
          <div className="text-sm text-slate-500 mt-1">Symptoms analyzed</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transform transition-transform hover:scale-[1.02]">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-emerald-500 bg-emerald-50 p-2 rounded-lg w-10 h-10" />
            <span className="font-semibold text-slate-700">Health Status</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">Good</div>
          <div className="text-sm text-slate-500 mt-1">Based on last checkup</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8 animate-slide-up" style={{animationDelay: '200ms'}}>
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>
            <Link to="/my-appointments" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Calendar size={24} />
              </div>
              <h3 className="text-slate-900 font-medium mb-1">No appointments yet</h3>
              <p className="text-slate-500 text-sm mb-4">Book a visit with our specialists.</p>
              <Link to="/book-appointment" className="text-blue-600 font-medium text-sm hover:underline">Book Now</Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingAppointments.map(appt => (
                <div key={appt.id} className="bg-white p-5 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-lg">
                      {new Date(appt.date).getDate()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{appt.doctorName}</h4>
                      <p className="text-sm text-slate-500">Specialist Checkup</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Clock size={12} /> {appt.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={12} /> Clinic A</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    appt.status === AppointmentStatus.CONFIRMED ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {appt.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent AI Checks */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent AI Insights</h2>
            <Link to="/symptom-checker" className="text-sm text-blue-600 hover:underline">New Check</Link>
          </div>
          
          <div className="space-y-4">
            {aiHistory.length === 0 ? (
               <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center">
                 <p className="text-sm text-slate-500">No symptoms recorded yet.</p>
               </div>
            ) : (
              aiHistory.slice(0, 3).map((record, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded uppercase">AI Analysis</span>
                    <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{record.prediction}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{record.recommendation}</p>
                </div>
              ))
            )}
            
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-blue-900 font-bold text-sm mb-1">Need quick advice?</h4>
              <p className="text-blue-700 text-xs mb-3">Our AI Symptom Checker is ready to help you triage your condition.</p>
              <Link to="/symptom-checker" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all">
                Start Check <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};