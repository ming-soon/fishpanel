import { useState, useEffect, useCallback } from 'react';

import {
  Stack,
  Alert,
  Container,
  Typography,
  Button,
  Snackbar,
  IconButton,
  Switch,
  TextField,
  MenuItem,
  FormControlLabel,
} from '@mui/material';
import moment from 'moment';

import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CircularProgress from '@mui/material/CircularProgress';
import SendIcon from '@mui/icons-material/Send';

import { DataGrid } from '@mui/x-data-grid';
// components

// components
import axios from '../../utils/axios';
import { useSettingsContext } from '../../components/settings';
import BasketDialog from './BasketDialog';
import TransferDialog from './TransferDialog';
import ImportDialog from './ImportDialog';

export default function BasketPage() {
  const { themeStretch } = useSettingsContext();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [itemTransfer, setItemTransfer] = useState(null);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const [oceans, setOceans] = useState([]);
  const [query, setQuery] = useState({
    ocean: '',
    status: 1,
    type: '',
  });

  const renderStatusSwitch = (row) => (
    <>
      <Switch
        checked={row.row.status === 1}
        onChange={(e) => onHandleRowStatusChange(row.row, e.target.checked)}
      />
    </>
  );
  const BASKET_TYPES = ['Bot', 'Fisher', 'Saving'];
  const columns = [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      renderCell: (params) => params.api.getRowIndex(params.row.id) + 1,
    },
    {
      field: 'ocean',
      headerName: 'Ocean',
      width: 150,
      valueGetter: (params) => params.row.ocean.name,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 80,
      renderCell: (params) => BASKET_TYPES[params.row.type],
    },
    {
      field: 'address',
      headerName: 'address',
      width: 100,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${params.row.ocean.explorerUrl}/address/${params.row.address}`}
        >
          {params.row.address.substr(0, 6)}...{params.row.address.substr(-4)}
        </a>
      ),
    },
    {
      field: 'balance',
      headerName: 'Balance',
      width: 150,
      renderCell: (params) => <div title={(params.row.balance)}>{Math.round(params.row.balance * 10000000)/10000000}</div>,
    },
    {
      field: 'checksum',
      headerName: 'Valid',
      width: 50,
      renderCell: (params) =>
        params.row.checksum ? <DoneIcon color="success" /> : <CloseIcon color="warning" />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => renderStatusSwitch(params),
    },
    {
      field: 'createdAt',
      headerName: 'Created at',
      width: 200,
      renderCell: (params) => moment(params.row.createdAt).format('YYYY-MM-DD hh:mm:ss')
    },
    {
      field: 'updatedAt',
      headerName: 'Updated at',
      width: 200,
      renderCell: (params) => moment(params.row.updatedAt).format('YYYY-MM-DD hh:mm:ss')
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => onCopyAddress(params.row)}>
            <ContentCopyIcon />
          </IconButton>
          <IconButton color="secondary" onClick={() => setItemTransfer(params.row)}>
            <SendIcon />
          </IconButton>
          <IconButton color="secondary" onClick={() => onEditItem(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="danger" onClick={() => onDeleteItem(params.row)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const loadList = useCallback(async (fetchBalance) => {
    setError(null);
    setLoading(true);
    try {
      const nq = { fetchBalance: fetchBalance || false };
      if (query.ocean !== '') nq.ocean = query.ocean;
      if (query.status !== '') nq.status = query.status;
      if (query.type !== '') nq.type = query.type;
      const response = await axios.get('/baskets', {
        params: nq,
      });
      setList(response);
      setError(null);
    } catch (err) {
      setError(err);
      console.log('err', err);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadListWithBalance= () => {
    loadList(true);
  };

  const onHandleRowStatusChange = async (item, checked) => {
    setError(null);
    setLoading(true);
    try {
      await axios.patch(`/baskets/${item.id}`, { status: checked ? 1 : 0 });
      loadList();
    } catch (err) {
      setError(err);
      setLoading(false);
      console.log('err', err);
    }
  };

  const onCopyAddress = async (item) => {
    await navigator.clipboard.writeText(item.address);
    setMsg(`${item.address} copied to clipboard!`);
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

  const onCloseTransferDialog = (result) => {
    setItemTransfer(null);
    setMsg(result);
  }

  const onDeleteItem = async (item) => {
    if (window.confirm('Do you want to delete?')) {
      setError(null);
      setLoading(true);
      try {
        await axios.delete(`/baskets/${item.id}`);
        loadList();
        setError(null);
      } catch (err) {
        setError(err);
        setLoading(false);
        console.log('err', err);
      }
    }
  };

  const onDeleteMulti = async () => {
    if (window.confirm(`Do you want to delete ${selectedRows.length} baskets?`)) {
      setError(null);
      setLoading(true);
      try {
        await Promise.all(selectedRows.map((row) => axios.delete(`/baskets/${row}`)));
        loadList();
        setError(null);
      } catch (err) {
        setError(err);
        setLoading(false);
        console.log('err', err);
      }
    }
  };

  const onChangeQuery = (newQuery) => {
    setQuery({ ...query, ...newQuery });
  };

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    (async () => {
      const res = await axios.get('/oceans');
      setOceans(res);
    })();
  }, []);

  return (
    <Container maxWidth={themeStretch ? false : 'xl'}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography variant="h3" component="h1" paragraph>
          Baskets
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => loadListWithBalance()}>
            Refresh with Balance
          </Button>
          <Button variant="contained" onClick={() => loadList()}>
            Refresh
          </Button>
          <Button variant="contained" onClick={() => onAddItem()}>
            Add
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={selectedRows.length === 0}
            onClick={() => onDeleteMulti()}
          >
            Delete
          </Button>
          <Button variant="contained" onClick={() => setShowImportDialog(true)}>
            Import
          </Button>
        </Stack>
      </Stack>
      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <TextField
          select
          size="small"
          helperText="Ocean"
          value={query.ocean}
          onChange={(e) => onChangeQuery({ ocean: e.target.value })}
        >
          <MenuItem value="">--All--</MenuItem>
          {oceans.map((ocean) => (
            <MenuItem key={ocean.id} value={ocean.id}>
              {ocean.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          helperText="Type"
          value={query.type}
          onChange={(e) => onChangeQuery({ type: e.target.value })}
        >
          <MenuItem value="">--All--</MenuItem>
          {BASKET_TYPES.map((label, type) => (
            <MenuItem key={type} value={type}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          helperText="Status"
          value={query.status}
          onChange={(e) => onChangeQuery({ status: e.target.value })}
          defaultValue="1"
        >
          <MenuItem value="">--All--</MenuItem>
          {['Inactive', 'Active'].map((label, type) => (
            <MenuItem key={type} value={type}>
              {label}
            </MenuItem>
          ))}
        </TextField>
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
      {list.length > 0 && !loading && (
        <DataGrid
          autoHeight
          rows={list}
          columns={columns}
          checkboxSelection
          pageSize={10}
          rowsPerPageOptions={[10, 20, 25, 50, 100]}
          onSelectionModelChange={(selected) => setSelectedRows(selected)}
        />
      )}
      {loading && <CircularProgress />}
      {!loading && list.length === 0 && <Alert severity="warning">No items found.</Alert>}

      {editItem !== null && (
        <BasketDialog item={editItem} oceans={oceans} onClose={onCloseDialog} />
      )}
      {itemTransfer !== null && <TransferDialog item={itemTransfer} onClose={onCloseTransferDialog} baskets={list} />}
      {showImportDialog && <ImportDialog oceans={oceans} onClose={() => setShowImportDialog(false)} />}
    </Container>
  );
}
