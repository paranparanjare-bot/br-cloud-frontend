import React, { useState } from 'react';
import { Cloud, ShieldCheck, AlertCircle } from 'lucide-react';

const API_BASE_URL = "https://educational-cyndie-gdrivegnet-de995a1e.koyeb.app";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fungsi memanggil rute Google di Backend
  const handleLoginGoogle = async () => {
    setIsLoading(true);
    setErrorMessage(''); // Reset error sebelumnya
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`);
      
      // Jika server Koyeb merespon tapi dengan kode error (misal 500 Internal Server Error)
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; // Lempar user ke halaman izin Google
      } else {
        throw new Error("Respon dari server tidak memiliki URL login.");
      }
      
    } catch (error) {
      console.error("Fetch Error:", error);
      // Menampilkan pesan error spesifik agar mudah di-debug
      setErrorMessage(`Koneksi Gagal: ${error.message}`);
    } finally {
      setIsLoading(false);
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
        
        {/* Area Pesan Error (Muncul jika ada error) */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="break-words">{errorMessage}</p>
          </div>
        )}

        {/* Tombol Login */}
        <div className="space-y-4 pt-4">
          <button 
            onClick={handleLoginGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all font-medium hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Cloud className="w-5 h-5 mr-3 animate-pulse text-blue-500" />
                Menghubungkan...
              </span>
            ) : (
              <>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
                Sambungkan Google Drive
              </>
            )}
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