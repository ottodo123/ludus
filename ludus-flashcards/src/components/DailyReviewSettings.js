import React, { useState, useMemo } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';
import { groupCardsByLesson } from '../utils/dataProcessor';
import '../styles/DailyReviewSettings.css';

const DailyReviewSettings = ({ onClose, onSave }) => {
  const { preferences, updatePreference, cards } = useFlashcards();
  
  const [settings, setSettings] = useState({
    dailyCardLimit: preferences.dailyCardLimit || 20,
    selectionMode: preferences.selectionMode || 'auto', // 'auto', 'manual', 'both'
    autoIncludeStudied: preferences.autoIncludeStudied !== undefined ? preferences.autoIncludeStudied : true,
    manualSelections: preferences.manualSelections || {
      ludus: {
        enabled: false,
        allChapters: false,
        selectedChapters: []
      },
      caesar: {
        enabled: false,
        allChapters: false,
        selectedChapters: []
      },
      cicero: {
        enabled: false,
        allChapters: false,
        selectedChapters: []
      }
    },
    prioritizeDue: preferences.prioritizeDue !== undefined ? preferences.prioritizeDue : true,
    includeNewCards: preferences.includeNewCards !== undefined ? preferences.includeNewCards : false,
    studyMoreIncrement: preferences.studyMoreIncrement || 10
  });

  // Get available chapters for each curriculum
  const availableChapters = useMemo(() => {
    const ludusCards = cards.filter(card => card.curriculum === 'LUDUS');
    const ludusGroups = groupCardsByLesson(ludusCards);
    
    return {
      ludus: Object.keys(ludusGroups).map(lesson => ({
        id: parseInt(lesson),
        name: `Chapter ${lesson}`,
        cardCount: ludusGroups[lesson].length
      })).sort((a, b) => a.id - b.id),
      caesar: [], // Will be populated when available
      cicero: []  // Will be populated when available
    };
  }, [cards]);

  const handleSave = () => {
    // Save each setting
    Object.keys(settings).forEach(key => {
      updatePreference(key, settings[key]);
    });
    onSave();
    onClose();
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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

  const toggleChapter = (curriculum, chapterId) => {
    setSettings(prev => {
      const currentChapters = prev.manualSelections[curriculum].selectedChapters;
      const newChapters = currentChapters.includes(chapterId)
        ? currentChapters.filter(id => id !== chapterId)
        : [...currentChapters, chapterId];
      
      return {
        ...prev,
        manualSelections: {
          ...prev.manualSelections,
          [curriculum]: {
            ...prev.manualSelections[curriculum],
            selectedChapters: newChapters,
            allChapters: newChapters.length === availableChapters[curriculum].length
          }
        }
      };
    });
  };

  const toggleAllChapters = (curriculum) => {
    const allChapters = availableChapters[curriculum].map(ch => ch.id);
    const currentlyAll = settings.manualSelections[curriculum].allChapters;
    
    updateManualSelection(curriculum, 'selectedChapters', currentlyAll ? [] : allChapters);
    updateManualSelection(curriculum, 'allChapters', !currentlyAll);
  };

  const getSelectionSummary = () => {
    const { selectionMode, autoIncludeStudied, manualSelections } = settings;
    
    let summary = [];
    
    if (selectionMode === 'auto' || selectionMode === 'both') {
      if (autoIncludeStudied) {
        summary.push('Previously studied cards');
      }
    }
    
    if (selectionMode === 'manual' || selectionMode === 'both') {
      Object.keys(manualSelections).forEach(curriculum => {
        const selection = manualSelections[curriculum];
        if (selection.enabled) {
          if (selection.allChapters) {
            summary.push(`All ${curriculum.toUpperCase()} chapters`);
          } else if (selection.selectedChapters.length > 0) {
            summary.push(`${curriculum.toUpperCase()}: ${selection.selectedChapters.length} chapters`);
          }
        }
      });
    }
    
    return summary.length > 0 ? summary.join(', ') : 'No selection criteria set';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Daily Review Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* Daily Card Limit */}
          <div className="setting-group">
            <label className="setting-label">Cards per Daily Review</label>
            <div className="card-limit-options">
              {[10, 15, 20, 25, 30, 40, 50].map(limit => (
                <button
                  key={limit}
                  className={`limit-btn ${settings.dailyCardLimit === limit ? 'active' : ''}`}
                  onClick={() => updateSetting('dailyCardLimit', limit)}
                >
                  {limit}
                </button>
              ))}
            </div>
            <div className="custom-limit">
              <label>Custom: </label>
              <input
                type="number"
                value={settings.dailyCardLimit}
                onChange={e => updateSetting('dailyCardLimit', parseInt(e.target.value) || 20)}
                min="5"
                max="100"
                className="custom-input"
              />
            </div>
          </div>

          {/* Selection Mode */}
          <div className="setting-group">
            <label className="setting-label">Card Selection Mode</label>
            <div className="selection-mode-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="selectionMode"
                  value="auto"
                  checked={settings.selectionMode === 'auto'}
                  onChange={e => updateSetting('selectionMode', e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="radio-content">
                  <strong>Automatic Only</strong>
                  <p>System automatically includes previously studied cards</p>
                </div>
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  name="selectionMode"
                  value="manual"
                  checked={settings.selectionMode === 'manual'}
                  onChange={e => updateSetting('selectionMode', e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="radio-content">
                  <strong>Manual Only</strong>
                  <p>You choose specific chapters/sets to include</p>
                </div>
              </label>
              
              <label className="radio-label">
                <input
                  type="radio"
                  name="selectionMode"
                  value="both"
                  checked={settings.selectionMode === 'both'}
                  onChange={e => updateSetting('selectionMode', e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="radio-content">
                  <strong>Automatic + Manual</strong>
                  <p>Combine automatic selection with manual choices</p>
                </div>
              </label>
            </div>
          </div>

          {/* Automatic Settings */}
          {(settings.selectionMode === 'auto' || settings.selectionMode === 'both') && (
            <div className="setting-group auto-settings">
              <label className="setting-label">🤖 Automatic Selection</label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoIncludeStudied}
                  onChange={e => updateSetting('autoIncludeStudied', e.target.checked)}
                />
                <span className="checkmark"></span>
                Include all previously studied cards (recommended)
              </label>
            </div>
          )}

          {/* Manual Settings */}
          {(settings.selectionMode === 'manual' || settings.selectionMode === 'both') && (
            <div className="setting-group manual-settings">
              <label className="setting-label">✋ Manual Selection</label>
              
              {/* LUDUS Selection */}
              <div className="curriculum-selection">
                <div className="curriculum-header">
                  <label className="checkbox-label curriculum-toggle">
                    <input
                      type="checkbox"
                      checked={settings.manualSelections.ludus.enabled}
                      onChange={e => updateManualSelection('ludus', 'enabled', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <strong>LUDUS (680 words)</strong>
                  </label>
                </div>
                
                {settings.manualSelections.ludus.enabled && (
                  <div className="chapter-selection">
                    <div className="chapter-controls">
                      <button
                        className={`toggle-all-btn ${settings.manualSelections.ludus.allChapters ? 'active' : ''}`}
                        onClick={() => toggleAllChapters('ludus')}
                      >
                        {settings.manualSelections.ludus.allChapters ? 'Deselect All' : 'Select All'} Chapters
                      </button>
                      <span className="chapter-count">
                        {settings.manualSelections.ludus.selectedChapters.length} of {availableChapters.ludus.length} selected
                      </span>
                    </div>
                    
                    <div className="chapters-grid">
                      {availableChapters.ludus.map(chapter => (
                        <label key={chapter.id} className="chapter-checkbox">
                          <input
                            type="checkbox"
                            checked={settings.manualSelections.ludus.selectedChapters.includes(chapter.id)}
                            onChange={() => toggleChapter('ludus', chapter.id)}
                          />
                          <span className="chapter-info">
                            <span className="chapter-name">{chapter.name}</span>
                            <span className="chapter-count-text">({chapter.cardCount} words)</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CAESAR Selection (Coming Soon) */}
              <div className="curriculum-selection disabled">
                <div className="curriculum-header">
                  <label className="checkbox-label curriculum-toggle">
                    <input type="checkbox" disabled />
                    <span className="checkmark"></span>
                    <strong>CAESAR (Coming Soon)</strong>
                  </label>
                </div>
              </div>

              {/* CICERO Selection (Coming Soon) */}
              <div className="curriculum-selection disabled">
                <div className="curriculum-header">
                  <label className="checkbox-label curriculum-toggle">
                    <input type="checkbox" disabled />
                    <span className="checkmark"></span>
                    <strong>CICERO (Coming Soon)</strong>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Selection Summary */}
          <div className="setting-group">
            <label className="setting-label">📋 Current Selection</label>
            <div className="selection-summary">
              {getSelectionSummary()}
            </div>
          </div>

          {/* Card Selection Priority */}
          <div className="setting-group">
            <label className="setting-label">Card Selection Priority</label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.prioritizeDue}
                onChange={e => updateSetting('prioritizeDue', e.target.checked)}
              />
              <span className="checkmark"></span>
              Prioritize cards due for review
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.includeNewCards}
                onChange={e => updateSetting('includeNewCards', e.target.checked)}
              />
              <span className="checkmark"></span>
              Include new cards if not enough cards available
            </label>
          </div>

          {/* Study More Increment */}
          <div className="setting-group">
            <label className="setting-label">"Study More" Additional Cards</label>
            <div className="card-limit-options">
              {[5, 10, 15, 20].map(increment => (
                <button
                  key={increment}
                  className={`limit-btn ${settings.studyMoreIncrement === increment ? 'active' : ''}`}
                  onClick={() => updateSetting('studyMoreIncrement', increment)}
                >
                  +{increment}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyReviewSettings; 