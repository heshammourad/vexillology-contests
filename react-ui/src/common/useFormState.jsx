import { useState } from 'react';

const useFormState = (fields) => {
  const [state, setState] = useState(
    fields.reduce((acc, cur) => {
      acc[cur] = {
        error: null,
        focus: false,
        touch: false,
        value: '',
      };
      return acc;
    }, {}),
  );

  const updateState = (field, key, value) => {
    setState((prevState) => ({ ...prevState, [field]: { ...prevState[field], [key]: value } }));
  };

  return [state, updateState];
};

export default useFormState;
