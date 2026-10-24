import React from 'react';
import {
  HeartPulse,
  ShoppingCart,
  Zap,
  GraduationCap,
  Coffee,
  TrendingUp,
  ShieldCheck,
  Wallet,
  Gift,
  HelpCircle,
  Home,
  Car,
  Utensils,
  Film,
  Dumbbell,
  Plane,
  ShoppingBag,
  Sparkles,
  Briefcase,
  Smile,
  Tag,
  Smartphone,
  PiggyBank,
  BookOpen,
  Baby,
  PawPrint,
} from 'lucide-react-native';

interface CategoryIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ name, size = 24, color = '#374151' }: CategoryIconProps) {
  switch (name) {
    case 'HeartPulse':
      return <HeartPulse size={size} color={color} />;
    case 'Home':
      return <Home size={size} color={color} />;
    case 'ShoppingCart':
      return <ShoppingCart size={size} color={color} />;
    case 'Car':
      return <Car size={size} color={color} />;
    case 'Zap':
      return <Zap size={size} color={color} />;
    case 'GraduationCap':
      return <GraduationCap size={size} color={color} />;
    case 'Coffee':
      return <Coffee size={size} color={color} />;
    case 'TrendingUp':
      return <TrendingUp size={size} color={color} />;
    case 'ShieldCheck':
      return <ShieldCheck size={size} color={color} />;
    case 'Wallet':
      return <Wallet size={size} color={color} />;
    case 'Gift':
      return <Gift size={size} color={color} />;
    case 'Utensils':
      return <Utensils size={size} color={color} />;
    case 'Film':
      return <Film size={size} color={color} />;
    case 'Dumbbell':
      return <Dumbbell size={size} color={color} />;
    case 'Plane':
      return <Plane size={size} color={color} />;
    case 'ShoppingBag':
      return <ShoppingBag size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    case 'Briefcase':
      return <Briefcase size={size} color={color} />;
    case 'Smile':
      return <Smile size={size} color={color} />;
    case 'Tag':
      return <Tag size={size} color={color} />;
    case 'Smartphone':
      return <Smartphone size={size} color={color} />;
    case 'PiggyBank':
      return <PiggyBank size={size} color={color} />;
    case 'BookOpen':
      return <BookOpen size={size} color={color} />;
    case 'Baby':
      return <Baby size={size} color={color} />;
    case 'PawPrint':
      return <PawPrint size={size} color={color} />;
    default:
      return <HelpCircle size={size} color={color} />;
  }
}
