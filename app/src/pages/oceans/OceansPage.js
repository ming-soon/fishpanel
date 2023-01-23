import { useState, useEffect } from 'react';

import { Stack, Alert, Container, Typography, Button, Snackbar, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';

import { DataGrid } from '@mui/x-data-grid';

// components
import axios from '../../utils/axios';
import { useSettingsContext } from '../../components/settings';
import OceanDialog from './OceanDialog';

export default function OceansPage() {
  const { themeStretch } = useSettingsContext();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const columns = [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      renderCell: (params) => params.api.getRowIndex(params.row.id) + 1,
    },
    { field: 'name', headerName: 'Name', width: 300 },
    {
      field: 'factoryAddr',
      headerName: 'Factory Address',
      width: 180,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${params.row.explorerUrl}/address/${params.row.factoryAddr}`}
        >
          {params.row.factoryAddr.substr(0, 6)}...{params.row.factoryAddr.substr(-4)}
        </a>
      ),
    },
    {
      field: 'routerAddr',
      headerName: 'Router Address',
      width: 180,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${params.row.explorerUrl}/address/${params.row.routerAddr}`}
        >
          {params.row.routerAddr.substr(0, 6)}...{params.row.routerAddr.substr(-4)}
        </a>
      ),
    },
    {
      field: 'serverUrl',
      headerName: 'Server Url',
      width: 200,
      renderCell: (params) => (
        <div>
          {params.row.serverUrl}<br />
          {params.row.serverWssUrl}
        </div>
      ),
    },
    { field: 'explorerUrl', headerName: 'Explorer Url', width: 200 },
    {
      field: 'status',
      headerName: 'Status',
      width: 80,
      renderCell: (params) => (<>
        {params.row.status === 1 ? <CheckIcon color="success" /> : <CloseIcon color="warning" />}<br />
        <IconButton onClick={() => toggleOcean(params.row)}>
          {params.row.status === 0 ? <PlayArrowIcon color="success" /> : <StopIcon color="warning" />}
        </IconButton>
      </>)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton color="secondary" onClick={() => onEditItem(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="secondary" onClick={() => onDeleteItem(params.row)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const loadList = async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.get('/oceans');
      setList(response);
      setError(null);
    } catch (err) {
      setError(err);
      console.log('err', err);
    } finally {
      setLoading(false);
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

  const onDeleteItem = async (item) => {
    if (window.confirm('Do you want to delete?')) {
      setError(null);
      setLoading(true);
      try {
        await axios.delete(`/oceans/${item.id}`);
        loadList();
        setError(null);
      } catch (err) {
        setError(err);
        console.log('err', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleOcean = async (item) => {
    if (window.confirm(`Do you want to ${item.status === 0 ? 'start' : 'stop'}?`)) {
      setError(null);
      setLoading(true);
      try {
        await axios.post(`/oceans/${item.id}/process`, {
          status: 1 - item.status
        });
        loadList();
        setError(null);
      } catch (err) {
        setError(err);
        console.log('err', err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography variant="h3" component="h1" paragraph>
          Oceans
        </Typography>
        <Button variant="contained" onClick={() => onAddItem()}>
          Add
        </Button>
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
      {list.length > 0 && (
        <DataGrid
          autoHeight
          rows={list}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 20, 25, 50, 100]}
        />
      )}
      {list.length === 0 && <Alert severity="warning">No items found.</Alert>}

      {editItem !== null && <OceanDialog item={editItem} onClose={onCloseDialog} />}
    </Container>
  );
}
