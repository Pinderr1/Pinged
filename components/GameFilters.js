import React from 'react';
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
