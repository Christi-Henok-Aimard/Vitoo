// Formatage monétaire FCFA : 5000 -> "5 000 FCFA"
export const formatPrice = (price: number): string => `${price.toLocaleString('fr-FR').replace(/\u202f/g, ' ')} FCFA`;

// Numéro affichable et lien tel:/wa.me:/sms: propre
export const toPhoneLink = (phone: string): string => `+225${phone.replace(/\D/g, '').replace(/^225/, '')}`;
