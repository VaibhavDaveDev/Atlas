export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '3.75rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Atlas ERP
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#4B5563',
          marginBottom: '2rem'
        }}>
          AI-Powered Cloud ERP Suite
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a
            href="/login"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4F46E5',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
          >
            Get Started
          </a>
          <a
            href="/docs"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#4F46E5',
              border: '1px solid #4F46E5',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
          >
            Documentation
          </a>
        </div>
        <p style={{
          marginTop: '2rem',
          fontSize: '0.875rem',
          color: '#6B7280'
        }}>
          ✅ Database Connected | ✅ API Running | ✅ Ready to Build
        </p>
      </div>
    </div>
  );
}
