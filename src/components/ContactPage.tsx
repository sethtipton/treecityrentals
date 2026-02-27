import { useMemo, useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { useSearchParams } from 'react-router-dom'
import SiteLayout from './SiteLayout'
import useDocumentMeta from '../hooks/useDocumentMeta'

type InquiryForm = {
  name: string
  email: string
  phone: string
  interestedProperty: string
  moveInDate: string
  message: string
}

type FormErrors = Partial<Record<keyof InquiryForm, string>>

const initialForm: InquiryForm = {
  name: '',
  email: '',
  phone: '',
  interestedProperty: '',
  moveInDate: '',
  message: '',
}

export default function ContactPage() {
  const [searchParams] = useSearchParams()

  const prefillProperty = (searchParams.get('property') ?? '').trim()
  const prefillFrom = (searchParams.get('from') ?? '').trim()

  useDocumentMeta({
    title: 'Contact | Tree City Rentals',
    description: 'Contact Tree City Rentals about rental availability, move-in dates, or property questions.',
  })

  const prefilledInitialForm = useMemo<InquiryForm>(() => {
    const next: InquiryForm = { ...initialForm }

    if (prefillProperty) {
      next.interestedProperty = prefillProperty
    }

    if (prefillFrom) {
      next.message = `Hi, I'm interested in ${prefillProperty || 'this rental'}.\n\nListing: ${prefillFrom}`
    }

    return next
  }, [prefillProperty, prefillFrom])

  const [form, setForm] = useState<InquiryForm>(() => prefilledInitialForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const canShowSummary = useMemo(() => submitted, [submitted])

  function updateField<K extends keyof InquiryForm>(key: K, value: InquiryForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validate(values: InquiryForm): FormErrors {
    const nextErrors: FormErrors = {}

    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!values.message.trim()) {
      nextErrors.message = 'Please add a short message.'
    } else if (values.message.trim().length < 10) {
      nextErrors.message = 'Message should be at least 10 characters.'
    }

    return nextErrors
  }

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()

    const validationErrors = validate(form)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      setSubmitted(false)
      return
    }

    // Frontend-only placeholder submit.
    // Later: replace with Formspree / serverless / custom API request.
    console.log('Inquiry submitted (frontend placeholder):', form)
    setSubmitted(true)
  }

  function handleReset() {
    setForm(prefilledInitialForm)
    setErrors({})
    setSubmitted(false)
  }

  return (
    <SiteLayout>
      <h1 className="page-title">Contact / Rental Inquiry</h1>
      <p className="page-subtle" style={{ marginTop: 0 }}>
        This is a frontend route. We’ll connect it to a real submission endpoint later.
      </p>

      {prefillProperty && (
        <p className="page-subtle" style={{ marginTop: '0.25rem' }}>
          Prefilled from rental: <strong>{prefillProperty}</strong>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ display: 'grid', gap: '0.9rem', maxWidth: '760px' }}
        noValidate
      >
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <label htmlFor="name">Name *</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            autoComplete="name"
          />
          {errors.name && <small style={{ color: '#b91c1c' }}>{errors.name}</small>}
        </div>

        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            autoComplete="email"
          />
          {errors.email && <small style={{ color: '#b91c1c' }}>{errors.email}</small>}
        </div>

        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <label htmlFor="phone">Phone (optional)</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            autoComplete="tel"
          />
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label htmlFor="interestedProperty">Interested Property (optional)</label>
            <input
              id="interestedProperty"
              type="text"
              value={form.interestedProperty}
              onChange={(e) => updateField('interestedProperty', e.target.value)}
              placeholder="e.g. 123 Main St or a rental title"
            />
          </div>

          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <label htmlFor="moveInDate">Desired Move-In Date (optional)</label>
            <input
              id="moveInDate"
              type="date"
              value={form.moveInDate}
              onChange={(e) => updateField('moveInDate', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <label htmlFor="message">Message *</label>
          <textarea
            id="message"
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={6}
            placeholder="Tell us what you're looking for, preferred move-in timing, pets, etc."
          />
          {errors.message && <small style={{ color: '#b91c1c' }}>{errors.message}</small>}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="submit">Send Inquiry</button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>

      {canShowSummary && (
        <div className="card" style={{ marginTop: '1rem', maxWidth: '760px' }}>
          <h2 style={{ margin: 0 }}>Inquiry saved (frontend placeholder) ✅</h2>
          <p className="page-subtle" style={{ marginTop: '0.25rem' }}>
            Next step we can connect this to Formspree or a serverless endpoint.
          </p>

          <div className="meta-row">
            <span><strong>Name:</strong> {form.name}</span>
            <span><strong>Email:</strong> {form.email}</span>
            {form.phone && <span><strong>Phone:</strong> {form.phone}</span>}
          </div>

          {(form.interestedProperty || form.moveInDate) && (
            <div className="meta-row">
              {form.interestedProperty && (
                <span><strong>Property:</strong> {form.interestedProperty}</span>
              )}
              {form.moveInDate && <span><strong>Move-In:</strong> {form.moveInDate}</span>}
            </div>
          )}

          <div>
            <strong>Message:</strong>
            <p style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{form.message}</p>
          </div>
        </div>
      )}
    </SiteLayout>
  )
}