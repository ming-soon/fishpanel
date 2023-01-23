// routes
import { PATH_DASHBOARD } from '../../../routes/paths';
// components
import SvgColor from '../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const ICONS = {
  user: icon('ic_user'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
};

const navConfig = [
  // GENERAL
  // ----------------------------------------------------------------------
  {
    subheader: 'fisher-panel',
    items: [
      { title: 'Dashboard', path: PATH_DASHBOARD.dashboard, icon: ICONS.dashboard },
      { title: 'Fish nets', path: PATH_DASHBOARD.fishnets, icon: ICONS.analytics },
    ],
  },

  // MANAGEMENT
  // ----------------------------------------------------------------------
  {
    subheader: 'management',
    items: [
      { title: 'Baskets', path: PATH_DASHBOARD.baskets, icon: ICONS.ecommerce },
      { title: 'Oceans', path: PATH_DASHBOARD.oceans, icon: ICONS.analytics },
    ],
  },
];

export default navConfig;
