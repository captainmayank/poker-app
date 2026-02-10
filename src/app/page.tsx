export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Poker Expense Tracker</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Manage your poker sessions, buy-ins, and settlements with ease
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
