// app/page.tsx
export default function HomePage() {
  return (
    <section className="grid gap-6">
      <div className="card">
        <h1 className="text-2xl font-semibold">राम नाम जप 🙏</h1>
        <p className="mt-2 text-neutral-700">
          Speak or tap to count your japs. Progress is saved to your account. Aim: <b>1,00,00,000</b>.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm text-neutral-700">
          <li>Sign up to store progress securely</li>
          <li>Choose your own mantra (e.g., “Ram”)</li>
          <li>Mic stays listening until you stop it</li>
          <li>Confetti for every <b>1,00,000</b> milestone</li>
        </ul>
      </div>
    </section>
  );
}
