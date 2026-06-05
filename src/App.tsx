import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  Plus,
  User as UserIcon,
  History,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Car,
  ClipboardCheck,
  CheckCircle
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, UserRole, Notification } from './types';
import { MOCK_NOTIFICATIONS } from './constants';

// Screens
import UserManagementScreen from './screens/UserManagementScreen';
import MisComprasScreen from './screens/MisComprasScreen';
import VentasPendientesScreen from './screens/VentasPendientesScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import InspectorScreen from './screens/InspectorScreen';
import InventoryScreen from './screens/InventoryScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import AddProductScreen from './screens/AddProductScreen';
import POSScreen from './screens/POSScreen';
import ReportsScreen from './screens/ReportsScreen';
import ProfileScreen from './screens/ProfileScreen';
import SalesHistoryScreen from './screens/SalesHistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import LandingScreen from './screens/LandingScreen';

import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem('currentScreen');
    if (localStorage.getItem('isLoggedIn') === 'true') {
      return (saved as Screen) || 'dashboard';
    }
    return 'landing';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || 'admin';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [currentUser, setCurrentUser] = useState({
    id: localStorage.getItem('userId') || '',
    name: localStorage.getItem('userName') || 'Cargando...',
    initials: localStorage.getItem('userInitials') || '??',
    email: localStorage.getItem('userEmail') || '',
    avatar: localStorage.getItem('userAvatar') || (null as string | null)
  });

  // Load user profile and listen for updates
  React.useEffect(() => {
    const loadProfile = () => {
      const savedUser = localStorage.getItem(`profile_${userRole}`);
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser({
          id: parsed.id || parsed.uid || '',
          name: parsed.nombre || parsed.name || 'Usuario',
          initials: parsed.iniciales || (parsed.nombre || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
          email: parsed.correo || parsed.email || '',
          avatar: parsed.avatar || null
        });
      }
    };

    loadProfile();
    window.addEventListener('profileUpdated', loadProfile);
    return () => window.removeEventListener('profileUpdated', loadProfile);
  }, [userRole]);

  // Sincronizar estado con localStorage y URL
  React.useEffect(() => {
    localStorage.setItem('currentScreen', currentScreen);
    localStorage.setItem('userRole', userRole);
    // Sync URL hash with current screen
    window.location.hash = `#${currentScreen}`;

  }, [currentScreen, userRole]);

  // Escuchar cambios en el hash (Botón Atrás del navegador)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Screen;
      if (hash && hash !== currentScreen) {
        setCurrentScreen(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentScreen]);

  const navigateTo = (screen: Screen, productId?: string) => {
    if (productId) setSelectedProductId(productId);
    setCurrentScreen(screen);
    setShowNotifications(false);
  };

  const handleLogin = (role: UserRole, userData?: any) => {
    setUserRole(role);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', role);
    if (userData) {
      setCurrentUser({
        id: userData.id || '',
        name: userData.nombre,
        initials: userData.iniciales,
        email: userData.correo,
        avatar: userData.avatar || null
      });
      // Guardar datos para persistencia física
      localStorage.setItem('userId', userData.id || '');
      localStorage.setItem('userName', userData.nombre);
      localStorage.setItem('userEmail', userData.correo);
      localStorage.setItem('userInitials', userData.iniciales);
      if (userData.avatar) localStorage.setItem('userAvatar', userData.avatar);
    }
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUserRole('admin');
    setCurrentUser({ id: '', name: 'Usuario', initials: 'U', email: '', avatar: null });
    navigateTo('login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'admin': return 'primary';
      case 'vendedor': return 'emerald-500';
      case 'comprador': return 'blue-500';
      case 'inspector': return 'violet-500';
      default: return 'primary';
    }
  };

  const roleColor = getRoleColor();
  const roleBorderColor = 
    userRole === 'admin' ? 'border-primary/10' : 
    userRole === 'vendedor' ? 'border-emerald-500/20' : 
    userRole === 'comprador' ? 'border-blue-500/20' : 
    'border-violet-500/20';

  const roleBgColor = 
    userRole === 'admin' ? 'bg-primary' : 
    userRole === 'vendedor' ? 'bg-emerald-500' : 
    userRole === 'comprador' ? 'bg-blue-500' : 
    'bg-violet-500';

  const roleTextColor = 
    userRole === 'admin' ? 'text-primary' : 
    userRole === 'vendedor' ? 'text-emerald-500' : 
    userRole === 'comprador' ? 'text-blue-500' : 
    'text-violet-500';

  const roleHoverBg = 
    userRole === 'admin' ? 'hover:bg-primary/10' : 
    userRole === 'vendedor' ? 'hover:bg-emerald-500/10' : 
    userRole === 'comprador' ? 'hover:bg-blue-500/10' : 
    'hover:bg-violet-500/10';

  const roleHoverText = 
    userRole === 'admin' ? 'hover:text-primary' : 
    userRole === 'vendedor' ? 'hover:text-emerald-500' : 
    userRole === 'comprador' ? 'hover:text-blue-500' : 
    'hover:text-violet-500';

  const renderScreen = () => {

    switch (currentScreen) {
      case 'login':
        return <LoginScreen onLogin={handleLogin} onRegister={() => navigateTo('register')} />;
      case 'register':
        return <RegisterScreen onBack={() => navigateTo('login')} />;
      case 'inspector':
        return <InspectorScreen userRole={userRole} onBack={() => navigateTo('dashboard')} />;
      case 'dashboard':
        return <DashboardScreen userRole={userRole} onNavigate={navigateTo} />;
      case 'inventory':
        return (
          <ProtectedRoute allowedRoles={['admin', 'vendedor', 'comprador', 'inspector']} userRole={userRole} onAccessDenied={() => navigateTo('dashboard')}>
            <InventoryScreen userRole={userRole} onSelectProduct={(id) => navigateTo('product-detail', id)} onAddProduct={() => navigateTo('add-product')} />
          </ProtectedRoute>
        );
      case 'product-detail':
        return <ProductDetailScreen productId={selectedProductId || '1'} userRole={userRole} currentUser={currentUser} onBack={() => navigateTo('inventory')} />;
      case 'add-product':
          return (
            <ProtectedRoute allowedRoles={['admin', 'vendedor']} userRole={userRole} onAccessDenied={() => navigateTo('inventory')}>
              <AddProductScreen onBack={() => navigateTo('inventory')} />
            </ProtectedRoute>
          );
        case 'mis-compras':
          return <MisComprasScreen userRole={userRole} onBack={() => navigateTo('dashboard')} />;
        case 'ventas-pendientes':
          return <VentasPendientesScreen userRole={userRole} onBack={() => navigateTo('dashboard')} />;
        case 'pos':
        return (
          <ProtectedRoute allowedRoles={['admin', 'comprador']} userRole={userRole} onAccessDenied={() => navigateTo('dashboard')}>
            <POSScreen userRole={userRole} />
          </ProtectedRoute>
        );
      case 'reports':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={userRole} onAccessDenied={() => navigateTo('dashboard')}>
            <ReportsScreen />
          </ProtectedRoute>
        );
      case 'profile':
        return <ProfileScreen userRole={userRole} currentUser={currentUser} />;
      case 'sales-history':
        return (
          <ProtectedRoute allowedRoles={['admin', 'vendedor', 'comprador', 'inspector']} userRole={userRole} onAccessDenied={() => navigateTo('dashboard')}>
            <SalesHistoryScreen userRole={userRole} />
          </ProtectedRoute>
        );
      case 'settings':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={userRole} onAccessDenied={() => navigateTo('dashboard')}>
            <SettingsScreen />
          </ProtectedRoute>
        );
      case 'user-management':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={userRole} onAccessDenied={() => navigateTo('dashboard')}>
            <UserManagementScreen />
          </ProtectedRoute>
        );
      case 'landing':
          return <LandingScreen />;
        default:
        return <DashboardScreen userRole={userRole} onNavigate={navigateTo} />;
    }
  };

  const showSidebar = !['login', 'register'].includes(currentScreen);

  const getBgColor = () => {
    if (userRole === 'vendedor') return 'bg-[#0a1a14]'; // Darker emerald for seller
    if (userRole === 'comprador') return 'bg-[#0a1420]'; // Darker blue for buyer
    if (userRole === 'inspector') return 'bg-[#150f22]'; // Darker violet for inspector
    return 'bg-background-dark';
  };

  return (
    <div translate="no" className={`min-h-screen flex ${getBgColor()} tech-pattern transition-colors duration-500 overflow-hidden`}>
      <Toaster position="top-right" />
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && isSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={`w-72 bg-surface-dark border-r ${roleBorderColor} flex flex-col z-50`}
          >
            <div className="p-6 flex items-center gap-3">
              <div className={`w-10 h-10 ${roleBgColor} rounded-lg flex items-center justify-center glow-shadow`}>
                <Car className="text-background-dark" size={24} />
              </div>
              <h1 className="text-xl font-black tracking-tight text-white">Auto<span className={roleTextColor}>Swap</span></h1>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-hide">
              <SidebarItem 
                icon={<LayoutDashboard size={20} />} 
                label="Dashboard" 
                active={currentScreen === 'dashboard'} 
                onClick={() => navigateTo('dashboard')}
                roleColor={roleColor}
              />

              {userRole === 'admin' && (
                <SidebarItem 
                  icon={<Users size={20} />} 
                  label="Gestión de Usuarios" 
                  active={currentScreen === 'user-management'} 
                  onClick={() => navigateTo('user-management')}
                  roleColor={roleColor}
                />
              )}

              {(userRole === 'admin' || userRole === 'vendedor') && (
                <SidebarItem
                  icon={<Package size={20} />}
                  label="Gestión de Productos"
                  active={currentScreen === 'add-product'}
                  onClick={() => navigateTo('add-product')}
                  roleColor={roleColor}
                />
              )}

            {userRole === 'inspector' && (
              <SidebarItem
                icon={<CheckCircle size={20} />}
                label="Vehículos a Inspeccionar"
                active={currentScreen === 'inspector'}
                onClick={() => navigateTo('inspector')}
                roleColor={roleColor}
              />
            )}

              {(userRole === 'admin' || userRole === 'comprador' || userRole === 'vendedor' || userRole === 'inspector') && (
                <SidebarItem 
                  icon={<Car size={20} />} 
                  label={
                    userRole === 'vendedor' ? 'Mis Autos en Venta' : 
                    userRole === 'inspector' ? 'Vehículos a Inspeccionar' : 
                    'Catálogo de Autos'
                  } 
                  active={currentScreen === 'inventory' || currentScreen === 'product-detail'} 
                  onClick={() => navigateTo('inventory')}
                  roleColor={roleColor}
                />
              )}

              {userRole === 'vendedor' && (
                <SidebarItem 
                  icon={<Plus size={20} />} 
                  label="Publicar Auto" 
                  active={currentScreen === 'add-product'} 
                  onClick={() => navigateTo('add-product')}
                  roleColor={roleColor}
                />
              )}


            {userRole === 'vendedor' && (
              <SidebarItem 
                icon={<History size={20} />} 
                label='Ventas Pendientes' 
                active={currentScreen === 'ventas-pendientes'} 
                onClick={() => navigateTo('ventas-pendientes')} 
                roleColor={roleColor}
              />
            )}

              <SidebarItem 
                icon={<History size={20} />}
                label={
                  userRole === 'vendedor' ? 'Mis Ventas Realizadas' : 
                  userRole === 'inspector' ? 'Historial de Visitas' : 
                  'Historial de Ventas'
                }
                active={currentScreen === 'sales-history'}
                onClick={() => navigateTo('sales-history')}
                roleColor={roleColor}
              />

                {userRole === 'comprador' && (
                  <SidebarItem
                    icon={<History size={20} />}
                    label='Mis Compras'
                    active={currentScreen === 'mis-compras'}
                    onClick={() => navigateTo('mis-compras')}
                    roleColor={roleColor}
                  />
                )}

              {userRole === 'admin' && (
                <SidebarItem 
                  icon={<BarChart3 size={20} />} 
                  label="Reportes" 
                  active={currentScreen === 'reports'} 
                  onClick={() => navigateTo('reports')}
                  roleColor={roleColor}
                />
              )}
            </nav>

            <div className={`p-4 border-t ${roleBorderColor} space-y-2`}>
              <SidebarItem 
                icon={<UserIcon size={20} />} 
                label="Mi Perfil" 
                active={currentScreen === 'profile'}
                onClick={() => navigateTo('profile')}
                roleColor={roleColor}
              />
              {userRole === 'admin' && (
                <SidebarItem 
                  icon={<Settings size={20} />} 
                  label="Configuración" 
                  active={currentScreen === 'settings'}
                  onClick={() => navigateTo('settings')}
                  roleColor={roleColor}
                />
              )}
              <SidebarItem 
                icon={<LogOut size={20} />} 
                label="Cerrar Sesión" 
                onClick={handleLogout}
                roleColor={roleColor}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {showSidebar && (
          <header className={`h-20 border-b ${roleBorderColor} bg-surface-dark/50 backdrop-blur-md flex items-center justify-between px-8 z-40`}>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 ${roleHoverBg} rounded-lg transition-colors ${roleTextColor}`}
              >
                <Menu size={20} />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar productos, órdenes..." 
                  className={`bg-background-dark/50 border ${roleBorderColor} rounded-full py-2 pl-10 pr-4 w-80 focus:outline-none focus:border-${roleColor}/50 transition-all text-sm`}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 ${roleHoverBg} rounded-full transition-colors text-slate-300`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className={`absolute top-2 right-2 w-2 h-2 ${roleBgColor} rounded-full glow-shadow`}></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-96 bg-surface-dark border border-primary/20 rounded-[32px] shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
                    >
                      <div className="p-6 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                        <h3 className="font-bold text-white">Notificaciones</h3>
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-primary font-bold hover:underline"
                        >
                          Marcar todas como leídas
                        </button>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        {notifications.length === 0 ? (
                          <div className="p-10 text-center text-slate-500">
                            <Bell size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-5 border-b border-primary/5 hover:bg-primary/5 transition-colors flex gap-4 ${!n.read ? 'bg-primary/[0.02]' : ''}`}>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                n.type === 'warning' ? 'bg-amber-400/10 text-amber-400' :
                                n.type === 'success' ? 'bg-emerald-400/10 text-emerald-400' :
                                n.type === 'error' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-blue-400/10 text-blue-400'
                              }`}>
                                {n.type === 'warning' ? <AlertTriangle size={20} /> :
                                 n.type === 'success' ? <CheckCircle2 size={20} /> :
                                 n.type === 'error' ? <XCircle size={20} /> :
                                 <Info size={20} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-bold text-white">{n.title}</p>
                                  <span className="text-[10px] text-slate-500">{n.time}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                              </div>
                              {!n.read && (
                                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <button className="w-full py-4 text-xs font-bold text-slate-500 hover:text-primary transition-colors border-t border-primary/10">
                        Ver todas las notificaciones
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={`flex items-center gap-3 pl-6 border-l ${roleBorderColor}`}>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                  <p className={`text-xs ${roleTextColor} uppercase font-bold tracking-widest`}>{userRole}</p>
                </div>
                <button 
                  onClick={() => navigateTo('profile')}
                  className={`w-10 h-10 rounded-full ${
                    userRole === 'admin' ? 'bg-primary/20 border-primary/30 text-primary' : 
                    userRole === 'vendedor' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' : 
                    userRole === 'comprador' ? 'bg-blue-500/20 border-blue-500/30 text-blue-500' : 
                    'bg-violet-500/20 border-violet-500/30 text-violet-500'
                  } border flex items-center justify-center font-bold hover:scale-110 transition-all overflow-hidden`}
                >
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    currentUser.initials
                  )}
                </button>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  roleColor?: string;
  badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, roleColor = 'primary', badge }) => {
  const activeBg = 
    roleColor === 'primary' ? 'bg-primary' : 
    roleColor === 'emerald-500' ? 'bg-emerald-500' : 
    roleColor === 'blue-500' ? 'bg-blue-500' : 
    'bg-violet-500';

  const hoverBg = 
    roleColor === 'primary' ? 'hover:bg-primary/10' : 
    roleColor === 'emerald-500' ? 'hover:bg-emerald-500/10' : 
    roleColor === 'blue-500' ? 'hover:bg-blue-500/10' : 
    'hover:bg-violet-500/10';

  const hoverText = 
    roleColor === 'primary' ? 'hover:text-primary' : 
    roleColor === 'emerald-500' ? 'hover:text-emerald-500' : 
    roleColor === 'blue-500' ? 'hover:text-blue-500' : 
    'hover:text-violet-500';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 relative ${
        active 
          ? `${activeBg} text-background-dark font-semibold glow-shadow` 
          : `text-slate-400 ${hoverBg} ${hoverText}`
      }`}
    >
      {icon}
      <span className="text-sm flex-1 text-left">{label}</span>
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-background-dark text-white' : `${activeBg} text-background-dark`}`}>
          {badge}
        </span>
      )}
    </button>
  );
};

export default App;
