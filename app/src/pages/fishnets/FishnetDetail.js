import * as React from 'react';
import { Grid, Stack, Alert, Card, Typography, Button } from '@mui/material';

import { DataGrid } from '@mui/x-data-grid';
import moment from 'moment';
import PurchaseDialog from './PurchaseDialog';
import AddFishDialog from './AddFishDialog';
import axios from '../../utils/axios';

const INT_TXN_STATUS = ['Standby', 'Bought', 'Sold', 'Error'];
export default function FishnetDetail({ item, setError, setMsg, setLoading, loadList }) {

  const [ showPurchase, setShowPurchase ] = React.useState(false);
  const [ showAddFish, setShowAddFish ] = React.useState(false);
  const [ sellIndex, setSellIndex ] = React.useState(-1);

  const columnsExtTxns = [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      renderCell: (params) => params.api.getRowIndex(params.row.id) + 1,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 50,
      renderCell: (params) => params.row.type === 0 ? 'BUY' : 'SELL',
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => moment(params.row.createdAt).format('YYYY-MM-DD hh:mm:ss'),
    },
    {
      field: 'from',
      headerName: 'From',
      width: 120,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${item.ocean.explorerUrl}/address/${params.row.from}`}
        >
          {params.row.from.substr(0, 6)}...{params.row.from.substr(-4)}
        </a>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      renderCell: (params) => Math.round(params.row.amount*10000000)/10000000,
    },
    {
      field: 'txnHash',
      headerName: 'Txn',
      width: 120,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${item.ocean.explorerUrl}/tx/${params.row.txnHash}`}
        >
          {params.row.txnHash.substr(0, 6)}...{params.row.txnHash.substr(-4)}
        </a>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => params.row.status === 0 ? 'UNBLOCKED' : 'BLOCKED',
    },
  ];

  const columnsIntTxns = [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      renderCell: (params) => params.api.getRowIndex(params.row.id) + 1,
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 150,
      renderCell: (params) => moment(params.row.createdAt).format('YYYY-MM-DD hh:mm:ss'),
    },
    {
      field: 'basket',
      headerName: 'basket',
      width: 120,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${item.ocean.explorerUrl}/address/${params.row.basket.address}`}
        >
          {params.row.basket.address.substr(0, 6)}...{params.row.basket.address.substr(-4)}
        </a>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      renderCell: (params) => Math.round(params.row.amount*10000000)/10000000,
    },
    {
      field: 'buyTxnHash',
      headerName: 'Buy Txn',
      width: 120,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${item.ocean.explorerUrl}/tx/${params.row.buyTxnHash}`}
        >
          {params.row.buyTxnHash.substr(0, 6)}...{params.row.buyTxnHash.substr(-4)}
        </a>
      ),
    },
    {
      field: 'sellTxnHash',
      headerName: 'Sell Txn',
      width: 120,
      renderCell: (params) => (
        <a
          target="_blank"
          rel="noreferrer"
          href={`${item.ocean.explorerUrl}/tx/${params.row.sellTxnHash}`}
        >
          {params.row.sellTxnHash.substr(0, 6)}...{params.row.sellTxnHash.substr(-4)}
        </a>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => INT_TXN_STATUS[params.row.status],
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 300,
      renderCell: (params) => (<Stack direction="row" spacing={1}>
      {(params.row.status === 1 && sellIndex !== params.row._id) && <Button variant="contained" onClick={() => setSellIndex(params.row._id)}>Sell</Button>}
      {params.row._id === sellIndex && (<>
        <input placeholder="Gas" type="number" value={sellInfo.gas} onChange={(e) => setSellInfo({ ...
        sellInfo, gas: e.target.value })} style={{width: '50px'}} />
        <input placeholder="Gas price" type="number" value={sellInfo.maxFeePerGas} onChange={(e) => setSellInfo({ ...sellInfo, maxFeePerGas: e.target.value })} style={{width: '30px'}} />
        <input placeholder="Max priority fee per gas" type="number" value={sellInfo.maxPriorityFeePerGas} onChange={(e) => setSellInfo({ ...sellInfo, maxPriorityFeePerGas: e.target.value })} style={{width: '30px'}} />
        <Button variant="contained" onClick={() => onSell(params.row)}>Sell</Button>
        <Button variant="contained" onClick={() => setSellIndex(-1)}>Cancel</Button>
      </>)}
      </Stack>)
    }
  ];

  const [ sellInfo, setSellInfo ] = React.useState({ gas: 1000000, maxFeePerGas: 5, maxPriorityFeePerGas: 1 });

  const reloadItem = () => {
    loadList();
  };

  const onPurchase = () => {
    setShowPurchase(true);
  };

  const onClosePurchase = (msg) => {
    setShowPurchase(false);
    setMsg(msg);
    reloadItem();
  };

  const onAddFish = () => {
    setShowAddFish(true);
  };

  const onCloseAddFish = (msg) => {
    setShowAddFish(false);
    reloadItem();
    setMsg(msg);
  };

  const calcItem = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/fishnets/${item.id}/calc`);
      reloadItem();
    }
    catch(err) {
      setError(err);
      setLoading(false);
    }
  };

  const onSell = async (tx) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/fishnets/${item.id}/sell/${tx._id}`, sellInfo);
      setSellIndex(-1);
      reloadItem();
    }
    catch(err) {
      setError(err);
      setLoading(false);
    }
  };
  return (
    <>
    <Stack spacing={2} direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button variant="contained" onClick={() => reloadItem()}>
          Refresh
        </Button>
        <Button variant="contained" onClick={() => calcItem()}>
          Calc
        </Button>
      </Stack>
      <Card sx={{ padding: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="button">External Txns ({ item.extTxns.length })</Typography>
                <Button variant="contained" onClick={() => onAddFish()}>
                  Add Fish
                </Button>
              </Stack>
              {item.extTxns.length > 0 && (
                <DataGrid
                  autoHeight
                  rows={item.extTxns}
                  columns={columnsExtTxns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 25, 50, 100]}
                  getRowId={(row) => row._id}
                />
              )}
              {item.extTxns.length === 0 && <Alert severity="warning">No items found.</Alert>}
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack spacing={1}>
              <Stack spacing={1} direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="button">Internal Txns ({ item.intTxns.length })</Typography>
                <Button variant="contained" onClick={() => onPurchase()}>
                  Purchase
                </Button>
              </Stack>
              {item.intTxns.length > 0 && (
                <DataGrid
                  autoHeight
                  rows={item.intTxns}
                  columns={columnsIntTxns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 25, 50, 100]}
                  getRowId={(row) => row._id}
                />
              )}
              {item.intTxns.length === 0 && <Alert severity="warning">No items found.</Alert>}
            </Stack>
          </Grid>
        </Grid>
        { showPurchase && <PurchaseDialog item={item} onClose={onClosePurchase} /> }
        { showAddFish && <AddFishDialog item={item} onClose={onCloseAddFish} /> }
      </Card>
    </>
  );
}