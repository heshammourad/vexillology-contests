import Dialog from '@material-ui/core/Dialog';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';

import { Header, PageContainer } from '../../components';

const RULES = [
  {
    name: 'Submission limit',
    rule: (
      <>
        You may submit up to
        {' '}
        <Emphasis variant="high">two</Emphasis>
        {' '}
        entries to each contest.
        {' '}
        <Emphasis variant="italic">In the event</Emphasis>
        {' '}
        you submit more than two designs,
        moderators will reach out via Reddit Direct Messages for clarification.
        {' '}
        <Emphasis variant="italic">In the event</Emphasis>
        {' '}
        clarification is not received, the two
        most recent entries will be accepted, while all others will be rejected.
      </>
    ),
  },
  {
    name: 'Technical limit',
    rule: (
      <>
        Flags should be at most
        {' '}
        <Emphasis>3000 pixels wide</Emphasis>
        . They should also be flat and
        not textured.
      </>
    ),
  },
  {
    name: 'Sharing prohibition',
    rule: (
      <>
        <Emphasis variant="high">Do not</Emphasis>
        {' '}
        post your flags elsewhere on the r/vexillology
        subreddit before the winners are announced. Don’t post it as another thread. Don’t post it
        as a response to the contest announcement thread. The contest aims to keep the submissions
        anonymous until results are announced, so as to avoid a popularity contest.
      </>
    ),
  },
  {
    name: 'Attribution requirement',
    rule: (
      <>
        If you take components from public domain, or other sources that are not your own work,
        please attribute them in the description portion of your submission.
      </>
    ),
  },
  {
    name: 'Sincerity requirement',
    rule: (
      <>
        Your flag design should be a sincere attempt to respond to the prompt. It should not be
        designed to troll.
      </>
    ),
  },
  {
    name: 'Deadline',
    important: true,
    rule: (
      <>
        Entries are generally due by the
        {' '}
        <Emphasis>18th</Emphasis>
        {' '}
        of the month, unless otherwise
        specified in the contest prompt.
      </>
    ),
  },
];

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(3),
  },
  rule: {
    marginBottom: theme.spacing(1),
  },
  ruleNumber: {
    fontStyle: 'italic',
  },
  // Emphasis classes
  /* eslint-disable mui-unused-classes/unused-classes */
  'emphasis-default': {
    fontWeight: 'bold',
  },
  'emphasis-high': {
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  'emphasis-italic': {
    fontStyle: 'italic',
  },
  /* eslint-enable mui-unused-classes/unused-classes */
}));

function ContestRules() {
  const classes = useStyles();
  return (
    <Dialog fullScreen open>
      <Header position="static" to="/submission">
        Contest Rules
      </Header>
      <PageContainer className={classes.container}>
        You will be asked to confirm you followed each rule upon submission. Repeated rule violators
        will be banned from the contest for the rest of the year.
        <ul>
          {RULES.map(({ important, name, rule }, index) => (
            <Rule key={name} important={important} name={name} number={index + 1}>
              {rule}
            </Rule>
          ))}
        </ul>
      </PageContainer>
    </Dialog>
  );
}

function Rule({ children, name, number }) {
  const classes = useStyles();
  return (
    <li className={[classes.rule]}>
      <span className={classes.ruleNumber}>
        Rule
        {' '}
        {number}
        :
        {' '}
        {name}
      </span>
      {' '}
      -
      {' '}
      {children}
    </li>
  );
}

Rule.propTypes = {
  children: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  number: PropTypes.number.isRequired,
};

function Emphasis({ children, variant }) {
  const classes = useStyles();
  return <span className={classes[`emphasis-${variant}`]}>{children}</span>;
}

Emphasis.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'high', 'italic']),
};

Emphasis.defaultProps = {
  variant: 'default',
};

export default ContestRules;
