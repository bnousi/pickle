import { INK, glass } from '../lib/ui';

// Shown on top of every screen while the sample household is open.
export default function DemoBanner({ onExit }: { onExit: () => void }) {
  return (
    <div style={{ position: 'relative', zIndex: 120, padding: '12px 16px 0' }}>
      <div style={{ ...glass(999), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '6px 6px 6px 16px', fontSize: '13px', fontWeight: 600, color: INK }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#E9B23C' }} />
          Demo · sample household, nothing is saved
        </span>
        <button type="button" onClick={e => { e.stopPropagation(); onExit(); }} style={{ height: '32px', padding: '0 14px', backgroundColor: INK, color: '#FFFFFF', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
          Exit
        </button>
      </div>
    </div>
  );
}
