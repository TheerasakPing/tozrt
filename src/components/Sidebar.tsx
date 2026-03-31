import React, { useState } from 'react';
import { Download, Upload, CheckCircle, PauseCircle, AlertTriangle, List, Settings, Film, Music, Gamepad2, FileText, Image, Video, Folder, Tag, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTorrentStore } from '../store/torrentStore';
import type { FilterType, Category } from '../types/torrent';

const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <List size={14} /> },
  { id: 'downloading', label: 'Downloading', icon: <Download size={14} /> },
  { id: 'seeding', label: 'Seeding', icon: <Upload size={14} /> },
  { id: 'completed', label: 'Completed', icon: <CheckCircle size={14} /> },
  { id: 'paused', label: 'Paused', icon: <PauseCircle size={14} /> },
  { id: 'error', label: 'Error', icon: <AlertTriangle size={14} /> },
];

const categoryList: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'uncategorized', label: 'Uncategorized', icon: <Tag size={14} /> },
  { id: 'movies', label: 'Movies', icon: <Film size={14} /> },
  { id: 'music', label: 'Music', icon: <Music size={14} /> },
  { id: 'games', label: 'Games', icon: <Gamepad2 size={14} /> },
  { id: 'software', label: 'Software', icon: <FileText size={14} /> },
  { id: 'documents', label: 'Documents', icon: <FileText size={14} /> },
  { id: 'images', label: 'Images', icon: <Image size={14} /> },
  { id: 'videos', label: 'Videos', icon: <Video size={14} /> },
  { id: 'other', label: 'Other', icon: <Folder size={14} /> },
];

export function Sidebar() {
  const { torrents, filter, setFilter, categories, setShowSettings, downloadHistory } = useTorrentStore();
  const [collapsed, setCollapsed] = useState(false);

  const counts: Record<FilterType, number> = {
    all: torrents.length,
    downloading: torrents.filter((t) => t.state === 'downloading').length,
    seeding: torrents.filter((t) => t.state === 'seeding').length,
    completed: torrents.filter((t) => t.progress_pct >= 100).length,
    paused: torrents.filter((t) => t.state === 'paused').length,
    error: torrents.filter((t) => t.state === 'error').length,
    history: downloadHistory.length,
  };

  const getCat = (id: number) => categories[id] || 'uncategorized';

  const categoryCounts: Record<Category, number> = {
    uncategorized: torrents.filter((t) => getCat(t.id) === 'uncategorized').length,
    movies: torrents.filter((t) => getCat(t.id) === 'movies').length,
    music: torrents.filter((t) => getCat(t.id) === 'music').length,
    games: torrents.filter((t) => getCat(t.id) === 'games').length,
    software: torrents.filter((t) => getCat(t.id) === 'software').length,
    documents: torrents.filter((t) => getCat(t.id) === 'documents').length,
    images: torrents.filter((t) => getCat(t.id) === 'images').length,
    videos: torrents.filter((t) => getCat(t.id) === 'videos').length,
    other: torrents.filter((t) => getCat(t.id) === 'other').length,
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className={`sidebar-section-title ${collapsed ? 'hidden' : ''}`}>Library</div>

      {filters.map((f) => (
        <div
          key={f.id}
          className={`nav-item ${filter === f.id ? 'active' : ''}`}
          onClick={() => setFilter(f.id)}
          title={collapsed ? f.label : undefined}
        >
          {f.icon}
          {!collapsed && f.label}
          {!collapsed && counts[f.id] > 0 && (
            <span className="nav-badge">{counts[f.id]}</span>
          )}
        </div>
      ))}

      <div className={`sidebar-section-title ${collapsed ? 'hidden' : ''}`} style={{ marginTop: 16 }}>Categories</div>

      {categoryList.map((c) => (
        <div key={c.id} className="nav-item" onClick={() => setFilter('all')} title={collapsed ? c.label : undefined}>
          {c.icon}
          {!collapsed && c.label}
          {!collapsed && categoryCounts[c.id] > 0 && (
            <span className="nav-badge">{categoryCounts[c.id]}</span>
          )}
        </div>
      ))}

      <div className={`sidebar-section-title ${collapsed ? 'hidden' : ''}`} style={{ marginTop: 16 }}>More</div>

      <div
        className={`nav-item ${filter === 'history' ? 'active' : ''}`}
        onClick={() => setFilter('history')}
        title={collapsed ? 'History' : undefined}
      >
        <History size={14} />
        {!collapsed && 'History'}
        {!collapsed && downloadHistory.length > 0 && (
          <span className="nav-badge">{downloadHistory.length}</span>
        )}
      </div>

      <div className="sidebar-footer">
        <div
          className="nav-item"
          onClick={() => setShowSettings(true)}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={14} />
          {!collapsed && 'Settings'}
        </div>
        <div
          className="nav-item"
          onClick={() => setFilter('all')}
          title={collapsed ? 'All' : undefined}
        >
          <List size={14} />
          {!collapsed && 'All'}
        </div>
      </div>
    </aside>
  );
}
