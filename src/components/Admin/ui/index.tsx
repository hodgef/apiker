import React from "react";

/**
 * The admin panel's shared UI primitives.
 *
 * Deliberately dependency-free: apiker ships no runtime dependencies, so these
 * are plain elements over the class names defined in `assets/css/panel.css`
 * rather than a component library.
 */

type Variant = "primary" | "secondary" | "destructive" | "ghost";

export const Icon: React.FC<{ name?: string; className?: string }> = ({ name, className = "" }) =>
  name ? (
    <span className={`material-symbols-outlined admp-icon ${className}`.trim()} aria-hidden="true">
      {name}
    </span>
  ) : null;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  block,
  className = "",
  type = "button",
  children,
  ...rest
}) => (
  <button
    type={type}
    className={`admp-btn admp-btn--${variant}${block ? " admp-btn--block" : ""} ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = "", ...rest }) => (
  <input className={`admp-input ${className}`.trim()} {...rest} />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = "",
  ...rest
}) => <textarea className={`admp-textarea ${className}`.trim()} {...rest} />;

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, hint, htmlFor, children }) => (
  <div className="admp-field">
    <label className="admp-label" htmlFor={htmlFor}>{label}</label>
    {children}
    {hint && <p className="admp-hint">{hint}</p>}
  </div>
);

/** Lays a control and its adjacent button on one row. */
export const InlineRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="admp-inline">{children}</div>
);

interface FormProps {
  onSubmit: () => void;
  children: React.ReactNode;
}

/** Actions post through fetch, so the native submit navigation is always suppressed. */
export const Form: React.FC<FormProps> = ({ onSubmit, children }) => (
  <form
    className="admp-form"
    noValidate
    onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    {children}
  </form>
);

interface CardProps {
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, footer, children }) => (
  <section className="admp-card">
    {(title || description) && (
      <header className="admp-card__header">
        {title && <h2 className="admp-card__title">{title}</h2>}
        {description && <p className="admp-card__description">{description}</p>}
      </header>
    )}
    <div className="admp-card__body">{children}</div>
    {footer && <footer className="admp-card__footer">{footer}</footer>}
  </section>
);

export interface SelectOption {
  id: string;
  displayName: string;
}

interface SelectProps {
  value?: SelectOption;
  options: SelectOption[];
  placeholder?: string;
  onSelect: (option: SelectOption) => void;
}

/**
 * A menu that does not rely on Bootstrap's dropdown script, so the panel keeps
 * working with only React on the page.
 */
export const Select: React.FC<SelectProps> = ({ value, options, placeholder = "Select", onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="admp-select" ref={ref}>
      <button
        type="button"
        className="admp-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{value ? value.displayName : placeholder}</span>
        <span className="admp-select__chevron" aria-hidden="true">expand_more</span>
      </button>
      {open && (
        <ul className="admp-select__menu" role="listbox">
          {options.map((option) => (
            <li key={option.id} role="option" aria-selected={value?.id === option.id}>
              <button
                type="button"
                className={`admp-select__option${value?.id === option.id ? " is-selected" : ""}`}
                onClick={() => {
                  onSelect(option);
                  setOpen(false);
                }}
              >
                {option.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface AlertProps {
  tone?: "info" | "success" | "warning" | "danger";
  onDismiss?: () => void;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ tone = "info", onDismiss, children }) => (
  <div className={`admp-alert admp-alert--${tone}`} role="alert">
    <span className="admp-alert__body">{children}</span>
    {onDismiss && (
      <button type="button" className="admp-alert__close" aria-label="Dismiss" onClick={onDismiss}>
        &times;
      </button>
    )}
  </div>
);

export interface DataRow {
  [key: string]: string | number | undefined;
}

interface TooltipProps {
  label: React.ReactNode;
  side?: "top" | "bottom";
  align?: "center" | "end";
  children: React.ReactNode;
}

/**
 * A described hover/focus hint.
 *
 * Kept to CSS so it works for keyboard users and needs no positioning library:
 * the panel ships no runtime dependencies.
 */
export const Tooltip: React.FC<TooltipProps> = ({ label, side = "top", align = "center", children }) => (
  <span className={`admp-tooltip admp-tooltip--${side} admp-tooltip--align-${align}`}>
    {children}
    <span className="admp-tooltip__content" role="tooltip">{label}</span>
  </span>
);

export interface MenuItem {
  id: string;
  label: string;
  description?: string;
  destructive?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  items: MenuItem[];
  label?: string;
}

/** Row actions, collapsed so a table reads as data rather than as buttons. */
export const Menu: React.FC<MenuProps> = ({ items, label = "Actions" }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="admp-menu" ref={ref}>
      <Tooltip label={label} align="end">
        <button
          type="button"
          className="admp-menu__trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
          onClick={() => setOpen(!open)}
        >
          &#8943;
        </button>
      </Tooltip>
      {open && (
        <ul className="admp-menu__list" role="menu">
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={`admp-menu__item${item.destructive ? " admp-menu__item--destructive" : ""}`}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                <span className="admp-menu__label">{item.label}</span>
                {item.description && <span className="admp-menu__description">{item.description}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface DataListProps {
  rows: DataRow[];
  emptyLabel?: string;
}

export const DataList: React.FC<DataListProps> = ({ rows, emptyLabel = "Nothing to show." }) => {
  if (!rows?.length) {
    return <p className="admp-empty">{emptyLabel}</p>;
  }

  return (
    <div className="admp-results">
      {rows.map((row, index) => (
        <div className="admp-results__item" key={index}>
          <dl>
            {Object.entries(row)
              .filter(([, value]) => value !== undefined && value !== null && value !== "")
              .map(([key, value]) => (
                <div className="admp-results__row" key={key}>
                  <dt>{key}</dt>
                  <dd title={String(value)}>{String(value)}</dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
};
