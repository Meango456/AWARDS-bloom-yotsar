
import { useCallback, useEffect, useState } from 'react'
import { DIAMANT } from './categories.js'
import { isConfigured, supabase } from './supabase.js'

/** Heure courante, rafraîchie à intervalle régulier (pour le décompte). */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

/** Découpe une durée en millisecondes en jours, heures, minutes, secondes. */
export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

/**
 * Côté invités : le vote Diamant est-il ouvert ?
 * C'est le serveur Supabase qui répond (son horloge fait foi), puis on revérifie toutes les 30 secondes
 * pour que la section apparaisse toute seule le jour J, sans recharger la page.
 * Sans Supabase (mode démo), on compare avec la date de démonstration de categories.js.
 */
export function useDiamantOpen() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const check = async () => {
      let value = false
      if (!isConfigured) {
        value = Date.now() >= new Date(DIAMANT.demoOpensAt).getTime()
      } else {
        const { data, error } = await supabase.rpc('diamant_is_open')
        value = !error && data === true
      }
      if (alive) setOpen(value)
    }
    check()
    const id = setInterval(check, 30000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return open
}

/** Côté organisateur : réglages (dates d'ouverture/clôture) et votes Diamant, en direct. */
export function useDiamantAdmin() {
  const [state, setState] = useState({ settings: null, votes: [], error: '', loading: true })

  const load = useCallback(async () => {
    const [s, v] = await Promise.all([
      supabase.from('diamant_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('diamant_votes').select('*').order('created_at', { ascending: false }),
    ])
    if (s.error || v.error || !s.data) {
      setState((p) => ({
        ...p,
        loading: false,
        error: "Le Diamant n'est pas encore activé : exécutez supabase/diamant.sql dans l'éditeur SQL de Supabase.",
      }))
      return
    }
    setState({ settings: s.data, votes: v.data, error: '', loading: false })
  }, [])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('diamant-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diamant_votes' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  /** Enregistre de nouvelles dates. Renvoie une erreur ou null. */
  const save = async (patch) => {
    const { error } = await supabase.from('diamant_settings').update(patch).eq('id', 1)
    if (error) return error
    await load()
    return null
  }

  /** Appelle diamant_open_now ou diamant_close_now. Renvoie une erreur ou null. */
  const run = async (fn) => {
    const { error } = await supabase.rpc(fn)
    if (error) return error
    await load()
    return null
  }

  return { ...state, reload: load, save, run }
}
