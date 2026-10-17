// Shown on top of every screen while the sample household is open.
export default function DemoBanner({ onExit }: { onExit: () => void }) {
  return (
    <div style={{ position: 'relative', zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '8px 16px', backgroundColor: '#1A1A1A', color: '#FFFFFF', fontSize: '12px', fontWeight: '700', letterSpacing: '0.3px' }}>
      <span>Demo · sample data, nothing is saved</span>
      <button type="button" onClick={e => { e.stopPropagation(); onExit(); }} style={{ padding: '4px 12px', backgroundColor: '#FFFFFF', color: '#1A1A1A', border: 'none', borderRadius: '12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit' }}>
        Exit
      </button>
    </div>
  );
}
