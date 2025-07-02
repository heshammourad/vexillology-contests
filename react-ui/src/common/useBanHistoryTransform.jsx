import { useMemo } from 'react';

/**
 * Hook to transform ban history data by converting date strings to Date objects
 * @param {Object} data - The API response data containing users with history
 * @returns {Object} - Transformed data with Date objects
 */
const useBanHistoryTransform = (data) => useMemo(() => {
  if (!data?.users) {
    return data;
  }

  console.log(data);

  return {
    ...data,
    users: data.users.map((user) => ({
      ...user,
      history: user.history.map((action) => ({
        ...action,
        createdDate: new Date(action.createdDate),
        startDate: action.startDate ? new Date(action.startDate) : null,
        endDate: action.endDate ? new Date(action.endDate) : null,
        liftedDate: action.liftedDate ? new Date(action.liftedDate) : null,
        actionId: String(action.actionId),
      })),
    })),
  };
}, [data]);

export default useBanHistoryTransform;
