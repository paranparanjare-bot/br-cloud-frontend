import React, { useState, useEffect } from 'react';
import { Search, Folder, FileText, Cloud, ChevronLeft, RefreshCw, LayoutGrid, List, Minimize2, User, ArrowUp, ArrowDown } from 'lucide-react';

// Mengambil URL dari Environment Variable Netlify, jika tidak ada pakai URL Koyeb langsung sebagai fallback
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://educational-cyndie-gdrivegnet-de995a1e.koyeb.app"; 

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [viewSize, setViewSize] = useState("medium");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts`);
      if (!res.ok) throw new Error("Gagal mengambil data akun");
      const data = await res.json();
      setAccounts(data);
      if (data.length > 0 && !selectedAcc) setSelectedAcc(data[0]);
    } catch (e) { 
      console.error("Koneksi ke Backend Gagal:", e);
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
      console.error("Gagal memuat file:", e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { 
    loadAccounts(); 
  }, []);

  useEffect(() => { 
    if (selectedAcc) loadFiles(selectedAcc.email, currentFolder); 
  }, [selectedAcc, currentFolder]);

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isFolder !== b.isFolder) {
      return sortOrder === "asc" ? (a.isFolder ? -1 : 1) : (a.isFolder ? 1 : -1);
    }
    let comp = sortBy === "name" ? a.name.localeCompare(b.name) : a.size - b.size;
    return sortOrder === "asc" ? comp : -comp;
  });

  const handleItemClick = async (file) => {
    if (file.isFolder) {
      setHistory([...history, currentFolder]);
      setCurrentFolder(file.id);
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/api/files/open/${file.id}?email=${selectedAcc.email}`);
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
      } catch (e) {
        alert("Gagal membuka file. Pastikan server Satpam (Koyeb) aktif!");
      }
    }
  };

  const goBack = () => {
    const prevHistory = [...history];
    const lastFolder = prevHistory.pop() || 'root';
    setHistory(prevHistory);
    setCurrentFolder(lastFolder);
  };

  const gridStyles = { 
    small: "grid-cols-4 md:grid-cols-8 gap-2", 
    medium: "grid-cols-2 md:grid-cols-5 gap-6", 
    list: "grid-cols-1 gap-2" 
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      <aside className="w-64 bg-white border-r p-6 flex flex-col shadow-sm">
        <div className="flex items-center mb-10 text-blue-600 font-bold text-xl uppercase italic">
          <Cloud className="mr-2"/> BR Drive
        </div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {accounts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Menghubungkan ke server...</p>
          ) : (
            accounts.map(acc => (
              <button key={acc.email} onClick={() => {setSelectedAcc(acc); setCurrentFolder('root'); setHistory([]);}}
                className={`w-full flex items-center p-3 rounded-xl text-sm font-bold transition-all ${selectedAcc?.email === acc.email ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-500'}`}>
                <User className="w-4 h-4 mr-3" /> {acc.name.split(' ')[0]}
              </button>
            ))
          )}
          <button onClick={() => fetch(`${API_BASE_URL}/api/auth/google`).then(r => r.json()).then(d => window.location.href=d.url)}
            className="w-full p-3 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all">
            + Tambah Akun
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center px-10 gap-4">
          {currentFolder !== 'root' && (
            <button onClick={goBack} className="p-2 border rounded-full hover:bg-slate-100">
              <ChevronLeft />
            </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-slate-400 w-4 h-4" />
            <input 
              className="w-full bg-slate-100 pl-12 pr-4 py-3 rounded-2xl outline-none" 
              placeholder="Cari file..." 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-xs font-bold outline-none cursor-pointer">
              <option value="name">Nama</option>
              <option value="size">Ukuran</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-1 hover:bg-white rounded-lg">
              {sortOrder === "asc" ? <ArrowUp className="w-4 h-4 text-blue-500" /> : <ArrowDown className="w-4 h-4 text-blue-500" />}
            </button>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border">
            <button onClick={() => setViewSize('small')} className={`p-2 rounded-lg ${viewSize==='small'?'bg-white shadow-sm':''}`}><Minimize2 className="w-3 h-3" /></button>
            <button onClick={() => setViewSize('medium')} className={`p-2 rounded-lg ${viewSize==='medium'?'bg-white shadow-sm':''}`}><LayoutGrid className="w-3 h-3" /></button>
            <button onClick={() => setViewSize('list')} className={`p-2 rounded-lg ${viewSize==='list'?'bg-white shadow-sm':''}`}><List className="w-3 h-3" /></button>
          </div>
          <button onClick={() => loadFiles(selectedAcc.email, currentFolder)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
            <RefreshCw className="w-5 h-5"/>
          </button>
        </header>

        <div className="p-10 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-40 animate-pulse text-blue-500 font-black tracking-widest uppercase italic">
              Menghubungkan ke Cloud Drive...
            </div>
          ) : (
            <div className={`grid ${gridStyles[viewSize]}`}>
              {sortedFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(file => (
                <div key={file.id} onClick={() => handleItemClick(file)}
                  className={`bg-white border border-slate-100 rounded-3xl cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all flex ${viewSize === 'list' ? 'flex-row items-center p-3' : 'flex-col p-5'}`}>
                  <div className={`rounded-2xl flex items-center justify-center ${file.isFolder ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-600'} ${viewSize==='small' ? 'p-2 w-10 h-10' : 'p-4 w-14 h-14'} ${viewSize==='list' ? 'mr-4' : 'mb-4'}`}>
                    {file.isFolder ? <Folder className="fill-current w-full h-full" /> : <FileText className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate text-slate-700 ${viewSize==='small' ? 'text-[10px]' : 'text-sm'}`}>{file.name}</p>
                    {viewSize !== 'small' && (
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase font-black">
                        {file.isFolder ? 'Folder' : `${(file.size/1024/1024).toFixed(2)} MB`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}