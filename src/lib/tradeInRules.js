// Reglas del cotizador: los porcentajes por defecto están en config.js y Matías los ajusta desde el sistema.
import { useEffect, useState } from 'react';
import { TRADE_IN } from '@/config';
import { getSetting } from './store';

export function mergeRules(saved) {
  const s = saved ?? {};
  return {
    conditions: TRADE_IN.conditions.map(c => ({ ...c, factor: s.conditions?.[c.id] ?? c.factor })),
    battery: TRADE_IN.battery.map(b => ({ ...b, factor: s.battery?.[b.id] ?? b.factor })),
    faultFactor: s.faultFactor ?? TRADE_IN.faultFactor,
    spread: s.spread ?? TRADE_IN.spread
  };
}

export function toSaved(rules) {
  return {
    conditions: Object.fromEntries(rules.conditions.map(c => [c.id, c.factor])),
    battery: Object.fromEntries(rules.battery.map(b => [b.id, b.factor])),
    faultFactor: rules.faultFactor,
    spread: rules.spread
  };
}

export function useTradeInRules() {
  const [rules, setRules] = useState(() => mergeRules(null));
  useEffect(() => {
    const load = () => getSetting('trade_in').then(v => setRules(mergeRules(v)));
    load();
    window.addEventListener('mg:data', load);
    return () => window.removeEventListener('mg:data', load);
  }, []);
  return rules;
}
