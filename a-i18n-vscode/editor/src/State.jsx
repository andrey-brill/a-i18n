
import React, { useContext } from 'react';


const State = React.createContext(null);

export const useContextState = () => useContext(State);

export default State;