import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, User, Tag, Package, Printer, X, CheckCircle, Download } from 'lucide-react';
import { RatingModal } from '../components/RatingModal';
import { api } from "../api.1";
import { UserRole } from '../types';

interface POSScreenProps {
  userRole: UserRole;
  currentUser: any;
}

const POSScreen: React.FC<POSScreenProps> = ({ userRole, currentUser }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Vendedor');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState('');

  const isClient = userRole === 'cliente';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await api.getProductos();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) { console.error("Error loading products"); }
      finally { setLoading(false); }
    };
    fetchProducts();
    window.addEventListener('inventoryUpdated', fetchProducts);
    return () => window.removeEventListener('inventoryUpdated', fetchProducts);
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    else setCart([...cart, { product, quantity: 1 }]);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => item.product.id === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeFromCart = (productId: string) => setCart(cart.filter(item => item.product.id !== productId));

  const subtotal = cart.reduce((sum, item) => sum + (item.product.precio * item.quantity), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleProcessPayment = async () => {
    if (cart.length === 0) return;
    try {
      const ventaData = {
        total: total,
        vendedor: customerName,
        items: cart.length
      };
      await api.registrarVenta(ventaData);

      const data = {
        id: `INV-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toLocaleString(),
        items: [...cart],
        subtotal,
        tax,
        total,
        customer: customerName
      };
      setInvoiceData(data);
      setShowInvoice(true);
      setCart([]);
      // Open rating modal for the first purchased listing
      if (data.items && data.items.length > 0) {
        setSelectedListingId(data.items[0].product.id);
        setShowRatingModal(true);
      }
    } catch (error) {
      alert("Error al sincronizar la venta con el servidor MASTER");
    }
  };

  if (loading) return <div className="p-8 flex flex-col items-center justify-center h-full space-y-4 animate-pulse"><div className="w-12 h-12 bg-primary rounded-xl animate-spin"></div><div className="text-primary font-black uppercase tracking-widest">Cargando Tienda...</div></div>;

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden relative animate-in fade-in duration-500">
      {/* Modal de Factura Nativo */}
      {showInvoice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background-dark/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-white rounded-[40px] overflow-hidden shadow-2xl flex flex-col text-slate-900 animate-in zoom-in-95 duration-500">
            <div className="bg-emerald-500 p-10 text-white flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2"><CheckCircle size={32} /><h2 className="text-3xl font-black tracking-tighter uppercase">Venta Exitosa</h2></div>
                <p className="text-emerald-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">{invoiceData.id} / {invoiceData.date}</p>
              </div>
              <button onClick={() => setShowInvoice(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={28} /></button>
            </div>
            <div className="p-10 flex-1 overflow-y-auto max-h-[50vh] space-y-6">
              <div className="flex justify-between items-end border-b border-slate-100 pb-4"><h3 className="text-2xl font-black text-slate-800">FACTURA</h3><div className="text-right text-xs font-bold text-slate-400">CLIENTE:<br /><span className="text-slate-800">{invoiceData.customer}</span></div></div>
              <div className="space-y-4">
                {invoiceData.items.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between items-center text-sm">
                    <div className="flex flex-col"><span className="font-bold text-slate-800 uppercase tracking-tighter">{item.product.nombre || item.product.name}</span><span className="text-slate-400 text-xs">CANTIDAD: {item.quantity}</span></div>
                    <span className="font-black text-slate-800 text-lg">${(item.product.precio * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t-2 border-dashed border-slate-200 flex justify-between items-center">
                <span className="text-3xl font-black text-slate-800">TOTAL</span>
                <span className="text-4xl font-black text-emerald-600 tracking-tighter">${invoiceData.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="p-10 bg-slate-50 flex gap-4">
              <button onClick={() => setShowInvoice(false)} className="flex-1 bg-slate-900 text-white font-black py-5 rounded-[24px] hover:bg-slate-800 transition-all text-lg">CERRAR</button>
              <button className="bg-emerald-500 text-white p-5 rounded-[24px] hover:scale-105 transition-all"><Printer size={28} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Catálogo de Productos */}
      <div className="flex-1 flex flex-col p-10 overflow-hidden bg-background-dark/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div><h1 className="text-5xl font-black text-white tracking-tighter uppercase">{isClient ? 'Catálogo' : 'Punto de <span class="text-primary">Venta</span>'}</h1><p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Productos en tiempo real</p></div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform" size={20} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="BUSCAR PRODUCTO..." className="w-full bg-surface-dark border border-primary/10 rounded-[20px] py-4 pl-14 pr-6 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold placeholder:text-slate-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 xl:grid-cols-4 gap-8 scrollbar-hide pr-2">
          {products.filter(p => (p.nombre || p.name).toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
            <button key={product.id} onClick={() => addToCart(product)} className="group bg-surface-dark/40 border border-primary/5 p-6 rounded-[40px] text-left hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 flex flex-col shadow-lg hover:shadow-primary/5 hover:-translate-y-2 active:scale-95">
              <div className="relative overflow-hidden rounded-[32px] mb-6 aspect-square"><img src={product.imagen || product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div><div className="absolute bottom-4 right-4 bg-primary text-background-dark p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0"><Plus size={20} /></div></div>
              <h3 className="text-sm font-black text-white line-clamp-1 uppercase tracking-tighter mb-1">{product.nombre || product.name}</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Stock: {product.stock}</p>
              <div className="mt-auto flex items-end justify-between"><span className="text-2xl font-black text-white tracking-tighter">${(product.precio || product.price).toLocaleString()}</span><span className="text-[10px] font-black text-primary uppercase">🛒 Añadir</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* Carrito de Compras */}
      <div className="w-full lg:w-[480px] bg-surface-dark border-l border-primary/10 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.5)] z-40">
        <div className="p-10 border-b border-primary/10 flex justify-between items-center bg-background-dark/20">
          <div className="flex items-center gap-4"><div className="p-4 bg-primary rounded-2xl shadow-lg shadow-primary/20"><ShoppingCart className="text-background-dark" size={24} /></div><h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mi Carrito</h2></div>
          <span className="bg-primary text-background-dark text-xs font-black px-4 py-2 rounded-full animate-bounce-subtle">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20"><ShoppingCart size={80} className="mb-4" /><p className="font-black uppercase tracking-[0.2em] text-xs">Carrito Vacío</p></div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="group p-5 bg-background-dark/40 border border-primary/5 rounded-[32px] flex items-center gap-5 hover:border-primary/20 transition-all animate-in slide-in-from-right-4">
                <img src={item.product.imagen || item.product.image} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                <div className="flex-1 min-w-0"><h4 className="text-sm font-black text-white truncate uppercase tracking-tighter">{item.product.nombre || item.product.name}</h4><p className="text-lg font-black text-primary tracking-tighter">${(item.product.precio * item.quantity).toLocaleString()}</p></div>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center bg-background-dark rounded-xl border border-white/5 p-1">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 hover:bg-white/5 rounded-lg flex items-center justify-center text-slate-400"><Minus size={16} /></button>
                    <span className="w-8 text-center text-white text-sm font-black">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 hover:bg-white/5 rounded-lg flex items-center justify-center text-slate-400"><Plus size={16} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-rose-500/50 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-10 bg-background-dark/60 border-t border-primary/10 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-slate-400 text-xs font-bold uppercase tracking-widest"><span>IVA (13%)</span><span>${tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-4xl font-black text-white tracking-tighter pt-4 border-t border-white/5"><span>TOTAL</span><span className="text-primary">${total.toLocaleString()}</span></div>
          </div>
          <button onClick={handleProcessPayment} disabled={cart.length === 0} className="w-full bg-primary text-background-dark font-black py-6 rounded-[28px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.95] transition-all disabled:opacity-20 flex items-center justify-center gap-3 text-xl tracking-tighter">
            <CreditCard size={24} /> PROCESAR PAGO
          </button>
        </div>
        {showRatingModal && <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} listingId={selectedListingId} />}
      </div>
      </div>
  );
};

export default POSScreen;
