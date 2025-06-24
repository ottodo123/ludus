import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { groupCardsByLesson } from '../utils/dataProcessor';
import '../styles/SettingsPage.css';

const SettingsPage = ({ onBack }) => {
  const { preferences, updatePreference, cards } = useFlashcards();
  
  // Migration function for legacy selectionMode preference
  const migrateSelectionMode = (prefs) => {
    if (prefs.selectionMode && prefs.useAutomatic === undefined && prefs.useManual === undefined) {
      switch (prefs.selectionMode) {
        case 'auto':
          return { useAutomatic: true, useManual: false };
        case 'manual':
          return { useAutomatic: false, useManual: true };
        case 'both':
          return { useAutomatic: true, useManual: true };
        default:
          return { useAutomatic: true, useManual: false };
      }
    }
    return {};
  };

  const migratedPrefs = migrateSelectionMode(preferences);

  const [settings, setSettings] = useState({
    dailyCardLimit: preferences.dailyCardLimit || 20,
    useAutomatic: preferences.useAutomatic !== undefined ? preferences.useAutomatic : (migratedPrefs.useAutomatic !== undefined ? migratedPrefs.useAutomatic : true),
    useManual: preferences.useManual !== undefined ? preferences.useManual : (migratedPrefs.useManual !== undefined ? migratedPrefs.useManual : false),
    autoIncludeStudied: preferences.autoIncludeStudied !== undefined ? preferences.autoIncludeStudied : true,
    manualSelections: preferences.manualSelections || {
      ludus: {
        enabled: false,
        fromChapter: 1,
        toChapter: 64
      },
      caesar: {
        enabled: false,
        fromChapter: 1,
        toChapter: 1
      },
      cicero: {
        enabled: false,
        fromChapter: 1,
        toChapter: 1
      }
    },
    prioritizeDue: preferences.prioritizeDue !== undefined ? preferences.prioritizeDue : true,
    includeNewCards: preferences.includeNewCards !== undefined ? preferences.includeNewCards : false,
  });

  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const fromDropdownRef = useRef(null);
  const toDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fromDropdownRef.current && !fromDropdownRef.current.contains(event.target)) {
        setShowFromDropdown(false);
      }
      if (toDropdownRef.current && !toDropdownRef.current.contains(event.target)) {
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get available chapters for each curriculum
  const availableChapters = useMemo(() => {
    const ludusCards = cards.filter(card => card.curriculum === 'LUDUS');
    const ludusGroups = groupCardsByLesson(ludusCards);
    
    const result = {
      ludus: Object.keys(ludusGroups).map(lesson => ({
        id: parseInt(lesson),
        name: `Chapter ${lesson}`,
        cardCount: ludusGroups[lesson].length
      })).sort((a, b) => a.id - b.id),
      caesar: [], // Will be populated when available
      cicero: []  // Will be populated when available
    };
    
    return result;
  }, [cards]);

  const handleSave = () => {
    // Save each setting
    Object.keys(settings).forEach(key => {
      updatePreference(key, settings[key]);
    });
    onBack();
  };

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: value
      };
      
      // When automatic is enabled, automatically set autoIncludeStudied to true
      if (key === 'useAutomatic' && value === true) {
        newSettings.autoIncludeStudied = true;
      }
      
      return newSettings;
    });
  };

  const updateManualSelection = (curriculum, key, value) => {
    setSettings(prev => ({
      ...prev,
      manualSelections: {
        ...prev.manualSelections,
        [curriculum]: {
          ...prev.manualSelections[curriculum],
          [key]: value
        }
      }
    }));
  };

  const updateChapterRange = (curriculum, field, value) => {
    setSettings(prev => ({
      ...prev,
      manualSelections: {
        ...prev.manualSelections,
        [curriculum]: {
          ...prev.manualSelections[curriculum],
          [field]: parseInt(value)
        }
      }
    }));
  };

  const selectAllChapters = (curriculum) => {
    const maxChapter = Math.max(...availableChapters[curriculum].map(ch => ch.id));
    updateManualSelection(curriculum, 'fromChapter', 1);
    updateManualSelection(curriculum, 'toChapter', maxChapter);
  };

  const getSelectionSummary = () => {
    const { useAutomatic, useManual, manualSelections } = settings;
    
    let summary = [];
    
    if (useAutomatic) {
      summary.push('Previously studied cards');
    }
    
    if (useManual) {
      Object.keys(manualSelections).forEach(curriculum => {
        const selection = manualSelections[curriculum];
        if (selection.enabled) {
          const from = selection.fromChapter;
          const to = selection.toChapter;
          if (from === to) {
            summary.push(`${curriculum.toUpperCase()}: Chapter ${from}`);
          } else {
            summary.push(`${curriculum.toUpperCase()}: Chapters ${from}-${to}`);
          }
        }
      });
    }
    
    return summary.length > 0 ? summary.join(', ') : 'No selection criteria set';
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h1 className="settings-title">Daily Review Settings</h1>
      </div>

      <div className="settings-container">
        {/* Daily Card Limit */}
        <div className="setting-section">
          <h2 className="section-title">Daily Goals</h2>
          <div className="setting-group">
            <label className="setting-label">Cards per Daily Review</label>
            <div className="setting-input">
              <input
                type="number"
                value={settings.dailyCardLimit}
                onChange={e => updateSetting('dailyCardLimit', parseInt(e.target.value) || 20)}
                min="5"
                max="100"
                className="number-input"
                placeholder="20"
              />
            </div>
          </div>
        </div>

        {/* Selection Mode */}
        <div className="setting-section">
          <h2 className="section-title">Card Selection</h2>
          <div className="setting-group">
            <label className="setting-label">Selection Mode</label>
            <div className="compact-checkboxes">
              <label className="compact-checkbox">
                <input
                  type="checkbox"
                  checked={settings.useAutomatic}
                  onChange={e => updateSetting('useAutomatic', e.target.checked)}
                />
                <span className="checkbox-text">Automatic</span>
              </label>
              
              <label className="compact-checkbox">
                <input
                  type="checkbox"
                  checked={settings.useManual}
                  onChange={e => updateSetting('useManual', e.target.checked)}
                />
                <span className="checkbox-text">Manual Selection</span>
              </label>
            </div>
          </div>

          {/* Card Selection Priority */}
          <div className="setting-group">
            <label className="setting-label">Priority Options</label>
            <div className="compact-checkboxes">
              <label className="compact-checkbox">
                <input
                  type="checkbox"
                  checked={settings.prioritizeDue}
                  onChange={e => updateSetting('prioritizeDue', e.target.checked)}
                />
                <span className="checkbox-text">Prioritize due cards</span>
              </label>
              <label className="compact-checkbox">
                <input
                  type="checkbox"
                  checked={settings.includeNewCards}
                  onChange={e => updateSetting('includeNewCards', e.target.checked)}
                />
                <span className="checkbox-text">Include new cards</span>
              </label>
            </div>
          </div>
        </div>

        {/* Manual Settings */}
        {settings.useManual && (
          <div className="setting-section manual-section">
            <h2 className="section-title">✋ Manual Selection</h2>
            
            {/* LUDUS Selection */}
            <div className="curriculum-card">
              <div className="curriculum-header-page">
                <label className="curriculum-toggle-page">
                  <input
                    type="checkbox"
                    checked={settings.manualSelections.ludus.enabled}
                    onChange={e => updateManualSelection('ludus', 'enabled', e.target.checked)}
                  />
                  <span className="curriculum-title">LUDUS</span>
                  <span className="curriculum-count">(680 words)</span>
                </label>
              </div>
              
              {settings.manualSelections.ludus.enabled && (
                <div className="chapter-selection-page">
                  <div className="chapter-range-selection">
                    <div className="range-inputs">
                      <div className="range-input-group" ref={fromDropdownRef}>
                        <label className="range-label">From</label>
                        <button
                          className="chapter-dropdown-btn"
                          onClick={() => setShowFromDropdown(!showFromDropdown)}
                        >
                          Chapter {settings.manualSelections.ludus.fromChapter}
                          <span className="dropdown-arrow">▼</span>
                        </button>
                        {showFromDropdown && (
                          <div className="chapter-dropdown-menu">
                            {availableChapters.ludus.map(chapter => (
                              <button
                                key={chapter.id}
                                className={`chapter-dropdown-item ${settings.manualSelections.ludus.fromChapter === chapter.id ? 'active' : ''}`}
                                onClick={() => {
                                  updateChapterRange('ludus', 'fromChapter', chapter.id);
                                  setShowFromDropdown(false);
                                }}
                              >
                                Chapter {chapter.id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="range-input-group" ref={toDropdownRef}>
                        <label className="range-label">To</label>
                        <button
                          className="chapter-dropdown-btn"
                          onClick={() => setShowToDropdown(!showToDropdown)}
                        >
                          Chapter {settings.manualSelections.ludus.toChapter}
                          <span className="dropdown-arrow">▼</span>
                        </button>
                        {showToDropdown && (
                          <div className="chapter-dropdown-menu">
                            {availableChapters.ludus.map(chapter => (
                              <button
                                key={chapter.id}
                                className={`chapter-dropdown-item ${settings.manualSelections.ludus.toChapter === chapter.id ? 'active' : ''}`}
                                onClick={() => {
                                  updateChapterRange('ludus', 'toChapter', chapter.id);
                                  setShowToDropdown(false);
                                }}
                              >
                                Chapter {chapter.id}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="chapter-actions">
                      <button
                        className="toggle-all-btn"
                        onClick={() => selectAllChapters('ludus')}
                      >
                        Select All Chapters
                      </button>
                      <span className="selection-count">
                        {settings.manualSelections.ludus.fromChapter === settings.manualSelections.ludus.toChapter 
                          ? `Chapter ${settings.manualSelections.ludus.fromChapter}` 
                          : `Chapters ${settings.manualSelections.ludus.fromChapter}-${settings.manualSelections.ludus.toChapter}`
                        } • {
                          availableChapters.ludus
                            .filter(ch => ch.id >= settings.manualSelections.ludus.fromChapter && ch.id <= settings.manualSelections.ludus.toChapter)
                            .reduce((sum, ch) => sum + ch.cardCount, 0)
                        } words
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CAESAR Selection (Coming Soon) */}
            <div className="curriculum-card disabled">
              <div className="curriculum-header-page">
                <label className="curriculum-toggle-page">
                  <input type="checkbox" disabled />
                  <span className="curriculum-title">CAESAR</span>
                  <span className="curriculum-count">(Coming Soon)</span>
                </label>
              </div>
            </div>

            {/* CICERO Selection (Coming Soon) */}
            <div className="curriculum-card disabled">
              <div className="curriculum-header-page">
                <label className="curriculum-toggle-page">
                  <input type="checkbox" disabled />
                  <span className="curriculum-title">CICERO</span>
                  <span className="curriculum-count">(Coming Soon)</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Selection Summary */}
        <div className="setting-section">
          <h2 className="section-title">📋 Current Selection</h2>
          <div className="selection-summary-page">
            {getSelectionSummary()}
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;