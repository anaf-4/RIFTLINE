import { useGameStore } from '../../store/gameStore';
import { useT } from '../../i18n/useT';

export default function UpdateBanner() {
  const updateInfo = useGameStore((s) => s.ui.updateInfo);
  const downloadUpdate = useGameStore((s) => s.downloadUpdate);
  const installUpdate = useGameStore((s) => s.installUpdate);
  const dismissUpdate = useGameStore((s) => s.dismissUpdate);
  const t = useT();

  if (!updateInfo.available) return null;

  const label = updateInfo.downloaded
    ? t('update_ready', updateInfo.latestVersion ?? '')
    : t('update_available', updateInfo.latestVersion ?? '');

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: 'var(--panel)',
        border: '1px solid var(--accent)',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 12,
        color: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 400,
        maxWidth: 320,
      }}
    >
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {updateInfo.downloaded ? (
          <button className="btn btn-accent" style={{ padding: '4px 10px', fontSize: 12 }} onClick={installUpdate}>
            {t('update_restart')}
          </button>
        ) : (
          <button
            className="btn btn-accent"
            style={{ padding: '4px 10px', fontSize: 12 }}
            disabled={updateInfo.downloading}
            onClick={downloadUpdate}
          >
            {updateInfo.downloading ? t('update_downloading') : t('update_now')}
          </button>
        )}
        <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={dismissUpdate}>
          {t('update_later')}
        </button>
      </div>
    </div>
  );
}
