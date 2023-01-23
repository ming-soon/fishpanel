import { useState, useEffect } from 'react';

import {
  Card,
  Stack,
  Box,
  Grid,
  Paper,
  Alert,
  Container,
  Typography,
  Button,
  Snackbar,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// components
import axios from '../../utils/axios';
import { useSettingsContext } from '../../components/settings';
import FishnetDialog from './FishnetDialog';
import FishnetDetail from './FishnetDetail';

export default function FishnetsPage() {
  const { themeStretch } = useSettingsContext();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);

  const loadList = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.get('/fishnets');
      setList(response);
      setError(null);

      if (currentItem !== null) {
        setCurrentItem(response.find((v) => v.id === currentItem.id));
      }
    } catch (err) {
      setError(err);
      console.log('err', err);
    } finally {
      setLoading(false);
    }
  };

  const completeFishing = async (item) => {
    if (window.confirm('Do you want to complete fishing?')) {
      setError(null);
      setLoading(true);
      try {
        await axios.post(`/fishnets/${item.id}/complete`);
        loadList();
        setError(null);
      } catch (err) {
        setError(err);
        setLoading(false);
        console.log('err', err);
      }
    }
  };

  const onDeleteItem = async (item) => {
    if (window.confirm('Do you want to delete?')) {
      setError(null);
      setLoading(true);
      try {
        await axios.delete(`/fishnets/${item.id}`);
        loadList();
        setError(null);
      } catch (err) {
        setError(err);
        setLoading(false);
        console.log('err', err);
      }
    }
  };

  const onAddItem = () => {
    setEditItem({});
  };

  const onEditItem = (item) => {
    setEditItem(item);
  };

  const onCloseDialog = (result) => {
    setEditItem(null);
    setMsg(result);
    if (result !== null) {
      loadList();
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const renderList = () => {
    if (list.length === 0) return <Alert severity="warning">No items found.</Alert>;

    const FISHNET_STATUS = ['CREATED', 'RUNNING', 'COMPLETED'];

    return (
      <Stack spacing={3}>
        {list.map((item) => {
          const totalAmount = 0;
          return (
            <Card key={item.id} sx={{ padding: 1 }} onClick={() => setCurrentItem(item)}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Stack spacing={2} direction="row" alignItems="center">
                    <a
                      href={`${item.ocean.explorerUrl}/token/${item.baitAddr}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Typography variant="button">{item.name}</Typography>
                      <Typography variant="caption">
                        <b>({FISHNET_STATUS[item.status]})</b>
                      </Typography>
                    </a>
                    {item.status === 1 && (
                      <IconButton color="secondary" onClick={() => completeFishing(item)}>
                        <CheckCircleIcon />
                      </IconButton>
                    )}
                    <IconButton color="secondary" onClick={() => onEditItem(item)}>
                      <EditIcon />
                    </IconButton>
                    {item.status !== 1 && (
                      <IconButton color="danger" onClick={() => onDeleteItem(item)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption"><b>{item.ocean.name}</b></Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" display="block">Total Net size</Typography>
                  <Typography variant="button" display="block">{Math.round(item.netSize*10000)/10000}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" display="block">Total harvest</Typography>
                  <Typography variant="button">{Math.round(item.statistics.totalHarvest*10000)/10000} ({`${item.extTxns.length} txns`})</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" display="block">Total invest</Typography>
                  <Typography variant="button">{Math.round(item.statistics.totalInvest*10000)/100000} ({Math.round((item.statistics.baitFee + item.statistics.netAddFee + item.statistics.netRemoveFee)*10000)/10000})</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" display="block">{ item.remarks }</Typography>
                </Grid>
              </Grid>
            </Card>
          );
        })}
      </Stack>
    );
  };

  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography variant="h3" component="h1" paragraph>
          Fishnets
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error">
          {error.message}
          <br />
          {error.stack}
        </Alert>
      )}
      <Snackbar
        open={msg !== null}
        autoHideDuration={3000}
        message={msg}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClose={() => setMsg(null)}
      />

      <Grid container spacing={3}>
        <Grid item xs={3}>
          <Button variant="contained" onClick={() => onAddItem()} sx={{ mb: 1 }}>
            Add
          </Button>
          {renderList()}
        </Grid>
        <Grid item xs={9}>
          {currentItem !== null && <FishnetDetail item={currentItem} setMsg={setMsg} setError={setError} loadList={loadList} setLoading={setLoading}  />}
        </Grid>
      </Grid>

      {editItem !== null && <FishnetDialog item={editItem} onClose={onCloseDialog}/>}
    </Container>
  );
}
