/** Shared metal finishes and machining; these marks never encode a measurement. */
export function InstrumentMaterials({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-titanium`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#809ca8" />
        <stop offset=".18" stopColor="#345664" />
        <stop offset=".45" stopColor="#1a3342" />
        <stop offset=".48" stopColor="#547887" />
        <stop offset=".58" stopColor="#203e50" />
        <stop offset="1" stopColor="#0a1928" />
      </linearGradient>
      <linearGradient id={`${id}-champagne`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#f0d6a4" />
        <stop offset=".24" stopColor="#927b4b" />
        <stop offset=".49" stopColor="#433e31" />
        <stop offset=".52" stopColor="#ab8c53" />
        <stop offset="1" stopColor="#26333b" />
      </linearGradient>
    </defs>
  );
}

export function MachinedBezel({ x, y, radius }: { x: number; y: number; radius: number }) {
  return (
    <g className="ln-machining" transform={`translate(${x} ${y})`}>
      <circle r={radius} stroke="#6c8b9e" strokeWidth=".8" />
      <circle r={radius - 5} stroke="#d9be846b" strokeWidth=".65" />
      {Array.from({ length: 32 }, (_, index) => (
        <path
          key={index}
          d={`M0 ${-radius + 1}v${index % 4 === 0 ? 5 : 2}`}
          stroke={index % 4 === 0 ? "#dcc18f" : "#688798"}
          strokeWidth={index % 4 === 0 ? 1.4 : 0.7}
          transform={`rotate(${index * 11.25})`}
        />
      ))}
      {[45, 135, 225, 315].map((angle) => (
        <g key={angle} transform={`rotate(${angle})`} stroke="#a5b6bd" strokeWidth=".55">
          <circle cy={-radius + 2.5} r="1.9" fill="#0a1721" />
          <path d={`m-1 ${-radius + 1.5} 2 2`} />
        </g>
      ))}
    </g>
  );
}
