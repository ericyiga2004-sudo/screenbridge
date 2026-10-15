import { useEffect, useState } from 'react';
export default function ReactionToast({ item }) {
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (!item) return;
    setShown(item);
    const timer = setTimeout(() => setShown(null), 2400);
    return () => clearTimeout(timer);
  }, [item]);
  return shown && <div key={shown.at} className="reaction-toast" role="status" aria-live="polite">
    <span className="text-3xl" aria-hidden="true">{shown.emoji}</span>
    <span>Reaction from the other screen</span>
  </div>;
}
