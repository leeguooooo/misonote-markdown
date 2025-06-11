import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileBottomNav from '../../src/components/MobileBottomNav';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  usePathname: () => '/docs/test'
}));

describe('MobileBottomNav', () => {
  const mockOnMenuToggle = vi.fn();
  const mockOnSearchOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation items correctly', () => {
    render(
      <MobileBottomNav 
        onMenuToggle={mockOnMenuToggle}
        onSearchOpen={mockOnSearchOpen}
      />
    );

    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('文档')).toBeInTheDocument();
    expect(screen.getByText('搜索')).toBeInTheDocument();
    expect(screen.getByText('菜单')).toBeInTheDocument();
  });

  it('calls onMenuToggle when menu button is clicked', () => {
    render(
      <MobileBottomNav 
        onMenuToggle={mockOnMenuToggle}
        onSearchOpen={mockOnSearchOpen}
      />
    );

    const menuButton = screen.getByText('菜单');
    fireEvent.click(menuButton);

    expect(mockOnMenuToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onSearchOpen when search button is clicked', () => {
    render(
      <MobileBottomNav 
        onMenuToggle={mockOnMenuToggle}
        onSearchOpen={mockOnSearchOpen}
      />
    );

    const searchButton = screen.getByText('搜索');
    fireEvent.click(searchButton);

    expect(mockOnSearchOpen).toHaveBeenCalledTimes(1);
  });
});
