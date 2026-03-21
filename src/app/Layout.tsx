import { Suspense, lazy, useState } from 'react';
import { BarChart3, ListChecks, Plus, Refrigerator, Settings, ShoppingBasket } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/modules/auth/use-auth';
import { usePush } from '@/shared/hooks/use-push';
import { NotificationPrompt } from '@/shared/ui/NotificationPrompt';

const AddItemModal = lazy(() => import('@/modules/add-item/AddItemModal').then((module) => ({ default: module.AddItemModal })));
const AddPantryItemModal = lazy(() => import('@/modules/pantry/items/AddPantryItemModal').then((module) => ({ default: module.AddPantryItemModal })));
const AddShoppingItemModal = lazy(() => import('@/modules/shopping-list/ui/AddShoppingItemModal').then((module) => ({ default: module.AddShoppingItemModal })));
const SettingsModal = lazy(() => import('@/modules/settings/SettingsModal').then((module) => ({ default: module.SettingsModal })));

const mobileTabClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex w-full flex-col items-center gap-1 py-2 text-xs font-medium transition-all duration-200',
    isActive
      ? 'text-slate-900 dark:text-white'
      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
  ].join(' ');

const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-300',
  ].join(' ');

export function Layout() {
  const { t } = useTranslation();
  const { user, userEmail } = useAuth();
  const push = usePush();
  const location = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddPantryOpen, setIsAddPantryOpen] = useState(false);
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openContextAdd = () => {
    if (location.pathname === '/pantry') setIsAddPantryOpen(true);
    else if (location.pathname === '/shopping-list') setIsAddShoppingOpen(true);
    else setIsAddModalOpen(true);
  };

  return (
    <div className="flex min-h-[100dvh] md:h-[100dvh] md:overflow-hidden">
      {/* ─── Desktop sidebar (md+) ─── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-100 bg-white px-4 py-6 md:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 px-1">
          <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {t('common.appName')}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{userEmail}</p>
        </div>

        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={desktopNavClass}>
            <Refrigerator className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.8} />
            {t('dashboard.title')}
          </NavLink>
          <NavLink to="/pantry" className={desktopNavClass}>
            <ShoppingBasket className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.8} />
            {t('pantry.title')}
          </NavLink>
          <NavLink to="/shopping-list" className={desktopNavClass}>
            <ListChecks className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.8} />
            {t('shoppingList.title')}
          </NavLink>
          <NavLink to="/stats" className={desktopNavClass}>
            <BarChart3 className="h-[1.125rem] w-[1.125rem] shrink-0" strokeWidth={1.8} />
            {t('stats.title')}
          </NavLink>
        </nav>

        <button
          type="button"
          onClick={openContextAdd}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-all duration-200 hover:bg-slate-700 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          {t('addItem.fabLabel')}
        </button>

        <div className="flex-1" />

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('settings.title')}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Settings className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            {t('settings.title')}
          </button>
        </div>
      </aside>

      {/* ─── Main column ─── */}
      <div className="flex min-h-[100dvh] flex-1 flex-col md:min-h-0 md:overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between px-5 pb-1 pt-4 md:hidden">
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {t('common.appName')}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label={t('settings.title')}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 active:scale-90 dark:text-slate-500 dark:hover:bg-slate-800"
          >
            <Settings className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-visible px-5 pb-28 pt-2 md:overflow-auto md:px-8 md:py-6 md:pb-6">
          <div className="relative mx-auto w-full max-w-lg md:max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                style={{ opacity: 0, transform: 'translateY(6px)', willChange: 'opacity, transform' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.08, ease: 'easeIn' } }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile bottom tab bar — liquid glass treatment */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl md:hidden dark:border-white/5 dark:bg-slate-950/80 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="relative mx-auto max-w-lg">
            <div className="flex px-4 pb-2 pt-1">
              <NavLink to="/" end className="flex flex-1">
                {({ isActive }) => (
                  <div className={mobileTabClass({ isActive })}>
                    <Refrigerator className="h-5 w-5" strokeWidth={1.8} />
                    <span>{t('dashboard.title')}</span>
                    <span className={['h-1 w-4 rounded-full transition-all duration-200', isActive ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'].join(' ')} />
                  </div>
                )}
              </NavLink>
              <NavLink to="/pantry" className="flex flex-1">
                {({ isActive }) => (
                  <div className={mobileTabClass({ isActive })}>
                    <ShoppingBasket className="h-5 w-5" strokeWidth={1.8} />
                    <span>{t('pantry.title')}</span>
                    <span className={['h-1 w-4 rounded-full transition-all duration-200', isActive ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'].join(' ')} />
                  </div>
                )}
              </NavLink>
              <div className="w-16 shrink-0" />
              <NavLink to="/shopping-list" className="flex flex-1">
                {({ isActive }) => (
                  <div className={mobileTabClass({ isActive })}>
                    <ListChecks className="h-5 w-5" strokeWidth={1.8} />
                    <span>{t('shoppingList.title')}</span>
                    <span className={['h-1 w-4 rounded-full transition-all duration-200', isActive ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'].join(' ')} />
                  </div>
                )}
              </NavLink>
              <NavLink to="/stats" className="flex flex-1">
                {({ isActive }) => (
                  <div className={mobileTabClass({ isActive })}>
                    <BarChart3 className="h-5 w-5" strokeWidth={1.8} />
                    <span>{t('stats.title')}</span>
                    <span className={['h-1 w-4 rounded-full transition-all duration-200', isActive ? 'bg-slate-900 dark:bg-white' : 'bg-transparent'].join(' ')} />
                  </div>
                )}
              </NavLink>
            </div>

            {/* Center Add button — context-sensitive */}
            <button
              type="button"
              onClick={openContextAdd}
              aria-label={t('addItem.fabLabel')}
              className="absolute left-1/2 top-0 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-[60%] items-center justify-center rounded-full bg-slate-900 text-white shadow-elevated ring-4 ring-white transition-all hover:bg-slate-700 active:scale-90 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:ring-slate-900"
            >
              <Plus className="h-7 w-7" strokeWidth={2.5} />
            </button>
          </div>
        </nav>

        <NotificationPrompt
          userId={typeof user?.id === 'string' ? user.id : null}
          isBrowserSupported={push.isBrowserSupported}
          isBusy={push.isLoading}
          isSubscribed={push.isSubscribed}
          isSupported={push.isSupported}
          needsIosStandalone={push.needsIosStandalone}
          error={push.error}
          permission={push.permission}
          onEnable={push.subscribe}
        />
      </div>

      <Suspense fallback={null}>
        {isAddModalOpen ? <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} /> : null}
        {isAddPantryOpen ? <AddPantryItemModal isOpen={isAddPantryOpen} onClose={() => setIsAddPantryOpen(false)} /> : null}
        {isAddShoppingOpen ? <AddShoppingItemModal isOpen={isAddShoppingOpen} onClose={() => setIsAddShoppingOpen(false)} /> : null}
        {isSettingsOpen ? <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} /> : null}
      </Suspense>
    </div>
  );
}
