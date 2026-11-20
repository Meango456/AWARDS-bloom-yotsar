export const CATEGORIES = [
  {
    key: 'entrepreneur',
    title: 'Meilleur entrepreneur',
    short: 'Entrepreneur',
    desc: "Celui ou celle qui bâtit, innove et fait grandir son projet avec audace.",
    icon: 'crown',
  },
  {
    key: 'coeur_or',
    title: 'Cœur en or',
    short: 'Cœur en or',
    desc: "Une personne particulièrement disponible pour les autres, toujours prête à servir.",
    icon: 'heart',
  },
  {
    key: 'revelation',
    title: 'Révélation',
    short: 'Révélation',
    desc: "Une nouvelle personne qui a su s'intégrer remarquablement au sein de Bloom.",
    icon: 'sprout',
  },
  {
    key: 'aura',
    title: 'Aura balèze',
    short: 'Aura balèze',
    desc: "Une personne qui se distingue par son charisme, son élégance et son leadership.",
    icon: 'star',
  },
  {
    key: 'solaire',
    title: 'Personne la plus solaire',
    short: 'Solaire',
    desc: "La plus souriante, dont la bonne humeur illumine tout son entourage.",
    icon: 'sun',
  },
]

export const EVENT = {
  name: 'Splendeur Awards',
  year: '2026',
  date: '24 décembre 2026',
  place: 'Bloom Centre Yotsar',
}

// Message de bienvenue affiché sous l'accueil : modifiez librement ces textes.
export const WELCOME = {
  title: 'Bienvenue à la soirée des Splendeur Awards',
  paragraphs: [
    "Chers invités, chers amis de Bloom, cette soirée est la nôtre : celle où nous honorons les personnes qui, jour après jour, font briller notre communauté.",
    "Prenez quelques minutes pour nommer celles et ceux qui vous ont marqué cette année, dans chacune des cinq distinctions. Chaque nomination est une manière de dire merci.",
  ],
  signature: 'Avec toute notre reconnaissance.',
}

// Catégorie spéciale : le vote ne s'ouvre que le jour J (invisible pour les invités avant).
// Les vraies dates se règlent dans l'espace organisateur ; demoOpensAt ne sert qu'en mode démo (sans Supabase).
export const DIAMANT = {
  title: 'Diamant de la soirée',
  desc: 'La personne la mieux habillée de la soirée : un diamant pour elle, un diamant pour lui.',
  icon: 'gem',
  demoOpensAt: '2026-12-24T18:00:00Z',
  groups: [
    { key: 'femme', title: 'Diamant féminin', label: 'La mieux habillée', icon: 'gem' },
    { key: 'homme', title: 'Diamant masculin', label: 'Le mieux habillé', icon: 'gem' },
  ],
}
