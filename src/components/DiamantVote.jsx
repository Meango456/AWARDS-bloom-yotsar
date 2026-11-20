import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DIAMANT } from '../lib/categories.js'
import { isConfigured, supabase } from '../lib/supabase.js'
import { useDiamantOpen } from '../lib/diamant.js'
import Icon from './Icon.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const empty = { first_name: '', last_name: '', email: '', femme: '', homme: '' }

/**
 * Vote « Diamant de la soirée » : invisible tant que le vote n'est pas ouvert.
 * Il apparaît tout seul le jour J, dès que l'organisateur ouvre le vote (ou à la date prévue).
 */
export default function DiamantVote() {
  const open = useDiamantOpen()
  const [data, setData] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [serverError, setServerError] = useState('')

  const set = (k, v) => {
    setData((d) => ({ ...d, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
    if (serverError) setServerError('')
  }

  const validate = () => {
    const e = {}
    if (data.first_name.trim().length < 2) e.first_name = 'Entrez votre prénom'
    if (data.last_name.trim().length < 2) e.last_name = 'Entrez votre nom'
    if (!EMAIL_RE.test(data.email.trim())) e.email = 'Entrez une adresse email valide'
    if (data.femme.trim().length < 2 && data.homme.trim().length < 2) {
      e.femme = 'Nommez au moins une personne'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setSending(true)
    setServerError('')
    const payload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.trim().toLowerCase(),
      femme: data.femme.trim() || null,
      homme: data.homme.trim() || null,
    }
    try {
      if (!isConfigured) {
        await new Promise((r) => setTimeout(r, 900))
        console.warn('Supabase non configuré : vote Diamant simulé (mode démo).', payload)
      } else {
        const { error } = await supabase.from('diamant_votes').insert(payload)
        if (error) {
          console.error('Erreur Supabase :', error)
          if (error.code === '23505') {
            setServerError('Cette adresse email a déjà servi à voter pour le Diamant. Un seul vote par personne.')
          } else if (error.code === '42501') {
            setServerError("Le vote Diamant n'est pas ouvert, ou vient de se clôturer.")
          } else if (error.code === 'PGRST205' || error.code === '42P01') {
            setServerError("Table introuvable : exécutez supabase/diamant.sql dans l'éditeur SQL de Supabase.")
          } else {
            setServerError(`Une erreur est survenue (${error.code || error.message}). Merci de réessayer dans un instant.`)
          }
          setSending(false)
          return
        }
      }
      setDone(true)
    } catch {
      setServerError('Connexion impossible. Vérifiez votre réseau et réessayez.')
    }
    setSending(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="diamant"
          className="section diamant-section"
          id="diamant"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="section-head">
            <p className="eyebrow">
              <span>✦</span> Ce soir seulement <span>✦</span>
            </p>
            <h2>{DIAMANT.title}</h2>
            <p className="diamant-desc">{DIAMANT.desc}</p>
          </div>

          {!isConfigured && (
            <p className="demo-note" role="alert">
              Mode démonstration : Supabase n'est pas connecté, les votes ne sont pas enregistrés.
            </p>
          )}

          <div className="card">
            {done ? (
              <motion.div
                className="success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
              >
                <motion.span
                  className="seal"
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 12, delay: 0.2 }}
                >
                  <Icon name="check" size={38} stroke={2} />
                </motion.span>
                <h3>Merci {data.first_name.trim()} !</h3>
                <p>Votre vote pour le Diamant de la soirée a bien été enregistré.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} noValidate className="step">
                <div className="cat-head">
                  <span className="cat-icon big">
                    <Icon name="gem" size={34} />
                  </span>
                  <h3 className="step-title">Qui est le mieux habillé ?</h3>
                  <p className="step-sub">Nommez une personne, ou les deux. Un seul vote par adresse email.</p>
                </div>

                <div className="grid-2">
                  <Field label="Prénom" error={errors.first_name}>
                    <input
                      value={data.first_name}
                      onChange={(e) => set('first_name', e.target.value)}
                      autoComplete="given-name"
                      placeholder="Ex. Awa"
                    />
                  </Field>
                  <Field label="Nom" error={errors.last_name}>
                    <input
                      value={data.last_name}
                      onChange={(e) => set('last_name', e.target.value)}
                      autoComplete="family-name"
                      placeholder="Ex. Koné"
                    />
                  </Field>
                </div>
                <Field label="Adresse email" error={errors.email}>
                  <input
                    type="email"
                    inputMode="email"
                    value={data.email}
                    onChange={(e) => set('email', e.target.value)}
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                  />
                </Field>

                {DIAMANT.groups.map((g) => (
                  <Field key={g.key} label={`${g.title} · ${g.label}`} error={errors[g.key]}>
                    <input
                      value={data[g.key]}
                      onChange={(e) => set(g.key, e.target.value)}
                      placeholder="Prénom et nom"
                      maxLength={120}
                    />
                  </Field>
                ))}

                {serverError && <p className="error banner">{serverError}</p>}

                <div className="actions">
                  <span />
                  <button type="submit" className="btn btn-gold" disabled={sending}>
                    {sending ? 'Envoi en cours…' : 'Voter pour le Diamant'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

function Field({ label, error, children }) {
  return (
    <label className={'field' + (error ? ' has-error' : '')}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="error">{error}</span>}
    </label>
  )
}
