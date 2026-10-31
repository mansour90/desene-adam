import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Cloud,
  CheckCircle2,
  XCircle,
  FolderSync,
  History,
  LogOut,
  Save,
  HelpCircle,
  X,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import {
  isGoogleDriveConnected,
  getGoogleClientId,
  setGoogleClientId,
  getRootFolderName,
  setRootFolderName,
  requestGoogleDriveAuth,
  disconnectGoogleDrive,
  testGoogleDriveConnection,
  getRecentSaves,
  clearRecentSaves
} from '../services/googleDrive';
import { resetSessionFolder, getOrCreateSessionFolderName } from '../utils/dateFolders';

const STORAGE_KEY_PIN = 'desene_adam_parent_pin';
const DEFAULT_PIN = '290590';

export default function ParentSettings({ isOpen, onClose, onAuthChanged }) {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Setări Google Drive
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState('');
  const [rootFolder, setRootFolder] = useState('Desene Adam');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Schimbare PIN
  const [newPin, setNewPin] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState(null);

  // Istoric salvări
  const [recentSaves, setRecentSaves] = useState([]);
  const [activeTab, setActiveTab] = useState('google'); // 'google', 'history', 'pin'

  // Sesiune curentă
  const [currentSessionFolder, setCurrentSessionFolder] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setPinError(false);
      setIsUnlocked(false);
      setTestResult(null);
      setAuthError(null);
      setPinSuccessMsg(null);
    }
  }, [isOpen]);

  const loadSettingsData = () => {
    setIsConnected(isGoogleDriveConnected());
    setClientId(getGoogleClientId());
    setRootFolder(getRootFolderName());
    setRecentSaves(getRecentSaves());
    setCurrentSessionFolder(getOrCreateSessionFolderName());
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    const storedPin = localStorage.getItem(STORAGE_KEY_PIN) || DEFAULT_PIN;
    if (pinInput === storedPin) {
      setIsUnlocked(true);
      setPinError(false);
      loadSettingsData();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleDigitPress = (digit) => {
    if (pinInput.length < 6) {
      const updated = pinInput + digit;
      setPinInput(updated);
      const storedPin = localStorage.getItem(STORAGE_KEY_PIN) || DEFAULT_PIN;
      if (updated === storedPin) {
        setIsUnlocked(true);
        setPinError(false);
        loadSettingsData();
      }
    }
  };

  const handleConnectGoogle = async () => {
    setAuthError(null);
    setTestResult(null);
    try {
      if (clientId.trim()) {
        setGoogleClientId(clientId.trim());
      }
      await requestGoogleDriveAuth();
      setIsConnected(true);
      if (onAuthChanged) onAuthChanged(true);
      setTestResult({ success: true, message: 'Conectat cu succes la contul Google!' });
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleDisconnectGoogle = () => {
    disconnectGoogleDrive();
    setIsConnected(false);
    setTestResult(null);
    if (onAuthChanged) onAuthChanged(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setAuthError(null);
    try {
      const user = await testGoogleDriveConnection();
      setTestResult({
        success: true,
        message: `Conexiune funcțională! Conectat ca: ${user.displayName || user.emailAddress || 'Utilizator Google'}`
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: `Eroare verificare conexiune: ${err.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveRootFolder = (e) => {
    e.preventDefault();
    setRootFolderName(rootFolder);
    alert(`Numele folderului principal a fost actualizat la: "${rootFolder}"`);
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    setGoogleClientId(clientId);
    alert('Google Client ID a fost salvat!');
  };

  const handleResetSession = () => {
    resetSessionFolder();
    const newName = getOrCreateSessionFolderName();
    setCurrentSessionFolder(newName);
    alert(`A fost creată o sesiune nouă! Următoarele salvări vor merge în folderul: "${newName}"`);
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    if (newPin.length >= 4) {
      localStorage.setItem(STORAGE_KEY_PIN, newPin);
      setNewPin('');
      setPinSuccessMsg('Noul cod PIN a fost salvat cu succes!');
      setTimeout(() => setPinSuccessMsg(null), 3500);
    } else {
      alert('Codul PIN trebuie să aibă cel puțin 4 cifre.');
    }
  };

  const handleClearHistory = () => {
    if (confirm('Sigur doriți să ștergeți istoricul salvărilor locale?')) {
      clearRecentSaves();
      setRecentSaves([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="parent-modal-backdrop" role="dialog" aria-modal="true">
      <div className="parent-modal-window">
        {/* Buton Închidere */}
        <button
          type="button"
          className="parent-modal-close"
          onClick={onClose}
          aria-label="Închide fereastra"
        >
          <X size={26} />
        </button>

        {!isUnlocked ? (
          /* Ecran blocare PIN pentru protecția copilului */
          <div className="pin-gate-view">
            <div className="pin-shield-header">
              <div className="lock-icon-circle">
                <Lock size={36} className="lock-icon" />
              </div>
              <h2 className="pin-title">Zonă rezervată părinților</h2>
              <p className="pin-subtitle">Introduceți codul PIN pentru a accesa setările:</p>
            </div>

            <form onSubmit={handlePinSubmit} className="pin-form">
              <div className="pin-display-wrapper">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN"
                  className={`pin-text-input ${pinError ? 'pin-error' : ''}`}
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="pin-error-msg">Cod PIN incorect. PIN-ul prestabilit este 290590.</p>
              )}

              {/* Tastatură numerică mare ușor de utilizat pe ecran tactil */}
              <div className="numeric-keypad">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="keypad-key"
                    onClick={() => handleDigitPress(String(num))}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="keypad-key keypad-clear"
                  onClick={() => setPinInput('')}
                >
                  C
                </button>
                <button
                  key={0}
                  type="button"
                  className="keypad-key"
                  onClick={() => handleDigitPress('0')}
                >
                  0
                </button>
                <button
                  type="submit"
                  className="keypad-key keypad-enter"
                  aria-label="Confirmă PIN"
                >
                  <Unlock size={22} />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Panou de administrare deblocat */
          <div className="parent-admin-view">
            <div className="admin-header">
              <div className="admin-title-row">
                <KeyRound size={28} className="admin-key-icon" />
                <h2 className="admin-title">Setări & Google Drive</h2>
              </div>
              <p className="admin-desc">Gestionează sincronizarea în cloud și istoricul desenelor lui Adam.</p>
            </div>

            {/* Tab-uri de navigare setări */}
            <nav className="admin-tabs-nav">
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
                onClick={() => setActiveTab('google')}
              >
                <Cloud size={18} />
                <span>Google Drive</span>
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={18} />
                <span>Trimise în Google Drive ({recentSaves.length})</span>
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'pin' ? 'active' : ''}`}
                onClick={() => setActiveTab('pin')}
              >
                <Lock size={18} />
                <span>Schimbare PIN</span>
              </button>
            </nav>

            <div className="admin-tab-content">
              {/* TAB 1: GOOGLE DRIVE */}
              {activeTab === 'google' && (
                <div className="tab-pane-google">
                  {/* Status conexiune */}
                  <div className="connection-status-card">
                    <div className="status-indicator-row">
                      {isConnected ? (
                        <>
                          <CheckCircle2 size={24} className="status-icon connected" />
                          <div>
                            <strong>Google Drive este CONECTAT</strong>
                            <p className="status-sub">Desenele se vor încărca automat în folderul sesiunii curente.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle size={24} className="status-icon disconnected" />
                          <div>
                            <strong>Google Drive este NECONECTAT</strong>
                            <p className="status-sub">Desenele se descarcă local pe dispozitiv. Conectați Google Drive pentru backup automat.</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="status-buttons-row">
                      {!isConnected ? (
                        <button
                          type="button"
                          className="admin-action-btn btn-connect-google"
                          onClick={handleConnectGoogle}
                        >
                          <Cloud size={20} />
                          <span>Conectează contul Google</span>
                        </button>
                      ) : (
                        <div className="connected-btn-group">
                          <button
                            type="button"
                            className="admin-action-btn btn-test-conn"
                            onClick={handleTestConnection}
                            disabled={isTesting}
                          >
                            <RefreshCw size={18} className={isTesting ? 'spinning' : ''} />
                            <span>Verifică conexiunea</span>
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn btn-disconnect"
                            onClick={handleDisconnectGoogle}
                          >
                            <LogOut size={18} />
                            <span>Deconectează</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {testResult && (
                      <div className={`test-feedback-box ${testResult.success ? 'test-success' : 'test-error'}`}>
                        {testResult.message}
                      </div>
                    )}

                    {authError && (
                      <div className="test-feedback-box test-error">
                        {authError}
                      </div>
                    )}
                  </div>

                  {/* Informații folder sesiune */}
                  <div className="session-folder-card">
                    <div className="session-card-header">
                      <FolderSync size={22} className="card-header-icon" />
                      <h4>Folderul sesiunii curente:</h4>
                    </div>
                    <div className="session-path-box">
                      <code>Google Drive / {rootFolder} / {currentSessionFolder} /</code>
                    </div>
                    <button
                      type="button"
                      className="admin-action-btn btn-secondary-small"
                      onClick={handleResetSession}
                    >
                      <FolderPlus size={18} />
                      <span>Începe o sesiune nouă (folder nou)</span>
                    </button>
                  </div>

                  {/* Configurare folder rădăcină */}
                  <form onSubmit={handleSaveRootFolder} className="settings-field-group">
                    <label className="field-label">Nume folder principal Google Drive:</label>
                    <div className="input-with-btn">
                      <input
                        type="text"
                        value={rootFolder}
                        onChange={(e) => setRootFolder(e.target.value)}
                        className="field-input"
                        placeholder="Desene Adam"
                      />
                      <button type="submit" className="field-save-btn">
                        <Save size={18} />
                        <span>Salvează</span>
                      </button>
                    </div>
                  </form>

                  {/* Configurare Client ID */}
                  <form onSubmit={handleSaveClientId} className="settings-field-group">
                    <div className="label-with-hint">
                      <label className="field-label">Google OAuth 2.0 Client ID:</label>
                      <span className="label-badge">Web Application</span>
                    </div>
                    <div className="input-with-btn">
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="field-input code-font"
                        placeholder="ex: 123456789-abc.apps.googleusercontent.com"
                      />
                      <button type="submit" className="field-save-btn">
                        <Save size={18} />
                        <span>Salvează</span>
                      </button>
                    </div>
                    <p className="field-help-text">
                      <HelpCircle size={14} />
                      Puteți crea un Client ID gratuit în <strong>Google Cloud Console</strong> cu originea autorizată <code>{window.location.origin}</code> și domeniul <code>https://www.googleapis.com/auth/drive.file</code>.
                    </p>
                  </form>
                </div>
              )}

              {/* TAB 2: ISTORIC SALVĂRI */}
              {activeTab === 'history' && (
                <div className="tab-pane-history">
                  <div className="history-header-row">
                    <h4>Desene trimise în Google Drive</h4>
                    {recentSaves.length > 0 && (
                      <button
                        type="button"
                        className="btn-text-danger"
                        onClick={handleClearHistory}
                      >
                        Șterge istoricul
                      </button>
                    )}
                  </div>

                  {recentSaves.length === 0 ? (
                    <div className="history-empty-state">
                      <p>Nu există încă desene trimise în Google Drive.</p>
                    </div>
                  ) : (
                    <div className="history-list-table">
                      {recentSaves.map((item, idx) => (
                        <div key={idx} className="history-item-row">
                          <div className="history-col-main">
                            <strong className="item-filename">{item.fileName}</strong>
                            <span className="item-folder">{item.folderName}</span>
                          </div>
                          <div className="history-col-meta">
                            <span className="item-date">
                              {new Date(item.date).toLocaleDateString('ro-RO', {
                                day: '2-digit',
                                month: '2-digit'
                              }).replace(/\.$/, '')}
                            </span>
                            {item.webViewLink && (
                              <a
                                href={item.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="item-drive-link"
                              >
                                Deschide pe Drive
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SCHIMBARE PIN */}
              {activeTab === 'pin' && (
                <div className="tab-pane-pin">
                  <form onSubmit={handleChangePin} className="pin-change-form">
                    <h4>Schimbare cod PIN Părinte</h4>
                    <p className="field-help-text">
                      PIN-ul implicit este <code>290590</code>. Alegeți un cod din minim 4 cifre pentru a preveni accesul copilului la aceste setări.
                    </p>

                    <div className="settings-field-group">
                      <label className="field-label">Cod PIN nou:</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={8}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="Introduceți 4-8 cifre"
                        className="field-input"
                        required
                      />
                    </div>

                    <button type="submit" className="admin-action-btn btn-save-pin">
                      <Save size={18} />
                      <span>Salvează noul PIN</span>
                    </button>

                    {pinSuccessMsg && (
                      <div className="test-feedback-box test-success">
                        {pinSuccessMsg}
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
