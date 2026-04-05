'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Mail } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AccountSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email') || '';
  const sessionId = searchParams.get('session_id');
  const productType = searchParams.get('product');

  const [method, setMethod] = useState<'magic' | 'password'>('magic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // MÉTHODE 1: Magic Link
  const handleMagicLink = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?session_id=${sessionId}&product=${productType}`,
        },
      });

      if (error) throw error;

      setSuccess(true);

    } catch (err: any) {
      console.error('Erreur magic link:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // MÉTHODE 2: Mot de passe
  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!firstName || !lastName) {
      setError('Prénom et nom requis');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          sessionId,
          productType,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Login automatique
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Rediriger vers dashboard
      router.push('/dashboard');

    } catch (err: any) {
      console.error('Erreur signup:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE
  if (success) {
    return (
      <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-8">
          
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <Mail size={40} className="text-green-600" />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Vérifiez votre email
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
              Nous avons envoyé un lien de connexion à <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm text-left space-y-3">
            <p className="text-sm text-gray-700">
              ✅ Cliquez sur le lien dans l'email
            </p>
            <p className="text-sm text-gray-700">
              ✅ Vous serez redirigé vers votre dashboard
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Le lien est valide 24h. Si vous ne recevez pas l'email, vérifiez vos spams.
            </p>
          </div>

          <button
            onClick={() => handleMagicLink()}
            disabled={loading}
            className="text-sm text-green-600 hover:underline"
          >
            Renvoyer l'email
          </button>

        </div>
      </main>
    );
  }

  // MAIN FORM
  return (
    <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      
      <div className="w-full max-w-md space-y-8">

        {/* HEADER */}
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Créez votre compte
          </h1>
          <p className="text-sm text-gray-600">
            Accédez à votre dashboard STRYV lab
          </p>
        </div>

        {/* METHOD SWITCH */}
        <div className="bg-white rounded-full p-1 shadow-sm flex">
          <button
            onClick={() => setMethod('magic')}
            className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              method === 'magic'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lien email
          </button>
          <button
            onClick={() => setMethod('password')}
            className={`flex-1 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              method === 'password'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mot de passe
          </button>
        </div>

        {/* MAGIC LINK METHOD */}
        {method === 'magic' && (
          <div className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Recevez un lien de connexion sécurisé par email. Pas besoin de mot de passe.
              </p>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  {email}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleMagicLink}
              disabled={loading}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Envoyer le lien
                </>
              )}
            </button>

          </div>
        )}

        {/* PASSWORD METHOD */}
        {method === 'password' && (
          <form onSubmit={handlePasswordSignup} className="bg-white rounded-lg p-8 shadow-sm space-y-6">
            
            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 text-sm bg-gray-50 text-gray-600 rounded-lg border border-gray-200 cursor-not-allowed"
              />
            </div>

            {/* Prénom */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="John"
              />
            </div>

            {/* Nom */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Doe"
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Min. 8 caractères"
              />
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Confirmer mot de passe
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Même mot de passe"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Création...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>

          </form>
        )}

        {/* FOOTER */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            En créant un compte, vous acceptez nos{' '}
            <a href="/cgv" className="text-green-600 hover:underline">
              CGV
            </a>
          </p>
        </div>

      </div>
    </main>
  );
}