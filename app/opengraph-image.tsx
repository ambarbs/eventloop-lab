import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#020617',
        color: 'white',
        padding: '72px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          color: '#22d3ee',
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '28px',
        }}
      >
        JavaScript Runtime Visualizer
      </div>

      <div
        style={{
          fontSize: '82px',
          fontWeight: 900,
          letterSpacing: '-4px',
          lineHeight: 1,
          marginBottom: '32px',
        }}
      >
        EventLoop Lab
      </div>

      <div
        style={{
          fontSize: '34px',
          lineHeight: 1.35,
          color: '#cbd5e1',
          maxWidth: '900px',
        }}
      >
        Step through JavaScript code and see the call stack, Web APIs,
        microtasks, macrotasks, and event loop in action.
      </div>

      <div
        style={{
          display: 'flex',
          gap: '18px',
          marginTop: '56px',
          fontSize: '24px',
          color: '#94a3b8',
        }}
      >
        <span>Call Stack</span>
        <span>→</span>
        <span>Web APIs</span>
        <span>→</span>
        <span>Queues</span>
        <span>→</span>
        <span>Event Loop</span>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
