'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Успешен вход', description: 'Пренасочваме ви към таблото за управление...' });
      router.push('/dashboard'); // Redirect to a protected route on successful login
    } catch (err: any) {
        let errorMessage = "Възникна грешка при входа. Моля, опитайте отново.";
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            errorMessage = "Грешен имейл или парола.";
        }
        setError(errorMessage);
        console.error("Firebase Login Error:", err);
        toast({ title: 'Грешка при вход', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm mx-4">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="text-2xl">Вход в системата</CardTitle>
            <CardDescription>
              Моля, въведете вашите данни, за да продължите.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Имейл</Label>
              <Input
                id="email"
                type="email"
                placeholder="imeil@primer.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Парола</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Вход'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
