import { useState } from 'react'
import './App.css'


function App() {

  const [startingLocation, setStartingLocation] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [budget, setBudget] = useState('');
  const [destinationPreference, setDestinationPreference] = useState('same-state');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const userInput = `Starting Location: ${startingLocation}\nTravel Date: ${travelDate}\nBudget: $${budget}\nDestination Preference: ${destinationPreference}\n`;

    try {
      const response = await fetch("http://127.0.0.1:5000/save-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: userInput }),
      });

      const result = await response.text();
      console.log("Success:", result);
      setMessage('Your input has been saved!');
    } catch (error) {
      console.error("Error:", error);
      setMessage('Failed to save input');
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col items-center">
      <header className="flex justify-between items-center w-full p-4 bg-blue-600 text-white">
        <img src="logo.png" alt="Vacation Planner Logo" className="h-10" />
        <nav className="space-x-4">
          <button className="px-4 py-1 rounded bg-blue-500 text-white">Home</button>
          <button className="px-4 py-1 rounded bg-blue-500 text-white">Sign In</button>
          <button className="px-4 py-1 rounded bg-blue-500 text-white">Register</button>
        </nav>
      </header>

      <main className="main w-full max-w-xl p-6">
        <h1>VACATION PLANNER</h1>
        <p>"Your Dream Trip, Perfectly Planned!"</p>

        <div className="skill">
          <div className="outer">
            <div className="inner">
              <div id="number"></div>
            </div>
          </div>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width="160px"
            height="160px"
          >
            <defs>
              <linearGradient id="GradientColor">
                <stop offset="0%" stopColor="#DA22FF" />
                <stop offset="100%" stopColor="#9733EE" />
              </linearGradient>
            </defs>
            <circle cx="80" cy="80" r="70" strokeLinecap="round" />
          </svg>
        </div>

        <div className="form-container bg-white rounded shadow p-6 mt-6">
          <label className="block mb-2">Starting Location:</label>
            <input
              type="text"
              value={startingLocation}
              onChange={(e) => setStartingLocation(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

             <label className="block mb-2">Travel Date:</label>
            <input
              type="text"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              placeholder="MM/DD/YYYY - MM/DD/YYYY"
            />
          


          <label className="block mb-2">Budget ($):</label>
      <input
        type="number"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        min="100"
        max="50000"
        step="100"
      />

      <label className="block mb-2">Destination Preference:</label>
      <select
        value={destinationPreference}
        onChange={(e) => setDestinationPreference(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      >
        <option value="same-state">Same State</option>
        <option value="same-country">Same Country</option>
        <option value="world">All Over the World</option>
      </select>


        <div className="buttons flex justify-between mt-4">
          <button id="previous-btn" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">&larr; Previous</button>
          <button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded">Submit</button>
          <button id="next-btn" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">Next &rarr;</button>
        </div>
        {message && (
          <p className="mt-4 text-center text-green-700">{message}</p>
        )}
      </div>
        <div className="footer">
              <p>Figma</p>
              <p>Amadeus APIs</p>
              <p>Python</p>
              <p>HTML, CSS, and JS</p>
              <p>MySQL</p>
              <p>React</p>
              <p>GitHub</p>
          </div>
      </main>
    </div>
  );
}

export default App
