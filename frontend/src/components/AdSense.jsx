import { useEffect } from 'react';

const AdSense = ({ 
  adClient = 'ca-pub-XXXXXXXXXX', // Replace with your AdSense client ID
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = {}
}) => {
  useEffect(() => {
    try {
      if (window.adsbygoogle && process.env.NODE_ENV === 'production') {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    return (
      <div style={{
        padding: '20px',
        background: '#f0f0f0',
        border: '2px dashed #ccc',
        textAlign: 'center',
        ...style
      }}>
        <p style={{ color: '#666', margin: 0 }}>Ad Placeholder (Development Mode)</p>
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: 'block', ...style }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
};

export default AdSense;
