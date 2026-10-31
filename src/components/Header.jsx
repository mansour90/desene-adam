import React from 'react';
import { Pencil, FileText, Settings, ShieldCheck } from 'lucide-react';

export default function Header({ onOpenParentSettings, isGoogleConnected }) {
  return (
    <header className="app-header">
      {/* Buton discret pentru părinți în colț */}
      <button
        type="button"
        className="parent-gate-btn"
        onClick={onOpenParentSettings}
        aria-label="Setări Părinte"
        title="Mod Părinte (protejat cu PIN)"
      >
        {isGoogleConnected ? (
          <ShieldCheck size={20} className="icon-parent-active" />
        ) : (
          <Settings size={20} className="icon-parent" />
        )}
        <span className="parent-btn-text">Părinte</span>
      </button>

      {/* Logo ilustrat cu creion și foaie de desen */}
      <div className="logo-container">
        <div className="logo-badge">
          <div className="paper-icon-wrapper">
            <FileText size={44} className="icon-sheet" />
            <div className="pencil-icon-wrapper">
              <Pencil size={36} className="icon-pencil" />
            </div>
          </div>
        </div>
      </div>

      <div className="header-titles">
        <h1 className="header-title">Ce vrei să colorezi?</h1>
        <p className="header-subtitle">Alege desenul preferat!</p>
      </div>
    </header>
  );
}
