// @mui
import { Stack, Box } from '@mui/material';

// ----------------------------------------------------------------------

export default function NavDocs() {

  return (
    <Stack
      spacing={3}
      sx={{
        px: 5,
        pb: 5,
        mt: 10,
        width: 1,
        display: 'block',
        textAlign: 'center',
      }}
    >
      <Box component="img" src="/assets/illustrations/illustration_docs.svg" />
    </Stack>
  );
}
