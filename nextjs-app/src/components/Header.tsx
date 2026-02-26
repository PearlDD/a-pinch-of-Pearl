'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/types';
import styles from './Header.module.css';

interface HeaderProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLogoClick: () => void;
}

export default function Header({
  currentFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onLogoClick,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a className={styles.logo} onClick={onLogoClick}>
          A Pinch of <span>Pearl</span>
        </a>

        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>&#128269;</span>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <nav className={styles.nav}>
          <button
            className={currentFilter === 'all' ? styles.active : ''}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={currentFilter === cat ? styles.active : ''}
              onClick={() => onFilterChange(cat)}
            >
              {cat}
            </button>
          ))}
          <button
            className={`${styles.favBtn} ${currentFilter === 'favorites' ? styles.activeFav : ''}`}
            onClick={() => onFilterChange('favorites')}
          >
            &#10084; Favorites
          </button>
        </nav>

        <Link href="/admin/login" className={styles.pearlMode}>
          &#128274; Pearl Mode
        </Link>
      </div>
    </header>
  );
}
