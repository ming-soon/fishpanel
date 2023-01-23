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
import { Stack, Alert  } from '@mui/material';
import { LoadingButton } from '@mui/lab';

// components
import FormProvider, { RHFTextField } from '../../components/hook-form';

import axios from '../../utils/axios';

export default function OceanDialog({ item, onClose }) {
  const UpdateUserSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    factoryAddr: Yup.string().required('Factory address is required'),
    routerAddr: Yup.string().required('Router address is required'),
    swapIdentifier: Yup.string().required('Router address is required'),
    routerAbi: Yup.string().required('Router ABI is required'),
    serverUrl: Yup.string().required('Server address is required'),
    serverWssUrl: Yup.string().required('Server address is required'),
    explorerUrl: Yup.string().required('Explorer url is required'),
    etherAddress: Yup.string().required('Ether address is required'),
    chainId: Yup.number().required('Ether address is required'),
    ether: Yup.string().required('Ether name is required'),
    unit: Yup.string().required('Unit is required'),
  });

  const defaultValues = { 
    name: item.name || '', 
    factoryAddr: item.factoryAddr || '', 
    routerAddr: item.routerAddr || '', 
    swapIdentifier: item.swapIdentifier || '', 
    routerAbi: item.routerAbi || '[]',
    serverUrl: item.serverUrl || '', 
    serverWssUrl: item.serverWssUrl || '', 
    explorerUrl: item.explorerUrl || '',  
    etherAddress: item.etherAddress || '',
    chainId: item.chainId || 1,
    ether: item.ether || 'ether',  
    unit: item.unit || 'eth',  
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
      if (item.id) await axios.patch(`/oceans/${item.id}`, data);
      else await axios.post('/oceans', data);

      reset();

      onClose('Ocean data saved.');
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
        <DialogTitle>{ item.id ? `Edit - ${item.name}` : 'Add new' }</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
            <RHFTextField
              name="name"
              label="Name"
              type='text'
            />
            <RHFTextField
              name="factoryAddr"
              label="Factory address"
              type='text'
            />
            <RHFTextField
              name="routerAddr"
              label="Router address"
              type='text'
            />
            <RHFTextField
              name="swapIdentifier"
              label="Swap identifier"
              type='text'
            />
            <RHFTextField
              name="routerAbi"
              label="Router ABI"
              type='text'
            />
            <RHFTextField
              name="serverUrl"
              label="Server url"
              type='text'
            />
            <RHFTextField
              name="serverWssUrl"
              label="Server WSS url"
              type='text'
            />
            <RHFTextField
              name="explorerUrl"
              label="Explorer Url"
              type='text'
            />
            <RHFTextField
              name="etherAddress"
              label="Wrapped ether address"
              type='text'
            />
            <RHFTextField
              name="ether"
              label="Governance Token"
              type='text'
            />
            <RHFTextField
              name="unit"
              label="Unit"
              type='text'
            />
            <RHFTextField
              name="chainId"
              label="Chain Id"
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