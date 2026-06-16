import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { layout: 'auth' }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { layout: 'default', roles: ['owner', 'kasir', 'gudang'] }
  },
  {
    path: '/pos',
    name: 'POS',
    component: () => import('../views/PosView.vue'),
    meta: { layout: 'default', roles: ['owner', 'kasir'] }
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('../views/ProductListView.vue'),
    meta: { layout: 'default', roles: ['owner', 'kasir', 'gudang'] }
  },
  {
    path: '/products/new',
    name: 'ProductCreate',
    component: () => import('../views/ProductFormView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/products/:id/edit',
    name: 'ProductEdit',
    component: () => import('../views/ProductFormView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/categories',
    name: 'CategoryList',
    component: () => import('../views/CategoryListView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/suppliers',
    name: 'SupplierList',
    component: () => import('../views/SupplierListView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/stock',
    name: 'Stock',
    component: () => import('../views/StockView.vue'),
    meta: { layout: 'default', roles: ['owner', 'gudang'] }
  },
  {
    path: '/stock/in',
    name: 'StockIn',
    component: () => import('../views/StockInFormView.vue'),
    meta: { layout: 'default', roles: ['owner', 'gudang'] }
  },
  {
    path: '/stock/out',
    name: 'StockOut',
    component: () => import('../views/StockOutFormView.vue'),
    meta: { layout: 'default', roles: ['owner', 'gudang'] }
  },
  {
    path: '/transactions',
    name: 'TransactionList',
    component: () => import('../views/TransactionListView.vue'),
    meta: { layout: 'default', roles: ['owner', 'kasir', 'gudang'] }
  },
  {
    path: '/reports',
    name: 'ReportList',
    component: () => import('../views/ReportListView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/users',
    name: 'UserList',
    component: () => import('../views/UserListView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { layout: 'default', roles: ['owner'] }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (to.name !== 'Login' && !session) {
      return next('/login')
    }

    if (to.name === 'Login' && session) {
      return next('/dashboard')
    }

    if (to.meta.roles && session) {
      const { data: profile, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      if (error) throw error
      const role = profile?.role || session.user?.user_metadata?.role || 'kasir'
      if (!to.meta.roles.includes(role)) {
        return next('/dashboard')
      }
    }

    next()
  } catch {
    next('/login')
  }
})

export default router
