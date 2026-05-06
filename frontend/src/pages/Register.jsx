import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from './Login'

/**
 * REGISTRATION FLOW (prompt-first, not Figma):
 *  Step 1: Enter email → Send OTP
 *  Step 2: Verify OTP
 *  Step 3: Fill remaining details → Register
 */
export default function Register() {
  const [step, setStep] = useState(1) // 1=email, 2=otp, 3=details
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [form, setForm] = useState({ name: '', rollNo: '', phone: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  /* ── Step 1: Send OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) { toast.error('Enter your college email'); return }
    if (!email.endsWith('@nitkkr.ac.in')) {
      toast.error('Only @nitkkr.ac.in emails are allowed')
      return
    }
    try {
      setLoading(true)
      await authAPI.sendOtp(email)
      toast.success('OTP sent to your email!')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2: Verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 4) { toast.error('Enter a valid OTP'); return }
    try {
      setLoading(true)
      await authAPI.verifyOtp(email, otp)
      toast.success('Email verified! Fill your details.')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 3: Complete Registration ── */
  const handleRegister = async (e) => {
    e.preventDefault()
    const { name, rollNo, phone, password, confirmPassword } = form
    if (!name || !rollNo || !phone || !password) { toast.error('Please fill all fields'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    try {
      setLoading(true)
      await authAPI.register({ email, otp, name, rollNo, phone, password })
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const resendOtp = async () => {
    try {
      setLoading(true)
      await authAPI.sendOtp(email)
      toast.success('OTP resent!')
    } catch {
      toast.error('Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 1 UI ── */
  if (step === 1) {
    return (
      <AuthLayout title="Create New Account">
        <form onSubmit={handleSendOtp} className="space-y-5">
          <p className="text-sm text-muted text-center -mt-4 mb-2">
            Enter your college email to get started
          </p>
          <div>
            <label className="block text-sm font-bold text-charcoal mb-2">College Email</label>
            <input
              type="email"
              placeholder="yourname@nitkkr.ac.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-field-cream"
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base disabled:opacity-60"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:text-primary-dark transition-colors">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </AuthLayout>
    )
  }

  /* ── Step 2 UI ── */
  if (step === 2) {
    return (
      <AuthLayout title="Verify OTP">
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <p className="text-sm text-muted text-center -mt-4">
            OTP sent to <span className="font-semibold text-charcoal">{email}</span>
          </p>

          <div className="relative">
            <input
              type="text"
              maxLength={6}
              placeholder="OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input-field tracking-[0.5em] text-center text-xl font-mono pr-20"
            />
            <button
              type="button"
              onClick={resendOtp}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-semibold hover:text-primary-dark"
            >
              verify
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base disabled:opacity-60"
          >
            {loading ? 'Verifying...' : 'Next'}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm text-muted hover:text-charcoal text-center transition-colors"
          >
            ← Change email
          </button>
        </form>
      </AuthLayout>
    )
  }

  /* ── Step 3 UI ── */
  return (
    <AuthLayout title="Complete Profile">
      <form onSubmit={handleRegister} className="space-y-4">
        <p className="text-sm text-muted text-center -mt-4 mb-1">
          ✓ <span className="text-green-600 font-medium">{email}</span> verified
        </p>

        {[
          { name: 'name', placeholder: 'NAME', type: 'text' },
          { name: 'rollNo', placeholder: 'ROLL NO.', type: 'text' },
          { name: 'phone', placeholder: 'Phone number', type: 'tel' },
          { name: 'password', placeholder: 'Password', type: 'password' },
          { name: 'confirmPassword', placeholder: 'Confirm Password', type: 'password' },
        ].map(field => (
          <input
            key={field.name}
            name={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={form[field.name]}
            onChange={handleChange}
            className="input-field-cream"
            autoComplete={field.name === 'password' ? 'new-password' : field.name}
          />
        ))}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-60"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
    </AuthLayout>
  )
}
