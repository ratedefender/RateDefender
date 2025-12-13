import React, { useEffect } from 'react';

const AdSpace = ({ className = '', style = {}, adClient }) => {
  const enableAds = import.meta.env.VITE_ENABLE_ADS === 'true';
  const adsenseId = import.meta.env.VITE_ADSENSE_ID || adClient;

  useEffect(() => {
    if (!enableAds) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore
    }
  }, [enableAds]);

  if (!enableAds) {
    return (
      <div
        className={className}
        style={{
          border: '1px dashed #ddd',
          padding: 12,
          borderRadius: 8,
          background: '#fff',
          color: '#666',
          textAlign: 'center',
          ...style,
        }}
      >
        <strong>Ad placeholder</strong>
        <div style={{ fontSize: 13, marginTop: 6 }}>Ads disabled (development)</div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseId}
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSpace;

// src/components/AdSpace.jsx - Smart Ad Component
import { useEffect, useRef, memo } from 'react';

const AdSpace = ({ dataAdSlot, style = {} }) => {
  const adsEnabled = import.meta.env.VITE_ENABLE_ADS === 'true';
  const adContainerRef = useRef(null);
  const adPushed = useRef(false);

  useEffect(() => {
    if (adsEnabled && !adPushed.current && adContainerRef.current) {
      try {
        // Push ad only once
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushed.current = true;
      } catch (err) {
        console.error('AdSense error:', err);
      }
    }

    // Cleanup on unmount
    return () => {
      adPushed.current = false;
    };
  }, [adsEnabled]);

  // Show placeholder when ads are disabled
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