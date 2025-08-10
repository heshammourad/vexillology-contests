/**
 * Sponsor FlagMaker & Print
 */

import SvgIcon from '@material-ui/core/SvgIcon';

import { ReactComponent as FmpLogo } from '../images/FMP.svg';

const FmpLink = 'https://flagmaker-print.com/?utm_source=https%3A%2F%2Fwww.reddit.com%2Fr%2Fvexillology%2F&utm_medium=link&utm_campaign=r_vexilology&utm_id=R+%2F+Vexilology+Subreddit+Partnership&utm_term=flag+maker%2C+custom+flags%2C+create+flag%2C+flag+designer%2C+vexillology';

const FmpText = 'Powered by Flagmaker & Print ~ the easiest way to design and print custom flags';

function FmpIcon(props) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SvgIcon {...props}>
      <FmpLogo alt={`${FmpText} online`} />
    </SvgIcon>
  );
}

export { FmpIcon, FmpLink, FmpText };
