import React, { useEffect, useState } from 'react';
import { Cloud, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "https://educational-cyndie-gdrivegnet-de995a1e.koyeb.app";

export default function Login() {
  const [isLoading, setIsLoading] = useState(true); 
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Pengecekan otomatis saat halaman pertama kali dibuka
    const checkExistingAccounts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/accounts`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          // Jika sudah ada akun di database server, langsung masuk ke dashboard
          if (!localStorage.getItem('lastActiveAccount')) {
            localStorage.setItem('lastActiveAccount', data[0].email);
          }
          navigate('/dashboard');
        } else {
          // Jika belum ada akun sama sekali, tampilkan halaman login
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Gagal mengecek akun:", error);
        setIsLoading(false); // Tetap tampilkan halaman login jika terjadi error koneksi
      }
    };

    checkExistingAccounts();
  }, [navigate]);

  const handleLoginGoogle = async () => {
    setIsConnecting(true);
    setErrorMessage(''); 
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`);
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server Error: ${errText}`);
      }

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        throw new Error("Respon server tidak memiliki URL login.");
      }
      
    } catch (error) {
      setErrorMessage(`Koneksi Gagal: ${error.message}`);
      setIsConnecting(false);
    }
  };

  // Tampilan layar saat sedang mengecek database secara diam-diam
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memeriksa sesi penyimpanan...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-slate-100">
        
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Cloud className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            BR Cloud
          </h2>
          <p className="text-slate-500 mt-2 text-sm">Satu tempat untuk semua penyimpanan Anda.</p>
        </div>
        
        {errorMessage && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-start gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="break-words">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <button 
            onClick={handleLoginGoogle}
            disabled={isConnecting}
            className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-700 hover:bg-slate-50 transition-all font-medium hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <span className="flex items-center">
                <Loader2 className="w-5 h-5 mr-3 animate-spin text-blue-500" />
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

        <div className="flex items-center justify-center text-xs text-slate-400 mt-8">
          <ShieldCheck className="w-4 h-4 mr-1 text-green-500" />
          Akses token diamankan dengan enkripsi
        </div>
      </div>
    </div>
  );
}