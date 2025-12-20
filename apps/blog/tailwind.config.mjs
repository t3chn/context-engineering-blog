/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Electric blue accent
        accent: {
          50: "#eef9ff",
          100: "#d8f1ff",
          200: "#b9e7ff",
          300: "#89daff",
          400: "#52c4ff",
          500: "#2aa6ff",
          600: "#0d85f8",
          700: "#066de5",
          800: "#0b58b9",
          900: "#104b91",
          950: "#0f2e58",
        },
        // Neutral palette
        surface: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "72ch",
            "--tw-prose-body": theme("colors.surface.700"),
            "--tw-prose-headings": theme("colors.surface.900"),
            "--tw-prose-links": theme("colors.accent.600"),
            "--tw-prose-code": theme("colors.accent.700"),
            "--tw-prose-pre-bg": theme("colors.surface.900"),
            "--tw-prose-invert-body": theme("colors.surface.300"),
            "--tw-prose-invert-headings": theme("colors.surface.50"),
            "--tw-prose-invert-links": theme("colors.accent.400"),
            "--tw-prose-invert-code": theme("colors.accent.300"),
            "--tw-prose-invert-pre-bg": theme("colors.surface.800"),
            a: {
              textDecoration: "none",
              borderBottom: `1px solid ${theme("colors.accent.300")}`,
              transition: "border-color 0.2s ease",
              "&:hover": {
                borderColor: theme("colors.accent.500"),
              },
            },
            h2: {
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: "600",
              letterSpacing: "-0.02em",
            },
            h3: {
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: "500",
            },
            code: {
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "0.875em",
              padding: "0.2em 0.4em",
              borderRadius: "0.25rem",
              backgroundColor: theme("colors.surface.100"),
            },
            "code::before": { content: "none" },
            "code::after": { content: "none" },
          },
        },
        invert: {
          css: {
            code: {
              backgroundColor: theme("colors.surface.800"),
            },
          },
        },
      }),
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "slide-in-left": "slideInLeft 0.4s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
