import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Folder, FileText, Cloud, ChevronLeft, RefreshCw, User, UploadCloud, List, Grid, LayoutGrid, ArrowUp, ArrowDown, Menu, X, FolderPlus, MoreVertical, Trash2, Download, Eye, Send, Globe } from 'lucide-react';

const API_BASE_URL = "https://educational-cyndie-gdrivegnet-de995a1e.koyeb.app"; 

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [quotas, setQuotas] = useState({}); 
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [globalResults, setGlobalResults] = useState([]);
  const [transferModalFile, setTransferModalFile] = useState(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const [viewMode, setViewMode] = useState('medium'); 
  const [sortBy, setSortBy] = useState('name'); 
  const [sortOrder, setSortOrder] = useState('asc'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const loadAccountsAndQuota = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts`);
      const data = await res.json();
      setAccounts(data);
      
      if (data.length > 0) {
        const savedAccEmail = localStorage.getItem('lastActiveAccount');
        const foundAcc = data.find(acc => acc.email === savedAccEmail);
        setSelectedAcc(foundAcc || data[0]);
        if (!foundAcc) localStorage.setItem('lastActiveAccount', data[0].email);

        data.forEach(async (acc) => {
          try {
            const qRes = await fetch(`${API_BASE_URL}/api/accounts/quota?email=${acc.email}`);
            const qData = await qRes.json();
            if (qData.limit) setQuotas(prev => ({ ...prev, [acc.email]: qData }));
          } catch(e) {}
        });
      }
    } catch (e) { console.error("Gagal load akun:", e); }
  };

  const loadFiles = async (email, folderId = 'root') => {
    if (!email) return;
    setIsLoading(true);
    setActiveMenuId(null); 
    setIsGlobalSearch(false); 
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/list?email=${email}&folderId=${folderId}`);
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Gagal load file:", e); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadAccountsAndQuota(); }, []);
  
  useEffect(() => { 
    if (selectedAcc && !isGlobalSearch) {
      loadFiles(selectedAcc.email, currentFolder); 
      localStorage.setItem('lastActiveAccount', selectedAcc.email);
    }
  }, [selectedAcc, currentFolder]);

  const handleGlobalSearch = async () => {
    if (!search.trim()) return;
    setIsGlobalSearch(true);
    setIsLoading(true);
    setActiveMenuId(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/searchAll?query=${encodeURIComponent(search)}`);
      const data = await res.json();
      setGlobalResults(data);
    } catch (e) {
      alert("Gagal melakukan pencarian global.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- PERBAIKAN: TANGKAP ERROR MESSAGE & KIRIM MIMETYPE ---
  const executeTransfer = async (targetEmail) => {
    if (!transferModalFile || !selectedAcc) return;
    setIsTransferring(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: transferModalFile.id,
          sourceEmail: isGlobalSearch ? transferModalFile.accountEmail : selectedAcc.email,
          targetEmail: targetEmail,
          fileName: transferModalFile.name,
          mimeType: transferModalFile.mimeType // Pastikan mimetype dikirim
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Transfer berhasil! File ada di root folder akun tujuan.");
        setTransferModalFile(null);
      } else {
        // Tampilkan pesan error spesifik dari server Koyeb
        alert(`Transfer gagal: ${data.error || "Kesalahan tidak diketahui"}`);
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan saat transfer.");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCreateFolder = async () => {
    if (isGlobalSearch) return alert("Matikan mode pencarian global untuk membuat folder.");
    const folderName = prompt("Masukkan nama folder baru:");
    if (!folderName || !selectedAcc) return;
    try {
      await fetch(`${API_BASE_URL}/api/files/folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: selectedAcc.email, folderId: currentFolder, name: folderName })
      });
      loadFiles(selectedAcc.email, currentFolder);
    } catch (e) { alert("Gagal membuat folder"); }
  };

  const handleDelete = async (fileId, fileName, fileEmail, e) => {
    e.stopPropagation(); 
    if (!window.confirm(`Yakin ingin memindahkan "${fileName}" ke tempat sampah?`)) return;
    try {
      const targetEmail = isGlobalSearch ? fileEmail : selectedAcc.email;
      await fetch(`${API_BASE_URL}/api/files/delete/${fileId}?email=${targetEmail}`, { method: 'DELETE' });
      if (isGlobalSearch) handleGlobalSearch();
      else loadFiles(selectedAcc.email, currentFolder);
    } catch (err) { alert("Gagal menghapus"); }
  };

  const handleDownloadOrPreview = async (file, actionType, e) => {
    if(e) e.stopPropagation();
    try {
      const targetEmail = isGlobalSearch ? file.accountEmail : selectedAcc.email;
      const res = await fetch(`${API_BASE_URL}/api/files/open/${file.id}?email=${targetEmail}`);
      const data = await res.json();
      
      if (actionType === 'download') {
        if (data.downloadUrl) window.open(data.downloadUrl, '_blank');
        else window.open(data.url, '_blank');
      } else if (actionType === 'preview') {
        const embedUrl = data.url.replace('/view', '/preview');
        setPreviewUrl(embedUrl);
      }
    } catch (err) { alert("Gagal mengambil link file"); }
    setActiveMenuId(null);
  };

  const handleItemClick = (file) => {
    if (file.isFolder) {
      if(isGlobalSearch) return alert("Tidak bisa menavigasi folder di mode Global Search.");
      setHistory([...history, currentFolder]);
      setCurrentFolder(file.id);
    } else {
      handleDownloadOrPreview(file, 'preview', null); 
    }
  };

  const goBack = () => {
    if(isGlobalSearch) {
      setIsGlobalSearch(false);
      return;
    }
    const prev = [...history];
    const last = prev.pop() || 'root';
    setHistory(prev);
    setCurrentFolder(last);
  };

  const handleUpload = async (event) => {
    if (isGlobalSearch) return alert("Pindah ke folder spesifik untuk mengupload.");
    const file = event.target.files[0];
    if (!file || !selectedAcc) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', selectedAcc.email);
    formData.append('folderId', currentFolder);

    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/upload`, { method: 'POST', body: formData });
      if (res.ok) loadFiles(selectedAcc.email, currentFolder); 
      else alert("Gagal mengunggah file.");
    } catch (e) { alert("Terjadi kesalahan saat mengunggah."); } 
    finally { setIsUploading(false); event.target.value = null; }
  };

  const currentData = isGlobalSearch ? globalResults : files;

  const processedFiles = useMemo(() => {
    let filtered = isGlobalSearch ? currentData : currentData.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    
    return filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      let comparison = sortBy === 'name' ? a.name.localeCompare(b.name) : a.size - b.size;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [currentData, search, sortBy, sortOrder, isGlobalSearch]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans relative">
      
      {previewUrl && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col p-4 md:p-10">
          <div className="flex justify-between items-center text-white mb-4">
            <h3 className="font-semibold text-lg">Pratinjau File</h3>
            <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-6 h-6"/></button>
          </div>
          <div className="flex-1 bg-white rounded-xl overflow-hidden">
            <iframe src={previewUrl} className="w-full h-full border-none" allow="autoplay" title="Preview" />
          </div>
        </div>
      )}

      {transferModalFile && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Transfer File</h3>
            <p className="text-sm text-slate-500 mb-6 truncate">Kirim "{transferModalFile.name}" ke akun:</p>
            
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {accounts.filter(acc => acc.email !== (isGlobalSearch ? transferModalFile.accountEmail : selectedAcc?.email)).map(acc => (
                <button 
                  key={acc.email}
                  onClick={() => executeTransfer(acc.email)}
                  disabled={isTransferring}
                  className="w-full text-left p-3 rounded-xl border hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-between disabled:opacity-50"
                >
                  <span className="font-semibold text-sm text-slate-700">{acc.name.split(' ')[0]}</span>
                  <Send className="w-4 h-4 text-slate-400" />
                </button>
              ))}
              {accounts.length <= 1 && (
                <p className="text-xs text-center text-slate-400">Anda butuh lebih dari 1 akun untuk fitur transfer.</p>
              )}
            </div>
            
            <button onClick={() => setTransferModalFile(null)} disabled={isTransferring} className="w-full p-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-200">
              {isTransferring ? 'Memproses Transfer...' : 'Batal'}
            </button>
          </div>
        </div>
      )}

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col shadow-xl md:shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 mb-2">
          <div className="flex items-center text-blue-600 font-bold text-xl italic"><Cloud className="mr-2"/> BR Drive</div>
          <button className="md:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto px-6 pb-6">
          {accounts.map(acc => {
            const quota = quotas[acc.email];
            const usagePercent = quota ? (Number(quota.usage) / Number(quota.limit)) * 100 : 0;
            return (
              <div key={acc.email} className="relative group">
                <button 
                  onClick={() => { setSelectedAcc(acc); setCurrentFolder('root'); setHistory([]); setIsGlobalSearch(false); setIsSidebarOpen(false); }}
                  className={`w-full flex flex-col p-3 rounded-xl transition-all border ${selectedAcc?.email === acc.email && !isGlobalSearch ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200'}`}>
                  
                  <div className="flex items-center w-full">
                    <User className={`w-4 h-4 mr-3 ${selectedAcc?.email === acc.email && !isGlobalSearch ? 'text-blue-600' : 'text-slate-400'}`} /> 
                    <span className={`text-sm font-bold truncate ${selectedAcc?.email === acc.email && !isGlobalSearch ? 'text-blue-700' : 'text-slate-600'}`}>
                      {acc.name.split(' ')[0]}
                    </span>
                  </div>

                  {quota && (
                    <div className="w-full mt-3">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-medium">
                        <span>{formatBytes(quota.usage, 1)}</span>
                        <span>{formatBytes(quota.limit, 1)}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usagePercent}%` }}></div>
                      </div>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
          
          <button 
            onClick={() => { fetch(`${API_BASE_URL}/api/auth/google`).then(r => r.json()).then(d => { if(d.url) window.location.href=d.url; }); }}
            className="w-full p-3 rounded-xl text-xs font-bold border-2 border-dashed border-slate-200 text-slate-400 hover:text-blue-500 mt-4">
            + Tambah Akun
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full" onClick={() => setActiveMenuId(null)}>
        <header className="bg-white border-b flex flex-col md:flex-row items-start md:items-center px-4 py-3 md:h-20 gap-3 relative z-30">
          <div className="flex items-center w-full md:w-auto gap-2">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            {(currentFolder !== 'root' || isGlobalSearch) && (
              <button onClick={goBack} className="p-2 border rounded-full hover:bg-slate-100 shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="relative flex-1 md:w-64 lg:w-96 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
                <input 
                  className="w-full bg-slate-100 pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" 
                  placeholder={isGlobalSearch ? "Cari di seluruh akun..." : "Cari di folder ini..."} 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleGlobalSearch(); }}
                />
              </div>
              <button onClick={handleGlobalSearch} className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${isGlobalSearch ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-slate-200 hover:bg-blue-50'}`} title="Pencarian Universal">
                <Globe className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="hidden md:block flex-1"></div>

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

            <button onClick={() => isGlobalSearch ? handleGlobalSearch() : loadFiles(selectedAcc?.email, currentFolder)} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 shrink-0">
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5"/>
            </button>
            
            <button onClick={handleCreateFolder} disabled={isGlobalSearch} className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 disabled:opacity-50 shrink-0">
              <FolderPlus className="w-4 h-4 md:w-5 md:h-5"/>
            </button>

            <button onClick={() => fileInputRef.current.click()} disabled={isUploading || !selectedAcc || isGlobalSearch} className="flex items-center justify-center bg-blue-600 text-white w-10 h-10 md:w-11 md:h-11 rounded-xl hover:bg-blue-700 disabled:opacity-50 shrink-0 shadow-sm">
              {isUploading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
          </div>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          {isGlobalSearch && (
            <div className="mb-4 text-sm font-semibold text-blue-600 flex items-center bg-blue-50 p-3 rounded-xl border border-blue-100">
              <Globe className="w-4 h-4 mr-2" /> Menampilkan hasil pencarian dari seluruh akun
            </div>
          )}

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
                <div key={file.id} 
                  onClick={() => handleItemClick(file)}
                  className={`bg-white border border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex relative group
                  ${viewMode === 'list' ? 'flex-row items-center p-3 rounded-2xl gap-4' : 'flex-col items-center p-4 md:p-5 rounded-2xl md:rounded-3xl hover:-translate-y-1'}`}>
                  
                  <div className={`absolute ${viewMode === 'list' ? 'right-4 top-1/2 -translate-y-1/2' : 'right-2 top-2'} z-10`}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }}
                      className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-lg">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {activeMenuId === file.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-20 overflow-hidden">
                        {!file.isFolder && (
                          <>
                            <button onClick={(e) => handleDownloadOrPreview(file, 'preview', e)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center"><Eye className="w-4 h-4 mr-2" /> Lihat</button>
                            <button onClick={(e) => handleDownloadOrPreview(file, 'download', e)} className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center"><Download className="w-4 h-4 mr-2" /> Download</button>
                          </>
                        )}
                        {accounts.length > 1 && !file.isFolder && (
                          <button onClick={(e) => { e.stopPropagation(); setTransferModalFile(file); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center border-t border-b border-slate-50">
                            <Send className="w-4 h-4 mr-2" /> Transfer
                          </button>
                        )}
                        <button onClick={(e) => handleDelete(file.id, file.name, file.accountEmail, e)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                          <Trash2 className="w-4 h-4 mr-2" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`flex items-center justify-center shrink-0 relative
                    ${viewMode === 'list' ? 'w-10 h-10 rounded-xl' : viewMode === 'small' ? 'w-10 h-10 rounded-xl mb-2 mt-2' : 'w-12 h-12 md:w-14 md:h-14 rounded-2xl mb-3 md:mb-4 mt-2'}
                    ${file.isFolder ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                    {file.isFolder ? <Folder className="fill-current w-3/5 h-3/5" /> : <FileText className="w-3/5 h-3/5" />}
                    
                    {isGlobalSearch && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold truncate max-w-[40px]" title={file.accountEmail}>
                        {file.accountEmail.split('@')[0].substring(0,4)}
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex flex-col flex-1 overflow-hidden ${viewMode !== 'list' && 'items-center w-full px-2'}`}>
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
      <style>{` .hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } `}</style>
    </div>
  );
}