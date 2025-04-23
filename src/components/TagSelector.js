import React, { useState, useRef, useEffect } from 'react';

const TagSelector = ({ allTags, selectedTags, setSelectedTags }) => {
  const [tagInput, setTagInput] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const addTag = (tag = tagInput) => {
    const trimmed = tag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const filteredTags = allTags
    .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(tag))
    .sort((a, b) => a.localeCompare(b));

  // 外部クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="mt-3">
      <div className="d-flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag, index) => (
          <span
            key={index}
            className="badge bg-light text-dark border d-flex align-items-center"
            style={{ padding: '0.5em 0.75em', fontSize: '0.9em' }}
          >
            {tag}
            <button
              type="button"
              className="btn-close btn-sm ms-2"
              aria-label="Remove"
              onClick={() => removeTag(tag)}
              style={{ fontSize: '0.6em' }}
            />
          </span>
        ))}
      </div>

      <div className="position-relative">
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="タグを入力して Enter"
        />

        {isDropdownOpen && filteredTags.length > 0 && (
          <ul
            ref={dropdownRef}
            className="list-group position-absolute w-100"
            style={{ zIndex: 1000 }}
          >
            {filteredTags.map((tag, index) => (
              <li
                key={index}
                className="list-group-item list-group-item-action"
                onClick={() => {
                  addTag(tag);
                  setIsDropdownOpen(true); // インプットは開いたまま
                  inputRef.current?.focus(); // フォーカスを戻す
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
