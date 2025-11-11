import plugin from "tailwindcss/plugin";
var config = {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                orbit: {
                    "0%": { transform: "rotate(0deg) translateX(80px) rotate(0deg)" },
                    "100%": { transform: "rotate(360deg) translateX(80px) rotate(-360deg)" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-6px)" },
                },
                "pulse-glow": {
                    "0%, 100%": { boxShadow: "0 0 0 0 rgba(129, 140, 248, 0.4)" },
                    "50%": { boxShadow: "0 0 30px 0 rgba(129, 140, 248, 0.8)" },
                },
            },
            animation: {
                orbit: "orbit 18s linear infinite",
                float: "float 8s ease-in-out infinite",
                "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
            },
        },
    },
    plugins: [
        plugin(function (_a) {
            var addComponents = _a.addComponents;
            addComponents({
                ".glass-panel": {
                    backgroundColor: "rgba(15,23,42,0.85)",
                    border: "1px solid rgba(148,163,184,0.4)",
                    boxShadow: "0 18px 45px rgba(15,23,42,0.9)",
                    backdropFilter: "blur(18px)",
                },
                ".gradient-encrypted": {
                    backgroundImage: "radial-gradient(circle at top left, rgba(56,189,248,0.35), transparent 55%), radial-gradient(circle at bottom right, rgba(129,140,248,0.35), transparent 55%), radial-gradient(circle at center, rgba(244,114,182,0.25), transparent 60%)",
                },
                ".gradient-cosmic": {
                    backgroundImage: "linear-gradient(120deg, #22c55e, #22d3ee, #a855f7, #f97316)",
                },
                ".glow-primary": {
                    boxShadow: "0 0 20px rgba(129,140,248,0.8)",
                },
                ".glow-secondary": {
                    boxShadow: "0 0 18px rgba(56,189,248,0.75)",
                },
            });
        }),
        require("tailwindcss-animate"),
    ],
};
export default config;
