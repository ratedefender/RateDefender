import { useEffect, useRef, memo } from 'react';

const AdSpace = ({ dataAdSlot, style = {} }) => {
  const adsEnabled = import.meta.env.VITE_ENABLE_ADS === 'true';
  const adContainerRef = useRef(null);
  const adPushed = useRef(false);

  useEffect(() => {
    if (adsEnabled && !adPushed.current && adContainerRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushed.current = true;
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }

    return () => {
      adPushed.current = false;
    };
  }, [adsEnabled]);

  if (!adsEnabled) {
    return (
      <div
        className="ad-placeholder"
        style={{
          ...style,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: '2px dashed rgba(255,255,255,0.3)',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '500',
          fontSize: '14px',
          opacity: 0.7
        }}
      >
        📢 Ad Space ({style.height || 'auto'})
      </div>
    );
  }

  return (
    <div className="ad-container" ref={adContainerRef} style={{ margin: '20px 0' }}>
      <ins
        className="adsbygoogle"
        style={{ 
          display: 'block',
          ...style
        }}
        data-ad-client={import.meta.env.VITE_ADSENSE_ID}
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default memo(AdSpace);