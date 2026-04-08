import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeCard from '../RecipeCard';
import type { Recipe } from '@/lib/types';

const mockRecipe: Recipe = {
  id: '1',
  name: 'Test Pasta',
  category: 'Main Dish',
  description: 'A delicious test pasta',
  prep_time: '10 min',
  cook_time: '20 min',
  servings: '4',
  ingredients: 'pasta\nsauce',
  instructions: 'boil\nmix',
  tips: '',
  photo_url: '',
  photos: '',
  source_url: '',
  view_count: 0,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('RecipeCard', () => {
  const mockToggleFavorite = jest.fn();
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the recipe name and description', () => {
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
        onClick={mockOnClick}
      />
    );

    expect(screen.getByText('Test Pasta')).toBeInTheDocument();
    expect(screen.getByText('A delicious test pasta')).toBeInTheDocument();
  });

  it('calls onClick when the card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
        onClick={mockOnClick}
      />
    );

    await user.click(screen.getByText('Test Pasta'));
    expect(mockOnClick).toHaveBeenCalledWith(mockRecipe);
  });

  it('calls onToggleFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
        onClick={mockOnClick}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(mockToggleFavorite).toHaveBeenCalledWith('1');
  });

  it('does not trigger onClick when favorite button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <RecipeCard
        recipe={mockRecipe}
        isFavorite={false}
        onToggleFavorite={mockToggleFavorite}
        onClick={mockOnClick}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});
