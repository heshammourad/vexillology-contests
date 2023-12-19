/**
 * Fetch contestId from url
 */

import { useParams } from 'react-router-dom';

const useContestId = () => {
  const { contestId } = useParams();

  return contestId;
};

export default useContestId;
