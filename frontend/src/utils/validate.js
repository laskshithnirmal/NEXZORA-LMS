// Small, dependency-free form validation helpers.
// Each rule returns an error message, or '' when the value is valid.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+0-9 ()-]{7,20}$/

export const rules = {
  required: (label) => (v) => (v === null || v === undefined || String(v).trim() === '' ? `${label} is required` : ''),
  email: () => (v) => (v && !EMAIL_RE.test(String(v).trim()) ? 'Enter a valid email address' : ''),
  minLength: (n, label) => (v) => (v && String(v).length < n ? `${label} must be at least ${n} characters` : ''),
  maxLength: (n, label) => (v) => (v && String(v).length > n ? `${label} must be at most ${n} characters` : ''),
  phone: () => (v) => (v && !PHONE_RE.test(String(v).trim()) ? 'Phone number must be 7-20 digits' : ''),
  url: () => (v) => (v && !/^https?:\/\/\S+$/i.test(String(v).trim()) ? 'URL must start with http:// or https://' : ''),
  number: (label, { min, max } = {}) => (v) => {
    if (v === '' || v === null || v === undefined) return ''
    const n = Number(v)
    if (Number.isNaN(n)) return `${label} must be a number`
    if (min !== undefined && n < min) return `${label} must be at least ${min}`
    if (max !== undefined && n > max) return `${label} must be at most ${max}`
    return ''
  },
  pattern: (re, message) => (v) => (v && !re.test(String(v).trim()) ? message : ''),
  matches: (otherField, message) => (v, values) => (v !== values[otherField] ? message : ''),
}

/**
 * Validates `values` against `schema` ({ field: [rule, rule] }).
 * Returns an object of field -> first error message (empty object when valid).
 */
export function validate(values, schema) {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const msg = rule(values[field], values)
      if (msg) {
        errors[field] = msg
        break
      }
    }
  }
  return errors
}
