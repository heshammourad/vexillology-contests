import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import PropTypes from 'prop-types';

function PageContainer({
  children, className, fixed, maxWidth,
}) {
  return (
    <Container className={className} fixed={fixed} maxWidth={maxWidth}>
      <Box marginBottom={3}>{children}</Box>
    </Container>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  fixed: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['lg', 'md', 'sm', 'xl', 'xs', false]),
};

PageContainer.defaultProps = {
  className: null,
  fixed: false,
  maxWidth: 'lg',
};

export default PageContainer;
