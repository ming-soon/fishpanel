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

export default function PurchaseDialog({ item, onClose }) {
  const [ oceans, setOceans ] = useState([]);
  const [ baskets, setBaskets ] = useState([]);

  const UpdateUserSchema = Yup.object().shape({
    count: Yup.number().required('Number of purchase is required'),
    minAmount: Yup.number().required('Min amount is required'),
    maxAmount: Yup.number().required('Max amount is required'),
    minInterval: Yup.number().required('Min interval is required'),
    maxInterval: Yup.number().required('Max interval is required'),
    gas: Yup.number().required('Max interval is required'),
    maxFeePerGas: Yup.number().required('Max interval is required'),
    maxPriorityFeePerGas: Yup.number().required('Max interval is required'),
  });

  const defaultValues = { 
    count: 1,
    minAmount: 0.03,
    maxAmount: 0.1,
    minInterval: 1000,
    maxInterval: 5000,
    gas: 21000,
    maxFeePerGas: 5,
    maxPriorityFeePerGas: 1,
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
      await axios.post(`/fishnets/${item.id}/purchase`, data);

      reset();

      onClose('Purchased.');
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
        <DialogTitle>New purchases</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
            <RHFTextField
              name="count"
              label="Count"
              type='number'
            />
            <RHFTextField
              name="minAmount"
              label="Min amount"
              type='number'
            />
            <RHFTextField
              name="maxAmount"
              label="Max amount"
              type='number'
            />
            <RHFTextField
              name="minInterval"
              label="Min interval"
              type='number'
            />
            <RHFTextField
              name="maxInterval"
              label="Max interval"
              type='number'
            />
            <RHFTextField
              name="gas"
              label="Gas"
              type='number'
            />
            <RHFTextField
              name="maxFeePerGas"
              label="Max Fee Per Gas"
              type='number'
            />
            <RHFTextField
              name="maxPriorityFeePerGas"
              label="Max Priority Fee Per Gas"
              type='number'
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