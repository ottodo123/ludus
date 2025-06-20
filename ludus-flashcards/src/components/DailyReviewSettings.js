import React, { useState } from 'react';
import { useFlashcards } from '../contexts/FlashcardContext';

const DailyReviewSettings = ({ onClose, onSave }) => {
  const { preferences, updatePreference } = useFlashcards();
  
  const [settings, setSettings] = useState({
    dailyCardLimit: preferences.dailyCardLimit || 20,
    includeStudySets: preferences.includeStudySets || {
      ludus: true,
      caesar: false,
      cicero: false
    },
    prioritizeDue: preferences.prioritizeDue !== undefined ? preferences.prioritizeDue : true,
    includeNewCards: preferences.includeNewCards !== undefined ? preferences.includeNewCards : false,
    studyMoreIncrement: preferences.studyMoreIncrement || 10
  });

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

  const updateStudySet = (studySet, included) => {
    setSettings(prev => ({
      ...prev,
      includeStudySets: {
        ...prev.includeStudySets,
        [studySet]: included
      }
    }));
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

          {/* Study Sets Inclusion */}
          <div className="setting-group">
            <label className="setting-label">Include Study Sets</label>
            <div className="study-sets">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.includeStudySets.ludus}
                  onChange={e => updateStudySet('ludus', e.target.checked)}
                />
                <span className="checkmark"></span>
                LUDUS (680 words)
              </label>
              <label className="checkbox-label disabled">
                <input
                  type="checkbox"
                  checked={settings.includeStudySets.caesar}
                  onChange={e => updateStudySet('caesar', e.target.checked)}
                  disabled
                />
                <span className="checkmark"></span>
                CAESAR (Coming Soon)
              </label>
              <label className="checkbox-label disabled">
                <input
                  type="checkbox"
                  checked={settings.includeStudySets.cicero}
                  onChange={e => updateStudySet('cicero', e.target.checked)}
                  disabled
                />
                <span className="checkmark"></span>
                CICERO (Coming Soon)
              </label>
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
              Include new cards if not enough due cards
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