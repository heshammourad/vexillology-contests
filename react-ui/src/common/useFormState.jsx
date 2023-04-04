import { useState } from 'react';

const generateInitialState = (fields) => fields.reduce((acc, cur) => {
  acc[cur] = {
    error: null,
    focus: false,
    touch: false,
    value: '',
  };
  return acc;
}, {});

const useFormState = (fields) => {
  const [state, setState] = useState(generateInitialState(fields));

  const updateState = (field, key, value) => {
    setState((prevState) => ({ ...prevState, [field]: { ...prevState[field], [key]: value } }));
  };

  const resetState = () => {
    setState(generateInitialState(fields));
  };

  return [state, updateState, resetState];
};

export default useFormState;
