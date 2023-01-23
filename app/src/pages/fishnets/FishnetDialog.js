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

export default function FishnetDialog({ item, onClose }) {
  const [ oceans, setOceans ] = useState([]);
  const [ baskets, setBaskets ] = useState([]);

  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    ocean: Yup.string().required('Ocean is required'),
    fisherBasket: Yup.string().required('Fisher basket is required'),
    baitAddr: Yup.string().required('Bait address is required'),
    netAddr: Yup.string().required('Net address is required'),
    netSize: Yup.number().required('Net size is required'),
    baitFee: Yup.number().required('Bait fee is required'),
    netAddFee: Yup.number().required('Net add fee is required'),
    netRemoveFee: Yup.number().required('Net remove fee is required'),
    remarks: Yup.string(),
    status: Yup.number().required('Status is required'),
  });

  const defaultValues = { 
    name: item.name || '', 
    ocean: item.ocean?.id || '',
    fisherBasket: item.fisherBasket?.id || '',
    baitAddr: item.baitAddr || '',
    netAddr: item.netAddr || '',
    netSize: item.netSize || '0',
    baitFee: item.statistics?.baitFee || '0',
    netAddFee: item.statistics?.netAddFee || '0',
    netRemoveFee: item.statistics?.netRemoveFee || '0',
    remarks: item.remarks || '',
    status: item.status || '0',
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
      if (item.id) await axios.patch(`/fishnets/${item.id}`, data);
      else await axios.post('/fishnets', data);

      reset();

      onClose('Fishnet data saved.');
    } catch (error) {
      console.error(error);

      setError('afterSubmit', {
        ...error,
        message: error.message,
      });
    }
  };

  const loadData = async () => {
    try {
      const response = await Promise.all([
        axios.get('/oceans'),
        axios.get('/baskets?type=1&fetchBalance=false&status=1'),
      ]);
      setOceans(response[0]);
      setBaskets(response[1]);
    } catch (err) {
      console.log('err', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Dialog open={item !== null} onClose={() => onClose(null)} maxWidth="sm" fullWidth>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{ item.id ? `Edit - ${item.name}` : 'Add new' }</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
            <Stack direction="row" spacing={3}>
              <RHFTextField
                name="name"
                label="Name"
                type='text'
              />
              <RHFSelect
                name="status"
                label="Status"
                >    
                {['Created', 'Playing', 'Completed'].map((option, index) => (
                  <MenuItem key={index} value={index}>
                    {option}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Stack>
            <Stack direction="row" spacing={3}>
              <RHFSelect
                name="ocean"
                label="Ocean"
                >    
                {oceans.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </RHFSelect>

              <RHFSelect
                name="fisherBasket"
                label="Fisher basket"
                >    
                {baskets.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.address.substr(0, 6)}...{option.address.substr(-4)} ({option.balance})<br />
                    {option.ocean.name}
                  </MenuItem>
                ))}
              </RHFSelect>
            </Stack>

            <Stack direction="row" spacing={3}>
              <RHFTextField
                name="baitAddr"
                label="Bait address"
                type='text'
              />
              <RHFTextField
                name="netAddr"
                label="Net address"
                type='text'
              />
            </Stack>
            <Stack direction="row" spacing={3}>
              <RHFTextField
                name="netSize"
                label="Net size"
                type='number'
              />
              <RHFTextField
                name="baitFee"
                label="Bait Fee"
                type='number'
              />
            </Stack>

            <Stack direction="row" spacing={3}>
              <RHFTextField
                name="netAddFee"
                label="Net add fee"
                type='number'
              />
              <RHFTextField
                name="netRemoveFee"
                label="Net remove Fee"
                type='number'
              />
            </Stack>
            <RHFTextField
              name="remarks"
              label="Remarks"
              type='text'
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