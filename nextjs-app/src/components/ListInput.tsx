'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ListInput.module.css';

interface ListInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  numbered?: boolean;
}

export default function ListInput({ items, onChange, placeholder = 'Add an item...', numbered = false }: ListInputProps) {
  const [input, setInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editRef.current) {
      editRef.current.focus();
    }
  }, [editingIndex]);

  const addItem = () => {
    const val = input.trim();
    if (!val) return;
    onChange([...items, val]);
    setInput('');
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onChange(newItems);
    if (editingIndex === index) setEditingIndex(index - 1);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    onChange(newItems);
    if (editingIndex === index) setEditingIndex(index + 1);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const val = editValue.trim();
    if (val) {
      const newItems = [...items];
      newItems[editingIndex] = val;
      onChange(newItems);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
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
              {editingIndex === i ? (
                <div className={styles.editRow}>
                  {numbered && <span className={styles.itemNum}>{i + 1}.</span>}
                  <input
                    ref={editRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={saveEdit}
                    className={styles.editInput}
                  />
                </div>
              ) : (
                <span className={styles.itemText} onClick={() => startEditing(i)} title="Click to edit">
                  {numbered && <span className={styles.itemNum}>{i + 1}.</span>}
                  {item}
                </span>
              )}
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
