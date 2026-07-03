import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const justExpired = searchParams.get('expired') === 'true';
  const redirectTo = searchParams.get('redirect');
  const bookingRequired = searchParams.get('reason') === 'booking';
  const safeRedirectTo = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/profile';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate(safeRedirectTo, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Graphic elements */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 glass rounded-2xl p-8 shadow-2xl z-10 transition-all duration-300">
        <div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✈️
          </span>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to unlock personalized AI itineraries
          </p>
        </div>

        {justExpired && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-4 text-amber-500 text-sm border border-amber-500/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Your session has expired. Please log in again.</span>
          </div>
        )}

        {bookingRequired && !justExpired && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 p-4 text-blue-600 text-sm border border-blue-500/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Please log in to book this listing.</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-destructive text-sm border border-destructive/20">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.email ? 'border-destructive focus:ring-destructive/50' : 'border-border'
                  }`}
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.password ? 'border-destructive focus:ring-destructive/50' : 'border-border'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-muted-foreground select-none">
                Remember me
              </label>
            </div>

            <a href="#" className="font-medium text-primary hover:text-primary/95 transition-colors">
              Forgot password?
            </a>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center items-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:text-primary/95 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
