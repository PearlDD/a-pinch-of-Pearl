'use client';

import { useState } from 'react';
import styles from './ListInput.module.css';

interface ListInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  numbered?: boolean;
}

export default function ListInput({ items, onChange, placeholder = 'Add an item...', numbered = false }: ListInputProps) {
  const [input, setInput] = useState('');

  const addItem = () => {
    const val = input.trim();
    if (!val) return;
    onChange([...items, val]);
    setInput('');
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className={styles.listInput}>
      {items.length > 0 && (
        <ul className={styles.itemList}>
          {items.map((item, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.itemText}>
                {numbered && <span className={styles.itemNum}>{i + 1}.</span>}
                {item}
              </span>
              <div className={styles.itemActions}>
                <button type="button" className={styles.moveBtn} onClick={() => moveUp(i)} disabled={i === 0} title="Move up">&uarr;</button>
                <button type="button" className={styles.moveBtn} onClick={() => moveDown(i)} disabled={i === items.length - 1} title="Move down">&darr;</button>
                <button type="button" className={styles.deleteBtn} onClick={() => removeItem(i)} title="Remove">&times;</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.addRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={styles.addInput}
        />
        <button type="button" className={styles.addBtn} onClick={addItem} disabled={!input.trim()}>
          + Add
        </button>
      </div>
    </div>
  );
}
