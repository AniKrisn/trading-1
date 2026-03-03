import { useState } from 'react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey } from '@/narrative/llmClient';

export function ApiKeyInput() {
  const [hasKey, setHasKey] = useState(() => !!getStoredApiKey());
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (inputValue.trim()) {
      setStoredApiKey(inputValue.trim());
      setHasKey(true);
      setInputValue('');
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setHasKey(false);
  };

  if (!isOpen) {
    return (
      <div className="api-key-status">
        <button className="api-key-btn" onClick={() => setIsOpen(true)}>
          {hasKey ? 'api key set' : 'set api key'}
        </button>
        {hasKey && (
          <button className="api-key-btn api-key-clear" onClick={handleClear}>
            clear
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="api-key-input">
      <input
        type="password"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
        placeholder="sk-ant-..."
        className="api-key-field"
        autoFocus
      />
      <button className="api-key-btn" onClick={handleSave}>save</button>
      <button className="api-key-btn" onClick={() => setIsOpen(false)}>cancel</button>
    </div>
  );
}
