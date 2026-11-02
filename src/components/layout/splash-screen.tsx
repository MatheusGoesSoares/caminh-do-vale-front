import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import logoHorizontal from "@/assets/brand/logo-horizontal-yellow-v.png";

interface SplashScreenProps {
  onFinished: () => void;
  minDuration?: number;
}

export function SplashScreen({ onFinished, minDuration = 3200 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const steps = 40;
    const interval = minDuration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const eased = 1 - Math.pow(1 - current / steps, 3);
      setProgress(Math.min(Math.round(eased * 100), 100));

      if (current >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(onFinished, 600);
        }, 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [minDuration, onFinished]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-600",
        fadeOut ? "opacity-0" : "opacity-100"
      )}
      style={{ background: "linear-gradient(145deg, #1a7a44 0%, #1F8A4D 30%, #16643A 70%, #124e2e 100%)" }}
      role="status"
      aria-label="Carregando aplicativo"
    >
      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #BFE3C8 0%, transparent 70%)" }} />
      <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full opacity-8" style={{ background: "radial-gradient(circle, #2FA866 0%, transparent 70%)" }} />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #F2C94C 0%, transparent 70%)" }} />

      {/* Animated wave background - bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <svg viewBox="0 0 1440 320" className="w-full" style={{ minWidth: 1440 }}>
          <path
            className="animate-wave-1"
            fill="rgba(47, 168, 102, 0.15)"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path
            className="animate-wave-2"
            fill="rgba(191, 227, 200, 0.12)"
            d="M0,256L48,250.7C96,245,192,235,288,229.3C384,224,480,224,576,234.7C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path
            className="animate-wave-3"
            fill="rgba(22, 100, 58, 0.2)"
            d="M0,288L48,282.7C96,277,192,267,288,261.3C384,256,480,256,576,261.3C672,267,768,277,864,272C960,267,1056,245,1152,240C1248,235,1344,245,1392,250.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Top wave */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden rotate-180">
        <svg viewBox="0 0 1440 200" className="w-full opacity-30" style={{ minWidth: 1440 }}>
          <path
            className="animate-wave-2"
            fill="rgba(191, 227, 200, 0.15)"
            d="M0,128L60,138.7C120,149,240,171,360,165.3C480,160,600,128,720,122.7C840,117,960,139,1080,154.7C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </svg>
      </div>

      {/* Dotted route path */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none">
        <path
          d="M -50 100 Q 200 50, 400 150 T 800 120 T 1200 180 T 1600 100"
          fill="none"
          stroke="#BFE3C8"
          strokeWidth="2"
          strokeDasharray="8 12"
          className="animate-dash"
        />
        <path
          d="M -100 300 Q 300 250, 500 350 T 900 280 T 1300 340 T 1700 250"
          fill="none"
          stroke="#BFE3C8"
          strokeWidth="1.5"
          strokeDasharray="6 10"
          className="animate-dash-reverse"
        />
      </svg>

      {/* Main content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 max-w-6xl mx-auto w-full">

        {/* Left side - Branding */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8 animate-fade-in-up">
          {/* Logo */}
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <img
              src={logoHorizontal}
              alt="Caminho do Vale"
              className="h-24 sm:h-28 lg:h-36 w-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Tagline */}
          <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: "600ms" }}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
              Monitorando cada carga,{" "}
              <span className="relative">
                <span className="relative z-10" style={{ color: "#F2C94C" }}>do vale ao destino.</span>
                <span className="absolute bottom-0 left-0 right-0 h-2 rounded-full opacity-30" style={{ background: "#F2994A" }} />
              </span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg max-w-md" style={{ color: "rgba(191, 227, 200, 0.85)" }}>
              Tecnologia e cuidado no transporte das frutas do Vale do São Francisco
            </p>
          </div>

          {/* Loading section */}
          <div className="w-full max-w-sm space-y-3 animate-fade-in-up" style={{ animationDelay: "1000ms" }}>
            {/* Progress bar */}
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(191, 227, 200, 0.2)" }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #BFE3C8, #F2C94C, #F2994A)",
                  boxShadow: "0 0 12px rgba(242, 201, 76, 0.4)",
                }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full animate-shimmer"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                  backgroundSize: "200% 100%",
                }}
              />
            </div>

            {/* Loading text */}
            <div className="flex items-center justify-between text-xs" style={{ color: "rgba(191, 227, 200, 0.7)" }}>
              <div className="flex items-center gap-2">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full animate-bounce-dot" style={{ background: "#BFE3C8", animationDelay: "0ms" }} />
                  <span className="w-1 h-1 rounded-full animate-bounce-dot" style={{ background: "#BFE3C8", animationDelay: "150ms" }} />
                  <span className="w-1 h-1 rounded-full animate-bounce-dot" style={{ background: "#BFE3C8", animationDelay: "300ms" }} />
                </span>
                <span>Carregando dados da operação</span>
              </div>
              <span className="tabular-nums font-medium" style={{ color: "#BFE3C8" }}>{progress}%</span>
            </div>
          </div>
        </div>

        {/* Right side - Truck illustration */}
        <div className="relative animate-fade-in-up lg:flex-shrink-0" style={{ animationDelay: "400ms" }}>
          {/* Glow effect behind truck */}
          <div className="absolute inset-0 scale-110 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #2FA866 0%, transparent 70%)" }} />

          {/* Truck SVG Illustration */}
          <svg
            viewBox="0 0 480 380"
            className="w-64 h-auto sm:w-72 lg:w-96 drop-shadow-2xl animate-float"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ground shadow */}
            <ellipse cx="240" cy="350" rx="180" ry="14" fill="rgba(0,0,0,0.15)" />

            {/* Truck body - cargo area */}
            <rect x="140" y="100" width="280" height="180" rx="12" fill="#2FA866" />
            <rect x="145" y="105" width="270" height="170" rx="9" fill="#3CB371" opacity="0.6" />

            {/* Refrigeration lines on side */}
            <line x1="160" y1="130" x2="400" y2="130" stroke="#BFE3C8" strokeWidth="1" opacity="0.3" />
            <line x1="160" y1="160" x2="400" y2="160" stroke="#BFE3C8" strokeWidth="1" opacity="0.3" />
            <line x1="160" y1="190" x2="400" y2="190" stroke="#BFE3C8" strokeWidth="1" opacity="0.3" />
            <line x1="160" y1="220" x2="400" y2="220" stroke="#BFE3C8" strokeWidth="1" opacity="0.3" />

            {/* Snowflake icon (refrigeration) */}
            <g transform="translate(390, 115)" opacity="0.5">
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#BFE3C8" strokeWidth="1.5" />
              <line x1="-7" y1="-4" x2="7" y2="4" stroke="#BFE3C8" strokeWidth="1.5" />
              <line x1="-7" y1="4" x2="7" y2="-4" stroke="#BFE3C8" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="2" fill="#BFE3C8" />
            </g>

            {/* Truck cabin */}
            <path d="M60,170 L60,280 L150,280 L150,150 L120,120 L80,120 Q60,120 60,140Z" fill="#16643A" rx="8" />
            <rect x="62" y="170" width="46" height="40" rx="4" fill="#BFE3C8" opacity="0.5" />
            {/* Cabin highlight */}
            <rect x="64" y="172" width="20" height="36" rx="3" fill="white" opacity="0.15" />
            {/* Cabin stripe */}
            <rect x="60" y="240" width="90" height="4" rx="2" fill="#F2C94C" />

            {/* Bumper */}
            <rect x="50" y="274" width="100" height="10" rx="3" fill="#124e2e" />

            {/* Headlight */}
            <rect x="52" y="230" width="12" height="20" rx="4" fill="#F2C94C" opacity="0.9" />
            <rect x="54" y="232" width="8" height="8" rx="3" fill="#FFF" opacity="0.5" />

            {/* Truck bed floor */}
            <rect x="135" y="275" width="290" height="10" rx="3" fill="#16643A" />

            {/* Wheels */}
            <circle cx="115" cy="294" r="24" fill="#333" />
            <circle cx="115" cy="294" r="16" fill="#555" />
            <circle cx="115" cy="294" r="6" fill="#888" />
            <circle cx="115" cy="294" r="3" fill="#AAA" />

            <circle cx="350" cy="294" r="24" fill="#333" />
            <circle cx="350" cy="294" r="16" fill="#555" />
            <circle cx="350" cy="294" r="6" fill="#888" />
            <circle cx="350" cy="294" r="3" fill="#AAA" />

            {/* Wheel arches */}
            <path d="M85,280 Q115,256 145,280" fill="#16643A" stroke="#16643A" strokeWidth="4" />
            <path d="M320,280 Q350,256 380,280" fill="#2FA866" stroke="#2FA866" strokeWidth="4" />

            {/* Fruits in cargo - arranged neatly */}
            {/* Oranges row */}
            <circle cx="180" cy="250" r="14" fill="#F2994A" />
            <circle cx="180" cy="250" r="12" fill="#F5AD6F" opacity="0.6" />
            <circle cx="210" cy="248" r="14" fill="#F2994A" />
            <circle cx="210" cy="248" r="12" fill="#F5AD6F" opacity="0.6" />

            {/* Grapes cluster */}
            <circle cx="250" cy="250" r="6" fill="#8B4585" />
            <circle cx="260" cy="246" r="6" fill="#8B4585" />
            <circle cx="255" cy="256" r="6" fill="#8B4585" />
            <circle cx="265" cy="252" r="6" fill="#9B5595" />
            <circle cx="245" cy="244" r="6" fill="#7B3575" />
            <ellipse cx="255" cy="234" rx="3" ry="5" fill="#3CB371" />

            {/* Bananas */}
            <path d="M290,260 Q310,235 320,240 Q310,245 295,265Z" fill="#F2C94C" />
            <path d="M295,258 Q315,233 325,238 Q315,243 300,263Z" fill="#E8BF42" />
            <path d="M285,263 Q305,238 315,243 Q305,248 290,268Z" fill="#F2C94C" opacity="0.8" />

            {/* Watermelon */}
            <circle cx="360" cy="252" r="16" fill="#2D8B4E" />
            <circle cx="360" cy="252" r="14" fill="#3CB371" />
            <path d="M346,252 Q360,240 374,252" fill="#2D8B4E" opacity="0.4" />

            {/* Mangoes */}
            <ellipse cx="390" cy="250" rx="12" ry="9" fill="#F2994A" transform="rotate(-20 390 250)" />
            <ellipse cx="390" cy="250" rx="10" ry="7" fill="#F5C94A" opacity="0.4" transform="rotate(-20 390 250)" />

            {/* Top layer of fruits */}
            {/* Apples */}
            <circle cx="190" cy="220" r="12" fill="#D94F4F" />
            <circle cx="190" cy="220" r="10" fill="#E06060" opacity="0.5" />
            <path d="M188,210 Q190,205 192,210" fill="#3CB371" strokeWidth="1" />

            <circle cx="220" cy="218" r="11" fill="#D94F4F" />
            <circle cx="220" cy="218" r="9" fill="#E06060" opacity="0.5" />

            {/* More oranges */}
            <circle cx="250" cy="220" r="12" fill="#F2994A" />
            <circle cx="280" cy="218" r="11" fill="#F2994A" />

            {/* Guava */}
            <circle cx="310" cy="222" r="10" fill="#A8D86C" />
            <circle cx="310" cy="222" r="8" fill="#C2E88C" opacity="0.5" />

            {/* Papaya */}
            <ellipse cx="345" cy="220" rx="14" ry="10" fill="#F5AD6F" />
            <ellipse cx="345" cy="220" rx="11" ry="7" fill="#F5C98F" opacity="0.4" />

            <circle cx="380" cy="222" r="10" fill="#D94F4F" />
            <circle cx="400" cy="225" r="9" fill="#A8D86C" />

            {/* Top row - small fruits / leaves */}
            <circle cx="200" cy="195" r="8" fill="#F2C94C" />
            <circle cx="225" cy="192" r="9" fill="#D94F4F" />
            <circle cx="255" cy="194" r="8" fill="#F2994A" />
            <circle cx="285" cy="192" r="8" fill="#A8D86C" />
            <circle cx="315" cy="195" r="7" fill="#F2C94C" />
            <circle cx="340" cy="193" r="8" fill="#D94F4F" />
            <circle cx="365" cy="196" r="7" fill="#2D8B4E" />
            <circle cx="388" cy="198" r="7" fill="#F2994A" />

            {/* Leaves sticking out top */}
            <g className="animate-leaf-sway">
              <path d="M195,185 Q190,165 200,170 Q210,175 200,185Z" fill="#2FA866" />
              <path d="M240,180 Q235,160 245,165 Q255,170 245,180Z" fill="#3CB371" />
              <path d="M290,182 Q292,160 298,168 Q304,176 295,183Z" fill="#2FA866" />
              <path d="M350,184 Q345,162 355,168 Q365,174 355,185Z" fill="#3CB371" />
              <path d="M395,188 Q392,168 400,173 Q408,178 400,190Z" fill="#2FA866" />
            </g>

            {/* "CV" label on truck */}
            <rect x="75" y="147" width="60" height="22" rx="4" fill="#BFE3C8" opacity="0.2" />
            <text x="105" y="163" textAnchor="middle" fill="#BFE3C8" fontSize="13" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif" opacity="0.7">CV</text>

            {/* Location pin above truck */}
            <g className="animate-pin-bounce" transform="translate(240, 65)">
              <path d="M0,0 C0,-20 -12,-28 -12,-38 C-12,-48 -6,-55 0,-55 C6,-55 12,-48 12,-38 C12,-28 0,-20 0,0Z" fill="#F2C94C" />
              <circle cx="0" cy="-38" r="5" fill="white" opacity="0.9" />
              <path d="M-3,2 L0,8 L3,2Z" fill="#F2C94C" opacity="0.5" />
            </g>
          </svg>

          {/* Small floating fruit icons */}
          <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full flex items-center justify-center text-lg animate-float-delayed" style={{ animationDelay: "0.5s" }}>
            🍇
          </div>
          <div className="absolute top-8 -right-6 w-8 h-8 rounded-full flex items-center justify-center text-lg animate-float-delayed" style={{ animationDelay: "1s" }}>
            🥭
          </div>
          <div className="absolute -bottom-2 left-8 w-8 h-8 rounded-full flex items-center justify-center text-lg animate-float-delayed" style={{ animationDelay: "1.5s" }}>
            🍌
          </div>
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center animate-fade-in-up" style={{ animationDelay: "1200ms" }}>
        <p className="text-xs tracking-wider uppercase" style={{ color: "rgba(191, 227, 200, 0.4)" }}>
          Vale do São Francisco &bull; Petrolina &bull; Juazeiro
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatDelayed {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.8; }
          50% { transform: translateY(-12px) scale(1.1); opacity: 1; }
        }
        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes wave1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes wave2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(15px); }
        }
        @keyframes wave3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        @keyframes dashReverse {
          to { stroke-dashoffset: 100; }
        }
        @keyframes leafSway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(2deg); }
          75% { transform: rotate(-2deg); }
        }
        @keyframes pinBounce {
          0%, 100% { transform: translate(240px, 65px) translateY(0); }
          50% { transform: translate(240px, 65px) translateY(-5px); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out both;
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: floatDelayed 3s ease-in-out infinite;
        }
        .animate-bounce-dot {
          animation: bounceDot 1.4s ease-in-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
        }
        .animate-wave-1 {
          animation: wave1 8s ease-in-out infinite;
        }
        .animate-wave-2 {
          animation: wave2 6s ease-in-out infinite;
        }
        .animate-wave-3 {
          animation: wave3 7s ease-in-out infinite;
        }
        .animate-dash {
          animation: dash 20s linear infinite;
        }
        .animate-dash-reverse {
          animation: dashReverse 25s linear infinite;
        }
        .animate-leaf-sway {
          transform-origin: center bottom;
          animation: leafSway 3s ease-in-out infinite;
        }
        .animate-pin-bounce {
          animation: pinBounce 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up,
          .animate-float,
          .animate-float-delayed,
          .animate-bounce-dot,
          .animate-shimmer,
          .animate-wave-1,
          .animate-wave-2,
          .animate-wave-3,
          .animate-dash,
          .animate-dash-reverse,
          .animate-leaf-sway,
          .animate-pin-bounce {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
