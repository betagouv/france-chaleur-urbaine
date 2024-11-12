import React, { ReactNode, useContext, useState } from 'react';

import cx from '@utils/cx';

import AsyncButton, { type AsyncButtonProps } from './AsyncButton';

type NewsletterContextType = {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  error: string | null;
  handleSignUp: () => Promise<any>;
};

const NewsletterContext = React.createContext<NewsletterContextType>({
  email: '',
  setEmail: () => '',
  setError: () => '',
  error: null,
  handleSignUp: async () => null,
});

export const NewsletterInput = ({
  className,
  placeholder = 'Votre adresse électronique (ex. nom@domaine.fr)',
}: {
  className?: string;
  placeholder?: string;
}) => {
  const { email, setEmail, error, setError } = useContext(NewsletterContext);

  return (
    <input
      className={cx('fr-input', { 'fr-input--error': !!error }, className)}
      type="email"
      autoComplete="email"
      placeholder={placeholder}
      value={email}
      onChange={(e) => {
        setError('');
        setEmail(e.target.value);
      }}
    />
  );
};

export const NewsletterButton: React.FC<Omit<AsyncButtonProps, 'disabled' | 'onClick'>> = ({
  children = "S'abonner",
  title = "S'abonner",
  ...props
}) => {
  const { handleSignUp, error } = useContext(NewsletterContext);

  return (
    <AsyncButton disabled={!!error} onClick={handleSignUp} title={title} {...props}>
      {children}
    </AsyncButton>
  );
};

export const NewsletterError: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  const { error } = useContext(NewsletterContext);
  if (!error) return null;
  return (
    <p className={cx('fr-error-text', className)} {...props}>
      {error}
    </p>
  );
};

type NewsletterSectionProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  inputlabel?: string;
};

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title = '',
  subtitle = '',
  buttonText = "S'abonner",
  inputlabel = '',
  className,
  ...props
}) => {
  const { error } = useContext(NewsletterContext);

  return (
    <div className={cx('fr-follow', className)} {...props}>
      <div className="fr-container">
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <div className="fr-follow__newsletter">
              <div>
                <h2 className="fr-h5">{title}</h2>
                <p className="fr-text--sm">{subtitle}</p>
              </div>
              <div>
                <div className={cx('fr-input-group', { 'fr-input-group--error': !!error })}>
                  <label htmlFor="newsletter-email" className="fr-label">
                    {inputlabel}
                  </label>
                  <div className="fr-input-wrap fr-input-wrap--addon">
                    <NewsletterInput />
                    <NewsletterButton>{buttonText}</NewsletterButton>
                  </div>
                </div>
                <NewsletterError />
                <p id="newsletter-email-hint-text" className="fr-hint-text">
                  En renseignant votre adresse électronique, vous acceptez d’être recontacté par courriel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type NewsletterProps = {
  onSignUp: (email: string) => Promise<void>;
  children: ReactNode;
};

const Newsletter: React.FC<NewsletterProps> = ({ onSignUp, children }) => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUp = React.useCallback(async () => {
    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    try {
      await onSignUp(email);
      setError(null);
    } catch (err) {
      setError('Une erreur est survenue lors de l’inscription.');
    }
  }, [email, onSignUp]);

  return <NewsletterContext.Provider value={{ email, setEmail, error, handleSignUp, setError }}>{children}</NewsletterContext.Provider>;
};

export default Newsletter;
