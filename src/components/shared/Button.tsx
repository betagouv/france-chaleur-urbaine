type ButtonProps = {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
};
export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  disabled = false,
  ...others
}) => (
  <button className="fr-btn" type={type} disabled={disabled} {...others}>
    {children}
  </button>
);
