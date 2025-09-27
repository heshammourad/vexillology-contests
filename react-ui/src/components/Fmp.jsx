/**
 * Sponsor FlagMaker & Print
 */

import SvgIcon from '@material-ui/core/SvgIcon';

import { ReactComponent as FmpLogo } from '../images/FMP.svg';

const FMP_LINK = 'https://flagmaker-print.com/s/1cc47b';

const FMP_TEXT = 'Powered by Flagmaker & Print ~ the easiest way to design and print custom flags';

function FmpIcon(props) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SvgIcon {...props}>
      <FmpLogo alt={`${FMP_TEXT} online`} />
    </SvgIcon>
  );
}

export { FmpIcon, FMP_LINK, FMP_TEXT };
