import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, UserMinus, Clock, Search, Filter,
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight, X,
  ShieldCheck, Eye, EyeOff, RefreshCw, AlertTriangle,
  CheckCircle2, Loader2, Download
} from 'lucide-react';
import { api } from "../api.1";

// ─── Tipos locales ────────────────────────────────────
interface UsuarioAPI {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  estado: string;
  iniciales: string;
  avatar?: string;
  ultimo_login: string;
  kyc_estado?: string;
}

type ModalMode = 'crear' | 'editar' | 'eliminar' | 'reset' | null;

const ROL_COLORES: Record<string, string> = {
  admin:     'bg-orange-500/10 text-orange-400 border-orange-500/20',
  vendedor:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  comprador: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  inspector: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

// ─── Componente principal ─────────────────────────────
const UserManagementScreen: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [buscar, setBuscar] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroKyc, setFiltroKyc] = useState('todos');

  // Modal
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAPI | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  
  // Auditoria
  const [logs, setLogs] = useState<any[]>([]);
  const [verLogs, setVerLogs] = useState(false);

  // Formulario crear/editar
  const [form, setForm] = useState({ nombre: '', correo: '', rol: 'comprador', estado: 'Activo', contrasena: '', confirmar: '', kyc_estado: 'Pendiente' });
  const [mostrarPass, setMostrarPass] = useState(false);
  const [resetCorreo, setResetCorreo] = useState('');
  const [resetNueva, setResetNueva] = useState('');

  // ── Cargar usuarios ──────────────────────────────────
  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsuarios({ buscar, rol: filtroRol, estado: filtroEstado });
      if (!data || !Array.isArray(data)) {
        console.error("API no devolvió un array:", data);
        setUsuarios([]);
      } else {
        let finalData = data;
        if (filtroKyc !== 'todos') {
          finalData = data.filter((u: any) => u.kyc_estado === filtroKyc);
        }
        setUsuarios(finalData);
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [buscar, filtroRol, filtroEstado, filtroKyc]);

  useEffect(() => {
    const timer = setTimeout(() => cargarUsuarios(), 300);
    return () => clearTimeout(timer);
  }, [cargarUsuarios]);

  // ── Stats ────────────────────────────────────────────
  const total    = usuarios.length;
  const activos  = usuarios.filter(u => u.estado === 'Activo').length;
  const kycPendientes = usuarios.filter(u => u.kyc_estado === 'Pendiente').length;
  const admins   = usuarios.filter(u => u.rol === 'admin').length;

  // ── Abrir modales ────────────────────────────────────
  const abrirCrear = () => {
    setForm({ nombre: '', correo: '', rol: 'comprador', estado: 'Activo', contrasena: '', confirmar: '', kyc_estado: 'Pendiente' });
    setModalError(''); setModalSuccess('');
    setModalMode('crear');
  };

  const abrirEditar = (u: UsuarioAPI) => {
    setUsuarioSeleccionado(u);
    setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol, estado: u.estado, contrasena: '', confirmar: '', kyc_estado: u.kyc_estado || 'Pendiente' });
    setModalError(''); setModalSuccess('');
    setModalMode('editar');
  };

  const abrirEliminar = (u: UsuarioAPI) => {
    setUsuarioSeleccionado(u);
    setModalError(''); setModalSuccess('');
    setModalMode('eliminar');
  };

  const abrirReset = (u: UsuarioAPI) => {
    setUsuarioSeleccionado(u);
    setResetCorreo(u.correo);
    setResetNueva('');
    setModalError(''); setModalSuccess('');
    setModalMode('reset');
  };

  const cerrarModal = () => { setModalMode(null); setUsuarioSeleccionado(null); };

  // ── Acciones ─────────────────────────────────────────
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.contrasena !== form.confirmar) { setModalError('Las contraseñas no coinciden'); return; }
    if (form.contrasena.length < 6) { setModalError('Mínimo 6 caracteres'); return; }
    setModalLoading(true); setModalError('');
    try {
      await api.registrar(form.nombre, form.correo, form.contrasena, form.rol);
      setModalSuccess('¡Usuario creado exitosamente!');
      setTimeout(() => { cerrarModal(); cargarUsuarios(); }, 1200);
    } catch (e: any) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  const handleEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioSeleccionado) return;
    if (form.contrasena && form.contrasena !== form.confirmar) { setModalError('Las contraseñas no coinciden'); return; }
    setModalLoading(true); setModalError('');
    try {
      const payload: any = { nombre: form.nombre, correo: form.correo, rol: form.rol, estado: form.estado, kyc_estado: form.kyc_estado };
      if (form.contrasena) payload.nueva_contrasena = form.contrasena;
      await api.actualizarUsuario(usuarioSeleccionado.id, payload);
      setModalSuccess('¡Usuario actualizado!');
      setTimeout(() => { cerrarModal(); cargarUsuarios(); }, 1200);
    } catch (e: any) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  const handleEliminar = async () => {
    if (!usuarioSeleccionado) return;
    setModalLoading(true); setModalError('');
    try {
      await api.eliminarUsuario(usuarioSeleccionado.id);
      setModalSuccess('Usuario eliminado');
      setTimeout(() => { cerrarModal(); cargarUsuarios(); }, 1000);
    } catch (e: any) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNueva.length < 6) { setModalError('Mínimo 6 caracteres'); return; }
    setModalLoading(true); setModalError('');
    try {
      await api.resetContrasena(resetCorreo, resetNueva);
      setModalSuccess('¡Contraseña restablecida!');
      setTimeout(() => cerrarModal(), 1200);
    } catch (e: any) { setModalError(e.message); }
    finally { setModalLoading(false); }
  };

  const handleToggleEstado = async (u: UsuarioAPI) => {
    try {
      await api.cambiarEstadoUsuario(u.id);
      cargarUsuarios();
    } catch (e: any) { setError(e.message); }
  };

  const abrirLogs = async () => {
    setVerLogs(true);
    try {
      const res = await fetch('http://localhost:8004/api/auditoria');
      const data = await res.json();
      setLogs(data);
    } catch (e) { console.error(e); }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div className="p-8 space-y-8" translate="no">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <p className="text-slate-400">Administra accesos y roles — conectado a la base de datos</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={abrirLogs}
            className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-primary/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-violet-500/10 hover:text-violet-400 transition-all"
          >
            <Clock size={18} />
            Ver Logs
          </button>
          <button 
            onClick={() => api.descargarReporteUsuarios()}
            className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-primary/10 rounded-xl text-sm font-medium text-slate-300 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Download size={18} />
            Exportar PDF
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background-dark rounded-xl text-sm font-bold glow-shadow hover:scale-105 transition-all"
          >
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-blue-400" size={22}/>} label="Total" value={total} color="blue" />
        <StatCard icon={<UserCheck className="text-emerald-400" size={22}/>} label="Activos" value={activos} color="emerald" />
        <StatCard icon={<Clock className="text-amber-400" size={22}/>} label="KYC Pendiente" value={kycPendientes} color="amber" />
        <StatCard icon={<ShieldCheck className="text-violet-400" size={22}/>} label="Admins" value={admins} color="violet" />
      </div>

      {/* Filtros */}
      <div className="bg-surface-dark/50 border border-primary/10 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            className="w-full bg-background-dark/60 border border-primary/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 text-white"
          />
        </div>
        <select
          value={filtroRol}
          onChange={e => setFiltroRol(e.target.value)}
          className="bg-background-dark/60 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary/50"
        >
          <option value="todos">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="vendedor">Vendedor</option>
          <option value="comprador">Comprador</option>
          <option value="inspector">Inspector</option>
        </select>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="bg-background-dark/60 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary/50"
        >
          <option value="todos">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <select
          value={filtroKyc}
          onChange={e => setFiltroKyc(e.target.value)}
          className="bg-background-dark/60 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary/50"
        >
          <option value="todos">Todos los KYC</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobado">Aprobado</option>
          <option value="Rechazado">Rechazado</option>
        </select>
        <button onClick={cargarUsuarios} className="p-2.5 bg-background-dark/60 border border-primary/10 rounded-xl text-slate-400 hover:text-primary transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Error global */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex items-center gap-2">
          <AlertTriangle size={18}/> {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-surface-dark/50 border border-primary/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="animate-spin text-primary" size={28}/> Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Users size={40} className="opacity-30"/>
            <p>No se encontraron usuarios con esos filtros</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background-dark/30 border-b border-primary/10">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado KYC</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último Login</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {usuarios.map(u => (
                  <tr
                    key={u.id || Math.random().toString()}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                          {u.iniciales || u.nombre?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{u.nombre}</p>
                          <p className="text-xs text-slate-400">{u.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${ROL_COLORES[u.rol] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${u.estado === 'Activo' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-rose-400/10 text-rose-400 border-rose-400/20'}`}>
                        {u.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        u.kyc_estado === 'Aprobado' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                        u.kyc_estado === 'Rechazado' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                        'bg-amber-400/10 text-amber-400 border-amber-400/20'
                      }`}>
                        {u.kyc_estado || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                        <Clock size={13}/> {u.ultimo_login || 'Nunca'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ActionBtn icon={<Edit2 size={14}/>} label="Editar" color="blue" onClick={() => abrirEditar(u)} />
                        <ActionBtn
                          icon={u.estado === 'Activo' ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                          label={u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                          color={u.estado === 'Activo' ? 'amber' : 'emerald'}
                          onClick={() => handleToggleEstado(u)}
                        />
                        <ActionBtn icon={<Filter size={14}/>} label="Reset Pass" color="violet" onClick={() => abrirReset(u)} />
                        <ActionBtn icon={<Trash2 size={14}/>} label="Eliminar" color="rose" onClick={() => abrirEliminar(u)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t border-primary/10 text-sm text-slate-500">
          Mostrando {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── MODALES ── */}
      {modalMode && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div
            className="bg-surface-dark border border-primary/20 rounded-3xl w-full max-w-lg shadow-2xl"
          >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-primary/10">
                <h2 className="text-xl font-bold text-white">
                  {modalMode === 'crear'   && '➕ Nuevo Usuario'}
                  {modalMode === 'editar'  && '✏️ Editar Usuario'}
                  {modalMode === 'eliminar'&& '🗑️ Eliminar Usuario'}
                  {modalMode === 'reset'   && '🔑 Restablecer Contraseña'}
                </h2>
                <button onClick={cerrarModal} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-primary/10 transition-all"><X size={20}/></button>
              </div>

              <div className="p-6 space-y-4">

                {/* Mensajes */}
                {modalError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center gap-2">
                    <AlertTriangle size={16}/> {modalError}
                  </div>
                )}
                {modalSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
                    <CheckCircle2 size={16}/> {modalSuccess}
                  </div>
                )}

                {/* CREAR / EDITAR */}
                {(modalMode === 'crear' || modalMode === 'editar') && (
                  <form onSubmit={modalMode === 'crear' ? handleCrear : handleEditar} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Nombre completo">
                        <input
                          value={form.nombre} onChange={e => setForm(p=>({...p, nombre: e.target.value}))}
                          placeholder="Ej: Juan Pérez" required
                          className="input-field"
                        />
                      </Field>
                      <Field label="Correo electrónico">
                        <input
                          type="email" value={form.correo} onChange={e => setForm(p=>({...p, correo: e.target.value}))}
                          placeholder="correo@ejemplo.com" required
                          className="input-field"
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <Field label="Rol">
                        <select value={form.rol} onChange={e => setForm(p=>({...p, rol: e.target.value}))} className="input-field">
                          <option value="admin">Administrador</option>
                          <option value="vendedor">Vendedor</option>
                          <option value="comprador">Comprador</option>
                          <option value="inspector">Inspector</option>
                        </select>
                      </Field>
                      <Field label="Estado">
                        <select value={form.estado} onChange={e => setForm(p=>({...p, estado: e.target.value}))} className="input-field">
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      </Field>
                      <Field label="Estado KYC">
                        <select
                          value={form.kyc_estado}
                          onChange={e => setForm(p=>({...p, kyc_estado: e.target.value}))}
                          className="input-field"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </Field>
                    </div>
                    <div className="border-t border-primary/10 pt-4">
                      <p className="text-xs text-slate-500 mb-3">{modalMode === 'editar' ? 'Dejar en blanco para no cambiar contraseña' : 'Contraseña de acceso (mín. 6 caracteres)'}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Contraseña">
                          <div className="relative">
                            <input
                              type={mostrarPass ? 'text' : 'password'}
                              value={form.contrasena} onChange={e => setForm(p=>({...p, contrasena: e.target.value}))}
                              placeholder="••••••••" required={modalMode === 'crear'}
                              className="input-field pr-10"
                            />
                            <button type="button" onClick={() => setMostrarPass(!mostrarPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                              {mostrarPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                          </div>
                        </Field>
                        <Field label="Confirmar">
                          <input
                            type={mostrarPass ? 'text' : 'password'}
                            value={form.confirmar} onChange={e => setForm(p=>({...p, confirmar: e.target.value}))}
                            placeholder="••••••••" required={modalMode === 'crear'}
                            className="input-field"
                          />
                        </Field>
                      </div>
                    </div>
                    <button type="submit" disabled={modalLoading} className="w-full bg-primary text-background-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50 mt-2">
                      {modalLoading ? <><Loader2 size={18} className="animate-spin"/> Guardando...</> : modalMode === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                    </button>
                  </form>
                )}

                {/* ELIMINAR */}
                {modalMode === 'eliminar' && usuarioSeleccionado && (
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                      <p className="text-slate-300 text-sm">¿Seguro que deseas eliminar a <strong className="text-white">{usuarioSeleccionado.nombre}</strong>?</p>
                      <p className="text-slate-400 text-xs mt-2">⚠️ Si tiene ventas registradas, no podrá eliminarse. Usa "Desactivar" en su lugar.</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={cerrarModal} className="flex-1 py-3 rounded-xl border border-primary/20 text-slate-300 hover:bg-primary/5 transition-all text-sm font-medium">Cancelar</button>
                      <button onClick={handleEliminar} disabled={modalLoading} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                        {modalLoading ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Eliminar
                      </button>
                    </div>
                  </div>
                )}

                {/* RESET CONTRASEÑA */}
                {modalMode === 'reset' && (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-sm text-slate-300">
                      Restableciendo contraseña para: <strong className="text-white">{resetCorreo}</strong>
                    </div>
                    <Field label="Nueva contraseña (mín. 6 caracteres)">
                      <div className="relative">
                        <input
                          type={mostrarPass ? 'text' : 'password'}
                          value={resetNueva} onChange={e => setResetNueva(e.target.value)}
                          placeholder="Nueva contraseña" required className="input-field pr-10"
                        />
                        <button type="button" onClick={() => setMostrarPass(!mostrarPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                          {mostrarPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </Field>
                    <button type="submit" disabled={modalLoading} className="w-full bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50">
                      {modalLoading ? <><Loader2 size={18} className="animate-spin"/> Guardando...</> : '🔑 Restablecer Contraseña'}
                    </button>
                  </form>
                )}

              </div>
            </div>
          </div>
        )}

        {/* MODAL DE LOGS */}
        {verLogs && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-surface-dark border border-primary/20 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
              <div className="p-6 border-b border-primary/10 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="text-violet-400" /> Logs de Actividad del Sistema
                </h2>
                <button onClick={() => setVerLogs(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-3">
                {logs.length === 0 ? (
                  <p className="text-center py-10 text-slate-500">No hay registros aún.</p>
                ) : (
                  logs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-background-dark/50 border border-primary/5 rounded-xl flex justify-between items-center gap-4">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.accion === 'ELIMINAR' ? 'bg-rose-500/20 text-rose-400' :
                          log.accion === 'LOGIN' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-violet-500/20 text-violet-400'
                        }`}>
                          {log.accion}
                        </span>
                        <p className="text-sm text-slate-200 mt-1">{log.descripcion}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Por: {log.usuario}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400 font-mono">{log.fecha}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

// ─── Sub-componentes ──────────────────────────────────
const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-surface-dark/50 border border-primary/10 p-5 rounded-2xl hover:border-primary/30 transition-all">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-background-dark rounded-xl">{icon}</div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const ActionBtn: React.FC<{ icon: React.ReactNode; label: string; color: string; onClick: () => void }> = ({ icon, label, color, onClick }) => {
  const colors: Record<string, string> = {
    blue:   'hover:bg-blue-500/10   hover:text-blue-400   hover:border-blue-400/30',
    amber:  'hover:bg-amber-500/10  hover:text-amber-400  hover:border-amber-400/30',
    emerald:'hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-400/30',
    rose:   'hover:bg-rose-500/10   hover:text-rose-400   hover:border-rose-400/30',
    violet: 'hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-400/30',
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 border border-transparent rounded-lg text-slate-500 transition-all ${colors[color] ?? ''}`}
    >
      {icon}
    </button>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-slate-400">{label}</label>
    {children}
  </div>
);

export default UserManagementScreen;
