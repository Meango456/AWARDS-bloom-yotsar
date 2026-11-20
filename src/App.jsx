import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { DIAMANT } from '../lib/categories.js'
import { isConfigured, supabase } from '../lib/supabase.js'
import { tally, tallyDiamant } from '../lib/tally.js'
import { buildWorkbook, exportFileName } from '../lib/exportExcel.js'
import { splitDuration, useDiamantAdmin, useNow } from '../lib/diamant.js'
import Icon from './Icon.jsx'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isConfigured) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return <div className="admin-wrap" />

  if (!isConfigured) {
    return (
      <div className="admin-wrap">
        <div className="card narrow">
          <h3 className="step-title">Supabase non configuré</h3>
          <p className="step-sub">
            Copiez <code>.env.example</code> en <code>.env</code>, renseignez vos clés Supabase puis relancez le site.
          </p>
          <a className="btn btn-ghost" href="#/">
            <Icon name="back" size={18} /> Retour au site
          </a>
        </div>
      </div>
    )
  }

  return session ? <Dashboard /> : <Login />
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Identifiants incorrects.')
    setBusy(false)
  }

  return (
    <div className="admin-wrap">
      <motion.form
        onSubmit={submit}
        className="card narrow"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <img src="/logo.png" alt="" className="admin-logo" />
        <h3 className="step-title">Espace organisateur</h3>
        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        </label>
        <label className="field">
          <span className="field-label">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error banner">{error}</p>}
        <div className="actions">
          <a className="btn btn-ghost" href="#/">
            <Icon name="back" size={18} /> Site
          </a>
          <button className="btn btn-gold" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

function Dashboard() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const dia = useDiamantAdmin()

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('nominations').select('*').order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les données. Vérifiez les règles RLS (supabase/schema.sql).')
    else {
      setError('')
      setRows(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('nominations-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nominations' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const results = useMemo(() => tally(rows), [rows])
  const diamantResults = useMemo(() => tallyDiamant(dia.votes), [dia.votes])

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    XLSX.writeFile(buildWorkbook(XLSX, rows, dia.votes), exportFileName())
  }

  const refresh = () => {
    load()
    dia.reload()
  }

  return (
    <div className="admin-wrap wide">
      <header className="admin-head">
        <div>
          <p className="eyebrow">
            <span>✦</span> Espace organisateur
          </p>
          <h2>Résultats en direct</h2>
          <p className="step-sub">
            {rows.length} participant{rows.length > 1 ? 's ont' : ' a'} déjà voté.
          </p>
        </div>
        <div className="admin-actions">
          <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button className="btn btn-gold" onClick={exportExcel} disabled={!rows.length && !dia.votes.length}>
            <Icon name="download" size={18} /> Exporter en Excel
          </button>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>
            Déconnexion
          </button>
        </div>
      </header>

      {error && <p className="error banner">{error}</p>}

      <DiamantPanel dia={dia} />

      <div className="result-grid">
        {results.map((c) => (
          <RankCard key={c.key} c={c} empty="Aucune nomination pour le moment." />
        ))}
        {diamantResults.map((c) => (
          <RankCard key={c.key} c={c} empty="Aucun vote pour le moment." note="Vote du jour J" />
        ))}
      </div>

      <a className="admin-link" href="#/">
        ← Retour au site
      </a>
    </div>
  )
}

function RankCard({ c, empty, note }) {
  const max = c.list[0]?.votes || 1
  return (
    <section className="card result-card">
      <h3 className="result-title">
        <Icon name={c.icon} size={22} /> {c.title}
      </h3>
      {note && <p className="result-note">{note}</p>}
      {c.list.length === 0 && <p className="hint">{empty}</p>}
      <ol className="rank">
        {c.list.slice(0, 8).map((n, i) => (
          <li key={n.name}>
            <div className="rank-line">
              <span className="rank-pos">{i + 1}</span>
              <span className="rank-name">{n.name}</span>
              <span className="rank-votes">{n.votes}</span>
            </div>
            <div className="bar">
              <motion.i
                initial={{ width: 0 }}
                animate={{ width: `${(n.votes / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            </div>
          </li>
        ))}
      </ol>
      {c.list.length > 8 && <p className="hint">+ {c.list.length - 8} autres dans l'export Excel</p>}
    </section>
  )
}

/* ---------- Diamant de la soirée : décompte et réglages ---------- */

const pad = (n) => String(n).padStart(2, '0')

/** ISO -> valeur d'un champ datetime-local (heure locale du navigateur). */
const toInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fmt = (ms) => new Date(ms).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })

function Countdown({ ms }) {
  const { d, h, m, s } = splitDuration(ms)
  const units = [
    ['jours', d],
    ['heures', h],
    ['minutes', m],
    ['secondes', s],
  ]
  return (
    <div className="countdown" role="timer">
      {units.map(([label, v]) => (
        <div className="cd-unit" key={label}>
          <span className="cd-num">{pad(v)}</span>
          <span className="cd-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

function DiamantPanel({ dia }) {
  const now = useNow()
  const { settings, votes, error } = dia
  const [opens, setOpens] = useState('')
  const [closes, setCloses] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (settings) {
      setOpens(toInput(settings.opens_at))
      setCloses(toInput(settings.closes_at))
    }
  }, [settings])

  const opensAt = settings ? new Date(settings.opens_at).getTime() : 0
  const closesAt = settings?.closes_at ? new Date(settings.closes_at).getTime() : null
  const status = now < opensAt ? 'wait' : closesAt && now >= closesAt ? 'closed' : 'open'

  const done = (err, ok) => {
    setBusy(false)
    setMsg(err ? "L'action a échoué. Vérifiez que supabase/diamant.sql a bien été exécuté." : ok)
  }

  const saveDates = async (e) => {
    e.preventDefault()
    if (!opens) {
      setMsg("Indiquez la date d'ouverture.")
      return
    }
    const o = new Date(opens)
    const c = closes ? new Date(closes) : null
    if (c && c <= o) {
      setMsg("La clôture doit être après l'ouverture.")
      return
    }
    setBusy(true)
    setMsg('')
    done(await dia.save({ opens_at: o.toISOString(), closes_at: c ? c.toISOString() : null }), 'Dates enregistrées.')
  }

  const openNow = async () => {
    if (!window.confirm('Ouvrir le vote Diamant à tous les invités maintenant ?')) return
    setBusy(true)
    setMsg('')
    done(await dia.run('diamant_open_now'), 'Le vote est ouvert : il apparaît sur le site des invités.')
  }

  const closeNow = async () => {
    if (!window.confirm('Clôturer le vote Diamant maintenant ?')) return
    setBusy(true)
    setMsg('')
    done(await dia.run('diamant_close_now'), 'Le vote est clôturé.')
  }

  return (
    <section className="card diamant-admin">
      <div className="diamant-top">
        <span className="cat-icon">
          <Icon name="gem" size={26} />
        </span>
        <div>
          <h3 className="result-title">{DIAMANT.title}</h3>
          <p className="step-sub">Vote spécial du jour J. Les invités ne le voient pas tant qu'il n'est pas ouvert.</p>
        </div>
      </div>

      {error && <p className="error banner">{error}</p>}
      {!error && !settings && <p className="hint">Chargement…</p>}

      {!error && settings && (
        <>
          <div className="diamant-status">
            {status === 'wait' && (
              <>
                <p className="diamant-state">Ouverture du vote dans</p>
                <Countdown ms={opensAt - now} />
                <p className="hint">Ouverture prévue le {fmt(opensAt)}</p>
              </>
            )}
            {status === 'open' && (
              <>
                <p className="diamant-state">
                  <span className="badge-open">Vote ouvert</span> {votes.length} vote{votes.length > 1 ? 's' : ''} reçu
                  {votes.length > 1 ? 's' : ''}
                </p>
                {closesAt ? (
                  <>
                    <Countdown ms={closesAt - now} />
                    <p className="hint">Clôture prévue le {fmt(closesAt)}</p>
                  </>
                ) : (
                  <p className="hint">Aucune clôture prévue : le vote reste ouvert jusqu'à ce que vous le clôturiez.</p>
                )}
              </>
            )}
            {status === 'closed' && (
              <p className="diamant-state">
                <span className="badge-closed">Vote clôturé</span> {votes.length} vote{votes.length > 1 ? 's' : ''} au total
              </p>
            )}
          </div>

          <form className="diamant-schedule" onSubmit={saveDates}>
            <label className="field">
              <span className="field-label">Ouverture du vote</span>
              <input type="datetime-local" value={opens} onChange={(e) => setOpens(e.target.value)} required />
            </label>
            <label className="field">
              <span className="field-label">Clôture (facultative)</span>
              <input type="datetime-local" value={closes} onChange={(e) => setCloses(e.target.value)} />
            </label>
            <div className="diamant-buttons">
              <button type="submit" className="btn btn-gold" disabled={busy}>
                Enregistrer les dates
              </button>
              <button type="button" className="btn btn-ghost" onClick={openNow} disabled={busy || status === 'open'}>
                Ouvrir maintenant
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeNow} disabled={busy || status !== 'open'}>
                Clôturer maintenant
              </button>
            </div>
            {msg && (
              <p className="hint" role="status">
                {msg}
              </p>
            )}
          </form>
        </>
      )}
    </section>
  )
}
