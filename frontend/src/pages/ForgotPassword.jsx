import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import { AuthLayout } from './Login'

export default function ForgotPassword() {
  const [step, setStep] = useState(1) // 1=email, 2=otp+newpassword
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [email, setEmail] = useState('') // actual email for reset
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!emailOrPhone) { toast.error('Enter your email'); return }
    try {
      setLoading(true)
      await authAPI.forgotPassword(emailOrPhone)
      // Store the value as email for the reset step
      setEmail(emailOrPhone)
      toast.success('OTP sent! Check your email.')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    if (!otp) { toast.error('Enter the OTP'); return }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    try {
      setLoading(true)
      await authAPI.resetPassword(email, otp, password)
      toast.success('Password changed successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <AuthLayout title="Change Password">
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-sm text-muted text-center -mt-4 mb-2">
            OTP sent to <span className="font-semibold text-charcoal">{email}</span>
          </p>
          <div className="relative">
            <input
              type="text"
              placeholder="OTP verify"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input-field tracking-widest text-center font-mono pr-16"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleSendOtp}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-semibold"
            >
              resend
            </button>
          </div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="input-field"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base disabled:opacity-60"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-sm text-muted hover:text-charcoal text-center"
          >
            ← Back
          </button>
        </form>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forget Password">
      <form onSubmit={handleSendOtp} className="space-y-5">
        <input
          type="text"
          placeholder="Email/ Phone No."
          value={emailOrPhone}
          onChange={e => setEmailOrPhone(e.target.value)}
          className="input-field"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send OTP'}
        </button>
      </form>
    </AuthLayout>
  )
}
