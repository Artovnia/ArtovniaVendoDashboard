/**
 * Maintenance Page for Vendor Panel
 *
 * Displayed when the backend is unavailable.
 */

import { Button, Container, Heading, Text } from "@medusajs/ui";
import { ArrowPath } from "@medusajs/icons";
import { useBackendHealth } from "../../hooks/use-backend-health";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const MaintenancePage = () => {
  const navigate = useNavigate();
  const { isHealthy, isChecking, refresh } = useBackendHealth({
    checkOnMount: true,
    autoRetry: true,
    retryInterval: 15000,
  });

  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isHealthy === true) {
      navigate("/", { replace: true });
    }
  }, [isHealthy, navigate]);

  const handleRetry = async () => {
    const healthy = await refresh();
    if (healthy) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ui-bg-subtle overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Watercolor blobs */}
        <svg
          className="absolute -top-20 -left-20 w-96 h-96 opacity-[0.04]"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path
            d="M200 50c80 0 150 60 150 150s-70 150-150 150S50 280 50 200c0-40 20-80 50-110 10-10 30-20 40-25 20-10 40-15 60-15z"
            fill="currentColor"
            className="text-ui-fg-base"
          />
        </svg>
        <svg
          className="absolute -bottom-32 -right-20 w-[500px] h-[500px] opacity-[0.03]"
          viewBox="0 0 400 400"
          fill="none"
        >
          <path
            d="M180 30c90 10 180 80 190 170s-50 170-140 180S50 310 40 220 90 20 180 30z"
            fill="currentColor"
            className="text-ui-fg-base"
          />
        </svg>
        <svg
          className="absolute top-1/4 -right-10 w-72 h-72 opacity-[0.025]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="currentColor"
            className="text-ui-fg-base"
          />
        </svg>

        {/* Brush stroke accents */}
        <svg
          className="absolute top-20 right-[15%] w-32 h-8 opacity-[0.06] text-ui-fg-muted"
          viewBox="0 0 200 30"
          fill="none"
        >
          <path
            d="M5 15c30-8 60-12 95-10s70 8 95 10"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="absolute bottom-32 left-[10%] w-24 h-6 opacity-[0.04] text-ui-fg-muted"
          viewBox="0 0 200 30"
          fill="none"
        >
          <path
            d="M5 15c40-10 80-10 120-5s55 8 70 5"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </svg>

        {/* Paint splatter dots */}
        {[
          { top: "12%", left: "6%", size: "w-2 h-2" },
          { top: "22%", left: "88%", size: "w-1.5 h-1.5" },
          { top: "68%", left: "4%", size: "w-1 h-1" },
          { top: "78%", left: "92%", size: "w-2.5 h-2.5" },
          { top: "42%", left: "2%", size: "w-1 h-1" },
          { top: "58%", left: "96%", size: "w-1.5 h-1.5" },
        ].map((dot, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-ui-fg-muted/[0.08] ${dot.size}`}
            style={{ top: dot.top, left: dot.left }}
          />
        ))}
      </div>

      <Container className="relative z-10 max-w-2xl">
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="p-4 bg-ui-bg-base rounded-full shadow-elevation-card-rest">
              <img
                src="/logo.svg"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>

          {/* Easel illustration */}
          <div className="flex justify-center">
            <svg
              className="w-40 h-40 text-ui-fg-base"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Easel legs */}
              <line
                x1="70"
                y1="80"
                x2="50"
                y2="185"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.5"
              />
              <line
                x1="130"
                y1="80"
                x2="150"
                y2="185"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.5"
              />
              <line
                x1="100"
                y1="75"
                x2="100"
                y2="190"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.5"
              />
              {/* Easel shelf */}
              <line
                x1="65"
                y1="130"
                x2="135"
                y2="130"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.4"
              />

              {/* Canvas */}
              <rect
                x="55"
                y="20"
                width="90"
                height="110"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                className="fill-ui-bg-subtle"
                opacity="0.9"
              />
              <rect
                x="60"
                y="25"
                width="80"
                height="100"
                rx="1"
                stroke="currentColor"
                strokeWidth="0.5"
                fill="none"
                opacity="0.3"
              />

              {/* Abstract strokes on canvas */}
              <path
                d="M75 55c10-8 20-5 30 2s15 12 25 5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.12"
              />
              <path
                d="M70 75c15 5 25 0 35-5s20-8 25 0"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.08"
              />
              <path
                d="M80 95c8-3 18 5 25 2s12-6 20-2"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.1"
              />

              {/* Paint dots on canvas */}
              <circle
                cx="85"
                cy="45"
                r="3"
                fill="currentColor"
                opacity="0.07"
              />
              <circle
                cx="110"
                cy="85"
                r="4"
                fill="currentColor"
                opacity="0.05"
              />
              <circle
                cx="95"
                cy="110"
                r="2.5"
                fill="currentColor"
                opacity="0.08"
              />

              {/* Wrench hint on canvas */}
              <g opacity="0.2" transform="translate(88, 58)">
                <path
                  d="M12 2C11.2 2 10.4 2.1 9.7 2.4L12 4.7V7.3L9.7 9.6C10.4 9.9 11.2 10 12 10C15.3 10 18 7.8 18 5C18 4.2 17.8 3.5 17.5 2.8L15.2 5.1H12.6L10.3 2.8C10.9 2.3 11.4 2 12 2Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>

              {/* Palette */}
              <ellipse
                cx="100"
                cy="162"
                rx="28"
                ry="14"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                opacity="0.3"
              />
              <ellipse
                cx="90"
                cy="162"
                rx="5"
                ry="3.5"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                opacity="0.2"
              />
              <circle
                cx="102"
                cy="155"
                r="2.5"
                fill="currentColor"
                opacity="0.12"
              />
              <circle
                cx="112"
                cy="158"
                r="2"
                fill="currentColor"
                opacity="0.1"
              />
              <circle
                cx="108"
                cy="166"
                r="2.5"
                fill="currentColor"
                opacity="0.08"
              />
              <circle
                cx="96"
                cy="168"
                r="2"
                fill="currentColor"
                opacity="0.1"
              />

              {/* Paintbrush */}
              <line
                x1="140"
                y1="40"
                x2="158"
                y2="155"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.25"
              />
              <path
                d="M139.5 40l1-8c0-2 1.5-3 1.5-3s1.5 1 1.5 3l-1 8"
                fill="currentColor"
                opacity="0.18"
              />
            </svg>
          </div>

          {/* Brush stroke divider */}
          <div className="flex justify-center">
            <svg
              className="w-56 h-4 text-ui-fg-muted/20"
              viewBox="0 0 300 15"
              fill="none"
            >
              <path
                d="M5 8c40-5 80-3 120 0s80 5 120 1c15-2 30-3 45-1"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <Heading level="h1" className="text-ui-fg-base">
              Tworzymy coś pięknego
            </Heading>
            <Text className="text-ui-fg-subtle text-lg max-w-md mx-auto leading-relaxed">
              Nasza pracownia jest chwilowo zamknięta na konserwację. Pracujemy
              nad tym, aby wrócić z jeszcze lepszym doświadczeniem.
            </Text>
          </div>

          {/* Info Box with corner accents */}
          <div className="relative bg-ui-bg-base border border-ui-border-base rounded-lg p-6 text-left">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-ui-fg-muted/20 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-ui-fg-muted/20 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-ui-fg-muted/20 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-ui-fg-muted/20 rounded-br-lg" />

            <Text className="font-medium text-ui-fg-base mb-4">
              Co się dzieje?
            </Text>
            <ul className="space-y-3 text-ui-fg-subtle">
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-ui-fg-muted/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                </svg>
                <span>Planowana konserwacja systemu</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-ui-fg-muted/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                </svg>
                <span>Aktualizacja oprogramowania</span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-ui-fg-muted/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3m3 3l7.5-7.5a2.12 2.12 0 00-3-3L9 12m3 3l-3-3" />
                </svg>
                <span>Ulepszanie Twojego doświadczenia</span>
              </li>
            </ul>
          </div>

          {/* Retry Button */}
          <div className="space-y-4">
            <Button
              variant="primary"
              size="large"
              onClick={handleRetry}
              isLoading={isChecking}
              disabled={isChecking}
              className="group"
            >
              <ArrowPath className="mr-2 transition-transform duration-300 group-hover:rotate-180" />
              Spróbuj ponownie
            </Button>

            <Text className="text-ui-fg-muted text-sm">
              {isChecking
                ? "Sprawdzanie dostępności serwera..."
                : `Pracujemy nad tym${dots}`}
            </Text>
          </div>

          {/* Contact */}
          <div className="pt-6 border-t border-ui-border-base">
            <Text className="text-ui-fg-muted text-sm mb-2">
              Jeśli problem się utrzymuje, napisz do nas:
            </Text>
            <a
              href="mailto:info.artovnia@gmail.com"
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover font-medium underline underline-offset-4 transition-colors duration-200"
            >
              info.artovnia@gmail.com
            </a>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-sm text-ui-fg-muted">
            <div
              className={`w-2 h-2 rounded-full ${
                isHealthy === false
                  ? "bg-ui-tag-red-icon animate-pulse"
                  : isHealthy === true
                    ? "bg-ui-tag-green-icon"
                    : "bg-ui-tag-orange-icon animate-pulse"
              }`}
            />
            <span>
              {isHealthy === false
                ? "Konserwacja w toku"
                : isHealthy === true
                  ? "Dostępny"
                  : "Sprawdzanie..."}
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default MaintenancePage;

export const config = {
  name: "maintenance",
};