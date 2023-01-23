import * as React from 'react';
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
import { Stack, Alert, MenuItem, Switch, FormControlLabel, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';

// components
import FormProvider, { RHFTextField, RHFSelect } from '../../components/hook-form';

import axios from '../../utils/axios';

export default function TransferDialog({ item, onClose, baskets }) {
  const [ customAddress, setCustomAddress ] = React.useState(false);

  const dataSchema = Yup.object().shape({
    toAddress: Yup.string().required('toAddress is required'),
    amount: Yup.number().required('Amount required'),
    gas: Yup.number().required('Gas required'),
    maxPriorityFeePerGas: Yup.number().required('maxPriorityFeePerGas required'),
  });

  const defaultValues = {
    toAddress: '',
    amount: 0,
    gas: 21000,
    maxFeePerGas: 5,
    maxPriorityFeePerGas: 1,
  };  

  const methods = useForm({
    resolver: yupResolver(dataSchema),
    defaultValues,
  });

  const {
    reset,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  const formAmount = watch('amount');
  const formGas = watch('gas');
  const formMaxFeePerGas = watch('maxFeePerGas');


  const getFee = () => (formGas * formMaxFeePerGas) / 1000000000;
  const getTotalBalanceNeeded  = () => parseFloat(formAmount) + getFee();

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`/baskets/${item.id}/transfer`, data);

      reset();

      onClose(`Transaction pending. tx # - ${res.transactionHash}`);
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
        <DialogTitle>{ `Transfer from ${item.address}` }</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}

            <FormControlLabel
              control={
                <Switch
                  checked={customAddress}
                  onChange={(e) => setCustomAddress(e.target.checked)}
                />
              }
              label="Use custom address"
            />
            { customAddress && <RHFTextField
              name="toAddress"
              label="To"
              type='text'
            /> }
            { !customAddress && <RHFSelect
              name="toAddress"
              label="To"
              >    
              {baskets.map((option) => (
                <MenuItem key={option.id} value={option.address}>
                  <Typography variant="caption" display="block" gutterBottom>
                    {option.address}
                  </Typography>
                  <Typography variant="button" display="block" gutterBottom>
                  ({option.balance})
                  </Typography>
                </MenuItem>
              ))}
            </RHFSelect> }
            <RHFTextField
              name="amount"
              label={`Amount in ${item.ocean.ether} (max: ${item.balance})`}
              type='number'
            />
            <RHFTextField
              name="gas"
              label="Gas"
              type='number'
            />
            <RHFTextField
              name="maxFeePerGas"
              label="maxFeePerGas(Gwei)"
              type='number'
            />
            <RHFTextField
              name="maxPriorityFeePerGas"
              label="maxPriorityFeePerGas(Gwei)"
              type='number'
            />
            <div>
                Approx Fee: { getFee() }
            </div>
            <div>
                Total balance needed: { getTotalBalanceNeeded() }
            </div>
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