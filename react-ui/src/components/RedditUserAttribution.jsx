import PropTypes from 'prop-types';

import ExternalLink from './ExternalLink';

const RedditUserAttribution = ({ user }) => (
  <div>
    by
    {' '}
    <ExternalLink href={`https://reddit.com${user}`}>{user}</ExternalLink>
  </div>
);

RedditUserAttribution.propTypes = {
  user: PropTypes.string.isRequired,
};

export default RedditUserAttribution;
