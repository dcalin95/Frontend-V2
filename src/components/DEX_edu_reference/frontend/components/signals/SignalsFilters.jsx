/**
 * Signals filters — behavior unchanged (local state + callbacks only).
 * Search uses native input in a flex row (no absolute icon) to avoid vertical clipping.
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui';
import '../../styles/components/signals-filters.css';

const SignalsFilters = ({ onFilterChange, onSearchChange }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (onSearchChange) onSearchChange(value);
  };

  const handleStatusChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    if (onFilterChange) {
      onFilterChange({
        status: value,
        type: typeFilter,
        sortBy
      });
    }
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    setTypeFilter(value);
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter,
        type: value,
        sortBy
      });
    }
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter,
        type: typeFilter,
        sortBy: value
      });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('newest');
    if (onSearchChange) onSearchChange('');
    if (onFilterChange) {
      onFilterChange({
        status: 'all',
        type: 'all',
        sortBy: 'newest'
      });
    }
  };

  const hasActiveFilters = search || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'newest';

  return (
    <div className="signals-filters signals-filters--bar" aria-label="Filter signals">
      <div className="signals-filters__row">
        <div className="signals-filters__grid">
          <div className="signals-search">
            <label className="signals-filter-label" htmlFor="dex-signals-search">
              Search
            </label>
            <div className="signals-search__box">
              <span className="signals-search__ico" aria-hidden>
                <Search size={18} strokeWidth={2} />
              </span>
              <input
                id="dex-signals-search"
                name="signals-search"
                type="search"
                className="signals-search__input"
                placeholder="Search symbols or notes…"
                value={search}
                onChange={handleSearchChange}
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
          </div>
          <div className="signals-filter-group">
            <label className="signals-filter-label" htmlFor="dex-signals-status">
              Status
            </label>
            <select
              id="dex-signals-status"
              className="signals-filter-select"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="executed">Executed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="signals-filter-group">
            <label className="signals-filter-label" htmlFor="dex-signals-type">
              Type
            </label>
            <select
              id="dex-signals-type"
              className="signals-filter-select"
              value={typeFilter}
              onChange={handleTypeChange}
            >
              <option value="all">All types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="swap">Swap</option>
            </select>
          </div>
          <div className="signals-filter-group">
            <label className="signals-filter-label" htmlFor="dex-signals-sort">
              Sort by
            </label>
            <select
              id="dex-signals-sort"
              className="signals-filter-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price-high">Price: high to low</option>
              <option value="price-low">Price: low to high</option>
              <option value="confidence">Decision score: high to low</option>
            </select>
          </div>
        </div>
        {hasActiveFilters ? (
          <div className="signals-filters__clear">
            <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters} title="Reset filters">
              Clear
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SignalsFilters;
