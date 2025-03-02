import SmalltalkDashboard from "../components/SmalltalkDashboard";

export const metadata = {
  title: "Smalltalk Dashboard",
  description: "Student data powered by Smalltalk",
};

export default function SmalltalkPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Smalltalk Integration Demo</h1>
      <p className="mb-6 text-gray-600">
        This dashboard displays student data that is generated and processed
        using Smalltalk code. The data is served through a JavaScript bridge
        that connects the Smalltalk interpreter to our Next.js application.
      </p>

      <SmalltalkDashboard />

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">About This Integration</h2>
        <p className="mb-4">
          This demo showcases how Smalltalk can be integrated with a modern web
          application:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Smalltalk code generates and processes student data</li>
          <li>
            A JavaScript bridge connects the Smalltalk interpreter to our
            application
          </li>
          <li>Next.js API routes expose the Smalltalk functionality</li>
          <li>
            React components display the data and provide interactive features
          </li>
        </ul>
        <p className="mt-4">
          You can also run your own Smalltalk code in the interactive console
          above!
        </p>
      </div>
    </div>
  );
}
