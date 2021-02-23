import PropTypes from 'prop-types';
import { useEffect } from 'react';
import ReactGA from 'react-ga';

ReactGA.initialize('G-0T7BRN2XYS');

export default (WrappedComponent, options = {}) => {
  const trackPage = (page) => {
    ReactGA.set({
      page,
      ...options,
    });
    ReactGA.pageview(page);
  };

  const HOC = (props) => {
    const {
      location: { pathname },
    } = props;
    useEffect(() => trackPage(pathname), [pathname]);

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <WrappedComponent {...props} />;
  };

  HOC.propTypes = {
    location: PropTypes.shape({
      pathname: PropTypes.string,
    }).isRequired,
  };

  return HOC;
};
