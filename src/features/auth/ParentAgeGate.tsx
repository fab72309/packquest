import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import './ParentAgeGate.css'

const adultSessionKey = 'packquest.parent.adult-confirmed'
const birthMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function ageOnDate(value: string, today = new Date()): number | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const birthDate = new Date(year, month - 1, day)
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day || birthDate > today) return null
  let age = today.getFullYear() - year
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age -= 1
  return age
}

export function ParentAgeGate({ children }: { children: ReactNode }) {
  const [adultConfirmed, setAdultConfirmed] = useState(() => window.sessionStorage.getItem(adultSessionKey) === 'true')
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [under18, setUnder18] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const closeAdultSession = () => setAdultConfirmed(false)
    window.addEventListener('packquest:adult-session-ended', closeAdultSession)
    return () => window.removeEventListener('packquest:adult-session-ended', closeAdultSession)
  }, [])

  function clearBirthDate() {
    setBirthDay('')
    setBirthMonth('')
    setBirthYear('')
  }

  function continueToParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const age = /^\d{4}$/.test(birthYear) ? ageOnDate(`${birthYear}-${birthMonth}-${birthDay}`) : null
    if (age === null) {
      setError('Indique une date de naissance valide.')
      return
    }
    clearBirthDate()
    setError('')
    if (age < 18) {
      setUnder18(true)
      return
    }
    window.sessionStorage.setItem(adultSessionKey, 'true')
    setAdultConfirmed(true)
  }

  if (adultConfirmed) return children

  return (
    <main className="parent-age-page">
      <section className="parent-age-card" aria-labelledby="parent-age-title">
        <Link className="parent-age-back" to="/">← Accueil</Link>
        <p className="parent-age-eyebrow">PACKQUEST</p>
        <h1 id="parent-age-title">À qui appartient cet espace&nbsp;?</h1>
        <p>Indique ta date de naissance pour ouvrir l’espace adapté. Elle est vérifiée sur cet appareil, puis effacée ; PackQuest ne l’enregistre pas et ne l’envoie pas.</p>
        {!under18 ? <form onSubmit={(event) => continueToParent(event)}>
          <fieldset className="parent-age-date">
            <legend>Date de naissance</legend>
            <div className="parent-age-date-fields">
              <label htmlFor="parent-age-birth-day">Jour
                <input id="parent-age-birth-day" type="text" inputMode="numeric" pattern="[0-9]{1,2}" maxLength={2} placeholder="JJ" value={birthDay} onChange={(event) => { setBirthDay(event.target.value.replace(/\D/g, '').slice(0, 2)); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'parent-age-error' : undefined} required />
              </label>
              <label htmlFor="parent-age-birth-month">Mois
                <select id="parent-age-birth-month" value={birthMonth} onChange={(event) => { setBirthMonth(event.target.value); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'parent-age-error' : undefined} required>
                  <option value="">Mois</option>
                  {birthMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                </select>
              </label>
              <label htmlFor="parent-age-birth-year">Année
                <input id="parent-age-birth-year" type="text" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} placeholder="AAAA" value={birthYear} onChange={(event) => { setBirthYear(event.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'parent-age-error' : undefined} required />
              </label>
            </div>
          </fieldset>
          {error && <p id="parent-age-error" className="account-message account-message--error" role="alert">{error}</p>}
          <button className="button button--primary" type="submit">Continuer</button>
        </form> : <div className="parent-age-child-choice" role="status">
          <p>L’espace parent est réservé aux adultes. Demande à ton parent de t’aider à rejoindre l’espace enfant.</p>
          <Link className="button button--primary" to="/child/join">Rejoindre ma famille</Link>
          <button type="button" onClick={() => { setUnder18(false); clearBirthDate() }}>Recommencer</button>
        </div>}
        <p className="parent-age-privacy"><Link to="/privacy">Notice de confidentialité</Link></p>
      </section>
    </main>
  )
}
