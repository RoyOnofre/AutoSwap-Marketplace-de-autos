import React from 'react';
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  Star,
  Zap,
  Shield,
  UserCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole, Screen } from '../types';

interface DashboardScreenProps {
  userRole: UserRole;
  onNavigate?: (screen: Screen) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ userRole, onNavigate }) => {
  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">AutoSwap Bolivia - Marketplace de autos usados en Bolivia</h1>
          <p className="text-slate-400">Resumen ejecutivo del sistema TechStore Pro</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Sistema Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard 
          icon={<TrendingUp size={24} />}
          label="VENTAS DEL DÍA (AUTOS)"
          value="Bs. 12,450"
          trend="+12.5%"
          color="text-emerald-400"
        />
        <DashboardStatCard 
          icon={<Package size={24} />}
          label="AUTOS LISTADOS"
          value="1,284"
          trend="+4"
          color="text-blue-400"
        />
        <DashboardStatCard 
          icon={<Users size={24} />}
          label="USUARIOS REGISTRADOS"
          value="48"
          trend="+18%"
          color="text-violet-400"
        />
        <DashboardStatCard 
          icon={<Zap size={24} />}
          label="INSPECCIONES COMPLETADAS"
          value="98.2%"
          trend="+0.5%"
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-[32px] border border-primary/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-primary" size={20} />
              Actividad Reciente
            </h3>
            <button 
              onClick={() => onNavigate?.('sales-history')}
              className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
            >
              Ver todo
            </button>
          </div>
          <div className="space-y-6">
            <ActivityItem 
              title="Venta completada #8492" 
              desc="iPhone 15 Pro Max - $1,299.00" 
              time="Hace 5 min" 
              icon={<ShoppingCart size={18} />}
              color="bg-emerald-400/10 text-emerald-400"
            />
            <ActivityItem 
              title="Stock bajo detectado" 
              desc="MacBook Air M2 - Solo 2 unidades" 
              time="Hace 12 min" 
              icon={<AlertTriangle size={18} />}
              color="bg-amber-400/10 text-amber-400"
            />
            <ActivityItem 
              title="Nuevo usuario registrado" 
              desc="Carlos Ruiz - Rol: Cajero" 
              time="Hace 45 min" 
              icon={<UserCheck size={18} />}
              color="bg-blue-400/10 text-blue-400"
            />
          </div>
        </div>

        {/* System Health */}
        <div className="glass-panel p-8 rounded-[32px] border border-primary/10">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Shield className="text-primary" size={20} />
            Estado del Sistema
          </h3>
          <div className="space-y-6">
            <HealthIndicator label="Base de Datos" status="Óptimo" percent={94} />
            <HealthIndicator label="Servidor API" status="Estable" percent={88} />
            <HealthIndicator label="Seguridad" status="Protegido" percent={100} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCajeroDashboard = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Hola, <span className="text-primary">Alejandro</span></h1>
          <p className="text-slate-400">Tu turno ha comenzado. ¡Que tengas excelentes ventas!</p>
        </div>
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onNavigate?.('pos')}
            className="px-6 py-3 bg-primary text-background-dark rounded-2xl font-black flex items-center gap-2 glow-shadow cursor-pointer hover:scale-105 transition-all"
          >
            <ShoppingCart size={20} />
            ABRIR CAJA
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatCard 
          icon={<TrendingUp size={24} />} 
          label="Mis Ventas Hoy" 
          value="$3,840.00" 
          trend="+15%" 
          color="text-emerald-400"
        />
        <DashboardStatCard 
          icon={<ShoppingCart size={24} />} 
          label="Órdenes" 
          value="24" 
          trend="+2" 
          color="text-blue-400"
        />
        <DashboardStatCard 
          icon={<Star size={24} />} 
          label="Meta Diaria" 
          value="76%" 
          trend="+5%" 
          color="text-amber-400"
        />
      </div>

      <div className="glass-panel p-8 rounded-[32px] border border-primary/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white">Mis Últimas Transacciones</h3>
          <button 
            onClick={() => onNavigate?.('sales-history')}
            className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
          >
            Ver todo
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs font-bold uppercase tracking-widest border-b border-primary/10">
                <th className="pb-4">ID</th>
                <th className="pb-4">Cliente</th>
                <th className="pb-4">Total</th>
                <th className="pb-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="group hover:bg-primary/5 transition-colors">
                  <td className="py-4 text-sm text-slate-300">#TRX-00{i}</td>
                  <td className="py-4 text-sm font-bold text-white">Cliente General</td>
                  <td className="py-4 text-sm font-black text-primary">$450.00</td>
                  <td className="py-4">
                    <span className="px-3 py-1 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold rounded-full uppercase">Completada</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderClienteDashboard = () => (
    <div className="space-y-8">
      <div className="relative h-64 rounded-[40px] overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=2070" 
          alt="Banner" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background-dark to-transparent flex flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="px-4 py-1 bg-primary text-background-dark text-xs font-black rounded-full uppercase tracking-widest mb-4 inline-block">Oferta Especial</span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
              La Tecnología del <br /><span className="text-primary">Futuro</span> Hoy
            </h1>
            <p className="text-slate-300 max-w-md mb-6">Explora nuestra nueva colección de dispositivos premium con hasta 20% de descuento.</p>
            <button 
              onClick={() => onNavigate?.('inventory')}
              className="px-8 py-3 bg-white text-background-dark font-black rounded-2xl hover:bg-primary transition-colors"
            >
              Ver Catálogo
            </button>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-panel p-8 rounded-[32px] border border-primary/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-400/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Mis Pedidos</h3>
          <p className="text-slate-400 text-sm mb-6">Rastrea tus compras y descarga tus facturas.</p>
          <button 
            onClick={() => onNavigate?.('sales-history')}
            className="text-primary font-bold text-sm uppercase tracking-widest hover:underline"
          >
            Gestionar
          </button>
        </div>
        <div className="glass-panel p-8 rounded-[32px] border border-primary/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-violet-400/10 text-violet-400 rounded-2xl flex items-center justify-center mb-6">
            <Star size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Favoritos</h3>
          <p className="text-slate-400 text-sm mb-6">Guarda los productos que más te gustan.</p>
          <button className="text-primary font-bold text-sm uppercase tracking-widest hover:underline">Ver lista</button>
        </div>
        <div className="glass-panel p-8 rounded-[32px] border border-primary/10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-400/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
            <Zap size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Soporte Tech</h3>
          <p className="text-slate-400 text-sm mb-6">¿Necesitas ayuda con tu compra?</p>
          <button className="text-primary font-bold text-sm uppercase tracking-widest hover:underline">Contactar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      {userRole === 'admin' && renderAdminDashboard()}
      {userRole === 'cajero' && renderCajeroDashboard()}
      {userRole === 'cliente' && renderClienteDashboard()}
    </div>
  );
};

const DashboardStatCard = ({ icon, label, value, trend, color }: any) => (
  <div className="glass-panel p-6 rounded-[32px] border border-primary/10 hover:border-primary/30 transition-all group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 bg-background-dark rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold ${color}`}>
        {trend}
        <ArrowUpRight size={14} />
      </div>
    </div>
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{label}</p>
    <h3 className="text-2xl font-black text-white mt-1">{value}</h3>
  </div>
);

const ActivityItem = ({ title, desc, time, icon, color }: any) => (
  <div className="flex items-center gap-4 group cursor-pointer">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{title}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
    <span className="text-[10px] font-bold text-slate-600 uppercase">{time}</span>
  </div>
);

const HealthIndicator = ({ label, status, percent }: any) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <span className="text-xs font-bold text-primary">{status}</span>
    </div>
    <div className="w-full h-2 bg-background-dark rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        className="h-full bg-primary glow-shadow"
      ></motion.div>
    </div>
  </div>
);

export default DashboardScreen;
