import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [location, setLocation] = useState('');
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [interests, setInterests] = useState([]);

  return (
    <FilterContext.Provider
      value={{
        location,
        ageRange,
        interests,
        setLocationFilter: setLocation,
        setAgeRangeFilter: setAgeRange,
        setInterestsFilter: setInterests,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
