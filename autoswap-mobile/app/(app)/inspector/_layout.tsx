import { Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@/hooks/useSession'; // assumes a hook that returns {user, loading}

export default function InspectorLayout() {
  const { user, loading } = useSession();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loading && (!user || !(user.roles?.includes('inspector') || user.roles?.includes('admin')))) {
      // redirect to home if not authorized
      router.replace('/');
    }
  }, [loading, user]);

  // Render nested routes only after auth check
  if (loading) return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
