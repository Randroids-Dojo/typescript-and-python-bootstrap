export function Home() {
  return (
    <div className="container py-10">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-4 py-8 md:py-12 lg:py-24">
        <h1 className="text-center text-3xl font-bold leading-tight md:text-5xl lg:text-6xl">
          Welcome to Our Application
        </h1>
        <p className="max-w-[700px] text-center text-lg text-muted-foreground md:text-xl">
          A secure, modern application built with React, TypeScript, and BetterAuth
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <a
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground"
          >
            Log In
          </a>
          <a
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Get Started
          </a>
        </div>
      </section>
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">Secure Authentication</h3>
              <p className="text-muted-foreground">
                Industry-standard authentication with JWT tokens and advanced security features.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">Modern UI</h3>
              <p className="text-muted-foreground">
                Built with shadcn/ui components for a beautiful and responsive user experience.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="text-xl font-bold">TypeScript Powered</h3>
              <p className="text-muted-foreground">
                Fully typed codebase for better developer experience and fewer bugs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}