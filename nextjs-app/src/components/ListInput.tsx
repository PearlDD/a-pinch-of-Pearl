'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styles from './ListInput.module.css';

export interface ListInputHandle {
  /** Commit the visible edit and pending addition, and return that exact list. */
  commit: () => string[];
}
interface ListInputProps {
  items: string[];
  onChange: (items: string[]) => void;
  onDraftChange?: () => void;
  itemLabel?: string;
  placeholder?: string;
  numbered?: boolean;
}

const ListInput = forwardRef<ListInputHandle, ListInputProps>(function ListInput({ items, onChange, onDraftChange, itemLabel = 'item', placeholder = 'Add an item...', numbered = false }, ref) {
  const [input, setInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);
  const currentItems = useRef(items);
  const draft = useRef({ input: '', index: null as number | null, value: '' });

  const clearDraft = () => {
    draft.current = { input: '', index: null, value: '' };
    setInput(''); setEditingIndex(null); setEditValue('');
  };
  useEffect(() => {
    // External loads/imports replace the draft too; our own publishes already
    // updated this ref synchronously and do not disturb editing/reordering.
    if (currentItems.current !== items) { currentItems.current = items; clearDraft(); }
  }, [items]);
  useEffect(() => {
    if (editingIndex !== null && editRef.current) {
      editRef.current.focus(); editRef.current.style.height = 'auto';
      editRef.current.style.height = editRef.current.scrollHeight + 'px';
    }
  }, [editingIndex]);

  const publish = (next: string[]) => {
    // The caller can read immediately, even before React flushes onBlur state.
    currentItems.current = next; onChange(next);
  };
  const commit = () => {
    const next = [...currentItems.current];
    const { index, value, input: pending } = draft.current;
    if (index !== null && index < next.length) next[index] = value.trim();
    if (pending.trim()) next.push(pending.trim());
    const committed = next.filter(item => item.trim());
    publish(committed); clearDraft();
    return committed;
  };
  useImperativeHandle(ref, () => ({ commit }));

  const saveEdit = () => {
    const { index, value } = draft.current;
    if (index === null) return;
    const next = [...currentItems.current]; next[index] = value.trim();
    draft.current.index = null; draft.current.value = '';
    setEditingIndex(null); setEditValue('');
    publish(next.filter(item => item.trim()));
  };
  const cancelEdit = () => { draft.current.index = null; draft.current.value = ''; setEditingIndex(null); setEditValue(''); };
  const removeItem = (index: number) => {
    publish(currentItems.current.filter((_, i) => i !== index));
    if (draft.current.index === index) cancelEdit();
    else if (draft.current.index !== null && draft.current.index > index) {
      draft.current.index--; setEditingIndex(draft.current.index);
    }
  };
  const move = (from: number, to: number) => {
    const next = [...currentItems.current];
    if (to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    if (draft.current.index === from) draft.current.index = to;
    else if (draft.current.index === to) draft.current.index = from;
    setEditingIndex(draft.current.index); publish(next);
  };
  const startEditing = (index: number) => {
    saveEdit();
    draft.current.index = index; draft.current.value = currentItems.current[index];
    setEditingIndex(index); setEditValue(draft.current.value);
  };

  return <div className={styles.listInput}>
    {items.length > 0 && <ul className={styles.itemList}>
      {items.map((item, i) => <li key={i} className={styles.item}>
        {editingIndex === i ? <div className={styles.editRow}>
          {numbered && <span className={styles.itemNum}>{i + 1}.</span>}
          <textarea ref={editRef} aria-label={`Edit ${itemLabel} ${i + 1}`} value={editValue} rows={1} className={styles.editInput}
            onChange={e => { draft.current.value = e.target.value; setEditValue(e.target.value); onDraftChange?.(); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } else if (e.key === 'Escape') cancelEdit(); }}
            onBlur={saveEdit} />
        </div> : <span className={styles.itemText} onClick={() => startEditing(i)} title="Click to edit">
          {numbered && <span className={styles.itemNum}>{i + 1}.</span>}{item}
        </span>}
        <div className={styles.itemActions}>
          <button type="button" className={styles.moveBtn} onMouseDown={e => e.preventDefault()} onClick={() => move(i, i - 1)} disabled={i === 0} title="Move up" aria-label={`Move ${itemLabel} ${i + 1} up`}>&uarr;</button>
          <button type="button" className={styles.moveBtn} onMouseDown={e => e.preventDefault()} onClick={() => move(i, i + 1)} disabled={i === items.length - 1} title="Move down" aria-label={`Move ${itemLabel} ${i + 1} down`}>&darr;</button>
          <button type="button" className={styles.deleteBtn} onMouseDown={e => e.preventDefault()} onClick={() => removeItem(i)} title="Remove" aria-label={`Remove ${itemLabel} ${i + 1}`}>&times;</button>
        </div>
      </li>)}
    </ul>}
    <div className={styles.addRow}>
      <input type="text" aria-label={`New ${itemLabel}`} value={input} placeholder={placeholder} className={styles.addInput}
        onChange={e => { draft.current.input = e.target.value; setInput(e.target.value); onDraftChange?.(); }}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }} />
      <button type="button" className={styles.addBtn} onClick={commit} disabled={!input.trim()}>+ Add</button>
    </div>
  </div>;
});

export default ListInput;
