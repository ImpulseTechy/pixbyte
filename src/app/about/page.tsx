import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutPhoto from "./AboutPhoto";

export const metadata: Metadata = {
  title: "about · 0x1306",
  description: "// who built pixbyte and why",
};

const NAME = "yogesh bawane";
const CONTACT_EMAIL = "impulsetech101@gmail.com";
const GITHUB_URL = "https://github.com/ImpulseTechy/pixbyte";
const LINKEDIN_URL = "https://www.linkedin.com/in/yogesh-bawane/";
const INSTAGRAM_URL = "https://www.instagram.com/impulsetechy/";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-bg text-text selection:bg-accent/30 selection:text-text">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-8 space-y-10 font-mono text-sm">
        {/* Back link */}
        <Link
          href="/"
          className="text-dim hover:text-accent transition-colors text-xs inline-block"
        >
          {"// ← back to all"}
        </Link>

        {/* Hero */}
        <section className="space-y-4">
          <div className="text-text text-base sm:text-lg leading-relaxed">
            {"// "}built by {NAME}, maker and robotics teacher · pimpri,
            maharashtra
          </div>
          <AboutPhoto />
        </section>

        {/* Why pixbyte exists */}
        <section className="space-y-3 border-t border-border pt-8">
          <div className="text-accent text-xs">{"//"} why pixbyte exists</div>
          <p className="text-text leading-relaxed">
            {"// "}every esp32 maker eventually wants something more than
            &quot;hello world&quot; on their oled. but the examples online are
            scattered across forums, half of them don&apos;t compile, and almost
            none of them actually animate. you end up rewriting the same byte
            arrays from scratch every time you start a new project.
          </p>
          <p className="text-text leading-relaxed">
            {"// "}pixbyte started as my own scratchpad — a place to keep the
            animation snippets i kept rewriting for my robotics workshops. when
            students asked &quot;how do you put that face on the screen?&quot;,
            the honest answer was &quot;copy this, change three things, hope it
            compiles.&quot; that wasn&apos;t good enough.
          </p>
          <p className="text-text leading-relaxed">
            {"// "}a robot with blinking eyes feels alive. a project with a
            loading spinner feels finished. those small details are what turn
            &quot;electronics homework&quot; into something a kid actually wants
            to show their parents. and every animation here is open source — mit
            licensed — because makers in india shouldn&apos;t have to wait for a
            paid sdk to make their robot smile.
          </p>
          <p className="text-text leading-relaxed">
            {"// "}the long-term plan is bigger than oleds. neopixel patterns,
            buzzer melodies, sensor visualizations — anything an esp32 can do
            that needs a copy-pasteable starting point. if you&apos;ve ever lost
            a saturday googling &quot;arduino oled animation example&quot; and
            given up halfway, this is for you.
          </p>
        </section>

        {/* What's next */}
        <section className="space-y-2 border-t border-border pt-8">
          <div className="text-accent text-xs">{"//"} what&apos;s next</div>
          <div className="text-dim leading-relaxed">
            {"// → "}neopixel patterns coming soon
          </div>
          <div className="text-dim leading-relaxed">
            {"// → "}buzzer melodies coming soon
          </div>
          <div className="text-dim leading-relaxed">
            {"// → "}community submissions opening soon
          </div>
        </section>

        {/* For schools */}
        <section className="space-y-3 border-t border-border pt-8">
          <div className="text-accent text-xs">
            {"//"} for schools and institutes
          </div>
          <p className="text-text leading-relaxed">
            {"// "}placeholder paragraph — pixbyte is free for schools,
            workshops and after-school programs. we can also do guest sessions
            and curriculum support for esp32 / robotics clubs.
          </p>
          <div className="text-dim text-xs">
            {"// "}contact:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-accent hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </section>

        {/* Contribute */}
        <section className="space-y-3 border-t border-border pt-8">
          <div className="text-accent text-xs">{"//"} contribute</div>
          <p className="text-text leading-relaxed">
            {"// "}pixbyte is open source · MIT · pull requests welcome
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-3 py-2 border border-accent text-accent hover:bg-accent/10 transition-colors text-xs uppercase"
          >
            [ ★ github ]
          </a>
        </section>

        {/* Footer socials */}
        <section className="space-y-2 border-t border-border pt-8 pb-4">
          <div className="text-accent text-xs">{"//"} elsewhere</div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-dim text-xs">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent transition-colors"
            >
              {"// "}github
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent transition-colors"
            >
              {"// "}instagram
            </a>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent transition-colors"
            >
              {"// "}linkedin
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-accent transition-colors"
            >
              {"// "}email
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
