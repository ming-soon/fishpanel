import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import * as base64 from 'base-64';

import * as Yup from 'yup';
// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { Stack, Alert, MenuItem } from '@mui/material';
import { LoadingButton } from '@mui/lab';

// components
import FormProvider, { RHFTextField, RHFSelect } from '../../components/hook-form';

import axios from '../../utils/axios';


const BASKET_TYPES = ['Bot', 'Fisher', 'Saving'];

export default function BasketDialog({ item, onClose, oceans }) {
  const UpdateUserSchema = Yup.object().shape({
    ocean: Yup.string().required('Ocean is required'),
    type: Yup.number().required('Type required'),
    ...(item.id ? {} : { count: Yup.number().required('Count required'), }),
  });

  const defaultValues = { 
    ocean: item.ocean ? item.ocean.id || '' : '',
    type: item.type || 0, 
    ...(item.id ? {} : { count: 0, }),
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
      if (item.id) await axios.patch(`/baskets/${item.id}`, data);
      else await axios.post('/baskets', data);

      reset();

      onClose('Baskets data saved.');
    } catch (error) {
      console.error(error);

      setError('afterSubmit', {
        ...error,
        message: error.message,
      });
    }
  };

  const onCopy = async () => {
    try {
      let val = await axios.post(`/baskets/${item.id}/reveal`);
      val = base64.decode(val);
      await navigator.clipboard.writeText(val);
    }
    catch (error) {
      setError('afterSubmit', {
        ...error,
        message: error.message,
      });
    }
  };

  return (
    <Dialog open={item !== null} onClose={() => onClose(null)} maxWidth="sm" fullWidth>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{ item.id ? `Edit - ${item.address}` : 'Add new' }</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {!!errors.afterSubmit && <Alert severity="error">{errors.afterSubmit.message}</Alert>}
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
              name="type"
              label="Type"
              >    
              {BASKET_TYPES.map((option, index) => (
                <MenuItem key={index} value={index}>
                  {option}
                </MenuItem>
              ))}
            </RHFSelect>
            {typeof item.id === 'undefined' && 
            <RHFTextField
              name="count"
              label="Count"
              type='number'
            />
            }
            { typeof item.id !== 'undefined' && <Button onClick={onCopy}>Claim</Button>}
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