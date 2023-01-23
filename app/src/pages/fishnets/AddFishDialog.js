import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

import * as Yup from 'yup';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { Stack, Alert, MenuItem  } from '@mui/material';
import { LoadingButton } from '@mui/lab';

// components
import FormProvider, { RHFTextField, RHFSelect } from '../../components/hook-form';

import axios from '../../utils/axios';

export default function AddFishDialog({ item, onClose }) {
  const UpdateUserSchema = Yup.object().shape({
    some_id: Yup.string().required('Buyer addr or Txn hash is required'),
  });

  const defaultValues = { 
    some_id: '',
  };
  

  const methods = useForm({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const onSubmit = async (data) => {
    try {
      await axios.post(`/fishnets/${item.id}/add_fish`, data);

      reset();

      onClose('Added.');
    } catch (error) {
      console.error(error);

      setError('afterSubmit', {
        ...error,
        message: error.message,
      });
    }
  };

  return (
    <Dialog open={item !== null} onClose={() => onClose(null)} maxWidth="sm" fullWidth>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Add fish by addr or tx hash</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
            <RHFTextField
              name="some_id"
              label="Addr or Txn hash"
              type='string'
            />
        </Stack>
        </DialogContent>
        <DialogActions>
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
            Save
          </LoadingButton>
          <Button onClick={() => onClose(null)}>Close</Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}