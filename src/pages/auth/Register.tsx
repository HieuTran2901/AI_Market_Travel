import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  phoneNumber: z.string().optional(),
  isProvider: z.boolean().default(false),
  businessType: z.string().optional(),
  businessName: z.string().optional(),
  address: z.string().optional(),
  taxCode: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
}).refine((data) => {
  if (data.isProvider) {
    return !!data.businessType && !!data.businessName && !!data.address;
  }
  return true;
}, {
  message: "Business Type, Business Name and Address are required for partner registration",
  path: ["businessName"]
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: registerApi } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProviderForm, setIsProviderForm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phoneNumber: '',
      isProvider: false,
    },
  });

  const handleRoleToggle = (value: boolean) => {
    setIsProviderForm(value);
    setValue('isProvider', value);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await registerApi(data);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-10rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl"></div>

      <div className="w-full max-w-xl space-y-8 glass rounded-2xl p-8 shadow-2xl z-10 transition-all duration-300">
        <div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-3xl">
            ✈️
          </span>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Join the platform and experience the future of travel
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-emerald-500/10 p-6 text-center text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-12 w-12 animate-bounce" />
            <h3 className="font-bold text-lg">Registration Successful!</h3>
            <p className="text-sm">We are redirecting you to the login page. Get ready to plan your trip.</p>
          </div>
        ) : (
          <>
            {/* Registration Role Selection Header */}
            <div className="flex rounded-xl bg-muted p-1 border border-border">
              <button
                type="button"
                onClick={() => handleRoleToggle(false)}
                className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
                  !isProviderForm
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Traveler (Customer)
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle(true)}
                className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
                  isProviderForm
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Partner (Service Provider)
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-destructive text-sm border border-destructive/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <input
                    {...register('fullName')}
                    id="fullName"
                    type="text"
                    className={`mt-1 block w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      errors.fullName ? 'border-destructive focus:ring-destructive/50' : 'border-border'
                    }`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    className={`mt-1 block w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      errors.email ? 'border-destructive focus:ring-destructive/50' : 'border-border'
                    }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
                    Phone Number (Optional)
                  </label>
                  <input
                    {...register('phoneNumber')}
                    id="phoneNumber"
                    type="text"
                    className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="+84 901234567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      {...register('password')}
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`block w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
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

                {/* Partner registration details */}
                {isProviderForm && (
                  <div className="sm:col-span-2 border-t border-border pt-6 mt-2 space-y-4 animate-fade-in">
                    <h3 className="text-md font-bold text-foreground">Business Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="businessType" className="block text-sm font-medium text-foreground">
                          Business Type
                        </label>
                        <select
                          {...register('businessType')}
                          id="businessType"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Select Service...</option>
                          <option value="HOTEL">Hotel / Homestay</option>
                          <option value="TOUR">Tour Operator / Guide</option>
                          <option value="RESTAURANT">Restaurant / Cafe</option>
                          <option value="VEHICLE">Vehicle Rental</option>
                          <option value="EXPERIENCE">Local Experience Provider</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-foreground">
                          Business Name
                        </label>
                        <input
                          {...register('businessName')}
                          id="businessName"
                          type="text"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="My Travel Business LTD"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-foreground">
                        Business Address
                      </label>
                      <textarea
                        {...register('address')}
                        id="address"
                        rows={2}
                        className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="123 Tourism Street, Da Lat, Lam Dong"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="taxCode" className="block text-sm font-medium text-foreground">
                          Tax Code / License Code
                        </label>
                        <input
                          {...register('taxCode')}
                          id="taxCode"
                          type="text"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="0123456789"
                        />
                      </div>

                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-foreground">
                          Bank Name
                        </label>
                        <input
                          {...register('bankName')}
                          id="bankName"
                          type="text"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="Vietcombank"
                        />
                      </div>

                      <div>
                        <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-foreground">
                          Bank Account Number
                        </label>
                        <input
                          {...register('bankAccountNumber')}
                          id="bankAccountNumber"
                          type="text"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="1029384756"
                        />
                      </div>

                      <div>
                        <label htmlFor="bankAccountName" className="block text-sm font-medium text-foreground">
                          Account Owner Name
                        </label>
                        <input
                          {...register('bankAccountName')}
                          id="bankAccountName"
                          type="text"
                          className="mt-1 block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="NGUYEN VAN A"
                        />
                      </div>
                    </div>
                    {errors.businessName && (
                      <p className="text-xs text-destructive">{errors.businessName.message}</p>
                    )}
                  </div>
                )}
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
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:text-primary/95 transition-colors">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
export default Register;
