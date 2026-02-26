import React, { useState, useEffect } from 'react';
import { Search, Folder, FileText, Cloud, ChevronLeft, RefreshCw, LayoutGrid, List, Minimize2, User, ArrowUp, ArrowDown } from 'lucide-react';

// URL LANGSUNG KE KOYEB
const API_BASE_URL = "https://educational-cyndie-gdrivegnet-de995a1e.koyeb.app"; 

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

  const sortedFiles = [...files].sort((a, b) => {
    if (a.isFolder !== b.isFolder) return sortOrder === "asc" ? (a.isFolder ? -1 : 1) : (a.isFolder ? 1 : -1);
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
      } catch (e) { alert("Gagal membuka file"); }
    }
  };

  const goBack = () => {
    const prev = [...history];
    const last = prev.pop() || 'root';
    setHistory(prev);
    setCurrentFolder(last);
  };

  const gridStyles = { small: "grid-cols-4 md:grid-cols-8 gap-2", medium: "grid-cols-2 md:grid-cols-5 gap-6", list: "grid-cols-1 gap-2" };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      <aside className="w-64 bg-white border-r p-6 flex flex-col shadow-sm">
        <div className="flex items-center mb-10 text-blue-600 font-bold text-xl italic"><Cloud className="mr-2"/> BR Drive</div>
        <div className="space-y-2 flex-1 overflow-y-auto">
          {accounts.map(acc => (
            <button key={acc.email} onClick={() => {setSelectedAcc(acc); setCurrentFolder('root'); setHistory([]);}}
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
            className="w-full p-3 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:text-blue-500 transition-all">
            + Tambah Akun
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center px-10 gap-4">
          {currentFolder !== 'root' && <button onClick={goBack} className="p-2 border rounded-full hover:bg-slate-100"><ChevronLeft /></button>}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 text-slate-400 w-4 h-4" />
            <input className="w-full bg-slate-100 pl-12 pr-4 py-3 rounded-2xl outline-none" placeholder="Cari file..." onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => loadFiles(selectedAcc.email, currentFolder)} className="p-2 text-slate-400 hover:text-blue-500"><RefreshCw className="w-5 h-5"/></button>
        </header>

        <div className="p-10 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-40 animate-pulse text-blue-500 font-black italic tracking-widest">LOADING DRIVE...</div>
          ) : (
            <div className={`grid ${gridStyles[viewSize]}`}>
              {sortedFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(file => (
                <div key={file.id} onClick={() => handleItemClick(file)}
                  className="bg-white border border-slate-100 rounded-3xl cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all p-5 flex flex-col items-center">
                  <div className={`rounded-2xl p-4 w-14 h-14 mb-4 flex items-center justify-center ${file.isFolder ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-600'}`}>
                    {file.isFolder ? <Folder className="fill-current w-full h-full" /> : <FileText className="w-full h-full" />}
                  </div>
                  <p className="font-bold truncate text-sm w-full text-center text-slate-700">{file.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}