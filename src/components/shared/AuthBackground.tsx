export default function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Mesh background */}
      <div className="absolute inset-0 bg-mesh" />

      {/* Animated orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.6) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-15 animate-float delay-300"
        style={{ background: 'radial-gradient(circle, rgba(90,74,232,0.5) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '2s' }} />

      <div className="absolute top-[40%] right-[10%] w-48 h-48 rounded-full opacity-10 animate-float"
        style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)', filter: 'blur(30px)', animationDelay: '4s' }} />

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(108,99,255,1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-16 h-16 border-l border-t border-brand-500/20 rounded-tl-lg" />
      <div className="absolute top-6 right-6 w-16 h-16 border-r border-t border-brand-500/20 rounded-tr-lg" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-l border-b border-brand-500/20 rounded-bl-lg" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-r border-b border-brand-500/20 rounded-br-lg" />
    </div>
  );
}
