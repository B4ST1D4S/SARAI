import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// Card Component Premium
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true,
  onClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 25px rgba(212, 175, 55, 0.1)' } : {}}
      onClick={onClick}
      className={`
        bg-slate-900 rounded-lg p-6
        border border-slate-800 border-t border-t-slate-700
        hover:border-slate-700 transition-all duration-200
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="relative">
        <div className="absolute -top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
        {children}
      </div>
    </motion.div>
  );
};

// Badge Component
type BadgeStatus = 'success' | 'error' | 'warning' | 'info' | 'default';

interface BadgeProps {
  status: BadgeStatus;
  label: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, className = '' }) => {
  const statusColors = {
    success: 'bg-green-900 text-green-200 border border-green-700',
    error: 'bg-red-900 text-red-200 border border-red-700',
    warning: 'bg-orange-900 text-orange-200 border border-orange-700',
    info: 'bg-blue-900 text-blue-200 border border-blue-700',
    default: 'bg-slate-800 text-slate-200 border border-slate-700',
  };

  return (
    <span className={`
      inline-flex items-center gap-1
      px-3 py-1 rounded-full text-xs font-medium
      ${statusColors[status]} ${className}
    `}>
      {status === 'success' && <CheckCircle size={14} />}
      {status === 'error' && <AlertCircle size={14} />}
      {status === 'warning' && <AlertTriangle size={14} />}
      {status === 'info' && <Info size={14} />}
      {label}
    </span>
  );
};

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-amber-500 hover:bg-amber-600 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || isLoading}
      className={`
        font-medium rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...(props as any)}
    >
      {isLoading ? '...' : children}
    </motion.button>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`
          bg-slate-900 rounded-lg border border-slate-800
          shadow-2xl ${maxWidth} w-full mx-4 max-h-screen overflow-y-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-slate-800">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}
      <input
        className={`
          bg-slate-800 border border-slate-700 rounded-lg
          text-white placeholder-slate-500
          px-4 py-2 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-amber-500
          focus:border-transparent
          ${error ? 'border-red-600 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {helper && <p className="text-sm text-slate-400">{helper}</p>}
    </div>
  );
};

// Toast Component
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onClose,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-900 border-green-700',
    error: 'bg-red-900 border-red-700',
    warning: 'bg-orange-900 border-orange-700',
    info: 'bg-blue-900 border-blue-700',
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`
        fixed bottom-4 right-4 z-[100]
        border ${typeStyles[type]}
        text-white px-6 py-4 rounded-lg
        shadow-lg max-w-sm
      `}
    >
      {message}
    </motion.div>
  );
};

// Skeleton Loading Component
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ duration: 2, repeat: Infinity }}
    className={`bg-slate-800 rounded-lg ${className}`}
  />
);

// Timeline Component
interface TimelineItem {
  id: string;
  date: string;
  title: string;
  status: 'completed' | 'current' | 'pending';
  description?: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export const Timeline: React.FC<TimelineProps> = ({ items }) => {
  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          {/* Connector Line */}
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-4 h-4 rounded-full border-2 ${
                item.status === 'completed'
                  ? 'bg-green-500 border-green-600'
                  : item.status === 'current'
                  ? 'bg-amber-500 border-amber-600'
                  : 'bg-slate-700 border-slate-600'
              }`}
            />
            {index < items.length - 1 && (
              <div className="w-0.5 h-12 bg-slate-700 mt-2 mb-2" />
            )}
          </div>

          {/* Content */}
          <Card className="flex-1">
            <p className="text-sm text-slate-400">{item.date}</p>
            <h3 className="font-semibold text-white mt-1">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-slate-300 mt-2">{item.description}</p>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
};

export default {
  Card,
  Badge,
  Button,
  Modal,
  Input,
  Toast,
  Skeleton,
  Timeline,
};
