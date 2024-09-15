/**
 * Fetch contestId from url
 */

import { useParams } from 'react-router-dom';

const useEntryId = () => {
  const { entryId } = useParams();

  return entryId;
};

export default useEntryId;
