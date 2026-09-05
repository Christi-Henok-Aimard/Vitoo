import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface SearchableDropdownProps {
  items: { id: string; label: string; sublabel?: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  items,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyMessage = 'Aucun résultat',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.sublabel?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItem = items.find((item) => item.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="searchable-dropdown">
      <button
        type="button"
        className={`searchable-dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`searchable-dropdown-value ${selectedItem ? '' : 'placeholder'}`}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <div className="searchable-dropdown-actions">
          {value && (
            <span className="searchable-dropdown-clear" onClick={handleClear}>
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
        </div>
      </button>

      {isOpen && (
        <div className="searchable-dropdown-menu">
          <div className="searchable-dropdown-search">
            <Search size={14} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="searchable-dropdown-list">
            {filteredItems.length === 0 ? (
              <div className="searchable-dropdown-empty">{emptyMessage}</div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`searchable-dropdown-item ${item.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(item.id)}
                >
                  <div className="searchable-dropdown-item-content">
                    <span className="searchable-dropdown-item-label">{item.label}</span>
                    {item.sublabel && (
                      <span className="searchable-dropdown-item-sublabel">{item.sublabel}</span>
                    )}
                  </div>
                  {item.id === value && <Check size={14} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
