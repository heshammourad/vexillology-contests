import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import useAuthState from '../../../common/useAuthState';
import { ProtectedRoute, SpinnerButton } from '../../../components';
import { postData } from '../../../data/api';

/**
 * Calculates the default contest date:
 * - If today's day of month > 7: 1st day of upcoming month
 * - Otherwise: 1st day of current month
 */
const getDefaultDate = (now = new Date()) => {
  const day = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (day > 7) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  const formattedMonth = String(month + 1).padStart(2, '0');
  return `${year}-${formattedMonth}-01`;
};

function AddContest() {
  const [{ authTokens }] = useAuthState();

  const [date, setDate] = useState(() => getDefaultDate());
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [id, setId] = useState('');
  const [yearEnd, setYearEnd] = useState(false);
  const [categoriesText, setCategoriesText] = useState('');

  const [submissionStart, setSubmissionStart] = useState('');
  const [submissionEnd, setSubmissionEnd] = useState('');
  const [voteStart, setVoteStart] = useState('');
  const [voteEnd, setVoteEnd] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    if (!name.trim() || !date || !prompt.trim()) {
      setStatusMessage({
        severity: 'error',
        text: 'Please fill out all required fields (Contest Name, Date, and Prompt).',
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const categories = categoriesText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      categories: categories.length ? categories : null,
      date,
      id: id.trim() || null,
      name: name.trim(),
      prompt: prompt.trim(),
      submissionEnd: submissionEnd || null,
      submissionStart: submissionStart || null,
      voteEnd: voteEnd || null,
      voteStart: voteStart || null,
      yearEnd,
    };

    try {
      const response = await postData('/mod/addContest', payload, authTokens);
      if (response && (response.status === 200 || response.status === 201)) {
        setStatusMessage({
          severity: 'success',
          text: `Successfully created contest "${name.trim()}"!`,
        });
        // Reset form optional inputs
        setName('');
        setPrompt('');
        setId('');
        setYearEnd(false);
        setCategoriesText('');
        setSubmissionStart('');
        setSubmissionEnd('');
        setVoteStart('');
        setVoteEnd('');
      } else {
        setStatusMessage({
          severity: 'error',
          text:
            response?.data || 'Failed to create contest. Check server logs.',
        });
      }
    } catch (err) {
      setStatusMessage({
        severity: 'error',
        text:
          err?.response?.data
          || err?.message
          || 'An error occurred while creating contest.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <Box sx={{ maxWidth: 800, mx: 'auto', my: 3 }}>
        <Paper sx={{ p: 4 }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Add New Contest
          </Typography>

          {statusMessage && (
            <Alert severity={statusMessage.severity} sx={{ mb: 3 }}>
              {statusMessage.text}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <TextField
              required
              label="Contest Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. August 2026 Contest"
              fullWidth
            />

            <TextField
              required
              label="Date"
              type="date"
              value={date}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              helperText="Defaults to upcoming month if past the 7th, current month otherwise."
              fullWidth
            />

            <TextField
              required
              label="Prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              multiline
              rows={4}
              placeholder="Enter contest prompt or theme..."
              fullWidth
            />

            <TextField
              label="Contest ID (Optional)"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. aug26 (leave blank for automatic generation)"
              helperText="If blank, database automatically generates ID as lower(monYY)."
              fullWidth
            />

            <FormControlLabel
              control={(
                <Switch
                  checked={yearEnd}
                  onChange={(e) => setYearEnd(e.target.checked)}
                  color="primary"
                />
              )}
              label="Year-End Contest"
            />

            <TextField
              label="Categories (One per line)"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              multiline
              rows={4}
              placeholder="Category 1&#10;Category 2, with commas&#10;Category 3"
              helperText="One category per line. Can contain commas."
              fullWidth
            />

            <Typography variant="h6" sx={{ mt: 1 }}>
              Timestamps (Optional)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Leave blank to use database defaults (America/New_York 12:00 AM
              EST/EDT schedule).
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <TextField
                label="Submission Start"
                type="datetime-local"
                value={submissionStart}
                onChange={(e) => setSubmissionStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Submission End"
                type="datetime-local"
                value={submissionEnd}
                onChange={(e) => setSubmissionEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Vote Start"
                type="datetime-local"
                value={voteStart}
                onChange={(e) => setVoteStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Vote End"
                type="datetime-local"
                value={voteEnd}
                onChange={(e) => setVoteEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                justify: 'flex-end',
                gap: 2,
                mt: 2,
              }}
            >
              <SpinnerButton
                type="submit"
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                submitting={submitting}
              >
                Create Contest
              </SpinnerButton>
            </Box>
          </Box>
        </Paper>
      </Box>
    </ProtectedRoute>
  );
}

export default AddContest;
