
import React, { useEffect, useState } from 'react'
import Particles from './components/Particles.jsx'
import Hero from './components/Hero.jsx'
import Categories from './components/Categories.jsx'
import NominationForm from './components/NominationForm.jsx'
import Admin from './components/Admin.jsx'
import { EVENT } from './lib/categories.js'

function useHash() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const on = () => setHash(window.location.hash)

    window.addEventListener('hashchange', on)

    return () => window.removeEventListener('hashchange', on)
  }, [])

  return hash
}

export default function App() {
  const hash = useHash()
  const isAdmin = hash.startsWith('#/admin')

  return (
    <>
      <div className="bg-glow" aria-hidden="true" />

      <Particles />

      {isAdmin ? (
        <Admin />
      ) : (
        <main>
          <Hero />

          <Categories />

          <NominationForm />

          <footer className="footer">
            <img
              src="/logo.png"
              alt="Bloom Centre Yotsar · Vases d'Honneur"
              className="footer-logo"
            />

            <p>
              {EVENT.name} {EVENT.year} · {EVENT.place}
            </p>

            <a className="admin-link" href="#/admin">
              Espace organisateur
            </a>
          </footer>
        </main>
      )}
    </>
  )
}
