import * as Yup from 'yup';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { Stack, Alert, Container, Typography  } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { useAuthContext } from '../../auth/useAuthContext';
// components
import FormProvider, { RHFTextField } from '../../components/hook-form';
// components
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

export default function SettingsPage() {
  const { update } = useAuthContext();
  const { themeStretch } = useSettingsContext();
  const UpdateUserSchema = Yup.object().shape({
    password: Yup.string().required('Password is required'),
    password1: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords does not match')
  });

  const defaultValues = {
    password: '',
    password1: '',
  };

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = methods;

  const onSubmit = async (data) => {
    try {
      await update({ password: data.password });

      reset();
    } catch (error) {
      console.error(error);

      reset();

      setError('afterSubmit', {
        ...error,
        message: error.message,
      });
    }
  };

  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Typography variant="h3" component="h1" paragraph>
        Settings
      </Typography>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
          <RHFTextField
            name="password"
            label="Password"
            type='password'
          />

          <RHFTextField
            name="password1"
            label="Password1"
            type='password'
          />
          <LoadingButton
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            sx={{
              bgcolor: 'text.primary',
              color: (theme) => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
              '&:hover': {
                bgcolor: 'text.primary',
                color: (theme) => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
              },
            }}
          >
            Update
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Container>
  );
}
