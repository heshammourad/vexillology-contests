# Fraud Detection System

## Overview

The fraud detection system implements a comprehensive heuristic scoring algorithm to detect potential voter fraud in vexillology contests. The system analyzes 8 different metrics and provides a single score between 0-100 indicating the likelihood of malicious behavior.

## Scoring Metrics

### 1. Account Age (Weight: 15)

- **Suspicious**: New accounts (< 30 days)
- **Good**: Established accounts (> 1 year)
- **Score**: Linear scale from 30 days (100) to 365 days (0)

### 2. Vote Count (Weight: 10)

- **Suspicious**: Low participation (< 20% of entries)
- **Good**: High participation (> 80% of entries)
- **Score**: Linear scale from 20% (100) to 80% (0)

### 3. Single Fives (Weight: 20)

- **Suspicious**: Giving 5s to only one account
- **Good**: Balanced voting patterns
- **Score**: Linear scale from 20% fives (0) to 80% fives (100)

### 4. Random Scoring (Weight: 15)

- **Suspicious**: Large deviations from average scores
- **Good**: Scores close to contest averages
- **Score**: Based on average deviation from entry averages

### 5. Poor Best Flags (Weight: 15)

- **Suspicious**: Scoring top-ranked entries poorly
- **Good**: Fair scoring of high-quality entries
- **Score**: Based on average score given to top 3 entries

### 6. Vote Timing (Weight: 10)

- **Suspicious**: Very rapid voting (< 10 seconds between votes)
- **Good**: Natural voting pace (> 5 minutes between votes)
- **Score**: Based on average time between votes

### 7. Voting Zeros (Weight: 5)

- **Suspicious**: Excessive use of zero scores
- **Good**: Balanced use of rating scale
- **Score**: Based on percentage of zero votes

### 8. Historical Analysis (Weight: 10)

- **Suspicious**: Consistently high scores for same creators
- **Good**: Varied voting patterns across creators
- **Score**: Based on historical voting patterns

## Implementation

### Backend API

- **Endpoint**: `/mod/analyzeVotes/:contestId/voters`
- **Enhancement**: Now includes `fraudScore` and `fraudBreakdown` fields
- **Calculation**: Real-time calculation for each voter

### Frontend Integration

- **VotersTable**: New "Fraud Score" column with color coding
- **EntrantVotersTable**: Fraud score display for entrant-specific voters
- **Color Coding**:
  - Red (80-100): High risk
  - Orange (60-79): Medium risk
  - Blue (40-59): Low risk
  - Green (0-39): Very low risk

## Usage

1. Navigate to the moderator analysis page
2. Select a contest to analyze
3. View the "Fraud Score" column in the voters table
4. Sort by fraud score to identify suspicious voters
5. Use the breakdown data for detailed analysis

## Technical Details

### Database Queries

The system performs multiple database queries to gather:

- Voter demographics (age, karma)
- Voting patterns and timing
- Entry averages and rankings
- Historical voting data

### Performance Considerations

- Scores calculated on-demand for ~100 users
- Caching implemented for entry averages
- Historical analysis limited to recent 100 votes per user

### Legal Compliance

- IP fingerprinting not implemented (GDPR considerations)
- Device fingerprinting not used
- Focus on behavioral patterns rather than technical identifiers

## Configuration

Weights can be adjusted in `server/api/contestVoters.js`:

```javascript
const FRAUD_WEIGHTS = {
  accountAge: 15,
  voteCount: 10,
  singleFives: 20,
  randomScoring: 15,
  poorBestFlags: 15,
  voteTiming: 10,
  votingZeros: 5,
  historicalAnalysis: 10,
};
```

## Future Enhancements

1. **Clustering**: Isolation Forest
1. **Machine Learning**: Replace heuristic weights with ML model
1. **Real-time Alerts**: Automatic flagging of high-risk voters
1. **Pattern Recognition**: Detect coordinated voting campaigns
1. **Geographic Analysis**: IP-based clustering (with consent)
1. **Temporal Analysis**: Voting pattern changes over time
