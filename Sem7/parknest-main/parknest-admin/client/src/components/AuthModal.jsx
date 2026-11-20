import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Car, CheckCircle2, KeyRound, LoaderCircle, MapPin, Phone, ShieldCheck, X, Zap } from 'lucide-react';

const DEMO_OTP = '1234';

const AuthModal = ({ onClose, required = false }) => {
  const { loginWithPhone, updateProfile } = useUser();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = (event) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setPhone(digits);
    setError('');
    setStep('otp');
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (otp !== DEMO_OTP) {
      setError('That code is not correct. Use the demo code shown below.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const account = await loginWithPhone(`+91 ${phone}`);
      if (account.needsName || !account.name.trim()) {
        setStep('name');
      } else {
        setStep('success');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveName = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter your name to continue.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateProfile({ name: trimmedName });
      setStep('success');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] overflow-y-auto ${required ? 'bg-slate-100' : 'flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm'}`}>
      {required && <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.12),_transparent_45%),radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.10),_transparent_42%)]" />}
      <div className={required ? 'relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 sm:px-8' : 'relative flex min-h-full w-full items-center justify-center'}>
        {required && (
          <header className="flex items-center justify-between py-5 sm:py-7">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-200"><Car size={23} strokeWidth={2.2} /></span>
              <span>
                <span className="block text-lg font-extrabold tracking-tight text-slate-900">ParkNest</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Smart parking</span>
              </span>
            </div>
            <span className="rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700 sm:text-xs">
              Driver sign in
            </span>
          </header>
        )}
        <main className={required ? 'flex flex-1 items-center justify-center py-4 sm:py-8' : 'w-full'}>
          <div className={required ? 'grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_80px_-28px_rgba(15,23,42,0.35)] md:grid-cols-[0.92fr_1.08fr]' : 'relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8'}>
            {required && (
              <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-800 p-9 text-white md:flex lg:p-11">
                <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" />
                <div aria-hidden="true" className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full border-[42px] border-white/10" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-50">
                    <Zap size={14} /> Park smarter
                  </span>
                  <h1 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight lg:text-4xl">Your next spot is closer.</h1>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-blue-100">Find nearby parking, reserve a space, and keep your vehicle details ready for every trip.</p>
                </div>
                <div className="relative mt-10 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
                    <span className="rounded-xl bg-white/15 p-2"><MapPin size={17} /></span>
                    <span className="text-sm font-semibold">Nearby parking at a glance</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
                    <span className="rounded-xl bg-white/15 p-2"><Car size={17} /></span>
                    <span className="text-sm font-semibold">Reservations for your vehicle</span>
                  </div>
                </div>
              </aside>
            )}
            <section role="dialog" aria-modal="true" aria-labelledby="auth-title" className={required ? 'relative flex flex-col justify-center p-6 sm:p-9 lg:p-11' : ''}>
        {!required && <button type="button" onClick={onClose} aria-label="Close sign in" className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>}
        {required && (
          <div className="mb-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            {step === 'phone' ? 'Welcome' : step === 'otp' ? 'Phone verification' : step === 'name' ? 'New driver profile' : 'All set'}
          </div>
        )}
        {step === 'phone' && (
          <form onSubmit={sendOtp} className="space-y-5">
            <div className={required ? '' : 'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700'}>{!required && <Phone size={22} />}</div>
            <div className={required ? 'text-left' : 'text-center'}>
              <h2 id="auth-title" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Welcome to ParkNest</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in with your phone to find and reserve parking.</p>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Mobile number
              <div className="mt-2 flex min-h-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <span className="flex items-center border-r border-slate-200 px-4 text-sm font-semibold text-slate-600">+91</span>
                <input autoFocus type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))} placeholder="98765 43210" className="min-w-0 flex-1 bg-transparent px-4 text-base font-semibold tracking-wide text-slate-900 outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400" />
              </div>
              <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">Existing drivers go straight in; new drivers only need to add their name.</span>
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.99]">
              Continue with phone <span aria-hidden="true">→</span>
            </button>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500"><ShieldCheck size={15} className="shrink-0 text-emerald-600" /> Demo sign-in · No SMS is sent</p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp} className="space-y-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><KeyRound size={22} /></div>
            <div className="text-left">
              <h2 id="auth-title" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Verify your number</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Enter the demo code for <span className="font-semibold text-slate-700">+91 {phone}</span>.</p>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Demo one-time password
              <input autoFocus required inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="••••" className="mt-2 min-h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center font-mono text-3xl tracking-[0.65em] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </label>
            <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm text-blue-900">Use demo OTP <strong className="ml-1 font-mono text-base tracking-wider">1234</strong></p>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => { setStep('phone'); setError(''); }} className="min-h-12 rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Change number</button>
              <button type="submit" disabled={loading} className="flex min-h-12 items-center justify-center rounded-2xl bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                {loading ? <LoaderCircle size={16} className="mx-auto animate-spin" /> : 'Verify & sign in'}
              </button>
            </div>
          </form>
        )}

        {step === 'name' && (
          <form onSubmit={saveName} className="space-y-5">
            <div className="text-left">
              <h2 id="auth-title" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Create your driver profile</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">You’re new to ParkNest. Add your name to finish setting up your account.</p>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Your name
              <input autoFocus required maxLength={80} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" className="mt-2 min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
            </label>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60">
              {loading ? <LoaderCircle size={16} className="animate-spin" /> : 'Save and continue'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={36} /></div>
            <div>
              <h2 id="auth-title" className="text-2xl font-extrabold tracking-tight text-slate-900">You’re signed in</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Your ParkNest account is ready. Continue to find your next parking spot.</p>
            </div>
            <button type="button" onClick={onClose} className="mt-2 min-h-14 w-full rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">Continue to ParkNest</button>
          </div>
        )}
            </section>
          </div>
        </main>
        {required && <footer className="py-4 text-center text-[11px] leading-5 text-slate-500 sm:py-6">Demo OTP: <span className="font-mono font-bold text-slate-700">1234</span> · Your phone number identifies your saved driver profile.</footer>}
      </div>
    </div>
  );
};

export default AuthModal;
