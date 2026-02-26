import React from 'react';
import { Cloud, ShieldCheck } from 'lucide-react';

export default function Login() {
  
  // Fungsi memanggil rute Google di Backend
  const handleLoginGoogle = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/google');
      const data = await response.json();
      if (data.url) window.location.href = data.url; // Lempar user ke halaman izin Google
    } catch (error) {
      alert("Gagal menghubungi server Satpam (Port 5000). Pastikan server menyala!");
    }
  };

  // Fungsi memanggil rute Dropbox di Backend
  const handleLoginDropbox = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/dropbox');
      const data = await response.json();
      if (data.url) window.location.href = data.url; // Lempar user ke halaman izin Dropbox
    } catch (error) {
      alert("Gagal menghubungi server Satpam (Port 5000).");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-slate-100">
        
        {/* Header Login */}
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            BR Cloud
          </h2>
          <p className="text-slate-500 mt-2 text-sm">Satu tempat untuk semua penyimpanan Anda.</p>
        </div>
        
        {/* Tombol Login */}
        <div className="space-y-4 pt-4">
          <button 
            onClick={handleLoginGoogle}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all font-medium hover:border-blue-400"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
            Sambungkan Google Drive
          </button>
          
          <button 
            onClick={handleLoginDropbox}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all font-medium hover:border-indigo-400"
          >
            <img src="https://www.svgrepo.com/show/475643/dropbox-color.svg" alt="Dropbox" className="w-5 h-5 mr-3" />
            Sambungkan Dropbox
          </button>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center text-xs text-slate-400 mt-8">
          <ShieldCheck className="w-4 h-4 mr-1 text-green-500" />
          Akses token diamankan dengan enkripsi
        </div>
      </div>
    </div>
  );
}