import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface MercadoPagoButtonProps {
  /** Transaction identifier */
  transactionId: string;
  /** Amount in Bolivianos (used for fallback UI) */
  amount: number;
}

/**
 * Calls the NestJS gateway to create a Mercado Pago Preference (sandbox).
 * The gateway endpoint: POST /v1/transactions/:id/pay
 * Expected response shape: { preferenceId: string }
 */
async function createPreference(transactionId: string): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/v1/transactions/${transactionId}/pay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Forward the Supabase auth token if the user is logged in
      Authorization: `Bearer ${supabase.auth.session()?.access_token || ''}`,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create preference: ${response.status} ${err}`);
  }
  const data = await response.json();
  if (!data.preferenceId) {
    throw new Error('Gateway did not return a preferenceId');
  }
  return data.preferenceId as string;
}

/** Load Mercado Pago SDK dynamically (sandbox) */
function loadMercadoPagoSdk(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window && (window as any).MercadoPago) {
      resolve((window as any).MercadoPago);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sandbox.mercadopago.com.ar/integrations/v1/web-payment-checkout.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).MercadoPago) {
        resolve((window as any).MercadoPago);
      } else {
        reject(new Error('MercadoPago SDK failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load MercadoPago SDK script'));
    document.body.appendChild(script);
  });
}

export const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({ transactionId, amount }) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    try {
      setLoading(true);
      // 1️⃣ Get preference ID from backend
      const preferenceId = await createPreference(transactionId);
      // 2️⃣ Load SDK
      const mp = await loadMercadoPagoSdk();
      // 3️⃣ Initialize checkout
      const checkout = new mp.checkout({
        preference: { id: preferenceId },
        // In sandbox mode, the public key comes from env TEST_MP_PUBLIC_KEY
        publicKey: process.env.NEXT_PUBLIC_TEST_MP_PUBLIC_KEY,
        // After payment MP will redirect back to this URL (same page) with query ?status=...
        redirectUrl: `${window.location.origin}/app/transactions/${transactionId}`,
      });
      // 4️⃣ Open checkout modal
      checkout.open();
    } catch (err) {
      console.error(err);
      // Show a simple toast – for now just alert
      alert('Error al iniciar el pago. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="accent"
      size="md"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
    </Button>
  );
};
