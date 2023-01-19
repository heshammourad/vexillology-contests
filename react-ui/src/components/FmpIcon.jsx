import SvgIcon from '@material-ui/core/SvgIcon';

import { ReactComponent as FmpLogo } from '../images/FMP.svg';

function FmpIcon(props) {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SvgIcon {...props}>
      <FmpLogo />
    </SvgIcon>
  );
}

export default FmpIcon;
