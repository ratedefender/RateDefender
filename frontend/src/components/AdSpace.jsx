const AdSpace = ({ style = {} }) => {
  const adsEnabled = import.meta.env.VITE_ENABLE_ADS === 'true'
  
  if (!adsEnabled) {
    return (
      <div style={{
        ...style,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '8px',
        color: 'white',
        opacity: 0.7,
        fontSize: '14px'
      }}>
        📢 Ad Space
      </div>
    )
  }
  
  return <div style={{ margin: '20px 0', ...style }}>Ad Space Here</div>
}

export default AdSpace
