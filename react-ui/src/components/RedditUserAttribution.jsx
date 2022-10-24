import PropTypes from 'prop-types';

import ExternalLink from './ExternalLink';

function RedditUserAttribution({ user }) {
  return (
    <div>
      by
      {' '}
      <ExternalLink href={`https://reddit.com${user}`}>{user}</ExternalLink>
    </div>
  );
}

RedditUserAttribution.propTypes = {
  user: PropTypes.string.isRequired,
};

export default RedditUserAttribution;
