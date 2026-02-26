import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Folder, FileText, Cloud, ChevronLeft, RefreshCw, User, Upload, List, Grid, LayoutGrid, ArrowUp, ArrowDown, Menu, X } from 'lucide-react';

const API_BASE_URL = "https://educational-cyndie-gdrivegnet-de995a1e.koyeb.app"; 

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  
  // State Baru untuk Tampilan, Sortir, dan Sidebar Mobile
  const [viewMode, setViewMode] = useState('medium'); 
  const [sortBy, setSortBy] = useState('name'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State untuk mengatur buka/tutup sidebar di HP

  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts`);
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0 && !selectedAcc) setSelectedAcc(data[0]);
    } catch (e) { 
      console.error("Gagal koneksi ke Koyeb:", e);
    }
  };

  const loadFiles = async (email, folderId = 'root') => {
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/list?email=${email}&folderId=${folderId}`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) { 
      console.error("Gagal load file:", e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { if (selectedAcc) loadFiles(selectedAcc.email, currentFolder); }, [selectedAcc, currentFolder]);

  const handleItemClick = async (file) => {
    if (file.isFolder) {
      setHistory([...history, currentFolder]);
      setCurrentFolder(file.id);
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/api/files/open/${file.id}?email=${selectedAcc.email}`);
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
      } catch (e) { alert("Gagal membuka file"); }
    }
  };

  const goBack = () => {
    const prev = [...history];
    const last = prev.pop() || 'root';
    setHistory(prev);
    setCurrentFolder(last);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedAcc) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', selectedAcc.email);
    formData.append('folderId', currentFolder);

    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        loadFiles(selectedAcc.email, currentFolder); 
      } else {
        alert("Gagal mengunggah file.");
      }
    } catch (e) {
      console.error("Upload error:", e);
      alert("Terjadi kesalahan saat mengunggah.");
    } finally {
      setIsUploading(false);
      event.target.value = null; 
    }
  };

  const processedFiles = useMemo(() => {
    let filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    
    return filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, search, sortBy, sortOrder]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {/* Latar Belakang Gelap (Backdrop) saat sidebar terbuka di Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Dibuat Absolute/Fixed di Mobile, Relative di Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col shadow-xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 mb-4">
          <div className="flex items-center text-blue-600 font-bold text-xl italic">
            <Cloud className="mr-2"/> BR Drive
          </div>
          {/* Tombol Tutup Sidebar (Hanya muncul di Mobile) */}
          <button className="md:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto px-6 pb-6">
          {accounts.map(acc => (
            <button key={acc.email} 
              onClick={() => {
                setSelectedAcc(acc); 
                setCurrentFolder('root'); 
                setHistory([]);
                setIsSidebarOpen(false); // Tutup sidebar otomatis di HP setelah pilih akun
              }}
              className={`w-full flex items-center p-3 rounded-xl text-sm font-bold transition-all ${selectedAcc?.email === acc.email ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-500'}`}>
              <User className="w-4 h-4 mr-3" /> {acc.name.split(' ')[0]}
            </button>
          ))}
          <button 
            onClick={() => {
                fetch(`${API_BASE_URL}/api/auth/google`)
                .then(r => r.json())
                .then(d => { if(d.url) window.location.href=d.url; })
                .catch(() => alert("Koneksi ke server Koyeb gagal."));
            }}
            className="w-full p-3 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:text-blue-500 transition-all mt-4">
            + Tambah Akun
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header - Disesuaikan agar scrollable di mobile jika penuh */}
        <header className="bg-white border-b flex flex-col md:flex-row items-start md:items-center px-4 py-3 md:h-20 gap-3">
          
          <div className="flex items-center w-full md:w-auto gap-2">
            {/* Tombol Hamburger (Hanya muncul di Mobile) */}
            <button 
              className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {currentFolder !== 'root' && (
              <button onClick={goBack} className="p-2 border rounded-full hover:bg-slate-100 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            <div className="relative flex-1 md:w-64 lg:w-96">
              <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <input className="w-full bg-slate-100 pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" placeholder="Cari file..." onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          
          <div className="hidden md:block flex-1"></div> {/* Spacer untuk desktop */}

          {/* Area Kontrol (Sortir, View, Tombol) - Scroll horizontal di HP */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            
            <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
              <select className="bg-transparent text-xs font-medium text-slate-600 outline-none px-2 py-1.5 cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name">Nama</option>
                <option value="size">Ukuran</option>
              </select>
              <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-1.5 text-slate-500 hover:text-blue-600">
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><List className="w-4 h-4"/></button>
              <button onClick={() => setViewMode('medium')} className={`p-1.5 rounded-lg ${viewMode === 'medium' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4"/></button>
              <button onClick={() => setViewMode('small')} className={`p-1.5 rounded-lg ${viewMode === 'small' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><Grid className="w-4 h-4"/></button>
            </div>

            <button onClick={() => loadFiles(selectedAcc?.email, currentFolder)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-50 shrink-0">
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5"/>
            </button>
            
            <button onClick={() => fileInputRef.current.click()} disabled={isUploading || !selectedAcc} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-medium text-xs md:text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap">
              {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="hidden sm:inline">{isUploading ? 'Mengunggah...' : 'Upload'}</span>
              <span className="sm:hidden">{isUploading ? '...' : 'Upload'}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          {isLoading ? (
            <div className="text-center py-40 animate-pulse text-blue-500 font-black italic tracking-widest text-sm md:text-base">LOADING DRIVE...</div>
          ) : processedFiles.length === 0 ? (
            <div className="text-center py-40 text-slate-400 font-medium text-sm">Folder ini kosong atau file tidak ditemukan.</div>
          ) : (
            <div className={
              viewMode === 'list' ? 'flex flex-col gap-2' : 
              viewMode === 'small' ? 'grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4' : 
              'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6'
            }>
              {processedFiles.map(file => (
                <div key={file.id} onClick={() => handleItemClick(file)}
                  className={`bg-white border border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex 
                  ${viewMode === 'list' ? 'flex-row items-center p-3 rounded-2xl gap-4' : 'flex-col items-center p-4 md:p-5 rounded-2xl md:rounded-3xl hover:-translate-y-1'}`}>
                  
                  <div className={`flex items-center justify-center shrink-0 
                    ${viewMode === 'list' ? 'w-10 h-10 rounded-xl' : viewMode === 'small' ? 'w-10 h-10 rounded-xl mb-2' : 'w-12 h-12 md:w-14 md:h-14 rounded-2xl mb-3 md:mb-4'}
                    ${file.isFolder ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                    {file.isFolder ? <Folder className="fill-current w-3/5 h-3/5" /> : <FileText className="w-3/5 h-3/5" />}
                  </div>
                  
                  <div className={`flex flex-col flex-1 overflow-hidden ${viewMode !== 'list' && 'items-center w-full'}`}>
                    <p className={`font-semibold truncate text-slate-700 ${viewMode === 'list' ? 'text-sm' : 'text-xs md:text-sm w-full text-center'}`} title={file.name}>
                      {file.name}
                    </p>
                    {viewMode === 'list' && !file.isFolder && (
                      <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)}</p>
                    )}
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CSS Tambahan untuk menyembunyikan scrollbar di menu atas versi mobile */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}