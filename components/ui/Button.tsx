import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  
  /* RÈGLES DE DESIGN SYSTEM (Section Boutons & Interactions)
    -------------------------------------------------------
    - Radius : 14px (rounded-btn)
    - Interaction : Micro-scale (active:scale-95)
    - Typographie : text-sm font-medium
  */

  const baseStyles = 
    "relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none rounded-btn active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/20";

  const variants = {
    /* PRIMAIRE
      - Fond : Accent (#0e8c5b)
      - Ombre : Glow diffus (shadow-glow-accent)
      - Texte : Blanc
    */
    primary: "bg-accent text-white shadow-glow-accent hover:bg-[#0c7a4f]",

    /* SECONDAIRE
      - Fond : Surface neutre
      - Ombre : Neumorphism Outset (shadow-soft-out)
      - Texte : Secondaire (#6f6f6f) -> Primaire au hover
    */
    secondary: "bg-surface text-secondary shadow-soft-out hover:text-primary"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="opacity-0">{children}</span>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Loader minimaliste blanc ou gris selon le contexte */}
            <div className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${variant === 'primary' ? 'border-white' : 'border-secondary'}`} />
          </div>
        </>
      ) : (
        children
      )}
    </button>
  );
};