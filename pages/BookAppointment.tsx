import React, { useState, useEffect } from 'react';
import { mockBackend } from '../services/mockBackend';
import { Doctor } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, User, CheckCircle, Search, X, Stethoscope, Loader2, GraduationCap, Clock, MapPin, Building2, Star, Briefcase, ArrowRight, Wallet } from 'lucide-react';

export const BookAppointment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null); // State for View More Modal
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialist, setFilterSpecialist] = useState('');

  useEffect(() => {
    setFetching(true);
    mockBackend.getDoctors().then(data => {
      setDoctors(data);
      
      // Auto-filter if coming from AI Recommendation
      if (location.state?.specialist) {
        setFilterSpecialist(location.state.specialist);
        setSearchTerm(location.state.specialist);
      }
      setFetching(false);
    });
  }, [location.state]);

  const handleBooking = async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime) return;
    
    setLoading(true);
    try {
      await mockBackend.createAppointment({
        patientId: user.id,
        patientName: user.name,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date: selectedDate,
        time: selectedTime,
        notes: notes ? notes.trim() : '' // Ensure it's a trimmed string
      });
      setStep(3); // Success step
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const term = searchTerm.toLowerCase();
    const name = doc.name?.toLowerCase() || '';
    const spec = doc.specialization?.toLowerCase() || '';
    return name.includes(term) || spec.includes(term);
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 animate-fade-in">Book an Appointment</h1>

      {/* Steps Indicator */}
      <div className="flex items-center mb-8 animate-fade-in">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              step >= s ? 'bg-blue-600 text-white scale-110' : 'bg-slate-200 text-slate-500'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 sm:w-24 h-1 mx-2 transition-colors duration-300 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
        <div className="ml-4 text-sm font-medium text-slate-600 animate-fade-in">
          {step === 1 && "Select Doctor"}
          {step === 2 && "Choose Time"}
          {step === 3 && "Confirmation"}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-slide-in-right">
          {/* Search / Filter Bar */}
          <div className="relative">
             <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
             <input 
              type="text" 
              placeholder="Search by doctor name or specialization (e.g. Cardiologist)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
             />
             {searchTerm && (
               <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
               >
                 <X size={20} />
               </button>
             )}
          </div>

          {filterSpecialist && searchTerm === filterSpecialist && (
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
              <CheckCircle size={16} />
              Showing recommended specialists for your condition.
              <button onClick={() => { setFilterSpecialist(''); setSearchTerm(''); }} className="text-blue-900 underline hover:no-underline font-medium ml-1">
                Show all
              </button>
            </div>
          )}

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Loading available doctors...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map(doc => (
                  <div 
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-6 flex flex-col md:flex-row gap-8">
                      {/* Left: Image */}
                      <div className="flex flex-col items-center shrink-0">
                         <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-blue-100 p-1 mb-2 shrink-0">
                           <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                             {doc.image ? (
                               <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                             ) : (
                               <User size={64} className="text-slate-300" />
                             )}
                           </div>
                         </div>
                      </div>

                      {/* Right: Content */}
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                              {doc.name}
                              <span className="text-sm font-normal text-slate-500">({doc.specialization})</span>
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                               <div className="flex items-center bg-green-50 px-2 py-0.5 rounded border border-green-100">
                                  <span className="font-bold text-sm text-green-700">{doc.rating || '4.5'}</span>
                                  <div className="flex ml-1">
                                    {[1,2,3,4].map(i => <Star key={i} size={10} className="fill-green-600 text-green-600" />)}
                                    <Star size={10} className="fill-green-600 text-green-600 opacity-50" />
                                  </div>
                               </div>
                               <span className="text-xs text-slate-500 border-b border-dashed border-slate-300 cursor-pointer">{doc.reviewCount || '100+'} Reviews</span>
                            </div>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 mb-6">
                           <div className="flex items-start gap-3">
                              <CheckCircle size={18} className="text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">Specialty</p>
                                <p className="text-sm font-medium text-slate-700">{doc.specialization} Treatment</p>
                              </div>
                           </div>
                           
                           <div className="flex items-start gap-3">
                              <Building2 size={18} className="text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">Hospital</p>
                                <p className="text-sm font-medium text-slate-700">{doc.hospital || 'HopCare Main Clinic'}</p>
                              </div>
                           </div>

                           <div className="flex items-start gap-3">
                              <Briefcase size={18} className="text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">Experience</p>
                                <p className="text-sm font-medium text-slate-700">{doc.experience || '10 Years'}</p>
                              </div>
                           </div>

                           <div className="flex items-start gap-3">
                              <MapPin size={18} className="text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">Location</p>
                                <p className="text-sm font-medium text-slate-700">{doc.location || 'Gurugram'}</p>
                              </div>
                           </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-6">
                          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                            {doc.bio || `${doc.name} is a highly qualified ${doc.specialization} with years of experience in treating complex cases. Dedicated to patient care and well-being.`}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => setViewingDoctor(doc)}
                             className="flex-1 sm:flex-none bg-white border border-rose-400 text-rose-500 hover:bg-rose-50 px-6 py-2.5 rounded-lg font-medium transition-colors text-sm"
                           >
                             View More <ArrowRight size={14} className="inline ml-1" />
                           </button>
                           <button 
                             onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                             className="flex-1 sm:flex-none bg-blue-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/10 text-sm"
                           >
                             Book Appointment
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <User size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="font-medium text-lg text-slate-600">No doctors found matching "{searchTerm}"</p>
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-blue-600 font-bold text-sm hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW MORE MODAL */}
      {viewingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingDoctor(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up relative" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={() => setViewingDoctor(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
            >
              <X size={20} className="text-slate-600" />
            </button>

            {/* Header Section */}
            <div className="relative">
              {/* Background pattern */}
              <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
                 <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                    </svg>
                 </div>
              </div>
              <div className="px-6 md:px-8 -mt-12 flex flex-col md:flex-row gap-6 items-center md:items-end">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden shrink-0">
                    {viewingDoctor.image ? (
                      <img src={viewingDoctor.image} alt={viewingDoctor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                          <User size={48} />
                      </div>
                    )}
                  </div>
                  <div className="text-center md:text-left pb-4 flex-1">
                    <h2 className="text-2xl font-bold text-slate-900">{viewingDoctor.name}</h2>
                    <p className="text-blue-600 font-medium flex items-center justify-center md:justify-start gap-1">
                      <Stethoscope size={16} /> {viewingDoctor.specialization}
                    </p>
                  </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Experience</p>
                      <p className="font-semibold text-slate-900 text-sm md:text-base">{viewingDoctor.experience || 'N/A'}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Rating</p>
                      <div className="flex items-center justify-center gap-1 font-semibold text-slate-900 text-sm md:text-base">
                        {viewingDoctor.rating || 4.5} <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      </div>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Patients</p>
                      <p className="font-semibold text-slate-900 text-sm md:text-base">{viewingDoctor.reviewCount || '100'}+</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Fee</p>
                      <p className="font-semibold text-slate-900 text-sm md:text-base">{viewingDoctor.consultationFee ? `₹${viewingDoctor.consultationFee}` : '₹800'}</p>
                  </div>
                </div>

                {/* About */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <User size={20} className="text-blue-500" /> About Doctor
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm md:text-base">
                    {viewingDoctor.bio || `Dr. ${viewingDoctor.name} is a dedicated specialist with extensive experience in ${viewingDoctor.specialization}. Committed to providing excellent patient care and known for a compassionate approach.`}
                  </p>
                </div>

                {/* Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3 shadow-sm hover:border-blue-200 transition-colors">
                      <Building2 className="text-blue-500 mt-1 shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Hospital</p>
                        <p className="text-sm text-slate-500">{viewingDoctor.hospital || 'HopCare Main Center'}</p>
                      </div>
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3 shadow-sm hover:border-blue-200 transition-colors">
                      <MapPin className="text-red-500 mt-1 shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Location</p>
                        <p className="text-sm text-slate-500">{viewingDoctor.location || 'New Delhi'}</p>
                      </div>
                  </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3 shadow-sm hover:border-blue-200 transition-colors">
                      <GraduationCap className="text-purple-500 mt-1 shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Education</p>
                        <p className="text-sm text-slate-500">{viewingDoctor.qualifications || 'MBBS, MD'}</p>
                      </div>
                  </div>
                  <div className="bg-white border border-slate-100 p-4 rounded-xl flex items-start gap-3 shadow-sm hover:border-blue-200 transition-colors">
                      <Wallet className="text-emerald-500 mt-1 shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">Consultation Fee</p>
                        <p className="text-sm text-slate-500">{viewingDoctor.consultationFee ? `₹${viewingDoctor.consultationFee}` : '₹800'}</p>
                      </div>
                  </div>
                </div>

                {/* Action */}
                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setViewingDoctor(null)}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedDoctor(viewingDoctor);
                      setViewingDoctor(null);
                      setStep(2);
                    }}
                    className="flex-[2] py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Book Appointment
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && selectedDoctor && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm animate-slide-in-right">
          
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8 flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm shrink-0 overflow-hidden">
                 {selectedDoctor.image ? (
                   <img src={selectedDoctor.image} alt={selectedDoctor.name} className="w-full h-full object-cover" />
                 ) : (
                   <User size={32} />
                 )}
             </div>
             <div>
                 <h2 className="text-xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                 <p className="text-blue-600 font-medium flex items-center justify-center md:justify-start gap-1.5 mb-2">
                     <Stethoscope size={16} /> {selectedDoctor.specialization}
                 </p>
                 <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-slate-600">
                      {selectedDoctor.qualifications && (
                         <div className="flex items-center gap-1.5">
                             <GraduationCap size={16} className="text-slate-400" />
                             <span>{selectedDoctor.qualifications}</span>
                         </div>
                      )}
                      {selectedDoctor.experience && (
                         <div className="flex items-center gap-1.5">
                             <Clock size={16} className="text-slate-400" />
                             <span>{selectedDoctor.experience}</span>
                         </div>
                      )}
                 </div>
             </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Select Date</label>
              <input 
                type="date" 
                min={minDate}
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Select Time</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {selectedDoctor.availability?.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    disabled={!selectedDate}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTime === time
                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
             <label className="block text-sm font-semibold text-slate-700 mb-3">Reason for visit (Optional)</label>
             <textarea 
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-blue-500 h-24 resize-none"
               placeholder="Briefly describe your symptoms..."
             />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 gap-4">
            <button onClick={() => setStep(1)} className="text-slate-500 font-medium hover:text-slate-800 py-2 sm:py-0">Back to List</button>
            <button
              onClick={handleBooking}
              disabled={!selectedDate || !selectedTime || loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 w-full sm:w-auto"
            >
              {loading ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto animate-slide-in-right">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-8">
            Your appointment with <span className="font-semibold text-slate-700">{selectedDoctor?.name}</span> is scheduled for <br/>
            <span className="text-slate-900 font-medium">{selectedDate} at {selectedTime}</span>.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};