// ----------------------------------------------------------------------

function path(root, sublink) {
  return `${root}${sublink}`;
}

const ROOTS_DASHBOARD = '/dashboard';

// ----------------------------------------------------------------------

export const PATH_AUTH = {
  login: '/login',
};

export const PATH_DASHBOARD = {
  root: ROOTS_DASHBOARD,
  dashboard: path(ROOTS_DASHBOARD, '/dashboard'),
  fishnets: path(ROOTS_DASHBOARD, '/fishnet'),
  baskets: path(ROOTS_DASHBOARD, '/baskets'),
  oceans: path(ROOTS_DASHBOARD, '/oceans'),
};
