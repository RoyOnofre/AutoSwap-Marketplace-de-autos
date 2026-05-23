import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CheckoutSummary from '@/components/features/checkout/checkout-summary';
import EscrowStatusTracker from '@/components/features/checkout/escrow-status-tracker';
import MercadoPagoButton from '@/components/features/checkout/mercado-pago-button';
import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  price: number;
  status: 'pending' | 'in_escrow' | 'released' | 'cancelled';
  seller_id: string;
  buyer_id: string;
  created_at: string;
}

export default function TransactionPage({ params }: { params: { id: string } }) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch transaction initially
  useEffect(() => {
    async function fetchTransaction() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', params.id)
        .single();
      if (error) {
        console.error(error);
        redirect('/');
        return;
      }
      setTransaction(data as Transaction);
      setLoading(false);
    }
    fetchTransaction();
  }, [params.id]);

  // Real‑time listener for status changes
  useEffect(() => {
    if (!transaction) return;
    const channel = supabase
      .channel(`public:transactions:id=eq.${transaction.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `id=eq.${transaction.id}` }, (payload) => {
        const updated = payload.new as Transaction;
        setTransaction(updated);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [transaction?.id]);

  if (loading || !transaction) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <section className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Detalle de la Transacción #{transaction.id}</h1>
      <CheckoutSummary transaction={transaction} />
      <EscrowStatusTracker status={transaction.status} />
      {transaction.status === 'in_escrow' && (
        <MercadoPagoButton transactionId={transaction.id} amount={transaction.price} />
      )}
    </section>
  );
}
