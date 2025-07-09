import React from 'react';
import PropTypes from 'prop-types';
import SearchInput from './SearchInput';
import FilterTabs from './FilterTabs';
import CategoryChips from './CategoryChips';

export default function GameFilters({
  search,
  setSearch,
  filter,
  setFilter,
  category,
  setCategory,
  categories,
}) {
  return (
    <>
      <SearchInput search={search} setSearch={setSearch} />
      <FilterTabs filter={filter} setFilter={setFilter} />
      <CategoryChips
        categories={categories}
        category={category}
        setCategory={setCategory}
      />
    </>
  );
}

GameFilters.propTypes = {
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
  filter: PropTypes.string.isRequired,
  setFilter: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  setCategory: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
};
