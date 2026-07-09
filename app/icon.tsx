import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#020617',
        color: '#22d3ee',
        fontSize: '18px',
        fontWeight: 800,
        fontFamily: 'Arial, sans-serif',
        borderRadius: '8px',
      }}
    >
      EL
    </div>,
    {
      ...size,
    },
  );
}
