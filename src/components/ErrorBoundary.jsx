import { Component } from 'react';

// Si algo falla al dibujar una pantalla, mostramos un aviso en vez de dejarla en negro.
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error) {
    console.error(error);
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-6 pt-24 text-center">
        <div>
          <h2 className="text-xl font-semibold">Algo no cargó bien</h2>
          <p className="mt-2 text-sm text-white/60">Tocá el botón para recargar la página.</p>
          <button className="btn btn-primary mt-5" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
