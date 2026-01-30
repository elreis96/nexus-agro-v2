import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Componente que lança erro para testar
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suprimir console.error durante os testes
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  it('deve renderizar children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('deve capturar erro e exibir UI de erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(/Ocorreu um erro inesperado/)).toBeInTheDocument();
  });

  it('deve exibir botão "Tentar novamente"', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText('Tentar novamente');
    expect(retryButton).toBeInTheDocument();
  });

  it('deve exibir botão "Ir para início"', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('Ir para início');
    expect(homeButton).toBeInTheDocument();
  });

  it('deve resetar estado quando clicar em "Tentar novamente"', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();

    const retryButton = screen.getByText('Tentar novamente');
    fireEvent.click(retryButton);

    // Re-renderizar sem erro
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });

  it('deve usar fallback customizado se fornecido', () => {
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('Algo deu errado')).not.toBeInTheDocument();
  });
});
