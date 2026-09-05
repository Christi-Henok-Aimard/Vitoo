export const AUTH_TEXTS = {
  // --------------------------------------------------------------------------
  // 1. PAGE D'INSCRIPTION (RegisterForm)
  // --------------------------------------------------------------------------
  register: {
    title: 'Créer un compte',
    subtitle: 'Rejoignez VITOO et voyagez en toute sérénité',
    googleBtn: 'Continuer avec Google',
    dividerText: 'ou avec vos informations',
    lastName: 'Nom',
    firstName: 'Prénoms',
    phone: 'Numéro de téléphone (ex: 0700000000)',
    email: 'Adresse email (optionnel)',
    city: 'Ville de résidence (ex: Daoukro)',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    submitBtn: "S'inscrire gratuitement",
    hasAccount: 'Vous avez déjà un compte ?',
    loginLink: 'Se connecter',
  },

  // --------------------------------------------------------------------------
  // 2. PAGE DE CONNEXION (LoginForm)
  // --------------------------------------------------------------------------
  login: {
    title: 'Bon retour !',
    subtitle: 'Connectez-vous pour accéder à vos trajets',
    phone: 'Numéro de téléphone',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    submitBtn: 'Se connecter',
    noAccount: "Vous n'avez pas de compte ?",
    registerLink: "S'inscrire",
  },

  // --------------------------------------------------------------------------
  // 3. RECUPERATION DE MOT DE PASSE & SMS OTP (ForgotPasswordForm)
  // --------------------------------------------------------------------------
  forgotPassword: {
    // Étape 1 : Saisie téléphone
    phoneTitle: 'Mot de passe oublié',
    phoneSubtitle: 'Entrez votre numéro pour recevoir un code de vérification SMS',
    sendCodeBtn: 'Envoyer le code SMS',
    
    // Étape 2 : Saisie OTP
    otpTitle: 'Code de vérification',
    otpSubtitle: 'Entrez le code à 6 chiffres envoyé au',
    verifyBtn: 'Vérifier le code',
    resendCode: 'Renvoyer le code SMS',

    // Étape 3 : Nouveau mot de passe
    resetTitle: 'Nouveau mot de passe',
    resetSubtitle: 'Définissez votre nouveau mot de passe de connexion',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le nouveau mot de passe',
    resetBtn: 'Enregistrer le mot de passe',
  },
} as const;