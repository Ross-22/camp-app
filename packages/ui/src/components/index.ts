// Placeholder for shared components
// Platform-specific implementations will be added as .native.tsx and .web.tsx files

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
}

// Export types for now, actual components will be implemented later
// ButtonProps and LoadingProps are already exported above