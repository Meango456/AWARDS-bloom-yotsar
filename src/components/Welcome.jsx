import React from 'react'
import { motion } from 'framer-motion'
import { WELCOME } from '../lib/categories.js'

export default function Welcome() {
  return (
    <section className="section welcome" id="bienvenue">
      <motion.div
        className="welcome-card"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="welcome-title">{WELCOME.title}</h2>
        <div className="ornament" aria-hidden="true">
          <i /> <b>◆</b> <i />
        </div>
        {WELCOME.paragraphs.map((p) => (
          <p key={p} className="welcome-text">
            {p}
          </p>
        ))}
        <p className="welcome-sign">{WELCOME.signature}</p>
      </motion.div>
    </section>
  )
}
