import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Orbit,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
} from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const auth = hasFirebaseConfig
  ? getAuth(getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
  : null;

const passwordRules = [
  { label: 'At least 8 characters', test: (value) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value) => /\d/.test(value) },
  { label: 'One special character', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

function getPasswordStrength(password) {
  return passwordRules.filter((rule) => rule.test(password)).length;
}

function getAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'That email or password doesn’t look right. Try again.',
    'auth/user-not-found': 'No account was found with that email address.',
    'auth/wrong-password': 'That password doesn’t look right. Try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Choose a stronger password and try again.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
    'auth/invalid-verification-code': 'That code isn’t correct. Check it and try again.',
    'auth/code-expired': 'That code has expired. Request a new one.',
    'auth/invalid-phone-number': 'Enter your phone number with country code, like +1 555 123 4567.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
}

function Brand({ compact = false }) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="#home" aria-label="Nexa home">
      <span className="brand-mark" aria-hidden="true">
        <Orbit size={23} strokeWidth={1.7} />
        <span />
      </span>
      <span className="brand-name">nexa<span>.</span></span>
    </a>
  );
}

function App() {
  const [view, setView] = useState('login');
  const [theme, setTheme] = useState(() => localStorage.getItem('nexa-theme') || 'dark');
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const recaptchaRef = useRef(null);
  const cardRef = useRef(null);
  const toastTimer = useRef(null);
  const strength = getPasswordStrength(password);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('nexa-theme', theme);
  }, [theme]);

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current);
    recaptchaRef.current?.clear();
  }, []);

  function notify(message) {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4200);
  }

  function changeView(nextView) {
    setView(nextView);
    setError('');
    setPassword('');
    setConfirmation(null);
    setOtpCode('');
  }

  function handleCardMove(event) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 900) return;
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setTilt({ x: y * -4, y: x * 5 });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setError('Enter your email and password to continue.');
      return;
    }
    if (demoMode) {
      setBusy(true);
      window.setTimeout(() => {
        setBusy(false);
        setCurrentUser({ email: trimmedIdentifier, displayName: 'Demo explorer' });
        notify('Demo preview unlocked — no real account or session was created.');
      }, 850);
      return;
    }
    if (!auth) {
      setError('Authentication isn’t connected yet. Add your Firebase settings or use the clearly labeled demo mode.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
      setError('Use email + password, choose a one-time code for phone, or connect a username identity provider.');
      return;
    }
    setBusy(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const result = await signInWithEmailAndPassword(auth, trimmedIdentifier, password);
      setCurrentUser(result.user);
      notify('You’re securely signed in.');
    } catch (authError) {
      setError(getAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      setError('Enter a valid email address to create your account.');
      return;
    }
    if (strength < 4) {
      setError('Meet all password requirements before creating your account.');
      return;
    }
    if (!auth) {
      setError('Authentication isn’t connected yet. Add your Firebase settings to create a real account.');
      return;
    }
    setBusy(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, identifier.trim(), password);
      if (fullName.trim()) {
        try {
          await updateProfile(result.user, { displayName: fullName.trim() });
        } catch (profileError) {
          setCurrentUser(result.user);
          notify(`Your account was created, but the profile name could not be saved. ${getAuthError(profileError)}`);
          return;
        }
      }
      setCurrentUser(result.user);
      notify('Your Nexa account is ready.');
    } catch (authError) {
      setError(getAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      setError('Enter the email address associated with your account.');
      return;
    }
    if (!auth) {
      setError('Password reset becomes available after Firebase Authentication is connected.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, identifier.trim());
      notify('If an account exists for that email, a reset link is on its way.');
    } catch (authError) {
      setError(getAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    if (!auth) {
      setError('Google sign-in isn’t connected yet. Add Firebase settings and enable Google as a sign-in provider.');
      return;
    }
    setBusy(true);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      setCurrentUser(result.user);
      notify('You’re securely signed in with Google.');
    } catch (authError) {
      setError(getAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleSendCode(event) {
    event.preventDefault();
    setError('');
    if (!auth) {
      setError('Phone sign-in isn’t connected yet. Add your Firebase settings to request a real code.');
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, ''))) {
      setError('Enter your phone number with country code, like +1 555 123 4567.');
      return;
    }
    setBusy(true);
    try {
      recaptchaRef.current?.clear();
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const result = await signInWithPhoneNumber(auth, phone.replace(/[\s()-]/g, ''), recaptchaRef.current);
      setConfirmation(result);
      notify('Verification code sent. Check your phone.');
    } catch (authError) {
      setError(getAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(event) {
    event.preventDefault();
    setError('');
    if (!confirmation || !/^\d{6}$/.test(otpCode)) {
      setError('Enter the 6-digit code sent to your phone.');
      return;
    }
    setBusy(true);
    try {
      const result = await confirmation.confirm(otpCode);
      setCurrentUser(result.user);
      notify('Your phone number is verified. You’re securely signed in.');
    } catch (authError) {
      setError(getAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    if (auth && !demoMode) await signOut(auth);
    setCurrentUser(null);
    setDemoMode(false);
    setIdentifier('');
    setPassword('');
    changeView('login');
    notify('You’ve signed out.');
  }

  function toggleDemoMode() {
    setDemoMode((active) => !active);
    setError('');
    notify(demoMode ? 'Demo mode turned off.' : 'Demo mode on. Any non-empty email and password opens a labeled preview only.');
  }

  const titles = {
    login: ['Welcome back', 'Your next big idea is one sign-in away.'],
    signup: ['Make it yours', 'Create an account and make room for what’s next.'],
    forgot: ['Reset your password', 'We’ll send you a secure link to get back in.'],
    otp: [confirmation ? 'Check your messages' : 'Your phone, your key', confirmation ? `Enter the 6-digit code sent to ${phone}.` : 'A one-time code. No passwords, no fuss.'],
  };
  const [title, subtitle] = titles[view];

  return (
    <main className="app-shell" id="home">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="ambient ambient--three" aria-hidden="true" />
      <div className="star-field" aria-hidden="true" />

      <header className="topbar">
        <Brand />
        <div className="topbar-actions">
          <span className="topbar-caption">A little more you, every day.</span>
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <section className="page-grid" aria-label="Sign in to Nexa">
        <div className="story-panel">
          <div className="eyebrow"><span className="eyebrow-dot" /> YOUR SPACE FOR WHAT'S NEXT</div>
          <h1>Ideas move<br />when <span>you do.</span></h1>
          <p className="story-copy">Pick up where curiosity left off. Your world is right where you left it.</p>

          <div className="visual-stage" aria-label="Nexa secure access illustration">
            <div className="visual-orbit visual-orbit--outer" />
            <div className="visual-orbit visual-orbit--inner" />
            <div className="visual-halo" />
            <div className="shield-illustration">
              <div className="shield-glow" />
              <Shield className="shield-outline" size={122} strokeWidth={1} aria-hidden="true" />
              <div className="shield-core"><Fingerprint size={49} strokeWidth={1.25} aria-hidden="true" /></div>
              <span className="shield-spark shield-spark--one"><Sparkles size={15} /></span>
              <span className="shield-spark shield-spark--two"><Sparkles size={11} /></span>
            </div>
            <div className="orbit-dot orbit-dot--one" />
            <div className="orbit-dot orbit-dot--two" />
            <div className="orbit-dot orbit-dot--three" />
            <div className="float-chip float-chip--secure"><ShieldCheck size={15} /> End-to-end secure</div>
            <div className="float-chip float-chip--private"><span className="privacy-dot" /> Private by design</div>
          </div>

          <div className="trust-row">
            <span className="trust-icon"><LockKeyhole size={15} /></span>
            <span>Protected with modern encryption</span>
            <span className="trust-divider" />
            <span className="trust-status"><span /> All systems normal</span>
          </div>
        </div>

        <section
          className="login-card"
          aria-labelledby="form-heading"
          ref={cardRef}
          onPointerMove={handleCardMove}
          onPointerLeave={resetTilt}
          style={{ transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          <div className="card-border" aria-hidden="true" />
          <div className="card-content">
            <div className="card-mobile-brand"><Brand compact /></div>
            <div className="card-heading">
              <span className="welcome-mark" aria-hidden="true"><KeyRound size={18} /></span>
              <h2 id="form-heading">{currentUser ? 'You’re in.' : title}</h2>
              <p>{currentUser ? 'Your Nexa space is ready when you are.' : subtitle}</p>
            </div>

            {currentUser ? (
              <div className="signed-in-panel" key="signed-in">
                <div className="signed-in-avatar"><UserRound size={24} /></div>
                <div className="signed-in-copy">
                  <strong>{currentUser.displayName || currentUser.email || 'Nexa member'}</strong>
                  <span>{demoMode ? 'Demo preview · no account authenticated' : currentUser.email}</span>
                </div>
                {demoMode && <span className="demo-badge">DEMO</span>}
                <div className="session-note">
                  <CheckCircle2 size={17} />
                  {demoMode ? 'You’re viewing a simulated preview. No real sign-in took place.' : 'Authentication confirmed by your provider.'}
                </div>
                <button className="primary-button signout-button" onClick={handleSignOut} type="button">
                  Sign out <ArrowRight size={17} />
                </button>
              </div>
            ) : (
              <div className="form-stage" key={view}>
                {view === 'otp' ? (
                  <form onSubmit={confirmation ? handleVerifyCode : handleSendCode} noValidate>
                    {confirmation ? (
                      <div className="field-wrap">
                        <label className="sr-only" htmlFor="otp-code">6-digit verification code</label>
                        <div className="input-shell">
                          <KeyRound className="field-icon" size={18} aria-hidden="true" />
                          <input
                            id="otp-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            placeholder=" "
                            value={otpCode}
                            onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            aria-describedby={error ? 'form-error' : undefined}
                          />
                          <span className="floating-label">6-digit code</span>
                        </div>
                      </div>
                    ) : (
                      <div className="field-wrap">
                        <label className="sr-only" htmlFor="phone-number">Phone number including country code</label>
                        <div className="input-shell">
                          <span className="country-code">+</span>
                          <input
                            id="phone-number"
                            type="tel"
                            autoComplete="tel"
                            placeholder=" "
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            aria-describedby={error ? 'form-error' : 'phone-hint'}
                          />
                          <span className="floating-label">Phone number with country code</span>
                        </div>
                        <span id="phone-hint" className="field-hint">For example, +1 555 123 4567</span>
                      </div>
                    )}
                    {error && <p className="form-error" id="form-error" role="alert"><CircleHelp size={15} />{error}</p>}
                    <div id="recaptcha-container" />
                    <button className="primary-button" type="submit" disabled={busy}>
                      {busy ? <><span className="spinner" /> {confirmation ? 'Verifying…' : 'Sending code…'}</> : <>{confirmation ? 'Verify & sign in' : 'Send one-time code'} <ArrowRight size={17} /></>}
                    </button>
                    {confirmation && <button className="text-button resend-button" type="button" onClick={() => { setConfirmation(null); setOtpCode(''); setError(''); }}>Use a different number</button>}
                    <button className="back-link" type="button" onClick={() => changeView('login')}><ArrowLeft size={15} /> Back to password sign-in</button>
                  </form>
                ) : (
                  <form onSubmit={view === 'login' ? handleLogin : view === 'signup' ? handleSignUp : handleForgotPassword} noValidate>
                    {view === 'signup' && (
                      <div className="field-wrap">
                        <label className="sr-only" htmlFor="full-name">Your name</label>
                        <div className="input-shell">
                          <UserRound className="field-icon" size={18} aria-hidden="true" />
                          <input id="full-name" type="text" placeholder=" " autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                          <span className="floating-label">Your name <span className="optional">(optional)</span></span>
                        </div>
                      </div>
                    )}
                    <div className="field-wrap">
                      <label className="sr-only" htmlFor="email-address">{view === 'login' ? 'Email, username, or mobile number' : 'Email address'}</label>
                      <div className="input-shell">
                        <Mail className="field-icon" size={18} aria-hidden="true" />
                        <input
                          id="email-address"
                          type={view === 'login' ? 'text' : 'email'}
                          placeholder=" "
                          autoComplete={view === 'login' ? 'username' : 'email'}
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          aria-describedby={error ? 'form-error' : view === 'login' ? 'identifier-hint' : undefined}
                        />
                        <span className="floating-label">{view === 'login' ? 'Email, username, or mobile' : 'Email address'}</span>
                      </div>
                      {view === 'login' && <span id="identifier-hint" className="field-hint">Email + password, phone via one-time code, or username with a linked provider.</span>}
                    </div>

                    {view !== 'forgot' && (
                      <div className="field-wrap">
                        <label className="sr-only" htmlFor="password">Password</label>
                        <div className={`input-shell${capsLock ? ' input-shell--warning' : ''}`}>
                          <LockKeyhole className="field-icon" size={18} aria-hidden="true" />
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder=" "
                            autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                            onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                            onBlur={() => setCapsLock(false)}
                            aria-describedby={[capsLock ? 'caps-warning' : '', view === 'signup' ? 'password-rules' : '', error ? 'form-error' : ''].filter(Boolean).join(' ') || undefined}
                          />
                          <span className="floating-label">Password</span>
                          <button className="icon-button password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                        {capsLock && <span className="caps-warning" id="caps-warning"><CircleHelp size={13} /> Caps Lock is on</span>}
                        {view === 'signup' && (
                          <div className="password-requirements" id="password-rules">
                            <div className="strength-header"><span>Password strength</span><span className={`strength-label strength-label--${strength}`}>{['Add a password', 'Too weak', 'Could be stronger', 'Looking good', 'Strong'][strength]}</span></div>
                            <div className="strength-meter" aria-label={`Password strength: ${strength} of 4`} role="meter" aria-valuemin="0" aria-valuemax="4" aria-valuenow={strength}>
                              {[0, 1, 2, 3].map((part) => <span className={part < strength ? `strength-fill strength-fill--${strength}` : ''} key={part} />)}
                            </div>
                            <div className="rule-list">
                              {passwordRules.map((rule) => <span className={rule.test(password) ? 'rule rule--met' : 'rule'} key={rule.label}>{rule.test(password) ? <Check size={12} /> : <span className="rule-dot" />}{rule.label}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {view === 'login' && (
                      <div className="form-options">
                        <label className="checkbox-label">
                          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                          <span className="custom-checkbox"><Check size={12} /></span>
                          <span>Remember me</span>
                        </label>
                        <button className="text-button" type="button" onClick={() => changeView('forgot')}>Forgot password?</button>
                      </div>
                    )}

                    {error && <p className="form-error" id="form-error" role="alert"><CircleHelp size={15} />{error}</p>}

                    <button className="primary-button" type="submit" disabled={busy}>
                      {busy ? <><span className="spinner" /> {view === 'signup' ? 'Creating account…' : view === 'forgot' ? 'Sending link…' : 'Signing in…'}</> : <>{view === 'signup' ? 'Create account' : view === 'forgot' ? 'Send reset link' : 'Sign in'} <ArrowRight size={17} /></>}
                    </button>

                    {view === 'login' && (
                      <>
                        <div className="divider"><span /> <span>or continue with</span> <span /></div>
                        <button className="google-button" type="button" onClick={handleGoogleSignIn} disabled={busy}>
                          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.05 5.05 0 0 1-2.2 3.31v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
                            <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.1V7.06H2.15A11 11 0 0 0 1 12c0 1.78.43 3.46 1.15 4.94l3.69-2.84Z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.06l3.69 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
                          </svg>
                          Continue with Google <ChevronRight className="google-chevron" size={16} />
                        </button>
                        <button className="otp-button" type="button" onClick={() => changeView('otp')}><Fingerprint size={16} /> Use a one-time code instead</button>
                        <p className="signup-prompt">New to Nexa? <button className="text-button" type="button" onClick={() => changeView('signup')}>Create an account <ArrowRight size={13} /></button></p>
                      </>
                    )}
                    {view === 'signup' && <p className="signup-prompt signup-prompt--compact">Already have an account? <button className="text-button" type="button" onClick={() => changeView('login')}>Sign in</button></p>}
                    {view === 'forgot' && <button className="back-link" type="button" onClick={() => changeView('login')}><ArrowLeft size={15} /> Back to sign in</button>}
                  </form>
                )}
              </div>
            )}

            {!currentUser && (
              <>
                <div className={`demo-panel${demoMode ? ' demo-panel--active' : ''}`}>
                  <div className="demo-icon"><Sparkles size={16} /></div>
                  <div className="demo-copy">
                    <strong>Just exploring?</strong>
                    <span>{demoMode ? 'Demo preview is on · simulated, not authenticated' : 'Take a guided look without an account.'}</span>
                  </div>
                  <button className="demo-action" type="button" onClick={toggleDemoMode} aria-pressed={demoMode}>
                    {demoMode ? 'Turn off' : 'Try demo'} <ArrowRight size={14} />
                  </button>
                </div>
                <p className="legal-note"><ShieldCheck size={13} /> Your data stays yours. <button type="button" onClick={() => notify('Privacy first: Nexa only uses your information to provide and secure your account.')}>Privacy promise</button></p>
              </>
            )}
          </div>
          <span className="card-corner card-corner--one" aria-hidden="true" />
          <span className="card-corner card-corner--two" aria-hidden="true" />
        </section>
      </section>

      <footer className="page-footer">
        <span>© {new Date().getFullYear()} Nexa Studio</span>
        <span className="footer-center"><span className="footer-pulse" /> Thoughtfully made for your next chapter</span>
        <button type="button" className="help-link" onClick={() => notify('Need a hand? Contact hello@nexa.example for this project demo.')}>Need help? <span>We’re here</span> <ArrowRight size={13} /></button>
      </footer>

      {toast && <div className="toast" role="status"><CheckCircle2 size={18} /><span>{toast}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}><X size={15} /></button></div>}
    </main>
  );
}

export default App;
