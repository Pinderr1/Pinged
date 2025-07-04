import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const FilterProvider = ({ children }) => {
  const [location, setLocation] = useState('');
  const [ageRange, setAgeRange] = useState([18, 99]);
  const [interests, setInterests] = useState([]);
  const [gender, setGender] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  return (
    <FilterContext.Provider
      value={{
        location,
        ageRange,
        interests,
        gender,
        verifiedOnly,
        setLocationFilter: setLocation,
        setAgeRangeFilter: setAgeRange,
        setInterestsFilter: setInterests,
        setGenderFilter: setGender,
        setVerifiedFilter: setVerifiedOnly,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => useContext(FilterContext);
