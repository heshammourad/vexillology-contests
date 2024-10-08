import PropTypes from 'prop-types';

import ExternalLink from './ExternalLink';

function RedditUserAttribution({ showUsernameOnly, user }) {
  const redditUser = `/u/${user}`;
  return (
    <div>
      {!showUsernameOnly && 'by '}
      <ExternalLink href={`https://reddit.com${redditUser}`}>
        {redditUser}
      </ExternalLink>
    </div>
  );
}

RedditUserAttribution.propTypes = {
  showUsernameOnly: PropTypes.bool,
  user: PropTypes.string.isRequired,
};

RedditUserAttribution.defaultProps = {
  showUsernameOnly: false,
};

export default RedditUserAttribution;
