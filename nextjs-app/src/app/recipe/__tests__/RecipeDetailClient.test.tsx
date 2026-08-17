import { render, screen } from '@testing-library/react';
import RecipeDetailClient from '../[id]/RecipeDetailClient';
import type { Recipe } from '@/lib/types';

const baseRecipe: Recipe = {
  id: '1',
  name: 'Test Recipe',
  category: 'Main Dish',
  description: 'A test recipe',
  prep_time: '10 min',
  cook_time: '20 min',
  servings: '4',
  ingredients: 'ingredient 1\ningredient 2',
  instructions: '1. Step one\n2. Step two',
  tips: '',
  photo_url: '',
  photos: '',
  source_url: '',
  calories: '',
  carbs: '',
  protein: '',
  fat: '',
  fiber: '',
  view_count: 5,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('RecipeDetailClient — Nutrition Info', () => {
  it('does not render nutrition section when no nutrition data exists', () => {
    render(<RecipeDetailClient recipe={baseRecipe} />);
    expect(screen.queryByText('Nutrition Info')).not.toBeInTheDocument();
  });

  it('renders nutrition section when nutrition data exists', () => {
    const recipe = {
      ...baseRecipe,
      calories: '250 kcal',
      carbs: '30g',
      protein: '15g',
      fat: '10g',
      fiber: '5g',
    };
    render(<RecipeDetailClient recipe={recipe} />);

    expect(screen.getByText('Nutrition Info')).toBeInTheDocument();
    expect(screen.getByText('250 kcal')).toBeInTheDocument();
    expect(screen.getByText('30g')).toBeInTheDocument();
    expect(screen.getByText('15g')).toBeInTheDocument();
    expect(screen.getByText('10g')).toBeInTheDocument();
    expect(screen.getByText('5g')).toBeInTheDocument();
  });

  it('renders nutrition section with partial data', () => {
    const recipe = {
      ...baseRecipe,
      calories: '200 kcal',
    };
    render(<RecipeDetailClient recipe={recipe} />);

    expect(screen.getByText('Nutrition Info')).toBeInTheDocument();
    expect(screen.getByText('200 kcal')).toBeInTheDocument();
    expect(screen.getByText('Calories')).toBeInTheDocument();
  });
});
