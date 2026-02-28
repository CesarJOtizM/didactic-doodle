import { prisma } from "@/lib/prisma";

export default async function Home() {
  const persons = await prisma.person.findMany({
    include: {
      assignments: { include: { assignment: true } },
    },
    orderBy: { name: "asc" },
  });

  const assignments = await prisma.assignment.findMany({
    include: {
      eligibilities: { include: { person: true } },
      results: { include: { person: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Assignment Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Persons */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Persons</h2>
          {persons.length === 0 ? (
            <p className="text-zinc-500">
              No persons yet. Use <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">POST /api/persons</code> to add one.
            </p>
          ) : (
            <ul className="space-y-2">
              {persons.map((person) => (
                <li key={person.id} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <span className="font-medium">{person.name}</span>
                  {person.email && (
                    <span className="text-zinc-500 text-sm ml-2">{person.email}</span>
                  )}
                  {person.assignments.length > 0 && (
                    <div className="mt-1 text-sm text-zinc-500">
                      Assigned: {person.assignments.map((a) => a.assignment.name).join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Assignments */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-zinc-500">
              No assignments yet. Use <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">POST /api/assignments</code> to create one.
            </p>
          ) : (
            <ul className="space-y-2">
              {assignments.map((assignment) => (
                <li key={assignment.id} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <span className="font-medium">{assignment.name}</span>
                  {assignment.description && (
                    <p className="text-sm text-zinc-500">{assignment.description}</p>
                  )}
                  <div className="mt-1 text-sm">
                    <span className="text-zinc-500">
                      Eligible: {assignment.eligibilities.length > 0
                        ? assignment.eligibilities.map((e) => e.person.name).join(", ")
                        : "none"}
                    </span>
                  </div>
                  {assignment.results.length > 0 && (
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">
                      Assigned to: {assignment.results.map((r) => r.person.name).join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* API Reference */}
      <section className="mt-12 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">API Endpoints</h2>
        <ul className="space-y-1 text-sm font-mono">
          <li><span className="text-blue-600 dark:text-blue-400">GET/POST</span> /api/persons</li>
          <li><span className="text-blue-600 dark:text-blue-400">GET/POST</span> /api/assignments</li>
          <li><span className="text-blue-600 dark:text-blue-400">POST</span> /api/assignments/distribute</li>
        </ul>
      </section>
    </main>
  );
}
